/**
 * Description: Random string
 *
 *
 * Last Modified: Tuesday, 31st May 2022 6:41:47 pm
 * Modified By: imfly (kubying@qq.com>)

 * Copyright（c) 2022 DATM FOUNDATION
 */

/**
 * const randomStr = randomName(size, name, random)
 *
 * name: The first string
 * random: Possible chars
 * size: Random name length, default 16
 *
 * e.g:
 * randomName('D', 'abcdefghigk1234', 20)
 *
 * @returns string
 */
function randomName () {
  // Convert arguments to Array
  const array = Array.prototype.slice.apply(arguments)
  let size = 16
  if (array.length > 2) {
    size = array.pop()
  }

  let name = array[0]
  const random = array[1]

  if (name.length > 0) {
    size = size - 1
  }

  for (let i = 0; i < size; i++) {
    name += random.charAt(Math.floor(Math.random() * random.length))
  }

  return name
}

function randomNethash () {
  return randomName('', 'abcdefghijklmnopqrstuvwxyz0123456789', 8)
}

function randomString (max) {
  const possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789#$%^&*@'
  return randomName('', possible, max)
}

export { randomName, randomNethash, randomString }
