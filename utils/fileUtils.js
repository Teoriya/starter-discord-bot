const importer = (directoryPath) => {
    const importedFiles = [];
    const fs = require('fs');
    const path = require('path');
    files = fs.readdirSync(directoryPath, { withFileTypes: true });
    files.forEach((file) => {
        if (file.isDirectory()) {
            importer(path.join(directoryPath, file.name));
        } else if (file.isFile() && path.extname(file.name) == ".js") {
            let importedFile = path.join(directoryPath, file.name);
            importedFiles.push(importedFile);
        }
    });
    return importedFiles;
}
module.exports = {
    allJSfetcher: importer
}