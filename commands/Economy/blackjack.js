const Command = require('../../base/Command.js'),
	Discord = require('discord.js');
var { randomNum } = require('../../helpers/functions');
var emojis = require('../../emojis')['blackjack'];
/* BJ DATA */
var suites = ['spade', 'heart', 'diamond', 'clover'];
var fullCollection = [
	'A',
	'A',
	'2',
	'2',
	'3',
	'4',
	'5',
	'6',
	'7',
	'8',
	'9',
	'9',
	'9',
	'9',
	'10',
	'J',
	'J',
	'Q',
	'Q',
	'K',
	'K'
];
class Blackjack extends Command {
	constructor(client) {
		super(client, {
			name: 'blackjack',
			dirname: __dirname,
			enabled: true,
			guildOnly: true,
			aliases: ['bj'],
			memberPermissions: [],
			botPermissions: ['SEND_MESSAGES', 'EMBED_LINKS'],
			nsfw: false,
			ownerOnly: false,
			cooldown: 5000
		});
	}

	async run(message, args, data) {
	    const client = this.client;
	    const cmd = this;
	    if (typeof args[0] === 'string' && args[0].toLowerCase() === 'multiplayer') {
	        let amount = client.functions.calcAmount(args[1], data, true, message);
	        if (!amount) return;
	        const blackjack = require('../../Commands Class/blackjack')
	        const bj = new blackjack(this, data, message, amount);
	        bj.init();
	        return;
	    }
		let amount = args[0];
		amount = client.functions.calcAmount(amount, data, true, message);
		if (!amount) return;
		
		let cardsObj = createCardCollection(amount);
		const cards = new CardMessage(cardsObj);

		const startEmbed = cembed()
			.addField(
				`${message.author.username}'s cards`,
				`${cards.user.card.join('')}\nvalue: ${cards.user.value.soft ? 'Soft ' : ''}${cards.user.value.score}`
			)
			.addField(
				`${client.user.username}'s cards`,
				`${cards.bot.card.join('')}${emojis['draw_card']}\nvalue: ${cards.bot.value.soft ? 'Soft ' : ''}${cards.bot.value.score}`
			)
			.defaultColor();
		const msg = await message.inlineReply(startEmbed);
		if (cards.user.value.score === 21) {
		    return checkUser(cards.user.value.score, msg, data, cembed, cardsObj, null, cards, message.author)
		}

		const filter = m => m.author.id === message.author.id;
		const collector = message.channel.createMessageCollector(filter, {
			time: 120000
		});

		collector.on('collect', message => {
			if (
				message.content.toLowerCase() === 'hit' ||
				message.content.toLowerCase() === 'h'
			) {
				userHit(msg, cardsObj, cembed, collector, data, message.author);
			} else if (
				message.content.toLowerCase() === 'stand' ||
				message.content.toLowerCase() === 's'
			) {
				userStand(msg, cardsObj, cembed, collector, data, message.author);
			} else if (
				message.content.toLowerCase() === 'double down' ||
				message.content.toLowerCase() === 'dd'
			) {
			    if (cards.user.card.length > 2) return message.inlineReply('You can only double-down when you have 2 cards in your hand.')
				if (cardsObj.bet * 2 > data.userData.money) return message.inlineReply(`You don't have enough money to double down!`)
				cardsObj.bet = cardsObj.bet * 2;
				const hit = userHit(
					msg,
					cardsObj,
					cembed,
					collector,
					data,
					message.author
				);
				if (hit)
					userStand(msg, cardsObj, cembed, collector, data, message.author);
			}
		});

		function cembed() {
			const embed = new Discord.MessageEmbed()
				.setTitle(`${message.author.username}'s Blackjack`)
				.setDescription(
					`Type \`hit\` to hit, \`stand\` to stand and \`double down\` to double down.`
				)
				.setFooter(`Did you know: you can start a multiplayer blackjack by running ${data.guild.prefix}${cmd.help.name} multiplayer`);
			return embed;
		}
	}
}
module.exports = Blackjack;

