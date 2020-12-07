function randomName () {
  // Convert arguments to Array
  const array = Array.prototype.slice.apply(arguments)

  let size = 16
  if (array.length > 2) {
    size = array.shift()
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
  return randomName(8, '', 'abcdefghijklmnopqrstuvwxyz0123456789')
}

function randomString (max) {
  const possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789#$%^&*@'
  return randomName(max, '', possible)
}

export { randomName, randomNethash, randomString }
