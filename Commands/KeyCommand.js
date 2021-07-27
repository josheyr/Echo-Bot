const Command = require('../Classes/Command.js');
const PermissionLevel = require('../Enums/PermissionLevel.js');
const ErrorMessage = require('../Enums/ErrorMessage.js');

module.exports = class KeyCommand extends Command {
    constructor(config, userManager){
        super("key", [{"name": "key", "required": true, "type": 3, "description": "Your private API key retrieved from Echo account page."}], "Sets your API key so you can use this bot.");

        this.userManager = userManager;
        this.config = config;
    }

    PermissionLevel = PermissionLevel.EVERYONE;

    async run(args, context){
        if(!args[0] || args[0].length > 75 || args[0].length < 15) return { error: ErrorMessage.SYNTAX, msg: "Invalid syntax / invalid key format!", hidden: true };
        
        // check if args[0] is valid base64
        if(!(new Buffer(args[0], 'base64')).toString('utf8').match(/^[A-Za-z0-9+/]*={0,2}$/)) return { error: ErrorMessage.SYNTAX, msg: "Invalid syntax / invalid key format!", hidden: true };

        var userid = context.author.id;
        var user = this.userManager.getUser(userid);
        this.userManager.setUserAPIKey(userid, args[0]);

        var echoUser = user.getUser();
        if(echoUser) {
            var info = await echoUser.getUserInfo();
            if (info) {
                return { error: ErrorMessage.SUCCESS, msg: `Hi ${info.username}, your key has been set! You can now use all the commands.`, hidden: true };
            } else {
                return { error: ErrorMessage.OTHER, msg: `We couldn't find the key you entered.`, hidden: true };
            }
        } else {
            return { error: ErrorMessage.OTHER, msg: `An unknown error occured.`, hidden: true };
        }
    }
}