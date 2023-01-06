const path = require('path');
const fs = require('fs');
const directoryPath = __dirname

require('./eventHandler')

fs.readdir(directoryPath, function(err, files) {
  if (err) {
    return console.log('Invalid folder structure:' + err);
  }
  files.forEach((file) => {
    if(file !== "index.js"){
        require(path.join(directoryPath, file));
    }
  });
});
