const Command = require('../../base/Command.js'),
	Discord = require('discord.js'),
	Notification = require('../../base/Notification'),
	moment = require('moment');

var maxPerPage = 5;
class Notifications extends Command {
	constructor(client) {
		super(client, {
			name: 'notifications',
			dirname: __dirname,
			enabled: true,
			guildOnly: true,
			aliases: ['notification', 'notifs', 'notif'],
			memberPermissions: [],
			botPermissions: ['SEND_MESSAGES', 'EMBED_LINKS'],
			nsfw: false,
			ownerOnly: false,
			cooldown: 3000
		});
	}

	async run(message, args, data) {
		let page = args[0];
		if (data.userData.notifications.length <= 0)
			return message.error('economy/notifications:NO_NOTIFICATION');
		let notifs = [];
		let i = 0;
		for (const notif of data.userData.notifications) {
			i++;
			notifs.push({
				title: notif.title,
				message: notif.message,
				category: notif.category,
				date: notif.date,
				place: i
			});
		}
		if (typeof page === 'string' && page.toLowerCase() === 'view') {
			let notifNumber = args[1];
			if (isNaN(parseInt(notifNumber)))
				return message.error('economy/notifications:NOTIF_NOT_EXIST', {
					prefix: data.guild.prefix
				});
			notifs = notifs[notifNumber - 1];
			if (!notifs)
				return message.error('economy/notifications:NOTIF_NOT_EXIST', {
					prefix: data.guild.prefix
				});
			const embed = new Discord.MessageEmbed()
				.setTitle(`Notification number: ${notifNumber}`)
				.setDescription(
					`Category: \`${notifs.category}\`\n**${notifs.title}**\n\n${
						notifs.message
					}\n\nDate:\`${message.printDate(notifs.date, 'MMMM Do YYYY, h:mm:ss a'
					)}\``
				)
				.defaultColor()
				.defaultFooter();
			return message.channel.send(embed);
		}
		if (typeof page === 'string' && page.toLowerCase() === 'clear') {
			const embed = new Discord.MessageEmbed()
				.setTitle(`${message.author.username}'s notification clear`)
				.setDescription(
					message.translate('economy/notifications:NOTIF_CLEAR_CONFIRM')
				)
				.defaultColor()
				.defaultFooter();
			message.channel.send(embed);
			const filter = res => {
				return res.author.id === message.author.id;
			};
			const answer = await message.channel
				.awaitMessages(filter, { max: 1, time: 20000, errors: ['time'] }).catch(() => {});
			if (!answer) return message.error('economy/notifications:NOTIF_CLEAR_FAIL');
			if (answer.first().content.toLowerCase() === 'yes') {
				data.userData.notifications = [];
				message.channel.send(
					message.success('economy/notifications:NOTIF_CLEAR_SUCCESS', {
						amount: notifs.length
					})
				);
			} else {
				message.error('economy/notifications:NOTIF_CLEAR_FAIL');
			}
			return;
		}
		if (isNaN(parseInt(page))) page = 1;
		let pages = notifs.toPages(maxPerPage).length;
		notifs = notifs.toPages(maxPerPage)[page - 1];
		// if an error was throwed
		if (!notifs || notifs.length <= 0 || page > notifs)
			return message.error('economy/notifications:PAGE_NOT_EXIST');
		const embed = new Discord.MessageEmbed()
			.setTitle(`${message.author.username}'s notifications`)
			.setDescription(
				message.translate('economy/notifications:PAGE_DESCRIPTION', {
					prefix: data.guild.prefix
				})
			)
			.addField('Your Notification:', '\u200B')
			.defaultColor()
			.setFooter(`Viewing page ${page} out of ${pages} pages.`);

		for (let n of notifs) {
			embed.addField(
				`${n.place}. ${n.title}`,
				`${n.message}\n\`${message.printDate(n.date, 'MM/DD/YY')}\``,
				true
			);
		}

		return message.channel.send(embed);
	}
}
module.exports = Notifications;