const Command = require('../../base/Command.js'),
	Discord = require('discord.js'),
	Notification = require('../../base/Notification');


let answers = {
	success: [
		'"Ok sure, have **{{amount}} coins**"',
		'"Come here and take my {{amount}} coins"',
		'"Take my **{{amount}} coins** and DONT let anyone knows"',
		'"Come here you little beggar, take my **{{amount}} coins**"'
	],
	fail: [
		'"Too bad i don\'t have any"',
		'"Nah mate, i only gives money to the poor"',
		'"Yo stop f\'ing calling me bro."',
		'"I don\'t give money to a beggars like you"',
		'"no hablan Inglés"',
		'"Beggars can\'t be choosers"',
		'"nou"'
	],
	fined: [
		'A police has caught you begging! You have been fined **{{amount}} coins**',
		'While walking on the street, you found a little poor dog thats hungry. You went to a Pet Store and bought a food for them for **{{amount}} coins**',
		'You got tripped by a rock and got your head hurt, you went to the Hospital and paid **{{amount}} coins**'
	],
	death: [
		'You begged too much that you forgot about your health. You ended up died and lost **{{amount}} coins** on your wallet'
	]
};

class Beg extends Command {
	constructor(client) {
		super(client, {
			name: 'beg',
			dirname: __dirname,
			enabled: true,
			guildOnly: true,
			aliases: [],
			memberPermissions: [],
			botPermissions: ['SEND_MESSAGES', 'EMBED_LINKS'],
			nsfw: false,
			ownerOnly: false,
			cooldown: 60000
		});
	}

	async run(message, args, data) {
	    var persons = this.client.locations.commonPeople[this.client.locations.findLocation(data.userData.currentLocation,  true)]
		const cLogo = this.client.config.currencyLogo;
		let options = getRandom(persons, 3);
		let optionslowercase = options.map(function(value) {
			return value.toLowerCase();
		});
		let optmsg = [];
		for (const opt of options) {
			optmsg.push(`\`${opt}\``);
		}
		await message.inlineReply(`${message.translate('economy/beg:BEG_LIST', {
			options: optmsg.join(', ')
		})}`, { allowedMentions: { repliedUser: false } });
		const filter = res => {
			return res.author.id === message.author.id;
		};
		const answer = await message.channel
			.awaitMessages(filter, { max: 1, time: 20000, errors: ['time'] })
			.catch(() => {});
		if (!answer)
			return message.channel.send(
				`${message.author}, ${message.translate('economy/beg:TIMED_OUT')}`
			);
		const result = answer.first().content;
		const chosen = optionslowercase.indexOf(result.toLowerCase());

		if (chosen < 0)
			return message.inlineReply(
				`${message.translate('economy/beg:NOT_FOUND')}`
			);
		options = options.splice(chosen, 1);
		const embed = new Discord.MessageEmbed()
			.setTitle(options.join(''))
			.setFooter(this.client.config.embed.footer);

		let payout;
		const random = Math.floor(this.client.functions.randomNum(1, 100));
		const min = 50;
		const max = 200;
		const payoutamount = Math.floor(this.client.functions.randomNum(min, max));
		/*
		1-50 = success
		50-85 = fail
		85-95 = fined
		95-100 = death
		*/
		if (random < 50) payout = 'success';
		else if (random > 50 && random < 85) payout = 'fail';
		else if (random > 85 && random < 95) payout = 'fined';
		else if (random > 95) payout = 'death';
		else payout = 'success'; //if somehow it broke

		switch (payout.toString()) {
			case 'success':
				let successarr = answers['success'];
				embed.setDescription(
					getRandom(successarr, 1)
						.join('')
						.replace('{{amount}}', `${cLogo}${payoutamount.commas()}`)
				)
				.successColor();
				data.userData.money += payoutamount;
				break;
			case 'fail':
				let failarr = answers['fail'];
				embed.setDescription(getRandom(failarr, 1).join(''))
				.waitColor();
				break;
			case 'fined':
				let finedarr = answers['fined'];
				embed.setDescription(
					getRandom(finedarr, 1)
						.join('')
						.replace('{{amount}}', `${cLogo}${payoutamount.commas()}`)
				)
				.errorColor();
				new Notification(this.client, data.userData, {
					title: 'You have been fined!',
					message: `You got fined **${
						this.client.config.currencyLogo
					}${payoutamount.commas()}** while trying to beg!`,
					category: this.help.name
				});
				data.userData.money -= payoutamount;
				break;
			case 'death':
				let deatharr = answers['death'];
				embed.setDescription(
					getRandom(deatharr, 1)
						.join('')
						.replace('{{amount}}', `${cLogo}${data.userData.money.commas()}`)
				)
				.errorColor();
				new Notification(this.client, data.userData, {
					title: 'You died!',
					message: `You died when trying to beg. You lost **${
						this.client.config.currencyLogo
					}${data.userData.money.commas()}**. That's pretty unfortunate.`,
					category: this.help.name
				});
				data.userData.money = 0;
				break;
			default:
			throw new Error(`Cannot determines if user won or fail. Payout Case: ${payout} (${this.help.name} command)`)
			break;
		}

		answer.first().inlineReply({ embed: embed, allowedMentions: { repliedUser: false } });
	}
}

module.exports = Beg;

function getRandom(arr, n) {
	var result = new Array(n),
		len = arr.length,
		taken = new Array(len);
	if (n > len)
		throw new RangeError('getRandom: more elements taken than available');
	while (n--) {
		let x = Math.floor(Math.random() * len);
		while (x > len || x < 0) {
			x = Math.floor(Math.random() * len);
		}
		result[n] = arr[x in taken ? taken[x] : x];
		taken[x] = --len in taken ? taken[len] : len;
	}
	return result;
}
