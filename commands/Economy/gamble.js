const Command = require('../../base/Command.js'),
	Discord = require('discord.js'),
	Notification = require('../../base/Notification');

class Gamble extends Command {
	constructor(client) {
		super(client, {
			name: 'gamble',
			dirname: __dirname,
			enabled: true,
			guildOnly: true,
			aliases: ['bet', 'roll', 'dice'],
			memberPermissions: [],
			botPermissions: ['SEND_MESSAGES', 'EMBED_LINKS'],
			nsfw: false,
			ownerOnly: false,
			cooldown: 5000,
			requiredLocation: 'CASINO'
		});
	}

	async run(message, args, data) {
		const client = this.client;
		let percentCalc = (percent, money) => {
			return this.client.functions.percentCalc(percent, money);
		};
		let randomNum = (min, max) => {
			return this.client.functions.randomNum(min, max);
		};
		const emojis = client.customEmojis;
		const rollingDice = emojis['rolling_dices'];
		const dices = emojis['dices'];

		let amount = args[0];
		amount = this.client.functions.calcAmount(amount, data, true, message);
		if (!amount) return;

		var userBet = [randomNum(1, 6), randomNum(1, 6)];
		var botBet = [randomNum(1, 6), randomNum(1, 6)];
		const userNumber = userBet[0] + userBet[1];
		const botNumber = botBet[0] + botBet[1];

		const embed = new Discord.MessageEmbed()
			.setTitle(`${message.author.username}'s Gambling Machine`)
			.setDescription(message.translate('economy/gamble:YOUR_TURN'))
			.addField(message.author.username, `${rollingDice['1']} ${rollingDice['2']} [?]`)
			.addField(this.client.user.username, `${dices['1']} ${dices['1']} [?]`)
			.waitColor()
			.defaultColor();

		const msg = await message.channel.send(embed);

		setTimeout(botTurn, 3000);
		setTimeout(end, 6000);

		function botTurn() {
			const embed = new Discord.MessageEmbed()
				.setTitle(`${message.author.username}'s Gambling Machine`)
				.setDescription(
					message.translate('economy/gamble:BOT_TURN', {
						name: client.user.username
					})
				)
				.addField(
					message.author.username,
					`${dices[userBet[0]]} ${dices[userBet[1]]} [${userNumber}]`
				)
				.addField(client.user.username, `${rollingDice['1']} ${rollingDice['2']} [?]`)
				.waitColor()
				.defaultColor();
			msg.edit({embed});
		}
		function end() {
			let result = '';

			const percentWon = randomNum(50, 200);
			if (userNumber > botNumber) result = 'win';
			else if (userNumber < botNumber) result = 'lose';
			else if (userNumber === botNumber) result = 'tie';
			const embed = new Discord.MessageEmbed()
				.setTitle(`${message.author.username}'s Gambling Machine`)
				.addField(
					message.author.username,
					`${dices[userBet[0]]} ${dices[userBet[1]]} [${userNumber}]`
				)
				.addField(
					client.user.username,
					`${dices[botBet[0]]} ${dices[botBet[1]]} [${botNumber}]`
				)
				.defaultFooter();
			switch (result) {
				case 'win':
					const won = percentCalc(percentWon, amount);
					data.userData.money += won;
					embed
						.setDescription(`${message.translate('economy/gamble:WIN', {amount: won.commas()})}\nPercent of bet won: **${percentWon}%**`)
						.successColor();
					break;
				case 'lose':
					data.userData.money -= amount;
					embed
						.setDescription(
							message.translate('economy/gamble:LOSE', {
								amount: amount.commas()
							})
						)
						.errorColor();
					break;
				case 'tie':
					const loseamt = percentCalc(15, amount);
					data.userData.money -= loseamt;
					embed
						.setDescription(
							message.translate('economy/gamble:TIE', { amount: loseamt.commas() })
						)
						.waitColor();
					break;
			}
			msg.edit({embed});
		}
	}
}
module.exports = Gamble;
