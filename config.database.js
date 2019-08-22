exports.dbSettings = {

    connection: {
        host: "127.0.0.1",
        dialect: "sqlite",

        pool: {
            max: 10,
            min: 1,
            idle: 10000
        },
        
        // SQLite only
        storage: 'blockchain.db'
    },

    username: "root",
    password: "root",
    database: "ddn"

}