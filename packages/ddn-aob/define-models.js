const fs = require('fs');
const path = require('path');

// 如果文件带有后缀名则去掉
function splitFileName(text) {
  const pattern = /\.{1}[a-z]{1,}$/;
  if (pattern.exec(text) !== null) {
    return (text.slice(0, pattern.exec(text).index));
  }
  return text;
}
const models = [];
const files = fs.readdirSync(path.resolve(__dirname, './models/'));
files.forEach((file) => {
    // eslint-disable-next-line
    const item = require(path.resolve(__dirname, './models/', file));
    models.push({
        name: splitFileName(file),
        data: item,
    });
});

module.exports = models;
