const Discord = require('discord.js');
const Command = require('../Classes/Command.js');
const PermissionLevel = require('../Enums/PermissionLevel.js');
const ErrorMessage = require('../Enums/ErrorMessage.js');
const { MessageButton, MessageActionRow, MessageComponent } = require('discord-buttons');
const { v4: uuidv4 } = require('uuid');

var footerText = "This is an official bot using the Echo API"

module.exports = class AltsCommand extends Command {
    constructor(config, userManager, buttonManager) {
        super("alts", [{ "name": "username", "required": true, "type": 3, "description": "Pin used for scanning (can automatically retrieve if you are enterprise)." }], "Retrieves all account usernames associated with the one you entered.");

        this.userManager = userManager;
        this.buttonManager = buttonManager;
        this.config = config;
    }

    PermissionLevel = PermissionLevel.EVERYONE;

    async run(args, context) {
        var userid = context.author.id;
        var user = this.userManager.getUser(userid);

        var echoUser = user.getUser();

        var username = "";

        if (user.getUser()) {
            var info = await echoUser.getUserInfo();

            if (info) {
                if (!info.has_echo) return { error: ErrorMessage.OTHER, msg: `You must own Echo to use this command, buy at https://buy.echo.ac/.`, hidden: true };

                username = info.username;
            } else {
                return { error: ErrorMessage.OTHER, msg: `You don't seem to have a valid API key linked. Visit your account settings, find your API key then use \`/key <key>\` to be able to use this command.`, hidden: true };
            }
        } else {
            return { error: ErrorMessage.OTHER, msg: `You don't seem to have a valid API key linked. Visit your account settings, find your API key then use \`/key <key>\` to be able to use this command.`, hidden: true };
        }

        if(!args[0]) return { error: ErrorMessage.SYNTAX, msg: "Invalid syntax!" };

        // function to validate username 
        var validateUsername = (username) => {
            // check if alphanumeric or _
            if (!/^[a-zA-Z0-9_]*$/.test(username)) {
                return false;
            }
            // check if username is not too long
            if (username.length > 32) {
                return false;
            }
            // check if username is not too short
            if (username.length < 3) {
                return false;
            }

            return true;
        }
        // check if args[0] is alphanumeric or _
        if (!validateUsername(args[0])) return { error: ErrorMessage.SYNTAX, msg: "Invalid username!", hidden: true};

        var info = await echoUser.getPlayerInfo(args[0])

        var new_alts = [];

        if (info) {
            if (info.alts) {
                // alts is an array of usernames, validate each one and add them to array "new_alts"
                for (var i = 0; i < info.alts.length; i++) {
                    if (validateUsername(info.alts[i])) {
                        new_alts.push(info.alts[i]);
                    }
                }
            }
        }
        // if no alts found, return error
        if (new_alts.length == 0) {
            return { error: ErrorMessage.OTHER, msg: `No alts found for \`${args[0]}\``, hidden: true };
        }

        const altsEmbed = new Discord.MessageEmbed()
        .setColor('#293e6a')
        .setTitle(args[0] + '\'s Alts')
        .setDescription("```" + new_alts.join("\n") + "```")
        .setThumbnail('https://cdn.echo.ac/images/avatar.php?account=' + args[0])
        .setTimestamp()
        .setFooter(footerText, 'https://cdn.echo.ac/images/echo.png');

        return { error: ErrorMessage.SUCCESS, msg: "vvv", embeds: [ altsEmbed ] , hidden: false };
    }
}