import fs from 'fs'
import DdnCrypto from '@ddn/crypto'
import path from 'path'

import inquirer from 'inquirer'
import shell from 'shelljs'
import symbols from 'log-symbols'
import child_process from 'child_process'
import handlebars from 'handlebars'
import chalk from 'chalk'
import ora from 'ora'
import valid_url from 'valid-url'

import accountHelper from '../helpers/account'
import blockHelper from '../helpers/block'
import { prompt } from '../utils/prompt'
import handlebarHelpers from 'handlebars-helpers'
const helpers = handlebarHelpers(['math', 'string', 'number'])

const dappCategories = [
  'Common',
  'Business',
  'Social',
  'Education',
  'Entertainment',
  'News',
  'Life',
  'Utilities',
  'Games'
]

async function createDAppMetaFile (name) {
  const answer = await prompt([
    {
      type: 'input',
      name: 'description',
      message: 'Enter DApp description',
      validate: function (value) {
        var done = this.async()

        if (value.length > 160) {
          done('DApp description is too long, maximum is 160 characters')
          return
        }

        return done(null, true)
      }
    },
    {
      type: 'input',
      name: 'tags',
      message: 'Enter DApp tags',
      validate: function (value) {
        var done = this.async()

        if (value.length > 160) {
          done('DApp tags is too long, maximum is 160 characters')
          return
        }

        return done(null, true)
      }
    },
    {
      type: 'rawlist',
      name: 'category',
      required: true,
      message: 'Choose DApp category',
      choices: dappCategories
    },
    {
      type: 'input',
      name: 'link',
      message: 'Enter DApp link',
      required: true,
      validate: function (value) {
        var done = this.async()

        if (!valid_url.isUri(value)) {
          done('Invalid DApp link, must be a valid url')
          return
        }
        if (value.indexOf('.zip') !== value.length - 4) {
          done('Invalid DApp link, does not link to zip file')
          return
        }
        if (value.length > 160) {
          return done('DApp link is too long, maximum is 160 characters')
        }

        return done(null, true)
      }
    },
    {
      type: 'input',
      name: 'icon',
      message: 'Enter DApp icon url',
      validate: function (value) {
        var done = this.async()

        if (!valid_url.isUri(value)) {
          return done('Invalid DApp icon, must be a valid url')
        }
        var extname = path.extname(value)
        if (['.png', '.jpg', '.jpeg'].indexOf(extname) === -1) {
          return done('Invalid DApp icon file type')
        }
        if (value.length > 160) {
          return done('DApp icon url is too long, maximum is 160 characters')
        }

        return done(null, true)
      }
    },
    {
      type: 'input',
      name: 'delegates',
      message: "Enter public keys of dapp delegates - hex array, use ',' for separator",
      validate: function (value) {
        var done = this.async()

        var publicKeys = value.split(',')

        if (publicKeys.length === 0) {
          done('DApp requires at least 1 delegate public key')
          return
        }

        for (var i in publicKeys) {
          try {
            var b = Buffer.from(publicKeys[i])
            // done('b.length..........' + b.length) // 66

            if (b.length !== 64) {
              done('Invalid public key: ' + publicKeys[i])
              return
            }
          } catch (e) {
            done('Invalid hex for public key: ' + publicKeys[i])
            return
          }
        }
        done(null, true)
      }
    },
    {
      type: 'input',
      name: 'unlock_delegates',
      message: 'How many delegates are needed to unlock asset of a dapp?',
      validate: function (value) {
        var done = this.async()
        var n = Number(value)
        if (!Number.isInteger(n) || n < 3 || n > 101) {
          return done('Invalid unlock_delegates')
        }
        done(null, true)
      }
    }
  ])

  return answer
}

async function generateDapp (name) {
  await tempaleDapp(name)
}

async function tempaleDapp (name) {
  if (!fs.existsSync(name)) {
    console.log('Generate DApp project ...')

    const answer = await createDAppMetaFile()
    const spinner = ora('DApp template is downloading ...\n')
    spinner.start()

    child_process.exec('git clone https://github.com/ddnlink/ddn-templates.git .tmp', function (err, stdout, stderr) {
      if (err) {
        spinner.fail()
        console.log(symbols.error, chalk.red('Template download failed'))
      } else {
        spinner.succeed()
        shell.mv('./.tmp/dapp', './' + name)
        const filename = `${name}/dapp.json`

        const meta = {
          name: name,
          link: answer.link,
          category: dappCategories.indexOf(answer.category) + 1,
          description: answer.description || '',
          tags: answer.tags || '',
          icon: answer.icon || '',
          delegates: answer.delegates,
          unlock_delegates: Number(answer.unlock_delegates),
          type: 0
        }

        if (fs.existsSync(filename)) {
          const content = fs.readFileSync(filename).toString()
          const template = handlebars.compile(content)
          const result = template(meta, helpers)
          fs.writeFileSync(filename, result)

          // 清理代码
          shell.rm('-rf', '.tmp')

          console.log(symbols.success, chalk.green('DApp Project initialization successful.'))
        } else {
          console.log(
            symbols.error,
            chalk.red('Dapp.json does not exist, please check whether the template is correct!')
          )
        }
      }
    })
  } else {
    console.log(symbols.error, chalk.red('项目已存在'))
  }
}

