const { Message } = require("discord.js");
const PermissionLevel = require("../Enums/PermissionLevel.js");
const ErrorMessage = require("../Enums/ErrorMessage.js");

function flatten(obj) {
    var empty = true;
    if (obj instanceof Array) {
        str = '[';
        empty = true;
        for (var i = 0; i < obj.length; i++) {
            empty = false;
            str += flatten(obj[i]) + ', ';
        }
        return (empty ? str : str.slice(0, -2)) + ']';
    } else if (obj instanceof Object) {
        str = '{';
        empty = true;
        for (i in obj) {
            empty = false;
            str += i + '->' + flatten(obj[i]) + ', ';
        }
        return (empty ? str : str.slice(0, -2)) + '}';
    } else {
        return obj; // not an obj, don't stringify me
    }
}

var activeServers = ['527654465189445642', '746777328553689208'];

module.exports = class CommandManager {
    constructor(config) {
        this.commands = {};
        this.config = config;
    }

    createSlashCommands(client, Discord) {
        Object.entries(this.getCommands()).forEach(([command_text, command]) => {
            // activeServers.forEach(server_id => {
            //     try {
            //         client.api.applications(client.user.id).guilds(server_id).commands.post({
            //             data: {
            //                 name: command.getCommand(),
            //                 description: command.description,
            //                 options: command.getArgs()
            //             }
            //         })
            //     } catch (err) {

            //     }
            // });

            try {
                client.api.applications(client.user.id).commands.post({
                    data: {
                        name: command.getCommand(),
                        description: command.description,
                        options: command.getArgs()
                    }
                })
            } catch (err) {

            }
        });

        client.ws.on('INTERACTION_CREATE', async interaction => {
            if (interaction.type == 3) return;
            let args = [];

            //console.log(JSON.stringify(interaction.data.options));

            var going_down = true;
            var options = interaction.data.options;
            var final_args = [];

            if (options != undefined) {
                // the hackiest thing I've ever done - turns huge json slash command args response into what a normal command args are eg. {bigslashcommandbullshit} -> mute josh 7d
                options.forEach(option => {

                    var new_args = flatten(option)
                        .replace(/\{type->2, options->\[{/g, "")
                        .replace(/type->1, options->\[{/g, "")
                        .replace(/value->/g, "")
                        .replace(/, type->7, name->/g, "#@")
                        .replace(/, type->8, name->/g, "#@")
                        .replace(/, type->6, name->.*?}/g, "#@")
                        .replace(/, type->4, name->.*?}/g, "#@")
                        .replace(/, type->5, name->.*?}/g, "#@")
                        .replace(/type->1, name->/g, "#@")
                        .replace(/, type->3, name->.*?}/g, "#@")
                        .replace(/}], name->/g, "#@")
                        .replace(/], name->/g, "#@")
                        .replace(/{{value->/g, "#@")
                        .replace(/}/g, "")
                        .replace(/{/g, "")
                        .split("#@");
                    var unique_args = [];


                    unique_args = new_args.filter(function (elem, pos) {
                        return new_args.indexOf(elem) == pos;
                    })

                    unique_args = unique_args.reverse();
                    unique_args.forEach(e => {
                        if (e != '') {
                            final_args.push(e);
                        }
                    })

                })
            }


            args = final_args;

            let user = new Discord.User(client, interaction.member.user);

            let guild = client.guilds.cache.get(interaction.guild_id);

            let member = guild.members.cache.get(user.id);

            let channel = guild.channels.cache.get(interaction.channel_id);

            this.runCommand(interaction.data.name, args, { author: user, channel: channel, guild: guild, member: member }).then(response => {
                if (response.msg == "" || response.msg == null) response.msg = "Handling your request...";

                if (response.embeds) {
                    client.api.interactions(interaction.id, interaction.token).callback.post({
                        data: {
                            type: 4,
                            data: {
                                embeds: (response.embeds ? response.embeds : []),
                            }
                        }
                    })
                } else {
                    client.api.interactions(interaction.id, interaction.token).callback.post({
                        data: {
                            type: (response.msg == "Handling your request..." ? 5 : 4),
                            data: {
                                content: response.msg,
                                flags: (response.hidden ? 64 : 0)
                            }
                        }
                    })
                }
            })
        });
    }

    registerCommand(command) {
        this.commands[command.getCommand()] = command;
    }

    getCommand(command_text) {
        return this.commands[command_text];
    }

    hasPermission(author, permission_level) {
        switch (permission_level) {
            case PermissionLevel.EVERYONE:
                return true;
            case PermissionLevel.ADMIN:
                if (author.hasPermission("ADMINISTRATOR")) {
                    return true;
                }
                break;
        }

        return false;
    }

    async runCommand(command_text, args, context) {
        let command = this.getCommand(command_text);

        if (command == undefined) return "";

        let author = context.guild.member(context.author);


        if (this.hasPermission(author, command.PermissionLevel))
            return command.run(args, context);
        else
            return { error: ErrorMessage.PERMISSIONS, msg: "No permissions!" };
    }

    listCommands(prefix) {
        console.log("Loaded commands:");
        Object.entries(this.commands).forEach(([command_text, command]) => {
            console.log(command.getCommand() + " " + command.getArgsAsString());
        });
        console.log();
    }

    getCommands() {
        return this.commands;
    }
}