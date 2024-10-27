// Require the necessary discord.js classes

const {ActionRowBuilder, ButtonBuilder, ButtonStyle, Events} = require("discord.js");

const fs = require('fs');
const process = require('node:process');
const { Client, GatewayIntentBits  } = require('discord.js');
const { token } = require('../data/config.json');
const { v4 } = require('uuid');

if (!fs.existsSync("./data/saved-data.json")) {
    let json = {
        "requestNum": 100,
        "requests": []
    };
    fs.mkdir('./data', { recursive: true }, (err) => {if (err) throw err;});
    fs.writeFileSync('./data/saved-data.json', JSON.stringify(json, null, 2));
}

const savedData = require('../data/saved-data.json');

const {searchTMDBShow, searchTMDBMovie} = require('./api-resources.js');
const {embedTMDBShow, embedTMDBMovie} = require('./embed-resources.js');

let requestNum = savedData.requestNum;
let requests

if (!requestNum) {
    updateSavedDataFile();
    requestNum = 100;
    requests = new Map();
} else {
    requests = new Map(savedData.requests)
}

process.on('unhandledRejection', error => {
	console.error('Unhandled promise rejection:', error);
});

// Create a new client instance
const client = new Client({ intents: [
    GatewayIntentBits.Guilds, GatewayIntentBits.DirectMessages, GatewayIntentBits.DirectMessageReactions,
        GatewayIntentBits.GuildMessages, GatewayIntentBits.GuildMessageReactions
    ] });

// When the client is ready, run this code (only once)
client.once('ready', () => {
    console.log('Ready!');
});

client.on(Events.ShardError, error => {
	console.error('A websocket connection encountered an error:', error);
});

client.on('interactionCreate', async interaction => {
    if (!interaction.isCommand()) return;

    const { commandName } = interaction;

    if (commandName === 'request_movie') {
        await processMovieRequest(interaction, true)
    } else if (commandName === 'request_show') {
        await processShowRequest(interaction, true)
    } else if (commandName === 'user') {
        await interaction.reply('User info.');
    }
});

client.on('messageReactionAdd', async (reaction, user) => {
    try {
        if (!reaction.me && requests.has(reaction.message.id)) {
            const requestPlex = requests.get(reaction.message.id);
            requestPlex.react(reaction.emoji).then().catch(console.error);
        }
    } catch (e) {
        console.log(e);
    }
});

client.on('messageReactionRemove', (reaction, user) => {
    try {
        if (requests.has(reaction.message.id)) {
            const requestPlex = requests.get(reaction.message.id);
            requestPlex.reactions.cache.find(r => r.emoji.name === reaction.emoji.name).remove().then().catch(console.error);
        }
    } catch (e) {
        console.log(e);
    }
});

// Login to Discord with your client's token
client.login(token);
client.users.fetch('116976756581203972');
client.users.fetch('139462400658112513');

async function processMovieRequest(interaction) {
    await interaction.deferReply()
    let test = false
    const interactionString = interaction.options.getString("movie_name")
    if (interactionString.endsWith("(test)")) {
        test = true
    }
    const movieName = interactionString.replace("(test)", "")
    try {
        searchTMDBMovie(movieName, function (movies) {
            let adminID = "116976756581203972";
            if (test) {
                adminID = "139462400658112513";
            }

            if (movies !== undefined && movies.length !== undefined && movies.length > 0) {
                const uuid = v4()
                const button = new ActionRowBuilder()
                    .addComponents(
                        new ButtonBuilder()
                            .setCustomId(uuid)
                            .setLabel("Not what I'm looking for")
                            .setStyle(ButtonStyle.Danger),
                    );
                interaction.editReply({content: "Select a movie to request.", components: [button]})

                sendTMDBMovies(interaction, movies, adminID, uuid, movieName)
            } else {
                interaction.editReply("No movies found with that name. Sending request to Admin.")
                client.users.cache.get(adminID).send({
                    content: `${interaction.user.username} has requested this Movie: ${movieName}. No results found on TMDB.`
                }).then(msg => {
                    requests.set(msg.id, interaction.fetchReply());
                    if (requestNum === 999)
                        requestNum = 100;
                    else
                        requestNum++;
                    updateSavedDataFile();
                }).catch(console.error);
            }
        })
    } catch (e) {
        console.log(e);
    }

}

