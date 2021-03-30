const Command = require('../../base/Command.js'),
	Notification = require('../../base/Notification');

class Pay extends Command {
	constructor(client) {
		super(client, {
			name: 'give',
			dirname: __dirname,
			enabled: true,
			guildOnly: true,
			aliases: ['pay'],
			memberPermissions: [],
			botPermissions: ['SEND_MESSAGES', 'EMBED_LINKS'],
			nsfw: false,
			ownerOnly: false,
			cooldown: 10000
		});
	}

	async run(message, args, data) {
		const member = await this.client.resolveMember(args[0], message.guild);
		if (!member) {
			return message.error('economy/pay:INVALID_MEMBER');
		}
		if (member.user.bot) {
			return message.error('economy/pay:BOT_USER');
		}
		if (member.id === message.author.id) {
			return message.error('economy/pay:YOURSELF');
		}
		const sentAmount = args[1];
		if (!sentAmount || isNaN(sentAmount) || parseInt(sentAmount, 10) <= 0) {
			return message.error('economy/pay:INVALID_AMOUNT', {
				username: member.user.tag
			});
		}

		const amount = Math.ceil(parseInt(sentAmount, 10));

		if (amount > data.userData.money) {
			return message.error('economy/pay:ENOUGH_MONEY', {
				amount: amount.commas(),
				username: member.user.tag
			});
		}

		const memberData = await this.client.findOrCreateUser({
			id: member.id
		});

		data.userData.money -= parseInt(amount, 10);

		memberData.money += parseInt(amount, 10);
		await memberData.save();
		
		// create a Notification
		new Notification(this.client, memberData, {
		    title: 'You have been given money!',
		    message: `\`${message.author.tag}\` has given you **${this.client.config.currencyLogo}${amount.commas()}** in **${message.member.guild}**!`,
		    category: this.help.name
		})
		// Send a success message
		message.success('economy/pay:SUCCESS', {
			amount: amount.commas(),
			username: member.user.tag
		});
	}
}

module.exports = Pay;
