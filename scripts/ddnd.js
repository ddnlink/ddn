const fs = require('fs');
const path = require('path');
const { exec, execSync } = require('child_process');
const readline = require('readline');
const https = require('https');
const http = require('http');

// 全局变量声明

const PROG_DIR = process.cwd();
const PID_FILE = path.join(PROG_DIR, 'ddn.pid');

// 修改主节点
const IPS = [
  "https://ddn.link/static/download-International",
  "http://ddn.link/static/download-Chinese"
];

let statusArray = [];
let length;
let net;
let meta_file;

function readPort() {
  const ddnrcContent = fs.readFileSync(path.join(PROG_DIR, '.ddnrc.js'), 'utf8');
  const portMatch = ddnrcContent.match(/"port"\s*:\s*(\d+)/);
  return portMatch ? portMatch[1].trim() : null;
}

function isRunning() {
  if (fs.existsSync(PID_FILE)) {
    const pid = fs.readFileSync(PID_FILE, 'utf8');
    try {
      process.kill(parseInt(pid), 0);
      return true;
    } catch (e) {
      return false;
    }
  }
  return false;
}

function status() {
  if (isRunning()) {
    console.log("DDN server is running");
  } else {
    console.log("DDN server is not running");
  }
}

function start(...args) {
  if (isRunning()) {
    console.log("DDN server is already started");
  } else {
    if (fs.existsSync(PID_FILE)) {
      fs.unlinkSync(PID_FILE);
    }
    const child = exec(`node ${path.join(PROG_DIR, 'app.js')} --base ${PROG_DIR} --daemon ${args.join(' ')}`);
    fs.writeFileSync(PID_FILE, child.pid.toString());
    console.log("DDN server is starting");
  }
}

function stop() {
    if (fs.existsSync(PID_FILE)) {
      const pid = parseInt(fs.readFileSync(PID_FILE, 'utf8'));
      if (pid && !isNaN(pid)) {
        try {
          process.kill(pid);
          console.log("Stopping DDN server...");
          let i = 0;
          const checkInterval = setInterval(() => {
            try {
              process.kill(pid, 0);
              i++;
              if (i === 5) {
                process.kill(pid, 'SIGKILL');
                console.log("DDN server killed");
                clearInterval(checkInterval);
              } else {
                console.log("Still waiting for ddn server to stop ...");
              }
            } catch (e) {
              console.log("DDN server stopped");
              clearInterval(checkInterval);
            }
          }, 1000);
        } catch (e) {
          console.log("DDN server is not running");
        }
      } else {
        console.log("Invalid PID in PID file");
      }
      fs.unlinkSync(PID_FILE);
    } else {
      console.log("DDN server is not running");
    }
  }
  
  function restart() {
    stop();
    setTimeout(() => {
      start();
    }, 5000); // 等待5秒后启动，确保完全停止
  }
  
  function ismainnet() {
    const ddnrcContent = fs.readFileSync(path.join(PROG_DIR, '.ddnrc.js'), 'utf8');
    const netMatch = ddnrcContent.match(/net\s*:\s*"(\w+)"/);
    if (netMatch) {
      const net = netMatch[1];
      if (net !== "mainnet" && net !== "testnet") {
        console.log("Wrong net!");
        process.exit(2);
      }
      console.log(`net is ${net}`);
      return net;
    } else {
      console.log("Unable to determine network type");
      process.exit(2);
    }
  }

function chosenode() {
  return new Promise((resolve, reject) => {
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout
    });

    rl.question("Please input your choice [default 0] : ", (num) => {
      num = num || "0";
      num = parseInt(num);

      if (num >= length) {
        console.log("You chosen wrong number, please run ddnd again!");
        rl.close();
        process.exit(1);
      }

      if (statusArray[num] === "N") {
        console.log("This node has no data, please run ddnd again!");
        rl.close();
        process.exit(2);
      }

      const ip = IPS[num].split('-')[0];
      
      const protocol = ip.startsWith('https') ? https : http;
      protocol.get(`${ip}/${meta_file}`, (res) => {
        let data = '';
        res.on('data', (chunk) => {
          data += chunk;
        });
        res.on('end', () => {
          const [Name, Md5] = data.split(' ');
          rl.close();
          resolve({ ip, Name, Md5 });
        });
      }).on('error', (err) => {
        console.error("Error fetching metadata:", err);
        rl.close();
        reject(err);
      });
    });
  });
}

