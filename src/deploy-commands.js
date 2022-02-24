const { SlashCommandBuilder } = require('@discordjs/builders');
const { REST } = require('@discordjs/rest');
const { Routes } = require('discord-api-types/v9');
const { clientId, token, guildId } = require('../data/config.json');

const commands = [
    new SlashCommandBuilder().setName('request_movie').setDescription('Search and request a movie')
        .addStringOption(option =>
            option.setName("movie_name")
                .setDescription('Enter a movie name')
                .setRequired(true)
        ),
    new SlashCommandBuilder().setName('request_show').setDescription('Search and request a show')
        .addStringOption(option =>
            option.setName("show_name")
                .setDescription('Enter a show name')
                .setRequired(true)
        )
]
    .map(command => command.toJSON());

const rest = new REST({ version: '9' }).setToken(token);

rest.put(Routes.applicationGuildCommands(clientId, guildId), { body: commands })
    .then(() => console.log('Successfully registered application commands.'))
    .catch(console.error);
