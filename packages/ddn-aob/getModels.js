var fs = require("fs");
const arr = [];

const files = fs.readdirSync("./models")

files.forEach((file) => {
  const item = require(path.resolve(__dirname, './models/', file))
  arr.push({
    name:file,
    data:item
  });
});

module.exports = arr; 
