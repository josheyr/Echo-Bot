const User = require("../Classes/User.js");
const Echo = new require('echo-tool-api');

module.exports = class UserManager {
    constructor(config) {
        this.users = {};
        this.configUsers = {};
        this.config = config;
        this.initializeUsers();
    }

    initializeUsers() {
        for (let user in this.config.config["users"]) {
            this.users[user] = new User(user);
            this.users[user].user = new Echo.API(this.config.config["users"][user]);
        }

        this.configUsers = this.config.config["users"];
    }

    saveUsers() {
        this.config.config["users"] = this.configUsers;
        this.config.saveConfig(this.config.config);
    }

    getUser(id) {
        if (!this.users[id]) { this.users[id] = new User(id);
            this.configUsers[id] = "";
        }
        return this.users[id];
    }

    setUserAPIKey(id, apiKey) {
        this.configUsers[id] = apiKey;
        var echoUser = this.getUser(id);
        echoUser.apiKey = apiKey;
        echoUser.user = new Echo.API(apiKey);
        this.saveUsers();
    }
}