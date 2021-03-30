const Command = require("../../base/Command.js"),
	Discord = require("discord.js");

const asyncForEach = async (array, callback) => {
	for (let index = 0; index < array.length; index++) {
		await callback(array[index], index, array);
	}
};

class Credits extends Command {

	constructor (client) {
		super(client, {
			name: "balance",
			dirname: __dirname,
			enabled: true,
			guildOnly: true,
			aliases: [ "credits", "money", "bal" ],
			memberPermissions: [],
			botPermissions: [ "SEND_MESSAGES", "EMBED_LINKS" ],
			nsfw: false,
			ownerOnly: false,
			cooldown: 1000
		});
	}

	async run (message, args, data) {
        
		let member = await this.client.resolveMember(args[0], message.guild);
		if(!member) member = message.member;
		const user = member.user;

		if(user.bot){
			return message.error("misc:BOT_USER");
		}

		const memberData = (message.author === user) ? data.userData : await this.client.findOrCreateUser({ id: user.id, guildID: message.guild.id }); 
		const bankSpace = memberData.bankSpace;
		const bankPercentage = ((memberData.bankSold/bankSpace) * 100).toFixed(0); 
		
		const embed = new Discord.MessageEmbed()
			.setAuthor(message.translate("economy/money:TITLE", {
				username: member.user.username
			}), member.user.displayAvatarURL())
			.addField(message.translate("economy/profile:CASH"), message.translate("economy/profile:MONEY", {
				money: memberData.money.commas()
			}), true)
			.addField(message.translate("economy/profile:BANK"), `${message.translate("economy/profile:MONEY", {
				money: memberData.bankSold.commas()
			})} / ${bankSpace.commas()} (${bankPercentage}%)`, true)
			.addField(message.translate("economy/profile:NET_WORTH"), message.translate("economy/profile:MONEY", {
				money: (memberData.money + memberData.bankSold).commas()
			}), true)
			.defaultColor()
			.defaultFooter();
			message.channel.send(embed);
	}

}

module.exports = Credits;