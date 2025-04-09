const path = require('path');
const fs = require('fs-extra');
const os = require('os');

async function copySqlite3Binary() {
  try {
    const platform = os.platform();
    const arch = os.arch();
    let sourceFile, targetDir;

    // 确定源文件路径和目标目录
    const sourceDir = path.join(__dirname, '../third_party');
    targetDir = path.join(__dirname, '../node_modules/sqlite3/build/Release');

    // 根据平台和架构确定文件名
    let fileName;
    if (platform === 'win32') {
      fileName = 'win32-x64.node_sqlite3.node';
    } else if (platform === 'darwin') {
      fileName = `darwin-${arch === 'arm64' ? 'arm64' : 'x64'}.node_sqlite3.node`;
    } else {
      fileName = `linux-${arch === 'arm64' ? 'arm64' : 'x64'}.node_sqlite3.node`;
    }

    // 确保目标目录存在
    fs.ensureDirSync(targetDir);

    // 复制文件
    const sourcePath = path.join(sourceDir, fileName);
    const targetPath = path.join(targetDir, 'node_sqlite3.node');

    if (fs.existsSync(sourcePath)) {
      fs.copyFileSync(sourcePath, targetPath);
      console.log(`√ 成功复制 ${fileName} 到 ${targetPath}`);
    } else {
      console.error(`× 错误: 找不到源文件 ${sourcePath}`);
      process.exit(1);
    }
  } catch (err) {
    console.error('× 复制sqlite3.node文件失败:', err);
    process.exit(1);
  }
}

// 执行函数
copySqlite3Binary();