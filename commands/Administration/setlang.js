const Command = require("../../base/Command.js");

class Setlang extends Command {

	constructor (client) {
		super(client, {
			name: "setlang",
			dirname: __dirname,
			enabled: true,
			guildOnly: true,
			aliases: [],
			memberPermissions: [ "MANAGE_GUILD" ],
			botPermissions: [ "SEND_MESSAGES", "EMBED_LINKS" ],
			nsfw: false,
			ownerOnly: false,
			cooldown: 3000
		});
	}

	async run (message, args, data) {

		const language = this.client.languages.find((l) => l.name === args[0] || l.aliases.includes(args[0]));

		if(!args[0] || !language){
			return message.error("administration/setlang:MISSING_LANG", {
				list: this.client.languages.map((l) => "`"+l.name+"`").join(", ")
			});
		}

		data.userData.settings.language = language.name;
		await data.userData.markModified('settings');
        
		return message.sendT("administration/setlang:SUCCESS");
        
	}

}

module.exports = Setlang;