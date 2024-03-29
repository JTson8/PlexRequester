const {EmbedBuilder} = require("discord.js");

const logger = require('winston');

function embedTMDBShow(client, show) {
    let imageUrl = null;
    if (show.poster_path !== null && show.poster_path.length !== 0) {
        imageUrl = `https://www.themoviedb.org/t/p/w58_and_h87_face/${show.poster_path}`
    } else if (show.backdrop_path !== null && show.backdrop_path.length !== 0) {
        imageUrl = `https://www.themoviedb.org/t/p/w58_and_h87_face/${show.backdrop_path}`
    } else {
		imageUrl = `https://www.themoviedb.org/t/p/w58_and_h87_face/uc4RAVW1T3T29h6OQdr7zu4Blui.jpg`
	}
	
	console.log(client.user.avatarURL())
    return new EmbedBuilder()
        .setColor("DarkOrange")
        .setTitle(show.name)
        .setAuthor({ name: client.user.username, iconURL: 'https://styles.redditmedia.com/t5_2ql7e/styles/communityIcon_mdwl2x2rtzb11.png' })
        .setDescription(((show.overview !== "") ? `||${show.overview}||` : "null"))
        .setThumbnail(imageUrl)
        .addFields(
            { name: 'Air Date', value: ((show.first_air_date !== "") ? show.first_air_date : "null"), inline: true },
            { name: 'TMDB', value: `[Link](https://www.themoviedb.org/tv/${show.id})`, inline: true }
        )
        .setTimestamp()
        .setFooter({text: "Plex Requester", iconURL: client.user.avatarURL() });
}

function embedTMDBMovie(client, movie) {
    let imageUrl = null;
    if (movie.poster_path !== null && movie.poster_path.length !== 0) {
        imageUrl = `https://www.themoviedb.org/t/p/w58_and_h87_face/${movie.poster_path}`
    } else if (movie.backdrop_path !== null && movie.backdrop_path.length !== 0) {
        imageUrl = `https://www.themoviedb.org/t/p/w58_and_h87_face/${movie.backdrop_path}`
    } else {
		imageUrl = `https://www.themoviedb.org/t/p/w58_and_h87_face/uc4RAVW1T3T29h6OQdr7zu4Blui.jpg`
	}

    return new EmbedBuilder()
        .setColor("DarkBlue")
        .setTitle(movie.title)
        .setAuthor({ name: client.user.username, iconURL: 'https://styles.redditmedia.com/t5_2ql7e/styles/communityIcon_mdwl2x2rtzb11.png' })
        .setDescription(((movie.overview !== "") ? `||${movie.overview}||` : "null"))
        .setThumbnail(imageUrl)
        .addFields(
            { name: 'Release Date', value: ((movie.release_date !== "") ? movie.release_date : "null"), inline: true },
            { name: 'TMDB', value: `[Link](https://www.themoviedb.org/movie/${movie.id})`, inline: true }
        )
        .setTimestamp()
        .setFooter({text: "Plex Requester", iconURL: client.user.avatarURL() });
}

module.exports = {embedTMDBShow, embedTMDBMovie}
