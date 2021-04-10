const Command = require("../../base/Command.js"),
	Discord = require("discord.js");

class Joke extends Command {

	constructor (client) {
		super(client, {
			name: "joke",
			dirname: __dirname,
			enabled: true,
			guildOnly: false,
			aliases: [ "blague" ],
			memberPermissions: [],
			botPermissions: [ "SEND_MESSAGES", "EMBED_LINKS" ],
			nsfw: false,
			ownerOnly: false,
			cooldown: 3000
		});
	}

	async run (message, args, data) {
		const joke = await this.client.jokes.random()

		const embed = new Discord.MessageEmbed()
			.setDescription(`**Category:** \`${joke.category}\`\n\n**${joke.question}**\n||${joke.answer}||`)
			.defaultFooter()
			.defaultColor();

		message.inlineReply({ embed: embed, allowedMentions: { repliedUser: false } });

	}

}

module.exports = Joke;