async function processShowRequest(interaction) {
    await interaction.deferReply()
    let test = false
    const interactionString = interaction.options.getString("show_name")
    if (interactionString.endsWith("(test)")) {
        test = true
    }
    const showName = interactionString.replace("(test)", "")
    try {

        searchTMDBShow(showName, function (shows) {
            let adminID = "116976756581203972";
            if (test) {
                adminID = "139462400658112513";
            }

            if (shows !== undefined && shows.length !== undefined && shows.length > 0) {
                const uuid = v4()
                const button = new ActionRowBuilder()
                    .addComponents(
                        new ButtonBuilder()
                            .setCustomId(uuid)
                            .setLabel("Not what I'm looking for")
                            .setStyle(ButtonStyle.Danger),
                    );
                interaction.editReply({content: "Select a show to request.", components: [button]})

                sendTMDBShows(interaction, shows, adminID, uuid, showName)
            } else {
                interaction.editReply(`No shows found with the name "${showName}". Sending request to Admin.`)
                client.users.cache.get(adminID).send({
                    content: `${interaction.user.username} has requested this Show: ${showName}. No results found on TMDB.`
                }).then(msg => {
                    requests.set(msg.id, interaction.fetchReply());
                    if (requestNum === 999)
                        requestNum = 100;
                    else
                        requestNum++;
                    updateSavedDataFile();
                }).catch(console.error);
            }
        })
    } catch (e) {
        console.log(e)
    }
}

async function sendTMDBMovies(interaction, movies, adminID, cancelId, movieName) {
    const maxI = movies.length > 5 ? 5 : movies.length
    const movieMessages = new Map()

    const interactionReply = await interaction.fetchReply()

    for (let i = 0; i < maxI; i++) {
        const uuid = v4()
        const embed = embedTMDBMovie(client, movies[i])
        const button = new ActionRowBuilder()
            .addComponents(
                new ButtonBuilder()
                    .setCustomId(uuid)
                    .setLabel('Request')
                    .setStyle(ButtonStyle.Primary),
            );

        interactionReply.reply({embeds: [embed], components: [button]}).then(message => {
            movieMessages[uuid] = {message: message, embed: embed}
            if (i+1 === maxI) {
                createCollector(movieMessages, interaction, interactionReply, cancelId, adminID, "Movie", movieName)
            }
        })

    }
}

async function sendTMDBShows(interaction, shows, adminID, cancelId, showName) {
    const maxI = shows.length > 5 ? 5 : shows.length
    const showMessages = new Map()

    const interactionReply = await interaction.fetchReply()

    for (let i = 0; i < maxI; i++) {
        const uuid = v4()
        const embed = embedTMDBShow(client, shows[i])
        const button = new ActionRowBuilder()
            .addComponents(
                new ButtonBuilder()
                    .setCustomId(uuid)
                    .setLabel('Request')
                    .setStyle(ButtonStyle.Primary),
            );

        interactionReply.reply({embeds: [embed], components: [button]}).then(message => {
            showMessages[uuid] = {message: message, embed: embed}
            if (i+1 === maxI) {
                createCollector(showMessages, interaction, interactionReply, cancelId, adminID, "Show")
            }
        })
    }
}

function createCollector(map, interaction, interactionReply, cancelId, adminID, showOrMovie, name) {
    const filter = i => i.customId === cancelId || Object.keys(map).find(value => value === i.customId) != null;
    const collector = interaction.channel
        .createMessageComponentCollector({filter, time: 5000 * 60 })

    collector.on('collect', async i => {
        if (i.customId === cancelId) {
            interactionReply.edit({content: `"${name}" did not give the ${showOrMovie} you are looking for. Request not sent.`, components: []})
            Object.keys(map).forEach(key => {
                try {
                    map[key].message.delete()
                        .then(msg => console.log(`Deleted message from ${msg.author.username}`))
                        .catch(console.error);
                } catch(e) {
                    console.log(e);
                }
            })
        } else if (Object.keys(map).find(value => value === i.customId) != null) {
            const {embed} = map[i.customId]
            Object.keys(map).forEach(key => {
                try {
                    map[key].message.delete()
                        .then(msg => console.log(`Deleted message from ${msg.author.username}`))
                        .catch(console.error);
                } catch(e) {
                    console.log(e);
                }
            })
            interactionReply.edit({content: "Requested", embeds: [embed], components: []})
            client.users.cache.get(adminID).send({
                content: `${interaction.user.username} has requested this ${showOrMovie}`,
                embeds: [embed],
                components: []
            }).then(msg => {
                requests.set(msg.id, interactionReply);
                if (requestNum === 999)
                    requestNum = 100;
                else
                    requestNum++;
                updateSavedDataFile();
            }).catch(console.error);
        }
    });

    collector.on('end', collected => {
        if (collected.size < 1) {
            interactionReply.edit({content: `No ${showOrMovie} was selected. Request not sent.`})
        }
        Object.keys(map).forEach(key => {
            try {
                map[key].message.delete()
                    .then(msg => console.log(`Deleted message from ${msg.author.username}`))
                    .catch(console.error);
            } catch(e) {
                console.log(e);
            }
        })
    });
}

function updateSavedDataFile() {
    let validRequestNum = 100;
    if (requestNum)
        validRequestNum = requestNum;

    let json = {
        "requestNum": validRequestNum,
        "requests": Array.from(requests)
    };
    fs.writeFileSync('./data/saved-data.json', JSON.stringify(json, null, 2));
}
