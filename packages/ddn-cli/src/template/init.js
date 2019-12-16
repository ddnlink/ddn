module.exports = async function () {
  console.log('enter dapp init')

  app.registerContract(1000, 'domain.register')
  app.registerContract(1001, 'domain.set_ip')


  app.events.on('newBlock', (block) => {
    console.log('new block received', block.height)
  })
}