const Command = require('../Classes/Command.js');
const PermissionLevel = require('../Enums/PermissionLevel.js');
const ErrorMessage = require('../Enums/ErrorMessage.js');

module.exports = class PingCommand extends Command {
    constructor(config, client){
        super("ping", [], "Responds with 'Pong!'");

        this.client = client;
        this.config = config;
    }

    PermissionLevel = PermissionLevel.EVERYONE;

    async run(args, context){
        return { error: ErrorMessage.SUCCESS, msg: `Pong! (${this.client.ws.ping}ms)` };
    }
}