async function rebuild() {
  net = ismainnet();
  meta_file = `metadata_rebuild_${net}.txt`;

  console.log("Please select one of the following sources to use");
  length = IPS.length;
  
  for (let i = 0; i < length; i++) {
    const [ip, country] = IPS[i].split('-');
    const memo = `${country} users recommended`;

    try {
      const response = await new Promise((resolve, reject) => {
        const protocol = ip.startsWith('https') ? https : http;
        protocol.get(`${ip}/${meta_file}`, resolve).on('error', reject);
      });

      let data = '';
      response.on('data', (chunk) => { data += chunk; });
      await new Promise((resolve) => response.on('end', resolve));

      if (!data.includes('html')) {
        statusArray[i] = "Y";
        const [Name, Md5, Date, Height, Size, DB] = data.split(' ');
        console.log(`${i}. ${ip} [${memo}] Height:${Height} Date:${Date} Size:${Size}`);
      } else {
        statusArray[i] = "N";
        console.log(`${i}. ${ip} [No data, do not use.]`);
      }
    } catch (error) {
      statusArray[i] = "N";
      console.log(`${i}. ${ip} [Error: ${error.message}]`);
    }
  }

  const nodeInfo = await chosenode();
  console.log(`Downloading blockchain snapshot ${nodeInfo.Name}...`);
  
  // 下载文件
  await new Promise((resolve, reject) => {
    const file = fs.createWriteStream(nodeInfo.Name);
    const protocol = nodeInfo.ip.startsWith('https') ? https : http;
    protocol.get(`${nodeInfo.ip}/${nodeInfo.Name}`, (response) => {
      response.pipe(file);
      file.on('finish', () => {
        file.close(resolve);
      });
    }).on('error', (err) => {
      fs.unlink(nodeInfo.Name, () => reject(err));
    });
  });

  // 验证 MD5
  const fileBuffer = fs.readFileSync(nodeInfo.Name);
  const hashSum = crypto.createHash('md5');
  hashSum.update(fileBuffer);
  const newMd5 = hashSum.digest('hex');

  if (newMd5 === nodeInfo.Md5) {
    console.log("Check md5 passed!");
  } else {
    console.log("Check md5 failed, please run again!");
    fs.unlinkSync(nodeInfo.Name);
    process.exit(1);
  }

  // 停止 DDN 服务器
  execSync('./ddnd stop');

  // 解压文件
  execSync(`tar zxf ${nodeInfo.Name}`);

  // 删除下载的压缩文件
  fs.unlinkSync(nodeInfo.Name);

  // 移动数据库文件
  const dbFile = fs.readdirSync('.').find(file => file.endsWith('.db'));
  if (dbFile) {
    fs.renameSync(dbFile, 'blockchain.db');
  } else {
    console.log("Database file not found in the extracted contents.");
    process.exit(1);
  }

  // 启动 DDN 服务器
  execSync('./ddnd start');

  console.log("Rebuild process completed successfully.");
}

function version() {
  try {
    const versionOutput = execSync(`node ${path.join(PROG_DIR, 'app.js')} --version`, { encoding: 'utf8' });
    console.log(versionOutput.trim());
  } catch (error) {
    console.error("Error getting version:", error.message);
  }
}

function check_os() {
  try {
    const osRelease = fs.readFileSync('/etc/os-release', 'utf8');
    const isUbuntu = osRelease.includes('"Ubuntu"');
    if (!isUbuntu) {
      console.log("Linux is not Ubuntu, please configure manually!");
      process.exit(1);
    }
  } catch (error) {
    console.error("Error checking OS:", error.message);
    process.exit(1);
  }
}

function configure() {
  check_os();
  try {
    execSync(`sudo bash ${path.join(PROG_DIR, 'init/install_deps.sh')}`, { stdio: 'inherit' });
    execSync(`sudo bash ${path.join(PROG_DIR, 'init/config_ntp.sh')}`, { stdio: 'inherit' });
    execSync(`sudo bash ${path.join(PROG_DIR, 'init/config_monitor.sh')}`, { stdio: 'inherit' });
  } catch (error) {
    console.error("Error during configuration:", error.message);
    process.exit(1);
  }
}

