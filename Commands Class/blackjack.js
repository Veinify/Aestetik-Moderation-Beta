const Discord = require('discord.js');
var {
	randomNum
} = require('../helpers/functions');
var emojis = require('../emojis')['blackjack'];
/* BJ DATA */
var suites = ['spade', 'heart', 'diamond', 'clover'];
var fullCollection = ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K'];
var channels = {};
class Blackjack {
	constructor(cmd, data, message, bet) {
		this.message = message;
		this.data = data;
		this.client = this.message.client;
		this.dealerId = this.client.user.id;
		this.gameId = this.message.author.id;
		this.channelId = this.message.channel.id;
		this.bet = parseInt(bet);
		this.joinmsg = `blackjack join`
		/*The max amount of user per this.client.blackjackGame */
		this.maxUser = 5;
		/*If the game is canceled or not*/
		this.canceled = false;
		/*The blackjack embed message */
		this.msg = null;
	}
	async init() {
		if (channels[this.channelId]) return this.message.inlineReply('There is already an ongoing match in this channel!')
		//Create join message
		const embed = new Discord.MessageEmbed().setTitle('BLACKJACK MULTIPLAYER').setDescription(`${this.message.author.tag} is starting a new blackjack game! To join you must type \`${this.joinmsg}\`\nBet: **${this.data.config.currencyLogo}${this.bet.commas()}**.\n\nIf you are the host, type \`start\` to automatically start the game and \`cancel\` to cancel the game.\nThe game will start in **1 minute**.`).defaultColor().defaultFooter();
		await this.message.channel.send(embed)
		//add a new game data
		this.client.blackjackGame[this.gameId] = {
			players: {},
			started: false,
			ended: false
		}
		channels[this.channelId] = true
		//Add the dealer and the author to the players list
		await this.addPlayer(this.dealerId);
		await this.addPlayer(this.message.member);
		//Start to collect messages
		const filter = e => !e.author.bot;
		const collector = this.message.channel.createMessageCollector(filter, {
			time: 60000
		})
		collector.on('collect', async msg => {
			var content = msg.content.toLowerCase();
			if (content === this.joinmsg) {
				//Adding +1 because the dealer doesn't count.
				if (this.players.size >= this.max + 1) return msg.inlineReply(`The game is qurrently full! Please wait for others to leave or wait for the next match!`)
				if (this.client.blackjackGame[this.gameId]['players'][msg.member.id]) return msg.inlineReply("You're already in!")
				const add = await this.addPlayer(msg.member, msg);
				if (add) return msg.inlineReply('You have joined the multi-player blackjack!\nType \`leave\` to leave the match.')
			}
			if (content === 'leave') {
				if (!this.client.blackjackGame[this.gameId]['players'][msg.member.id]) return msg.inlineReply("You're not in the match!")
				if (msg.member.id === this.message.author.id) return msg.inlineReply('You are the host and cannot leave the match.')
				delete this.client.blackjackGame[this.gameId]['players'][msg.member.id];
				return msg.inlineReply('Successfully left the match.')
			}
			if (content === 'start') {
				if (msg.member.id !== this.message.author.id) return msg.inlineReply('Only the host can start the match!')
				collector.stop()
			}
			if (content === 'cancel') {
				if (msg.member.id !== this.message.author.id) return msg.inlineReply(`Only the host can cancel the match!`)
				delete this.client.blackjackGame[this.gameId];
				delete channels[this.channelId];
				this.canceled = true;
				this.message.channel.send(`The match has been canceled by the host.`)
			}
		})
		collector.on('end', () => {
			if (this.canceled) return;
			this.client.blackjackGame[this.gameId]['started'] = true
			this.message.channel.send(`A game of blackjack has been started with ${this.players.intoArrayValues().length} players!\n${this.players.intoArrayValues().map(p => `• ${p.isDealer ? '**[DEALER]** ' : ''}${p.user}`).join('\n')}`)
			this.start()
		})
	}
	async addPlayer(member, msg = null) {
		if (member instanceof Discord.GuildMember || member instanceof Discord.User || member instanceof Discord.ClientUser) member = member.id
		let {user} = await this.client.resolveMember(member, this.message.guild)
		if (member === this.dealerId) user = this.client.user;
		if (!user) return false;
		const userData = await this.client.findOrCreateUser({
			id: user.id
		})
		if (!userData) return false;
		if (user.id !== this.dealerId && userData.money < this.bet) {
			if (msg) msg.inlineReply(`You don't have enough money! You must have atleast **${this.data.config.currencyLogo}${this.bet.commas()}**.`)
			return false;
		}
		this.client.blackjackGame[this.gameId]['players'][user.id] = {
			user: user,
			data: userData,
			cards: {
				left: [],
				right: []
			},
			emojis: {
				left: [],
				right: []
			},
			value: {
				left: {},
				right: {}
			},
			isDealer: (user.id === this.dealerId),
			stand: {
				left: false,
				right: false
			},
			doubledown: false,
			split: false,
			won: {
				left: null,
				right: null
			},
			reason: {
				left: null,
				right: null
			}, //The reason user won/lose
			bet: this.bet
		}
		//console.log(this.players.intoArrayValues())
		return true
	}
	async start() {
		//Draw cards for everyone
		await this.drawCardForEveryone()
		this.msg = await this.message.channel.send(this.createEmbed());
		const filter = u => this.client.blackjackGame[this.gameId]['players'][u.author.id]
		const collector = this.message.channel.createMessageCollector(filter, {
			time: 60000
		})
		const timeout = setTimeout(() => {
			const unfinishedPlayers = this.players.intoArrayValues().filter(function(p) {
				if (p.isDealer) return false;
				if (!p.stand['left'] || p.won['left'] === null) {
					if (p.split && !p.stand['right'] || p.split && p.won['right'] === null) return true
					if (!p.split) return true;
				}
				return false;
			}).map(p => p.user)
			if (unfinishedPlayers.length > 0) this.message.channel.send(`${unfinishedPlayers.join(' ')}, You got 10 seconds left to hit or stand. Otherwise you will automatically stands.`)
			return
		}, 50000)
		collector.on('collect', async msg => {
			const args = msg.content.toLowerCase().split(' ');
			let hand = 'left';
			if (this.players[msg.member.id].split) {
				if (args[1] === 'right') hand = 'right';
			}
			if (this.players[msg.member.id].stand[hand] || this.players[msg.member.id].won[hand] !== null) return;
			if (args[0] === 'hit' || args[0] === 'h') {
				await this.userHit(msg.member, hand)
				await msg.reactSuccess()
				await this.msg.edit(this.createEmbed())
			}
			if (args[0] === 'stand' || args[0] === 's') {
				this.userStand(msg.member, hand)
				await msg.reactSuccess()
				await this.msg.edit(this.createEmbed())
			}
			if (args[0] === 'double down' || args[0] === 'dd') {
				if (this.players[msg.member.id].split) {
					await msg.reactError();
					return await msg.inlineReply(`You cannot double-down when you split your card.`)
				}
				if (this.players[msg.member.id].value[hand].score < 9 || this.players[msg.member.id].value[hand].score > 12) {
					await msg.reactError();
					return await msg.inlineReply(`You can only double-down when you have 9-12 total card value.`)
				}
				let res = await this.userDoubledown(msg.member);
				if (res) {
					await msg.reactError();
					return await msg.inlineReply(res);
				}
				await msg.reactSuccess()
				await this.msg.edit(this.createEmbed())
			}
			if (args[0] === 'split') {
				if (this.players[msg.member.id].split) {
					await msg.reactError()
					return await msg.inlineReply(`You've already split you cards.`)
				}
				if (!this.checkSameValueCard(msg.member)) {
					await msg.reactError();
					return await msg.inlineReply(`You must have 2 cards with the same value to be able to split.`);
				}
				const res = await this.userSplit(msg.member);
				if (res) {
					await msg.reactError();
					return await msg.inlineReply(res);
				}
				await msg.reactSuccess();
				await this.msg.edit(this.createEmbed())
			}
			const p = this.players.intoArrayValues().filter(e => !e.isDealer)
			//Get players that have stands and win/lose the game
			const finishedPlayer = p.filter(function(p) {
				if (p.isDealer) return false;
				if (p.stand['left'] || p.won['left'] !== null) {
					if (p.split && p.stand['right'] || p.split && p.won['right'] !== null) return true
					if (!p.split) return true;
				}
				return false;
			})
			if (finishedPlayer >= p) {
				collector.stop();
			}
		})
		collector.on('end', () => {
			clearTimeout(timeout)
			const unfinishedPlayers = this.players.intoArrayValues().filter(function(p) {
				if (p.isDealer) return false;
				if (!p.stand['left'] || p.won['left'] === null) {
					if (p.split && !p.stand['right'] || p.split && p.won['right'] === null) return true
					if (!p.split) return true;
				}
				return false;
			})
			for (const player of unfinishedPlayers) {
				this.client.blackjackGame[this.gameId]['players'][player.user.id].stand['left'] = true
				this.client.blackjackGame[this.gameId]['players'][player.user.id].stand['right'] = true
			}
			this.end();
		})
	}
	async end() {
	    let leftHand;
	    let rightHand;
		const cLogo = this.data.config.currencyLogo;
		const players = this.players.intoArrayValues().filter(function(p) {
			if (p.isDealer) return false;
			//Left hand
			if (p.stand['left'] && p.won['left'] === null) leftHand = true;
			if (p.split) {
			    if (p.stand['right'] && p.won['right'] === null) rightHand = true;
			}
			return (leftHand || rightHand);
		})
		if (players.length > 0) {
			//Bot's turn to hit
			this.msg.inlineReply(`It's time for the dealer to hit!`);
			await this.botHit();
			var botValue = this.players[this.client.user.id].value['left'].score;
			for (const player of players) {
				const data = await this.client.findOrCreateUser({
					id: player.user.id
				})
				if (!leftHand && !rightHand) return
				let hands = [];
				if (leftHand) hands.push('left')
				if (player.split && rightHand) hands.push('right')
				for (const hand of hands) {
					const value = player.value[hand].score
					if (value === 21) {
						data.money += player.bet;
						this.client.blackjackGame[this.gameId]['players'][player.user.id].reason[hand] = `You got a blackjack! You won **${cLogo}${player.bet.commas()}**.`;
						this.client.blackjackGame[this.gameId]['players'][player.user.id].won[hand] = true;
					}
					else if (botValue > 21) {
						data.money += player.bet;
						this.client.blackjackGame[this.gameId]['players'][player.user.id].reason[hand] = `The dealer have busted! You won **${cLogo}${player.bet.commas()}**.`;
						this.client.blackjackGame[this.gameId]['players'][player.user.id].won[hand] = true;
					}
					else if (botValue === 21) {
						data.money -= player.bet;
						this.client.blackjackGame[this.gameId]['players'][player.user.id].reason[hand] = `The dealer got a blackjack! You lost **${cLogo}${player.bet.commas()}**.`;
						this.client.blackjackGame[this.gameId]['players'][player.user.id].won[hand] = false;
					}
					else if (value > botValue) {
						data.money += player.bet;
						this.client.blackjackGame[this.gameId]['players'][player.user.id].reason[hand] = `You got a higher number than the dealer! You won **${cLogo}${player.bet.commas()}**.`;
						this.client.blackjackGame[this.gameId]['players'][player.user.id].won[hand] = true;
					}
					else if (value < botValue) {
						data.money -= player.bet;
						this.client.blackjackGame[this.gameId]['players'][player.user.id].reason[hand] = `The dealer got a higher number than yours! You lost **${cLogo}${player.bet.commas()}**.`;
						this.client.blackjackGame[this.gameId]['players'][player.user.id].won[hand] = false;
					}
					else if (value === botValue) {
						this.client.blackjackGame[this.gameId]['players'][player.user.id].reason[hand] = `It's a tie! You lost nothing.`;
						this.client.blackjackGame[this.gameId]['players'][player.user.id].won[hand] = "tie";
					}
				}
			}
			await this.msg.edit(this.createEmbed());
		}
		await this.msg.inlineReply(`The game of Blackjack has ended! See the result in the replied message!`)
		delete channels[this.channelId];
		delete this.client.blackjackGame[this.gameId];
	}
	createEmbed() {
		const p = this.players.intoArrayValues().filter(p => !p.isDealer)
		//Get players that have stands and win/lose the game
		const finishedPlayer = p.filter(function(p) {
			if (p.isDealer) return false;
			if (p.stand['left'] || p.won['left'] !== null) {
				if (p.split && p.stand['right'] || p.split && p.won['right'] !== null) return true
				if (!p.split) return true;
			}
			return false;
		})
		const embed = new Discord.MessageEmbed().setTitle('BLACKJACK MULTIPLAYER').setDescription(`Type \`hit\` to hit, \`stand\` to stand, \`double down\` to double down and \`split\` to split.\n\nThe dealer will hit when everyone stands\nWaiting for (\`${finishedPlayer.length}/${p.length}\`) players.\n\nIf you split your cards, you are now playing with two hands (which is "left" and "right"). To use the commands above you must type the hand of which you want to use on (eg. \`hit left\`).`).defaultColor().defaultFooter();
		for (let player of this.players.intoArrayValues()) {
			let lwonicon = '';
			if (player.won['left'] === false) lwonicon = this.client.customEmojis['status']['dnd']
			else if (player.won['left'] === true) lwonicon = this.client.customEmojis['status']['online']
			else if (player.won['left'] === 'tie') lwonicon = this.client.customEmojis['status']['idle']
			let rwonicon = '';
			if (player.won['right'] === false) rwonicon = this.client.customEmojis['status']['dnd']
			else if (player.won['right'] === true) rwonicon = this.client.customEmojis['status']['online']
			else if (player.won['right'] === 'tie') rwonicon = this.client.customEmojis['status']['idle']
			let title = `${lwonicon !== '' ? `${lwonicon} ` : ''}${player.doubledown ? `${emojis['double-down']} ` : ''}${player.split ? `${emojis['split']} ` : ''}${player.isDealer ? `**[${this.client.customEmojis['crown']} DEALER]** ` : ''}${player.stand['left'] ? `${emojis['stand']} ` : ''}`
			let lreason = player.reason.left ? `\n${player.reason.left}` : '';
			let lemoji = `\n${player.emojis.left.join('')}${player.isDealer && player.cards.left.length === 1 ? emojis['draw_card'] : ''}`
			let lvalue = `\nValue: ${player.value.left.soft ? 'Soft ' : ''}${player.value.left.score}`
			let rreason = '';
			let remoji = '';
			let rvalue = '';
			let lmsg = player.split ? `${lwonicon !== '' ? `${lwonicon} ` : ''}${player.stand['left'] ? `${emojis['stand']} ` : ''}Left Hand:` : ''
			let rmsg = player.split ? `${rwonicon !== '' ? `${rwonicon }` : ''}${player.stand['right'] ? `${emojis['stand']} ` : ''}Right Hand:` : ''
			if (player.split) {
				title = `${player.split ? `${emojis['split']} ` : ''}`
				rreason = player.reason.right ? `\n${player.reason.right}` : '';
				remoji = `\n${player.emojis.right.join('')}${player.isDealer && player.cards.right.length === 1 ? emojis['draw_card'] : ''}`
				rvalue = `\nValue: ${player.value.right.soft ? 'Soft ' : ''}${player.value.right.score}`
			}
			embed.addField(`${title}${player.user.username}'s cards`, `${lmsg}${lreason}${lemoji}${lvalue}\n${rmsg}${rreason}${remoji}${rvalue}`)
		}
		return embed;
	}
	get players() {
		if (!this.client.blackjackGame[this.gameId]) return false;
		return this.client.blackjackGame[this.gameId]['players'];
	}
	drawCardForEveryone() {
		for (const player of this.players.intoArrayValues()) {
			let cards;
			//If the player is the dealer, they will only get one card.
			if (player.isDealer) {
				cards = [new Card(this.randCard())]
			}
			else {
				//Get a random 2 cards.
				cards = [new Card(this.randCard()), new Card(this.randCard())]
			}
			this.addUserCard(player, cards)
		}
		return true;
	}
	addUserCard(player, cards, hand = 'left') {
		var id = player.user.id;
		if (hand === 'left') {
			this.client.blackjackGame[this.gameId]['players'][id].cards.left.push(...cards);
			this.client.blackjackGame[this.gameId]['players'][id].emojis.left = this.players[id].cards.left.map(e => emojis[e.suite][e.value]);
			this.client.blackjackGame[this.gameId]['players'][id].value.left = this.userValue(this.players[id].cards.left)
		}
		else if (hand === 'right') {
			this.client.blackjackGame[this.gameId]['players'][id].cards.right.push(...cards);
			this.client.blackjackGame[this.gameId]['players'][id].emojis.right = this.players[id].cards.right.map(e => emojis[e.suite][e.value]);
			this.client.blackjackGame[this.gameId]['players'][id].value.right = this.userValue(this.players[id].cards.right)
		}
		return true;
	}
	wipeUserCards(player) {
		var id = player.user.id;
		//left
		this.client.blackjackGame[this.gameId]['players'][id].cards.left = [];
		this.client.blackjackGame[this.gameId]['players'][id].emojis.left = [];
		this.client.blackjackGame[this.gameId]['players'][id].value.left = 0;
		//right
		this.client.blackjackGame[this.gameId]['players'][id].cards.right = [];
		this.client.blackjackGame[this.gameId]['players'][id].emojis.right = [];
		this.client.blackjackGame[this.gameId]['players'][id].value.right = 0;
		return true
	}
	userValue(cards) {
		return this.scoreHand(cards)
	}
	async userHit(member, hand = 'left') {
		var newCard = [new Card(this.randCard())]
		this.addUserCard(this.players[member.id], newCard, hand)
		let cardCheck = await this.checkUser(member, hand)
		/* For double-down use */
		if (cardCheck) return true;
		else return false;
	}
	async checkUser(member, hand = 'left') {
		const player = this.players[member.id]
		const total = player.value[hand].score;
		const data = await this.client.findOrCreateUser({
			id: member.id
		});
		const cLogo = this.data.config.currencyLogo;
		if (total > 21) {
			//User busted - end game (loss)
			data.money -= player.bet;
			this.client.blackjackGame[this.gameId]['players'][member.id].won[hand] = false;
			this.client.blackjackGame[this.gameId]['players'][member.id].reason[hand] = `You have busted! You lost **${cLogo}${player.bet.commas()}**.`;
			return false;
		}
		else if (total === 21) {
			//User blackjack - end game (win)
			data.money += player.bet;
			this.client.blackjackGame[this.gameId]['players'][member.id].won[hand] = true;
			this.client.blackjackGame[this.gameId]['players'][member.id].reason[hand] = `You got a blackjack! You won **${cLogo}${player.bet.commas()}**.`;
			return false;
		}
		else if (total <= 21 && player.cards.length >= 5) {
			//Got 5 cards without busting. User wins
			data.money += player.bet;
			this.client.blackjackGame[this.gameId]['players'][member.id].won[hand] = true;
			this.client.blackjackGame[this.gameId]['players'][member.id].reason[hand] = `You have 5 cards without getting busted! You won **${cLogo}${player.bet.commas()}**.`;
			return false;
		}
		else {
			return true; // continue the script
		}
	}
	userStand(member, hand = 'left') {
		this.client.blackjackGame[this.gameId]['players'][member.id].stand[hand] = true;
		return true;
	}
	async userDoubledown(member) {
		var data = await this.client.findOrCreateUser({
			id: member.id
		})
		if (data.money < this.players[member.id].bet * 2) return 'You don\'t have enough money to double down!'
		this.client.blackjackGame[this.gameId]['players'][member.id].doubledown = true;
		this.client.blackjackGame[this.gameId]['players'][member.id].bet *= 2;
		const hit = await this.userHit(member)
		if (hit) this.userStand(member);
		return;
	}
	async userSplit(member) {
		var data = await this.client.findOrCreateUser({
			id: member.id
		})
		if (data.money < this.players[member.id].bet * 2) return 'You don\'t have enough money to split!'
		this.client.blackjackGame[this.gameId]['players'][member.id].split = true;
		let lcard = [this.players[member.id].cards.left[0], new Card(this.randCard())];
		let rcard = [this.players[member.id].cards.left[1], new Card(this.randCard())];
		//wipe all cards
		await this.wipeUserCards(this.players[member.id])
		//add the new cards
		await this.addUserCard(this.players[member.id], lcard, 'left')
		await this.addUserCard(this.players[member.id], rcard, 'right')
		return;
	}
	checkSameValueCard(member, hand = 'left') {
		var player = this.players[member.id];
		if (player.cards[hand].intoArray().length !== 2) return false;
		const cards = player.cards[hand].intoArray().map(c => c.realValue)
		if (cards[0] === cards[1]) return true;
		else return false;
	}
	async botHit() {
		const cLogo = this.data.config.currencyLogo;
		const player = this.players[this.client.user.id];
		let total = player.value['left'].score;
		while (total < 21 && total < 17) {
			await this.client.wait(2000)
			await this.addUserCard(player, [new Card(this.randCard())])
			total = this.players[player.user.id].value['left'].score;
			await this.msg.edit(this.createEmbed())
		}
	}
	randCard() {
		const randCard = Math.floor(Math.random() * fullCollection.length);
		const randSuit = Math.floor(Math.random() * suites.length);
		return [fullCollection[randCard], suites[randSuit]];
	}
	scoreHand(hand) {
		let nonAcesScore = 0;
		let acesInHand = 0;
		let acesScore = 0;
		for (let card of hand) {
			if (card.value === 'A') {
				acesInHand += 1;
			}
			else if ('JQK'.indexOf(card.value) !== -1) {
				nonAcesScore += 10;
			}
			else {
				nonAcesScore += Number(card.value);
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
		return {
			score: acesScore + nonAcesScore,
			soft: highAces > 0
		};
	}
}

function Card(value) {
	this.value = value[0];
	this.suite = value[1]; /*Card object initialized*/
	this.realValue = cardValue(value[0]);
}

function cardValue(val) {
	if (val === 'A') {
		return 1;
	}
	else if ('JQK'.indexOf(val) !== -1) {
		return 10;
	}
	else return Number(val);
}
module.exports = Blackjack