function generateBlockchain (name) {
  console.log(name)
  tempaleBlockchain(name)
}

// TODO: 产生合约交易
function generateContract (name) {
  console.log('Hi, I`m coming soon...')
}

function tempaleBlockchain (name) {
  if (!fs.existsSync(name)) {
    console.log('Create blockchain project...')

    // TODO: 添加更多定制项
    inquirer
      .prompt([
        {
          name: 'description',
          message: '请输入项目描述'
        },
        {
          name: 'author',
          message: '请输入作者名称'
        }
      ])
      .then(answers => {
        console.log(answers)
        const spinner = ora('正在下载模板...\n')
        spinner.start()

        child_process.exec('git clone https://github.com/ddnlink/ddn-templates.git .tmp', function (
          err,
          stdout,
          stderr
        ) {
          if (err) {
            spinner.fail()
            console.log(symbols.error, chalk.red('模板下载失败'))
          } else {
            spinner.succeed()
            shell.mv('./.tmp/blockchain', './' + name)
            const filename = `${name}/package.json`
            const meta = {
              name,
              description: answers.description,
              author: answers.author
            }

            if (fs.existsSync(filename)) {
              const content = fs.readFileSync(filename).toString()
              // const dt = JSON.parse(content)
              // dt.name = '{{name}}'
              // dt.description = '{{description}}'
              const result = handlebars.compile(content)(meta, helpers)
              // const result = handlebars.compile(JSON.stringify(dt, null, 2))(meta)
              fs.writeFileSync(filename, result)

              // 清理代码
              shell.rm('-rf', '.tmp')

              console.log(symbols.success, chalk.green('项目初始化完成'))
            } else {
              console.log(symbols.error, chalk.red('package.json 不存在，请检查模板是否正确！'))
            }
          }
        })
      })
  } else {
    console.log(symbols.error, chalk.red('项目已存在'))
  }
}

function writeFileSync (file, obj) {
  const content = typeof obj === 'string' ? obj : JSON.stringify(obj, null, 2)
  fs.writeFileSync(file, content, 'utf8')
}

function appendFileSync (file, obj) {
  const content = typeof obj === 'string' ? obj : JSON.stringify(obj, null, 2)
  fs.appendFileSync(file, content, 'utf8')
}

function genGenesisBlock (options) {
  const defaultSecret = 'enter boring shaft rent essence foil trick vibrant fabric quote indoor output'
  const secret = options && options.secret ? defaultSecret : DdnCrypto.generateSecret()
  const genesisAccount = accountHelper.account(secret, options.tokenPrefix)

  let index = 0
  const Daccount = {}
  const Eaccount = {}

  // let newBlockInfo;
  blockHelper
    .new(genesisAccount, options.nethash, options.tokenName, options.tokenPrefix, null, options.file, options.message)
    .then(function (newBlockInfo) {
      const delegateSecrets = newBlockInfo.delegates.map(i => {
        const rv = (Math.random() * 100 + index).toFixed(0) % 3
        if (rv === 0) {
          Daccount.address = i.address
          Daccount.publicKey = i.keypair.publicKey
          Daccount.password = i.secret
        } else if (rv === 2) {
          Eaccount.address = i.address
          Eaccount.publicKey = i.keypair.publicKey
          Eaccount.password = i.secret
        }
        index++

        return i.secret
      })

      genesisAccount.nethash = newBlockInfo.nethash
      const filename = options.genesisBlockName || './genesisBlock'

      writeFileSync(filename + '.json', newBlockInfo.block)

      const logFile = filename + '.log'
      writeFileSync(logFile, 'genesis account:\n')
      appendFileSync(logFile, genesisAccount)
      appendFileSync(logFile, '\nDaccount:\n')
      appendFileSync(logFile, Daccount)
      appendFileSync(logFile, '\nEaccount:\n')
      appendFileSync(logFile, Eaccount)
      appendFileSync(logFile, '\ndelegates secrets:\n')
      appendFileSync(logFile, delegateSecrets)
      console.log(
        `New genesis block and related account has been created, please see the two files: ${filename}.json and ${logFile}`
      )
    })
    .catch(function (err) {
      console.log('err=', err)
    })
}

export { generateBlockchain, generateDapp, generateContract, genGenesisBlock }
