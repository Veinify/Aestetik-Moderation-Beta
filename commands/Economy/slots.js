const Command = require('../../base/Command.js');

class Slots extends Command {
	constructor(client) {
		super(client, {
			name: 'slots',
			dirname: __dirname,
			enabled: true,
			guildOnly: true,
			aliases: ['casino', 'slot'],
			memberPermissions: [],
			botPermissions: ['SEND_MESSAGES', 'EMBED_LINKS'],
			nsfw: false,
			ownerOnly: false,
			cooldown: 5000
		});
	}

	async run(message, args, data) {
		const fruits = ['🍎', '🍐', '🍌', '🍇', '🍉', '🍒', '🍓'];

		let i1 = 0,
			j1 = 0,
			k1 = 0,
			i2 = 1,
			j2 = 1,
			k2 = 1,
			i3 = 2,
			j3 = 2,
			k3 = 2,
			em = 0;

		// Gets three random fruits array
		const colonnes = [
			this.client.functions.shuffle(fruits),
			this.client.functions.shuffle(fruits),
			this.client.functions.shuffle(fruits)
		];
		var arrow = 'ᛎ';

		// Gets the amount provided
		let amount = args[0];
		if (typeof amount === 'string' && amount.toLowerCase() === 'all') amount = data.userData.money
		else if (typeof amount === 'string' && amount.toLowerCase() === 'max' || typeof amount === 'string' && amount.toLowerCase() === 'full') {
		    if (data.userData.money <= data.config.maxBet) amount = data.userData.money;
			else if (data.userData.money > data.config.maxBet) amount = data.config.maxBet;
		}
		if (!amount || isNaN(amount) || amount < 1) {
			amount = 100;
		}
		amount = Math.round(amount);
		if (amount > data.userData.money) {
			return message.error('economy/slots:NOT_ENOUGH', {
				money: amount.commas()
			});
		}
		if (amount < data.config.minBet) {
		    return message.error('misc:GAMBLE_MIN', {min: data.config.minBet.commas()})
		}
		if (amount > data.config.maxBet) {
		    return message.error('misc:GAMBLE_MAX', {max: data.config.maxBet.commas()})
		}
		amount = Math.round(amount);

		function getCredits(number, isJackpot) {
			if (!isJackpot) {
				number = number * 1.5;
			}
			if (isJackpot) {
				number = number * 4;
			}
			return parseInt(Math.round(number));
		}

		const tmsg = await message.sendT('misc:loading', null, {
			prefixEmoji: 'loading'
		});
		editMsg();
		const interval = setInterval(editMsg, 1000);
		setTimeout(() => {
			clearInterval(interval);
			end(tmsg);
		}, 3000);

		const embed = new Discord.MessageEmbed().defaultFooter();
		async function end() {
			let msg = '[  🎰 |  SLOTS   ]\n------------------\n';

			i1 = i1 < fruits.length - 1 ? i1 + 1 : 0;
			i2 = i2 < fruits.length - 1 ? i2 + 1 : 0;
			i3 = i3 < fruits.length - 1 ? i3 + 1 : 0;
			j1 = j1 < fruits.length - 1 ? j1 + 1 : 0;
			j2 = j2 < fruits.length - 1 ? j2 + 1 : 0;
			j3 = j3 < fruits.length - 1 ? j3 + 1 : 0;
			k1 = k1 < fruits.length - 1 ? k1 + 1 : 0;
			k2 = k2 < fruits.length - 1 ? k2 + 1 : 0;
			k3 = k3 < fruits.length - 1 ? k3 + 1 : 0;
			msg += `   ${colonnes[0][i3]} : ${colonnes[1][j3]} : ${colonnes[2][k3]}\n`;
			msg += `>  ${colonnes[0][i2]} : ${colonnes[1][j2]} : ${colonnes[2][k2]}  <\n`;
			msg += `   ${colonnes[0][i1]} : ${colonnes[1][j1]} : ${colonnes[2][k1]}\n`;

			if (
				colonnes[0][i2] == colonnes[1][j2] &&
				colonnes[1][j2] == colonnes[2][k2]
			) {
				msg +=
					'|:::  ' +
					message.translate('common:VICTORY').toUpperCase() +
					'  :::|';
				embed.setDescription(`\`\`\`${msg}\`\`\``).successColor();
				tmsg.edit(embed);
				const credits = getCredits(amount, true);
				message.channel.send(
					'**!! JACKPOT !!**\n' +
						message.translate('economy/slots:VICTORY', {
							money: amount.commas(),
							won: credits.commas(),
							username: message.author.username
						})
				);
				data.userData.money += credits;
				if (!data.userData.achievements.slots.achieved) {
					data.userData.achievements.slots.progress.now += 1;
					if (
						data.userData.achievements.slots.progress.now ===
						data.userData.achievements.slots.progress.total
					) {
						data.userData.achievements.slots.achieved = true;
						message.channel.send({
							files: [
								{
									name: 'unlocked.png',
									attachment:
										'./assets/img/achievements/achievement_unlocked4.png'
								}
							]
						});
					}
					data.userData.markModified('achievements.slots');
					await data.userData.save();
				}
				await data.userData.save();
				return;
			}

			if (
				colonnes[0][i2] == colonnes[1][j2] ||
				colonnes[1][j2] == colonnes[2][k2] ||
				colonnes[0][i2] == colonnes[2][k2]
			) {
				msg +=
					'|:::  ' +
					message.translate('common:VICTORY').toUpperCase() +
					'  :::|';
				embed.setDescription(`\`\`\`${msg}\`\`\``).successColor();
				tmsg.edit(embed);
				const credits = getCredits(amount, false);
				message.channel.send(
					message.translate('economy/slots:VICTORY', {
						money: amount.commas(),
						won: credits.commas(),
						username: message.author.username
					})
				);
				data.userData.money += credits;
				if (!data.userData.achievements.slots.achieved) {
					data.userData.achievements.slots.progress.now += 1;
					if (
						data.userData.achievements.slots.progress.now ===
						data.userData.achievements.slots.progress.total
					) {
						data.userData.achievements.slots.achieved = true;
						message.channel.send({
							files: [
								{
									name: 'unlocked.png',
									attachment:
										'./assets/img/achievements/achievement_unlocked4.png'
								}
							]
						});
					}
					data.userData.markModified('achievements.slots');
					await data.userData.save();
				}
				await data.userData.save();
				return;
			}

			msg +=
				'|:::  ' +
				message.translate('common:DEFEAT').toUpperCase() +
				'  :::|';
			embed.setDescription(`\`\`\`${msg}\`\`\``).errorColor();
			tmsg.edit(embed);
			message.channel.send(
				message.translate('economy/slots:DEFEAT', {
					money: amount.commas(),
					username: message.author.username
				})
			);
			data.userData.money -= amount;
			if (!data.userData.achievements.slots.achieved) {
				data.userData.achievements.slots.progress.now = 0;
				data.userData.markModified('achievements.slots');
				await data.userData.save();
			}
			return;
		}
		function editMsg() {
			let msg = '[  🎰 |  SLOTS   ]\n------------------\n';

			i1 = i1 < fruits.length - 1 ? i1 + 1 : 0;
			i2 = i2 < fruits.length - 1 ? i2 + 1 : 0;
			i3 = i3 < fruits.length - 1 ? i3 + 1 : 0;
			j1 = j1 < fruits.length - 1 ? j1 + 1 : 0;
			j2 = j2 < fruits.length - 1 ? j2 + 1 : 0;
			j3 = j3 < fruits.length - 1 ? j3 + 1 : 0;
			k1 = k1 < fruits.length - 1 ? k1 + 1 : 0;
			k2 = k2 < fruits.length - 1 ? k2 + 1 : 0;
			k3 = k3 < fruits.length - 1 ? k3 + 1 : 0;
			em++
			msg += `  ${em === 1 ? arrow : ' '}${colonnes[0][i3]} : ${colonnes[1][j3]} : ${colonnes[2][k3]}${em === 1 ? arrow : ' '}\n`;
			msg += `> ${em === 2 ? arrow : ' '}${colonnes[0][i2]} : ${colonnes[1][j2]} : ${colonnes[2][k2]}${em === 2 ? arrow : ' '} <\n`;
			msg += `  ${em === 3 ? arrow : ' '}${colonnes[0][i1]} : ${colonnes[1][j1]} : ${colonnes[2][k1]}${em === 3 ? arrow : ' '}\n`;
			const embed = new Discord.MessageEmbed()
				.setDescription(`\`\`\`${msg}\`\`\``)
				.waitColor()
				.defaultFooter();
			tmsg.edit('', embed);
		}
	}
}

module.exports = Slots;
