var chalk = require('chalk');
var ora = require('ora');
var fs = require('fs');
import path from "path";

var inquirer = require('inquirer');
var shell = require('shelljs');
var symbols = require('log-symbols');
var child_process = require('child_process');
var handlebars = require('handlebars');
import valid_url from "valid-url";

const dappCategories = [
    "Common",
    "Business",
    "Social",
    "Education",
    "Entertainment",
    "News",
    "Life",
    "Utilities",
    "Games"
];

async function prompt(question) {
    if (Array.isArray(question)) {
        return await inquirer.prompt(question)
    } else {
        let answer = await inquirer.prompt([question])
        return answer[question.name]
    }
}

async function createDAppMetaFile(name) {
    let answer = await prompt([
        {
            type: "input",
            name: "name",
            message: "Enter DApp name",
            required: true,
            validate: function (value) {
                var done = this.async();
                if (value.length == 0) {
                    done("DApp name is too short, minimum is 1 character");
                    return;
                }
                if (value.length > 32) {
                    done("DApp name is too long, maximum is 32 characters");
                    return;
                }
                return done(null, true)
            }
        },
        {
            type: "input",
            name: "description",
            message: "Enter DApp description",
            validate: function (value) {
                var done = this.async();

                if (value.length > 160) {
                    done("DApp description is too long, maximum is 160 characters");
                    return;
                }

                return done(null, true);
            }
        },
        {
            type: "input",
            name: "tags",
            message: "Enter DApp tags",
            validate: function (value) {
                var done = this.async();

                if (value.length > 160) {
                    done("DApp tags is too long, maximum is 160 characters");
                    return;
                }

                return done(null, true);
            }
        },
        {
            type: "rawlist",
            name: "category",
            required: true,
            message: "Choose DApp category",
            choices: dappCategories
        },
        {
            type: "input",
            name: "link",
            message: "Enter DApp link",
            required: true,
            validate: function (value) {
                var done = this.async();

                if (!valid_url.isUri(value)) {
                    done("Invalid DApp link, must be a valid url");
                    return;
                }
                if (value.indexOf(".zip") != value.length - 4) {
                    done("Invalid DApp link, does not link to zip file");
                    return;
                }
                if (value.length > 160) {
                    return done("DApp link is too long, maximum is 160 characters");
                }

                return done(null, true);
            }
        },
        {
            type: "input",
            name: "icon",
            message: "Enter DApp icon url",
            validate: function (value) {
                var done = this.async();

                if (!valid_url.isUri(value)) {
                    return done("Invalid DApp icon, must be a valid url");
                }
                var extname = path.extname(value);
                if (['.png', '.jpg', '.jpeg'].indexOf(extname) == -1) {
                    return done("Invalid DApp icon file type");
                }
                if (value.length > 160) {
                    return done("DApp icon url is too long, maximum is 160 characters");
                }

                return done(null, true);
            }
        },
        {
            type: "input",
            name: "delegates",
            message: "Enter public keys of dapp delegates - hex array, use ',' for separator",
            validate: function (value) {
                var done = this.async();

                var publicKeys = value.split(",");

                if (publicKeys.length == 0) {
                    done("DApp requires at least 1 delegate public key");
                    return;
                }

                for (var i in publicKeys) {
                    try {
                        var b = Buffer.from(publicKeys[i]);
                        // console.log(b.length); // 66

                        if (b.length != 32) {
                            done("Invalid public key: " + publicKeys[i]);
                            return;
                        }
                    } catch (e) {
                        done("Invalid hex for public key: " + publicKeys[i]);
                        return;
                    }
                }
                done(null, true);
            }
        },
        {
            type: "input",
            name: "unlockDelegates",
            message: "How many delegates are needed to unlock asset of a dapp?",
            validate: function (value) {
                var done = this.async();
                var n = Number(value);
                if (!Number.isInteger(n) || n < 3 || n > 101) {
                    return done("Invalid unlockDelegates");
                }
                done(null, true);
            }
        }
    ])

    console.log("DApp meta information is saved to ./dapp.json ...");
    return answer;
}

async function generateDapp(type, name) {
    await tempaleDapp(type, name);
}