async function upgrade() {
  net = ismainnet();
  meta_file = `metadata_upgrade_${net}.txt`;

  console.log("Please select one of the following sources to use");
  length = IPS.length;
  
  for (let i = 0; i < length; i++) {
    const [ip, country] = IPS[i].split('-');
    const memo = `${country} users recommended`;

    try {
      const response = await new Promise((resolve, reject) => {
        const protocol = ip.startsWith('https') ? https : http;
        protocol.get(`${ip}/${meta_file}`, resolve).on('error', reject);
      });

      let data = '';
      response.on('data', (chunk) => { data += chunk; });
      await new Promise((resolve) => response.on('end', resolve));

      if (!data.includes('html')) {
        statusArray[i] = "Y";
        const [Name, Md5, Date, Version, Size] = data.split(' ');
        console.log(`${i}. ${ip} [${memo}] Version:${Version} Date:${Date} Size:${Size}`);
      } else {
        statusArray[i] = "N";
        console.log(`${i}. ${ip} [No data, do not use.]`);
      }
    } catch (error) {
      statusArray[i] = "N";
      console.log(`${i}. ${ip} [Error: ${error.message}]`);
    }
  }

  const nodeInfo = await chosenode();

  // 创建临时目录
  if (!fs.existsSync('tmp')) {
    fs.mkdirSync('tmp');
  }

  // 下载文件
  await new Promise((resolve, reject) => {
    const file = fs.createWriteStream(path.join('tmp', nodeInfo.Name));
    const protocol = nodeInfo.ip.startsWith('https') ? https : http;
    protocol.get(`${nodeInfo.ip}/${nodeInfo.Name}`, (response) => {
      response.pipe(file);
      file.on('finish', () => {
        file.close(resolve);
      });
    }).on('error', (err) => {
      fs.unlink(path.join('tmp', nodeInfo.Name), () => reject(err));
    });
  });

  // 验证 MD5
  const fileBuffer = fs.readFileSync(path.join('tmp', nodeInfo.Name));
  const hashSum = crypto.createHash('md5');
  hashSum.update(fileBuffer);
  const newMd5 = hashSum.digest('hex');

  if (newMd5 === nodeInfo.Md5) {
    console.log("Check md5 passed!");
  } else {
    console.log("Check md5 failed, please run again!");
    fs.unlinkSync(path.join('tmp', nodeInfo.Name));
    process.exit(1);
  }

  console.log("Extracting new package ...");
  execSync(`tar zxf ${path.join('tmp', nodeInfo.Name)} -C tmp/`);

  const extractedDir = fs.readdirSync('tmp')
    .filter(file => fs.statSync(path.join('tmp', file)).isDirectory())
    .find(dir => dir.includes('ddn'));

  if (!extractedDir) {
    console.log("Extracted directory not found");
    process.exit(1);
  }

  const currentVersion = execSync('./ddnd version', { encoding: 'utf8' }).trim();
  fs.chmodSync(path.join('tmp', extractedDir, 'ddnd'), '755');
  const newVersion = execSync(`${path.join('tmp', extractedDir, 'ddnd')} version`, { encoding: 'utf8' }).trim();

  execSync('./ddnd stop');

  console.log("Copying new files ...");
  fs.readdirSync(path.join('tmp', extractedDir)).forEach(file => {
    if (file !== '.ddnrc.js' && file !== 'blockchain.db') {
      console.log(`copy ${path.join('tmp', extractedDir, file)} ...`);
      fs.cpSync(path.join('tmp', extractedDir, file), path.join(PROG_DIR, file), { recursive: true });
    }
  });

  fs.rmSync(path.join('tmp', extractedDir), { recursive: true, force: true });
  fs.unlinkSync(path.join('tmp', nodeInfo.Name));

  console.log(`Upgrade to ${newVersion} done.`);
  execSync('./ddnd start');
}

function enable(...secret) {
  const port = readPort();
  const data = JSON.stringify({ secret: secret.join(' ') });

  const options = {
    hostname: 'localhost',
    port: port,
    path: '/api/delegates/forging/enable',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Content-Length': data.length
    }
  };

  const req = http.request(options, (res) => {
    let responseData = '';

    res.on('data', (chunk) => {
      responseData += chunk;
    });

    res.on('end', () => {
      console.log('Response:', responseData);
    });
  });

  req.on('error', (error) => {
    console.error('Error:', error);
  });

  req.write(data);
  req.end();
}

function main(args) {
  // 将 PROG_DIR/bin 添加到 PATH
  process.env.PATH = `${path.join(PROG_DIR, 'bin')}:${process.env.PATH}`;

  const command = args[0];
  const commandArgs = args.slice(1);

  const commands = {
    start,
    stop,
    restart,
    status,
    rebuild,
    version,
    configure,
    upgrade,
    enable
  };

  if (command in commands) {
    commands[command](...commandArgs);
  } else {
    console.log("Command not supported");
  }
}

// 启动主函数
if (require.main === module) {
  main(process.argv.slice(2));
}