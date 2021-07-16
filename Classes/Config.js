const fs = require('fs');

module.exports = class Config {
    constructor(fileName){
        this.fileName = fileName;
        this.config = require(fileName);
    }

    getConfig(){
        return this.config;
    }

    setConfig(config){
        this.config = config;
    }

    saveConfig(config){
        var fileName = this.fileName;

        fs.writeFile(fileName.substring(1), JSON.stringify(config), function writeJSON(err) {
            if (err) return console.log(err);

            console.log("updated configurations!");
          });
    }
}