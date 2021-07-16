// initiate discord bot
const Discord = require('discord.js');
const Config = require("./Classes/Config.js");
const CommandManager = require("./Managers/CommandManager.js");
const UserManager = require("./Managers/UserManager.js");
const ButtonManager = require("./Managers/ButtonManager.js");

const CommandHandler = require("./Handlers/CommandHandler.js");

const config = new Config("../config.json");
const commandManager = new CommandManager(config);
const buttonManager = new ButtonManager(config);
const userManager = new UserManager(config);
const commandHandler = new CommandHandler(config, commandManager);


const Echo = new require('echo-tool-api');

const client = new Discord.Client();
require("discord-buttons")(client);

client.on('ready', () => {
    console.log("Bot has started!");
    client.user.setPresence({ activity: { name: `your messages...`, type: "LISTENING" }});

    commandManager.registerCommand(new (require("./Commands/PingCommand.js"))(config, client));
    commandManager.registerCommand(new (require("./Commands/ScanCommand.js"))(config, userManager, buttonManager));
    commandManager.registerCommand(new (require("./Commands/KeyCommand.js"))(config, userManager));
    commandManager.registerCommand(new (require("./Commands/AltsCommand.js"))(config, userManager));
    commandManager.createSlashCommands(client, Discord);
});

// on bot recieve dm
client.on('message', message => {
    if (message.author.bot) return;
    if (message.guild === null) {

    } else {
        if (!commandHandler.onMessage(message)) return;
    }
});

client.on('clickButton', async (button) => {
    await button.reply.defer()
    buttonManager.callButton(button.id, button.clicker);
});

client.login(config.config.BOT_TOKEN);
