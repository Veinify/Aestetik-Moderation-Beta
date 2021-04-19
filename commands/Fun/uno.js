const Command = require("../../base/Command.js"),
    Game = require('../../Commands Class/uno');

class Uno extends Command {
	constructor (client) {
		super(client, {
			name: "uno",
			dirname: __dirname,
			enabled: true,
			guildOnly: true,
			aliases: [],
			memberPermissions: [],
			botPermissions: [ "SEND_MESSAGES", "EMBED_LINKS" ],
			nsfw: false,
			ownerOnly: false,
			cooldown: 3000
		});
	}

	async run (message, args, data) {
		const Uno = new Game(this, data, message);
		Uno.init();
	}

}

module.exports = Uno;