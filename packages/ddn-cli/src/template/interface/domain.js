app.route.get('/domain/:address',  async function (req) {
    return await app.model.Domain.findOne({address: req.params.address})
})

app.route.get('/domain/suffix/:suffix',  async function (req) {
    return await app.model.Domain.findAll({suffix: req.params.suffix})
})