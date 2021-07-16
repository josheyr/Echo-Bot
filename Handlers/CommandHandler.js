const PermissionLevel = require("../Enums/PermissionLevel.js");

module.exports = class CommandHandler {
    constructor(config, commandManager) {
        this.commands = {};
        this.config = config;
        this.commandManager = commandManager;
    }

    onMessage(message) {
        let config = this.config
        let content = message.content;

        if(!message.guild) return;

        let prefix = "."
        try {
            prefix = config.config["servers"][message.guild.id]["prefix"];
        } catch (e) {
            if (config.config["servers"][message.guild.id] == undefined)
                config.config["servers"][message.guild.id] = {};

            config.config["servers"][message.guild.id]["prefix"] = ".";

            config.saveConfig(config.config);
        }

        if (content.startsWith(prefix)) {
            content = content.substring(1);

            let command = content.split(" ")[0];
            let args = content.split(" ").slice(1);

            this.commandManager.runCommand(command, args, message).then(response => {
                if (response.msg != "" && response.msg != null)
                    message.channel.send(response.msg);
            });

            return false;
        }

        return true;
    }
}
