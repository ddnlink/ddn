
var program = require("commander");

var fs = require("fs");
var path = require("path");
var package = require('./package.json');

function main() {
    var default_host = process.env.EBOOKCOIN_HOST || '127.0.0.1';
    var default_port = process.env.EBOOKCOIN_PORT || 8001;
    program.version(package.version)
        .option('-H, --host <host>', 'Specify the hostname or ip of the node, default: '  + default_host, default_host)
        .option('-P, --port <port>', 'Specify the port of the node, default: ' + default_port, default_port)
        .option('-M, --main', 'Specify the mainnet, default: false')
    
    var plugins = fs.readdirSync(path.join(__dirname, 'plugins'));
    plugins.forEach(function (el) {
        if (el.endsWith('js')) {
            require('./plugins/' + el)(program);
        }
    });

    if (!process.argv.slice(2).length) {
        program.outputHelp();
    }
    program.parse(process.argv);
}

main();
