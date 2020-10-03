
import inquirer from 'inquirer'

async function prompt (question) {
  if (Array.isArray(question)) {
    return await inquirer.prompt(question)
  } else {
    const answer = await inquirer.prompt([question])
    return answer[question.name]
  }
}

export { prompt }