async function tempaleDapp(type, name) {
    if (!fs.existsSync(name)) {
        console.log('创建Dapp项目...');

        const answer = await createDAppMetaFile();
        console.log(answer)
        const spinner = ora('正在下载模板...\n');
        spinner.start();

        child_process.exec('git clone https://github.com/ddnlink/ddn-templates.git .tmp', function (err, stdout, stderr) {
            if (err) {
                spinner.fail();
                console.log(symbols.error, chalk.red('模板下载失败'))
            } else {
                spinner.succeed();
                shell.mv('./.tmp/' + type, './' + name)
                const filename = type === 'blockchain' ? `${name}/package.json` : `${name}/dapp.json`;

                const meta = {
                    name: answer.name,
                    link: answer.link,
                    category: dappCategories.indexOf(answer.category) + 1,
                    description: answer.description || "",
                    tags: answer.tags || "",
                    icon: answer.icon || "",
                    delegates: answer.delegates.split(","),
                    unlockDelegates: Number(answer.unlockDelegates),
                    type: 0
                }

                if (fs.existsSync(filename)) {
                    const content = fs.readFileSync(filename).toString();
                    let dt = JSON.parse(content);
                    dt.name = '{{name}}';
                    dt.link = '{{link}}';
                    dt.category = '{{category}}';
                    dt.description = '{{description}}'
                    dt.tags = '{{tags}}'
                    dt.icon = '{{icon}}'
                    dt.delegates = '{{delegates}}'
                    dt.unlockDelegates = '{{unlockDelegates}}'
                    dt.type = '{{type}}'

                    const result = handlebars.compile(JSON.stringify(dt, null, 2))(meta);
                    fs.writeFileSync(filename, result);

                    // 清理代码
                    shell.rm('-rf', '.tmp');

                    console.log(symbols.success, chalk.green('项目初始化完成'));
                } else {
                    console.log(symbols.error, chalk.red('Dapp.json 不存在，请检查模板是否正确！'))
                }

            }
        })
    } else {
        console.log(symbols.error, chalk.red('项目已存在'));
    }
}

function generateBlockchain(type, name) {
    tempaleBlockchain(type, name);
}

function tempaleBlockchain(type, name) {
    if (!fs.existsSync(name)) {
        console.log('创建项目...');

        // TODO: 添加更多定制项
        inquirer.prompt([
            {
                name: 'description',
                message: '请输入项目描述'
            },
            {
                name: 'author',
                message: '请输入作者名称'
            }
        ]).then(answers => {
            console.log(answers)
            const spinner = ora('正在下载模板...\n');
            spinner.start();

            child_process.exec('git clone https://github.com/ddnlink/ddn-templates.git .tmp', function (err, stdout, stderr) {
                if (err) {
                    spinner.fail();
                    console.log(symbols.error, chalk.red('模板下载失败'))
                } else {
                    spinner.succeed();
                    shell.mv('./.tmp/' + type, './' + name)
                    const filename = `${name}/package.json`;
                    const meta = {
                        name,
                        description: answers.description,
                        author: answers.author
                    }

                    if (fs.existsSync(filename)) {
                        const content = fs.readFileSync(filename).toString();
                        let dt = JSON.parse(content);
                        dt.name = '{{name}}';
                        dt.description = '{{description}}'
                        const result = handlebars.compile(JSON.stringify(dt, null, 2))(meta);
                        fs.writeFileSync(filename, result);

                        // 清理代码
                        shell.rm('-rf', '.tmp');

                        console.log(symbols.success, chalk.green('项目初始化完成'));
                    } else {
                        console.log(symbols.error, chalk.red('package.json 不存在，请检查模板是否正确！'))
                    }

                }
            })
        })
    } else {
        console.log(symbols.error, chalk.red('项目已存在'));
    }
}

// TODO: 产生合约交易
function generateContract(name) {

}

export default function (program) {
    program
        .command("generate [type] <name>")
        .alias('g')
        .description("generate new blockchain, dapp, contract etc.")
        .action(function (type, name) {
            switch (type) {
                case 'blockchain':
                    generateBlockchain(type, name);
                    break;
                case 'dapp':
                    generateDapp(type, name);
                    break;

                case 'contract':
                    generateContract(name);
                    break;
                default:
                    break;
            }
        });
}