const Discord = require('discord.js');
const Command = require('../Classes/Command.js');
const PermissionLevel = require('../Enums/PermissionLevel.js');
const ErrorMessage = require('../Enums/ErrorMessage.js');
const { MessageButton, MessageActionRow, MessageComponent } = require('discord-buttons');
const { v4: uuidv4 } = require('uuid');

var footerText = "This is an official bot using the Echo API"

const delay = ms => new Promise(res => setTimeout(res, ms));

function progressBar(percent) {
    var emptyBlock = "░"
    var fullBlock = "█"
    var bar = fullBlock.repeat(Math.floor(percent / 3)) + emptyBlock.repeat(Math.floor((100 - percent) / 3));

    if (bar.length != 34) {
        bar = bar + emptyBlock.repeat(34 - bar.length);
    }

    var progressBar = "[" + bar + "]";
    return progressBar;
}

function timeConverter(UNIX_timestamp) {
    var a = new Date(UNIX_timestamp * 1000);
    var months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",];
    var year = a.getFullYear();
    var month = months[a.getMonth()];
    var date = a.getDate();
    var hour = a.getHours();
    var min = a.getMinutes();
    var sec = a.getSeconds();
    var hours_text = "";
    if (hour < 10) {
        hours_text = "0" + hour;
    } else {
        hours_text = hour;
    }
    var mins_text = "";
    if (min < 10) {
        mins_text = "0" + min;
    } else {
        mins_text = min;
    }
    var secs_text = "";
    if (sec < 10) {
        secs_text = "0" + sec;
    } else {
        secs_text = sec;
    }
    var time = date + " " + month + " " + year + " " + hours_text + ":" + mins_text + ":" + secs_text;
    return time;
}
function secondsToHms(d) {
    d = Number(d);
    var h = Math.floor(d / 3600);
    var m = Math.floor((d % 3600) / 60);
    var s = Math.floor((d % 3600) % 60);
    var hDisplay = h > 0 ? h + (h == 1 ? "h, " : "h, ") : "";
    var mDisplay = m > 0 ? m + (m == 1 ? "m, " : "m, ") : "";
    var sDisplay = s > 0 ? s + (s == 1 ? "s" : "s") : "";
    return hDisplay + mDisplay + sDisplay;
}
function milisecondsToHmsms(d) {
    d = Number(d);
    var h = Math.floor(d / 1000 / 3600);
    var m = Math.floor(((d / 1000) % 3600) / 60);
    var s = Math.floor(((d / 1000) % 3600) % 60);
    var ms = d - s * 1000 - m * 60 * 1000 - h * 60 * 60 * 1000;
    var hDisplay = h > 0 ? h + (h == 1 ? "h, " : "h, ") : "";
    var mDisplay = m > 0 ? m + (m == 1 ? "m, " : "m, ") : "";
    var sDisplay = s > 0 ? s + (s == 1 ? "s, " : "s, ") : "";
    var msDisplay = ms > 0 ? ms + (ms == 1 ? "ms" : "ms") : "";
    return hDisplay + mDisplay + sDisplay + msDisplay;
}

function scanningEmbed(percent, heur) {
    return new Discord.MessageEmbed()
        .setColor('#293e6a')
        .setTitle((heur ? 'Running heuristic analysis...' : 'Scanning processes...'))
        .setDescription('**' + progressBar(percent) + '**')
        .setTimestamp()
        .setFooter(footerText, 'https://cdn.echo.ac/images/echo.png');
}

