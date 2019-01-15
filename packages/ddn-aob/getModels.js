var fs = require("fs");
const path = require('path')
const arr = [];
const files = fs.readdirSync(path.resolve(__dirname, './models/'));
files.forEach((file) => {
  const item = require(path.resolve(__dirname, './models/', file))
  arr.push({
    name:splitFileName(file),
    data:item
  });
});
// 如果文件带有后缀名则去掉
function splitFileName(text) {
  var pattern = /\.{1}[a-z]{1,}$/;
  if (pattern.exec(text) !== null) {
    return (text.slice(0, pattern.exec(text).index));
  } else {
    return text;
  }
}

module.exports = arr; 
