const Command = require('../../base/Command.js'),
	Discord = require('discord.js');
const asyncForEach = async (array, callback) => {
	for (let index = 0; index < array.length; index++) {
		await callback(array[index], index, array);
	}
};

class Profile extends Command {
	constructor(client) {
		super(client, {
			name: 'profile',
			dirname: __dirname,
			enabled: true,
			guildOnly: true,
			aliases: ['profil'],
			memberPermissions: [],
			botPermissions: ['SEND_MESSAGES', 'EMBED_LINKS'],
			nsfw: false,
			ownerOnly: false,
			cooldown: 3000
		});
	}

	async run(message, args, data) {
		const client = this.client;
		
		const { calculateXp, calculateLevel } = client.functions;
		
		let member = await client.resolveMember(args[0], message.guild);
		if (!member) member = message.member;

		// Check if the user is a bot
		if (member.user.bot) {
			return message.error('economy/profile:BOT_USER');
		}

		// Gets the data of the user whose profile you want to display
		const memberData =
			member.id === message.author.id
				? data.memberData
				: await client.findOrCreateMember({
						id: member.id,
						guildID: message.guild.id
				  });
		const userData =
			member.id === message.author.id
				? data.userData
				: await client.findOrCreateUser({ id: member.id });
		let level = userData.level;
		let exp = userData.exp;
		const currentXp = level !== 0 ? exp - calculateXp(level) : exp;
	    const neededXp = calculateXp(level+1);
		// Check if the lover is cached
		if (userData.lover && !this.client.users.cache.get(userData.lover)) {
			await this.client.users.fetch(userData.lover, true);
		}
		

		const profileEmbed = new Discord.MessageEmbed()
			.setAuthor(
				message.translate('economy/profile:TITLE', {
					username: member.user.tag
				}),
				member.user.displayAvatarURL()
			)
			.attachFiles([
				{
					attachment: await userData.getAchievements(),
					name: 'achievements.png'
				}
			])
			.setImage('attachment://achievements.png')
			.setDescription(
				userData.bio
					? userData.bio
					: message.translate('economy/profile:NO_BIO')
			)
			.addField(
				message.translate('economy/profile:CASH'),
				message.translate('economy/profile:MONEY', {
					money: userData.money.commas()
				}),
				true
			)
			.addField(
				message.translate('economy/profile:BANK'),
				message.translate('economy/profile:MONEY', {
					money: userData.bankSold.commas()
				}),
				true
			)
			.addField(
				message.translate('economy/profile:NET_WORTH'),
				message.translate('economy/profile:MONEY', {
					money: (userData.money + userData.bankSold).commas()
				}),
				true
			)
			.addField(
			    message.translate('economy/profile:LOCATION'),
			    message.translate('economy/profile:CURRENT_LOCATION', {location: this.client.locations.findLocation(userData.currentLocation).toLowerCase()})
			)
			.addField(
				message.translate('economy/profile:REPUTATION'),
				message.translate('economy/profile:REP_POINTS', {
					points: userData.rep.commas()
				}),
				true
			)
			.addField(
				message.translate('economy/profile:LEVEL'),
				`**${userData.level.commas()}**`,
				true
			)
			.addField(message.translate('economy/profile:EXP'), `**${exp}** / **${neededXp}** [**${(currentXp/(neededXp - calculateXp(level))*100).toFixed(0)}%**]`, true)
			.addField(
				message.translate('economy/profile:REGISTERED'),
				message.printDate(new Date(memberData.registeredAt)),
				true
			)
			.addField(
				message.translate('economy/profile:BIRTHDATE'),
				!userData.birthdate
					? message.translate('economy/profile:NO_BIRTHDATE')
					: message.printDate(new Date(userData.birthdate)),
				true
			)
			.addField(
				message.translate('economy/profile:LOVER'),
				!userData.lover
					? message.translate('economy/profile:NO_LOVER')
					: this.client.users.cache.get(userData.lover).tag,
				true
			)
			.addField(
				message.translate('economy/profile:ACHIEVEMENTS'),
				message.translate('economy/profile:ACHIEVEMENTS_CONTENT', {
					prefix: data.guild.prefix
				})
			)
			.defaultColor()
			.defaultFooter()
			.setTimestamp();

		message.channel.send(profileEmbed); // Send the embed in the current channel
	}
}

module.exports = Profile;
