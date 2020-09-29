import fs from 'fs'
import path from 'path'
import shell from 'shelljs'
import symbols from 'log-symbols'
import child_process from 'child_process'
import chalk from 'chalk'
import ora from 'ora'
import valid_url from 'valid-url'

import { prompt } from '../../utils/prompt'

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
      name: 'name',
      message: 'Enter DApp name',
      required: true,
      validate: function (value) {
        var done = this.async()
        if (value.length === 0) {
          done('DApp name is too short, minimum is 1 character')
          return
        }
        if (value.length > 32) {
          done('DApp name is too long, maximum is 32 characters')
          return
        }
        return done(null, true)
      }
    },
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
      name: 'unlockDelegates',
      message: 'How many delegates are needed to unlock asset of a dapp?',
      validate: function (value) {
        var done = this.async()
        var n = Number(value)
        if (!Number.isInteger(n) || n < 3 || n > 101) {
          return done('Invalid unlockDelegates')
        }
        done(null, true)
      }
    }
  ])

  console.log('DApp meta information is saved to ./dapp.json ...')
  return answer
}

async function generateDapp (name) {
  await tempaleDapp(name)
}

async function tempaleDapp (name) {
  if (!fs.existsSync(name)) {
    console.log('Genereate Dapp project...')

    const answer = await createDAppMetaFile()
    console.log(answer)
    const spinner = ora('Template is downloading ...\n')
    spinner.start()

    child_process.exec('git clone https://github.com/ddnlink/ddn-templates.git .tmp', function (err, stdout, stderr) {
      if (err) {
        spinner.fail()
        console.log(symbols.error, chalk.red('Template downloads fail.'))
      } else {
        spinner.succeed()
        shell.mv('./.tmp/dapp/' + name)
        const filename = `${name}/dapp.json`

        const meta = {
          name: answer.name,
          link: answer.link,
          category: dappCategories.indexOf(answer.category) + 1,
          description: answer.description || '',
          tags: answer.tags || '',
          icon: answer.icon || '',
          delegates: answer.delegates.split(','),
          unlockDelegates: Number(answer.unlockDelegates),
          type: 0
        }

        if (fs.existsSync(filename)) {
          const content = fs.readFileSync(filename).toString()
          const dt = JSON.parse(content)
          dt.name = '{{name}}'
          dt.link = '{{link}}'
          dt.category = '{{category}}'
          dt.description = '{{description}}'
          dt.tags = '{{tags}}'
          dt.icon = '{{icon}}'
          dt.delegates = '{{delegates}}'
          dt.unlockDelegates = '{{unlockDelegates}}'
          dt.type = '{{type}}'

          const result = handlebars.compile(JSON.stringify(dt, null, 2))(meta)
          fs.writeFileSync(filename, result)

          // 清理代码
          shell.rm('-rf', '.tmp')

          console.log(symbols.success, chalk.green('Dapp generare success.'))
        } else {
          console.log(symbols.error, chalk.red('No dapp.json，please check the template！'))
        }
      }
    })
  } else {
    console.log(symbols.error, chalk.red('项目已存在'))
  }
}

export { generateDapp }
