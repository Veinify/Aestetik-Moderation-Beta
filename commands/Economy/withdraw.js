const Command = require('../../base/Command.js');

class Withdraw extends Command {
	constructor(client) {
		super(client, {
			name: 'withdraw',
			dirname: __dirname,
			enabled: true,
			guildOnly: true,
			aliases: ['with'],
			memberPermissions: [],
			botPermissions: ['SEND_MESSAGES', 'EMBED_LINKS'],
			nsfw: false,
			ownerOnly: false,
			cooldown: 1000
		});
	}

	async run(message, args, data) {
		let amount = args[0];
		amount = this.client.functions.calcAmount(amount, data, false);
		if (!(parseInt(data.userData.bankSold, 10) > 0)) {
			return message.error('economy/withdraw:NO_CREDIT');
		}

		if (isNaN(amount) || parseInt(amount, 10) < 1) {
			return message.error('economy/withdraw:MISSING_AMOUNT');
		}

		if (data.userData.bankSold < amount) {
			return message.error('economy/withdraw:NOT_ENOUGH', {
				money: amount.commas()
			});
		}

		data.userData.money += amount;
		data.userData.bankSold -= amount;

		message.success('economy/withdraw:SUCCESS', {
			money: amount.commas()
		});
	}
}

module.exports = Withdraw;