function userHit(message, cardsObj, cembed, collector, data, author) {
	var card = new Card(randCard());
	cardsObj.userTotal.push(card);
	const cards = new CardMessage(cardsObj);
	var total = cards.user.value.score;
	const cardCheck = checkUser(
		total,
		message,
		data,
		cembed,
		cardsObj,
		collector,
		cards,
		author
	);
	/* idk for what but ill just put it here */
	if (cardCheck) return true;
	else return false;
}
function checkUser(
	total,
	message,
	data,
	cembed,
	cardsObj,
	collector,
	cards,
	author
) {
	const cLogo = data.config.currencyLogo;
	const bet = Number(cardsObj.bet);
	const embed = cembed();
	if (total > 21) {
		//User busted - end game (loss)
		data.userData.money -= bet;
		embed
			.setDescription(`Busted! You lost **${cLogo}${bet.commas()}**.`)
			.addField(
				`${author.username}'s cards`,
				`${cards.user.card.join('')}\nvalue: ${cards.user.value.soft ? 'Soft ' : ''}${cards.user.value.score}`
			)
			.addField(
				`${message.client.user.username}'s cards`,
				`${cards.bot.card.join('')}${emojis['draw_card']}\nvalue: ${cards.bot.value.soft ? 'Soft ' : ''}${cards.bot.value.score}`
			)
			.errorColor();
		message.edit(embed);
		if (collector) collector.stop();
		return false;
	} else if (total == 21) {
		//User blackjack - end game (win)
		data.userData.money += bet;
		embed
			.setDescription(`Blackjack! You won **${cLogo}${bet.commas()}**!`)
			.addField(
				`${author.username}'s cards`,
				`${cards.user.card.join('')}\nvalue: ${cards.user.value.soft ? 'Soft ' : ''}${cards.user.value.score}`
			)
			.addField(
				`${message.client.user.username}'s cards`,
				`${cards.bot.card.join('')}${emojis['draw_card']}\nvalue: ${cards.bot.value.soft ? 'Soft ' : ''}${cards.bot.value.score}`
			)
			.successColor();
		message.edit(embed);
		if (collector) collector.stop();
		return false;
	} else if (total <= 21 && cardsObj.userTotal.length >= 5) {
		//Got 5 cards without busting. User wins
		data.userData.money += bet;
		embed
			.setDescription(
				`You got 5 cards without getting busted! You won **${cLogo}${bet.commas()}**!`
			)
			.addField(
				`${author.username}'s cards`,
				`${cards.user.card.join('')}\nvalue: ${cards.user.value.soft ? 'Soft ' : ''}${cards.user.value.score}`
			)
			.addField(
				`${message.client.user.username}'s cards`,
				`${cards.bot.card.join('')}${emojis['draw_card']}\nvalue: ${cards.bot.value.soft ? 'Soft ' : ''}${cards.bot.value.score}`
			)
			.successColor();
		message.edit(embed);
		if (collector) collector.stop();
		return false;
	} else {
		embed
			.addField(
				`${author.username}'s cards`,
				`${cards.user.card.join('')}\nvalue: ${cards.user.value.soft ? 'Soft ' : ''}${cards.user.value.score}`
			)
			.addField(
				`${message.client.user.username}'s cards`,
				`${cards.bot.card.join('')}${emojis['draw_card']}\nvalue: ${cards.bot.value.soft ? 'Soft ' : ''}${cards.bot.value.score}`
			)
			.defaultColor();
		message.edit(embed);
		return true; // continue the script
	}
}
function userStand(message, cardsObj, cembed, collector, data, author) {
	if (collector) collector.stop();
	var card = new Card(randCard());
	cardsObj.compTotal.push(card);
	const cards = new CardMessage(cardsObj);
	var total = cards.bot.value.score;
	var userTotal = cards.user.value.score;
	const cardCheck = checkBot(
		total,
		message,
		data,
		cembed,
		cardsObj,
		cards,
		userTotal,
		author
	);
	/* idk for what but ill just put it here */
	if (cardCheck) return true;
	else return false;
}
function checkBot(
	total,
	message,
	data,
	cembed,
	cardsObj,
	cards,
	userTotal,
	author
) {
	const cLogo = data.config.currencyLogo;
	const bet = Number(cardsObj.bet);
	const embed = cembed();
	if (total > 21) {
		// Bot busted - User wins
		data.userData.money += bet;
		embed
			.setDescription(
				`${
					message.client.user.username
				} busted! You won **${cLogo}${bet.commas()}**!`
			)
			.addField(
				`${author.username}'s cards`,
				`${cards.user.card.join('')}\nvalue: ${cards.user.value.soft ? 'Soft ' : ''}${cards.user.value.score}`
			)
			.addField(
				`${message.client.user.username}'s cards`,
				`${cards.bot.card.join('')}\nvalue: ${cards.bot.value.soft ? 'Soft ' : ''}${cards.bot.value.score}`
			)
			.successColor();
		message.edit(embed);
		return false;
	} else if (total >= 17) {
		//Computer stands
		if (total == userTotal) {
			//It's a tie
			embed
				.setDescription(`It's a tie! You got nothing.`)
				.addField(
					`${author.username}'s cards`,
					`${cards.user.card.join('')}\nvalue: ${cards.user.value.soft ? 'Soft ' : ''}${cards.user.value.score}`
				)
				.addField(
					`${message.client.user.username}'s cards`,
					`${cards.bot.card.join('')}\nvalue: ${cards.bot.value.soft ? 'Soft ' : ''}${cards.bot.value.score}`
				)
				.waitColor();
			message.edit(embed);
			return false;
		} else if (total == 21) {
			//Computer has blackjack
			data.userData.money -= bet;
			embed
				.setDescription(
					`${
						message.client.user.username
					} got a blackjack! You lose **${cLogo}${bet.commas()}**.`
				)
				.addField(
					`${author.username}'s cards`,
					`${cards.user.card.join('')}\nvalue: ${cards.user.value.soft ? 'Soft ' : ''}${cards.user.value.score}`
				)
				.addField(
					`${message.client.user.username}'s cards`,
					`${cards.bot.card.join('')}\nvalue: ${cards.bot.value.soft ? 'Soft ' : ''}${cards.bot.value.score}`
				)
				.errorColor();
			message.edit(embed);
			return false;
		} else if (total > userTotal) {
			//Computer has larger number - end game (user loss)
			data.userData.money -= bet;
			embed
				.setDescription(
					`${
						message.client.user.username
					} got a higher number than yours! You lose **${cLogo}${bet.commas()}**.`
				)
				.addField(
					`${author.username}'s cards`,
					`${cards.user.card.join('')}\nvalue: ${cards.user.value.soft ? 'Soft ' : ''}${cards.user.value.score}`
				)
				.addField(
					`${message.client.user.username}'s cards`,
					`${cards.bot.card.join('')}\nvalue: ${cards.bot.value.soft ? 'Soft ' : ''}${cards.bot.value.score}`
				)
				.errorColor();
			message.edit(embed);
			return false;
		} else {
			//Computer has smaller number - end game (user win)
			data.userData.money += bet;
			embed
				.setDescription(
					`You got a higher number! You won **${cLogo}${bet.commas()}**!`
				)
				.addField(
					`${author.username}'s cards`,
					`${cards.user.card.join('')}\nvalue: ${cards.user.value.soft ? 'Soft ' : ''}${cards.user.value.score}`
				)
				.addField(
					`${message.client.user.username}'s cards`,
					`${cards.bot.card.join('')}\nvalue: ${cards.bot.value.soft ? 'Soft ' : ''}${cards.bot.value.score}`
				)
				.successColor();
			message.edit(embed);
			return false;
		}
	} else {
		embed
			.setDescription(`${message.client.user.username} is hitting...`)
			.addField(
				`${author.username}'s cards`,
				`${cards.user.card.join('')}\nvalue: ${cards.user.value.soft ? 'Soft ' : ''}${cards.user.value.score}`
			)
			.addField(
				`${message.client.user.username}'s cards`,
				`${cards.bot.card.join('')}\nvalue: ${cards.bot.value.soft ? 'Soft ' : ''}${cards.bot.value.score}`
			)
			.defaultColor();
		message.edit(embed);
		setTimeout(() => {
			userStand(message, cardsObj, cembed, null, data, author);
		}, 2000);
		return false;
	}
}