module.exports = class ScanCommand extends Command {
    constructor(config, userManager, buttonManager) {
        super("scan", [{ "name": "pin", "required": false, "type": 3, "description": "Pin used for scanning (can automatically retrieve if you are enterprise)." }], "Retrieves scan link and begins starts scanning process from Discord.");

        this.userManager = userManager;
        this.buttonManager = buttonManager;
        this.config = config;
    }

    PermissionLevel = PermissionLevel.EVERYONE;

    async run(args, context) {
        var userid = context.author.id;
        var user = this.userManager.getUser(userid);

        var echoUser = user.getUser();

        var isEnterprise = false;
        var username = "";

        if (user.getUser()) {
            var info = await echoUser.getUserInfo();

            if (info) {
                if (!info.has_echo) return { error: ErrorMessage.OTHER, msg: `You must own Echo to use this command, buy at https://buy.echo.ac/.`, hidden: true };

                if (info.plan) {
                    if (info.plan.name == "Enterprise") {
                        isEnterprise = true;
                    }
                } else {
                    if (info.has_echo == true)
                        isEnterprise = true;
                }

                username = info.username;
            } else {
                return { error: ErrorMessage.OTHER, msg: `You don't seem to have a valid API key linked. Visit your account settings, find your API key then use \`/key <key>\` to be able to use this command.`, hidden: true };
            }
        } else {
            return { error: ErrorMessage.OTHER, msg: `You don't seem to have a valid API key linked. Visit your account settings, find your API key then use \`/key <key>\` to be able to use this command.`, hidden: true };
        }

        if (!isEnterprise && !args[0]) {
            return { error: ErrorMessage.OTHER, msg: `Since you're not an Enterprise user, you must enter the pin as it cannot be retrieved automatically.`, hidden: true };
        }

        var pin;
        var scanLink = "https://dl.echo.ac/";

        if (!isEnterprise) {
            pin = args[0];
        } else {
            var info = await echoUser.getPinInfo();
            if (!info) return { error: ErrorMessage.OTHER, msg: `An unusual API error occured.`, hidden: true };
            pin = info.pin;
            scanLink = info.link;
        }

        var deleteButtonId = uuidv4();
        let deleteButton = new MessageButton()
            .setStyle('red')
            .setLabel('Delete')
            .setID(deleteButtonId);

        this.buttonManager.addButton(deleteButtonId, (clicker) => {
            if (clicker.id == context.author.id) {
                this.buttonManager.removeButton(deleteButtonId);
                msg.delete();
            }
        })

        const awaitingPinEmbed = new Discord.MessageEmbed()
            .setColor('#293e6a')
            .setTitle('Your Scan Information')
            .setDescription('<@' + context.author + '> ' + (username != "" ? ('(' + username + ')') : '') + ' has initiated a scan, download Echo and begin scanning to see results appear here.')
            .addFields(
                { name: 'PIN', value: pin, inline: true },
                { name: 'Scan Link', value: scanLink, inline: true },
            )
            .setTimestamp()
            .setFooter(footerText, 'https://cdn.echo.ac/images/echo.png');

        var msg = await context.channel.send(awaitingPinEmbed, new MessageActionRow()
            .addComponents(deleteButton));

        var started = false;


        echoUser.on(pin, "started", () => {
            if (!started) {
                started = true;
                msg.edit(scanningEmbed(0, false));
            }
        });

        var lastChanged = 0;
        var lastPercent = 0;
        var heur = false;
        var finished = false;

        echoUser.on(pin, "progress_change", (percent) => {
            if (Date.now() - lastChanged > 1000 && !finished && started) {
                lastChanged = Date.now();

                if (percent <= lastPercent)
                    heur = true;
                lastPercent = percent;

                msg.edit(scanningEmbed(percent, heur));
            }
        });

        echoUser.on(pin, "finished", async () => {
            finished = true;

            msg.edit(new Discord.MessageEmbed()
                .setColor('#293e6a')
                .setTitle('Processing results...')
                .setTimestamp()
                .setFooter(footerText, 'https://cdn.echo.ac/images/echo.png'), new MessageActionRow()
                    .addComponents(deleteButton))

            await delay(2000);
            var scanUuid = (await echoUser.getScans(1)).scans;
            var info = await echoUser.getScanInfo(scanUuid);
            // replace all @ with # in info to prevent people putting @everyone in the scan
            JSON.parse(JSON.stringify(info).replace(/@/g, "@˞˞˞˞˞˞˞˞˞˞˞˞˞˞˞˞˞˞˞˞"));

            var version = "";
            var results = info.results;
            if (results["traces"]) {
                results["traces"].forEach(function (trace) {
                    if (trace["in_instance"].endsWith(":o")) {
                        results["extra"].push({
                            name: "Traces found for " + trace["name"].replace("<code>", "``").replace("</code>", "``") + " out of instance.",
                            severity: "severe",
                            explain: "trace",
                        });
                    } else {
                        if (trace["name"].endsWith(":c")) {
                            results["extra"].push({
                                name: "<:custom_string_1:865641906796757012><:custom_string_2:865641916804104212> " + trace["name"].split(":")[0].replace("%^", "``").replace("%&", "``"),
                                severity: trace["in_instance"].toLowerCase(),
                                explain: "trace",
                            });
                        } else {
                            results["extra"].push({
                                name: "Traces found for " + trace["name"].replace("<code>", "``").replace("</code>", "``") + " in instance.",
                                severity: "severe",
                                explain: "trace",
                            });
                        }
                    }
                });
            }

            if (results["web"] != undefined) {
                results["web"].forEach(function (web) {
                    results["extra"].push({
                        name: "Player visited ``https://" + web + "/`` since last restart.",
                        severity: "warning",
                        explain: "web",
                    });
                });
            }

            var version_client_detected = false;
            if (results["versions"] != undefined) {
                if (results["versions"][results["current_version"]] != undefined) {
                    if (results["versions"][results["current_version"]]["lastVersionId"] != undefined) {
                        var version_clients = ["Ace", "Aristois", "ZeroDay", "Impact", "Wurst", "Sigma", "Huzuni", "Moon", "Nodus"];
                        version_clients.forEach(function (version_client) {
                            if (results["versions"][results["current_version"]]["lastVersionId"].toLowerCase().includes(version_client.toLowerCase())) {
                                version_client_detected = true;
                            }
                        });
                    }
                }
            }

            var found_xray = false;
            if (results["texture_packs"] != undefined) {
                results["texture_packs"].forEach(function (texture, i) {
                    if (results["current_pack"] == i) {
                        if (texture["name"].toLowerCase().includes("xray")) {
                            found_xray = true;
                        }
                    }
                });
            }

            if (found_xray) {
                results["extra"].push({
                    name: "(scan.indication.xray)",
                    severity: "severe",
                    explain: "xray",
                });
            }
            if (version_client_detected) {
                results["extra"].push({
                    name: "(scan.indication.version.a) <code>" + results["versions"][results["current_version"]]["lastVersionId"] + "</code> (scan.indication.version.b)",
                    severity: "severe",
                    explain: "version",
                });
            }

            var color = "#2dce89";

            var cleanliness = 0;
            results["extra"].forEach(function (extra) {
                if (extra["severity"] == "warning") {
                    cleanliness = 1;
                    color = "#cea70c";
                }
            });
            results["extra"].forEach(function (extra) {
                if (extra["severity"] == "good") {
                    cleanliness = 0;
                    color = "#2dce89";
                }
            });
            results["extra"].forEach(function (extra) {
                if (extra["severity"] == "severe") {
                    cleanliness = 2;
                    color = "#f5365c";
                }
            });

            var detectedText = 'an error occured';

            switch (cleanliness) {
                case 2:
                    detectedText = '<:detected:865588037864914965> **DETECTED**\nWe are pretty sure this person is cheating, the key indiciations are very strong and our systems think that you are dealing with a cheater, read the analysis below for more information.';
                    break;
                case 1:
                    detectedText = '<:warning:865588037957320765> **UNUSUAL**\nWe aren\'t for certain if this user is cheating but they have some strong indications, read the below analysis and check if there is any explanation to the key indications.';
                    break;
                case 0:
                    detectedText = '<:clean:865588037827035156> **CLEAN**\nThis scan result has strongly indicated the player is clean, this means our scanner has detected nothing unusual about the player and there is no apparent reason this person is cheating.';
                    break;
            }

            try {
                var mc_version = results["versions"][results["current_version"]]["lastVersionId"];
                if (!mc_version.includes("Lunar")) {
                    if (!mc_version.includes(" ") && !mc_version.includes("-")) {
                        version = ("Vanilla " + mc_version);
                    } else {
                        version = (mc_version);
                    }
                } else {
                    version = ("Lunar Client");
                }
            } catch (err) {
                version = ("Not found");
            }

            var indications = [];

            var counts = { clean: 0, warning: 0, severe: 0 };

            results["extra"].forEach(function (indication) {
                switch (indication["severity"]) {
                    case "severe":
                        indications.push("**Severe**  " + indication["name"]);
                        counts.severe++;
                        break;
                    case "warning":
                        indications.push("**Warning**  " + indication["name"]);
                        counts.warning++;
                        break;
                    case "good":
                        indications.push("**Good**  " + indication["name"]);
                        counts.clean++;
                        break;
                }
            });

            const scanInfoEmbed = new Discord.MessageEmbed()
                .setColor(color)
                .setTitle('Scan Info')
                .setDescription(detectedText)
                .setThumbnail('https://cdn.echo.ac/images/avatar.php?account=' + (info.alts ? info.alts[0] : "alex"))
                .addFields(
                    { name: 'ID', value: scanUuid.split("-")[0], inline: true },
                    { name: 'PIN', value: '``' + info.pin.split('').join("`` ``") + '``', inline: true },
                    { name: 'TIMESTAMP', value: timeConverter(results["info"]["timestamp"]), inline: true },
                    { name: 'VM', value: results["info"]["vm"], inline: true },
                    //{ name: 'CONNECTION TYPE', value: 'Residential', inline: true },
                    { name: 'RECYCLE BIN', value: secondsToHms(results["info"]["recycle"]) + " ago", inline: true },
                    //{ name: 'COUNTRY', value: ':flag_gb: United Kingdom', inline: true },
                    { name: 'OPERATING SYSTEM', value: results["info"]["os"], inline: true },
                    { name: 'SCAN SPEED', value: milisecondsToHmsms(results["info"]["speed"]), inline: true },
                    { name: 'GAME VERSION', value: version, inline: true },
                    { name: 'ACCOUNTS', value: (info.alts ? info.alts.join('\n') : "none") },
                    { name: '\u200B', value: "[Click here to view full scan details](https://scan.echo.ac/" + scanUuid + ")" },
                )
                .setTimestamp()
                .setFooter(footerText, 'https://cdn.echo.ac/images/echo.png');


            var fields = [{ name: 'Good', value: counts.clean, inline: true },
            { name: 'Warning', value: counts.warning, inline: true },
            { name: 'Severe', value: counts.severe, inline: true }];

            var indicationaries = (indications.join("\n") != "" ? indications.join("\n") : "No indications present");
            indicationaries.split("\n").forEach(function (indication) {
                fields.push({ name: '\u200B', value: indication, inline: false })
            });

            if (fields.length > 12) {
                fields = fields.slice(0, 10);
                fields.push({ name: '\u200B', value: "...", inline: false });
            }

            const keyIndicationsEmbed = new Discord.MessageEmbed()
                .setColor(color)
                .setTitle('Key Indications')
                .setDescription(detectedText)
                .setThumbnail('https://cdn.echo.ac/images/avatar.php?account=' + (info.alts ? info.alts[0] : "alex"))
                .addFields(
                    fields
                )
                .addFields({ name: '\u200B', value: "[Click here to view full scan details](https://scan.echo.ac/" + scanUuid + ")" })
                .setTimestamp()
                .setFooter(footerText, 'https://cdn.echo.ac/images/echo.png');



            const fileLogsEmbed = new Discord.MessageEmbed()
                .setColor(color)
                .setTitle('Explorer Pcaclient')
                .setDescription(detectedText + "\n\n" + '```' + results["pca"] + '```')
                .setThumbnail('https://cdn.echo.ac/images/avatar.php?account=' + (info.alts ? info.alts[0] : "alex"))
                .addFields({ name: '\u200B', value: "[Click here to view full scan details](https://scan.echo.ac/" + scanUuid + ")" })
                .setTimestamp()
                .setFooter(footerText, 'https://cdn.echo.ac/images/echo.png');

            const startTimesEmbed = new Discord.MessageEmbed()
                .setColor(color)
                .setTitle('Start Times')
                .setDescription(detectedText)
                .setThumbnail('https://cdn.echo.ac/images/avatar.php?account=' + (info.alts ? info.alts[0] : "alex"))
                .addFields(
                    { name: 'JAVAW', value: (results["start_time"]["javaw"] ? secondsToHms(results["info"]["timestamp"] - results["start_time"]["javaw"]) + " ago" : "Not found"), inline: true },
                    { name: 'SYSTEM', value: (results["start_time"]["sys"] ? secondsToHms(results["info"]["timestamp"] - results["start_time"]["sys"]) + " ago" : "Not found"), inline: true },
                    { name: 'EXPLORER', value: (results["start_time"]["explorer"] ? secondsToHms(results["info"]["timestamp"] - results["start_time"]["explorer"]) + " ago" : "Not found"), inline: true },
                    { name: 'DGT SERVICE', value: (results["start_time"]["dgt"] ? secondsToHms(results["info"]["timestamp"] - results["start_time"]["dgt"]) + " ago" : "Not found"), inline: true },
                    { name: 'DPS SERVICE', value: (results["start_time"]["dps"] ? secondsToHms(results["info"]["timestamp"] - results["start_time"]["dps"]) + " ago" : "Not found"), inline: true },
                    { name: 'PCA SERVICE', value: (results["start_time"]["pca"] ? secondsToHms(results["info"]["timestamp"] - results["start_time"]["pca"]) + " ago" : "Not found"), inline: true },
                    { name: 'DNS SERVICE', value: (results["start_time"]["dns"] ? secondsToHms(results["info"]["timestamp"] - results["start_time"]["dns"]) + " ago" : "Not found"), inline: true },

                    { name: '\u200B', value: "[Click here to view full scan details](https://scan.echo.ac/" + scanUuid + ")" })
                .setTimestamp()
                .setFooter(footerText, 'https://cdn.echo.ac/images/echo.png');

            function getButtons(pressedbtn, buttonManager) {
                var button1id = uuidv4();
                let button1 = new MessageButton()
                    .setStyle((pressedbtn == 1 ? 'blurple' : 'blurple'))
                    .setLabel('Scan Info')
                    .setID(button1id)
                    .setDisabled(pressedbtn == 1);

                var button2id = uuidv4();
                let button2 = new MessageButton()
                    .setStyle((pressedbtn == 2 ? 'blurple' : 'blurple'))
                    .setLabel('Key Indications')
                    .setID(button2id)
                    .setDisabled(pressedbtn == 2)

                var button3id = uuidv4();
                let button3 = new MessageButton()
                    .setStyle((pressedbtn == 3 ? 'blurple' : 'blurple'))
                    .setLabel('Explorer Pcaclient')
                    .setID(button3id)
                    .setDisabled(pressedbtn == 3)

                var button4id = uuidv4();
                let button4 = new MessageButton()
                    .setStyle((pressedbtn == 4 ? 'blurple' : 'blurple'))
                    .setLabel('Start Times')
                    .setID(button4id)
                    .setDisabled(pressedbtn == 4)

                buttonManager.addButton(button1id, (clicker) => {
                    if (clicker.id == context.author.id) {
                        buttonManager.removeButton(button1id);
                        buttonManager.removeButton(button2id);
                        buttonManager.removeButton(button3id);
                        buttonManager.removeButton(button4id);
                        msg.edit(scanInfoEmbed, getButtons(1, buttonManager));
                    }
                })

                buttonManager.addButton(button2id, (clicker) => {
                    if (clicker.id == context.author.id) {
                        buttonManager.removeButton(button1id);
                        buttonManager.removeButton(button2id);
                        buttonManager.removeButton(button3id);
                        buttonManager.removeButton(button4id);
                        msg.edit(keyIndicationsEmbed, getButtons(2, buttonManager));
                    }
                })

                buttonManager.addButton(button3id, (clicker) => {
                    if (clicker.id == context.author.id) {
                        buttonManager.removeButton(button1id);
                        buttonManager.removeButton(button2id);
                        buttonManager.removeButton(button3id);
                        buttonManager.removeButton(button4id);
                        msg.edit(fileLogsEmbed, getButtons(3, buttonManager));
                    }
                })

                buttonManager.addButton(button4id, (clicker) => {
                    if (clicker.id == context.author.id) {
                        buttonManager.removeButton(button1id);
                        buttonManager.removeButton(button2id);
                        buttonManager.removeButton(button3id);
                        buttonManager.removeButton(button4id);
                        msg.edit(startTimesEmbed, getButtons(4, buttonManager));
                    }
                })


                return new MessageActionRow()
                    .addComponents(button1, button2, button4, button3, deleteButton);


            }

            msg.edit(scanInfoEmbed, getButtons(1, this.buttonManager));
        });

        echoUser.listen(pin);


        return { error: ErrorMessage.SUCCESS, msg: `We've initiated scan in this channel, you can delete it from the channel at any time using the \`Delete\` button.`, hidden: true };
    }
}