function ToInteger(card) {
	if (card == 'A') {
		return 11;
	} else if (card == 'base') {
		return 0;
	} else if (card == 'J' || card == 'Q' || card == 'K') {
		return 10;
	} else {
		return Number(card);
	}
}

function Card(value) {
	this.toInteger = ToInteger(value[0]);
	this.val = value[0];
	this.suite = value[1]; /*Card object initialized*/
}
function createCardCollection(bet) {
	var cardsObj = { userTotal: [], compTotal: [], bet: bet };
	var userBase = [new Card(randCard()), new Card(randCard())];
	var compBase = new Card(randCard());
	cardsObj.userTotal.push(...userBase);
	cardsObj.compTotal.push(compBase);
	return cardsObj;
}
function arrCardCalc(arr) {
	var sum = 0;
	var iterations = 0;
	for (var x in arr) {
		sum += arr[iterations].toInteger;
		iterations += 1;
	}
	return [sum, iterations];
}
function randCard() {
	const randCard = randomNum(1, 20) - 1;
	const randSuit = randomNum(1, 4) - 1;
	return [fullCollection[randCard], suites[randSuit]];
}
function CardMessage(cardsObj) {
	const starterCard = cardsObj.userTotal.map(e => {
		return emojis[e.suite][e.val];
	});
	let starterVal = scoreHand(cardsObj.userTotal);
	const starterCardComp = cardsObj.compTotal.map(e => {
		return emojis[e.suite][e.val];
	});
	let starterValComp = scoreHand(cardsObj.compTotal)
	this.user = {
		card: starterCard,
		value: starterVal
	};
	this.bot = {
		card: starterCardComp,
		value: starterValComp
	};
}
function scoreHand(hand) {
	let nonAcesScore = 0;
	let acesInHand = 0;
	let acesScore = 0;
	for (let card of hand) {
		if (card.val === 'A') {
			acesInHand += 1;
		} else if ('JQK'.indexOf(card.val) !== -1) {
			nonAcesScore += 10;
		} else {
			nonAcesScore += Number(card.val);
		}
	}
	let highAces = 0;
	let lowAces = acesInHand;
	for (let i = acesInHand; i > 0; i--) {
		if (i * 11 + (acesInHand - i) * 1 + nonAcesScore <= 21) {
			highAces = i;
			lowAces = acesInHand - 1;
			break;
		}
	}
	acesScore = highAces * 11 + lowAces * 1;
	return { score: acesScore + nonAcesScore, soft: highAces > 0 };
}
