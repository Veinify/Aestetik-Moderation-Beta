const Discord = require('discord.js');
//const { MessageButton, MessageActionRow } = require("discord-buttons")

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
		/*The max amount of user per this.client.blackjackGame */
		this.maxUser = 5;
		/*If the game is canceled or not*/
		this.canceled = false;
		/*If the match has been started or not*/
		this.started = false;
		/*If the match has ended or not*/
		this.ended = false;
		/*The blackjack embed message */
		this.msg = null;
		/*Blackjack start message*/
		this.joinmsg = null;
	}
	async init() {
		if (channels[this.channelId]) return this.message.inlineReply('There is already an ongoing match in this channel!')

		//Create join message
		const embed = new Discord.MessageEmbed().setTitle('BLACKJACK MULTIPLAYER').setDescription(`${this.message.author.tag} is starting a new blackjack game!\nBet: **${this.data.config.currencyLogo}${this.bet.commas()}**.\n\nThe game will start in **1 minute**.`).defaultColor().defaultFooter();
		this.joinmsg = await this.message.channel.send({embed: embed, components: this.createJoinButton()})
		//add a new game data
		this.client.blackjackGame[this.gameId] = {
			players: {},
		}
		channels[this.channelId] = true
		//Add the dealer and the author to the players list
		await this.addPlayer(this.dealerId);
		await this.addPlayer(this.message.member);
		//Start to collect messages
		const filter = b => !b.clicker.user.bot;
		const collector = this.joinmsg.createButtonCollector(filter, {
			time: 60000
		})
		collector.on('collect', async b => {
			var id = b.id;
			if (id === 'join') {
				//Adding +1 because the dealer doesn't count.
				if (this.players.size >= this.max + 1) return b.reply.send(`The game is qurrently full! Please wait for others to leave or wait for the next match!`, {ephemeral: true})
				if (this.client.blackjackGame[this.gameId]['players'][b.clicker.user.id]) return b.reply.send("You're already in!", {ephemeral: true})
				const add = await this.addPlayer(b.clicker.user, b);
				if (add) {
				    this.message.channel.send(`${b.clicker.user} has joined the blackjack match!`)
				    return b.reply.send('You have joined the multi-player blackjack!', {ephemeral: true})
				}
			}
			if (id === 'leave') {
				if (!this.client.blackjackGame[this.gameId]['players'][b.clicker.user.id]) return b.reply.send("You're not in the match!", {ephemeral: true})
				if (b.clicker.user.id === this.message.author.id) return b.reply.send('You are the host and cannot leave the match.', {ephemeral: true})
				delete this.client.blackjackGame[this.gameId]['players'][b.clicker.user.id];
				this.message.channel.send(`${b.clicker.user} has left the blackjack match.`)
				return b.reply.send('Successfully left the match.', {ephemeral: true})
			}
			if (id === 'start') {
				if (b.clicker.user.id !== this.message.author.id) return b.reply.send('Only the host can start the match!', {ephemeral: true})
				b.defer(true);
				collector.stop()
			}
			if (id === 'cancel') {
				if (b.clicker.user.id !== this.message.author.id) return b.reply.send(`Only the host can cancel the match!`, {ephemeral: true})
				delete this.client.blackjackGame[this.gameId];
				delete channels[this.channelId];
				this.canceled = true;
				b.defer(true);
				collector.stop()
				this.message.channel.send(`The match has been canceled by the host.`)
			}
		})
		collector.on('end', () => {
			if (!this.canceled) this.started = true;
			this.joinmsg.edit({embed: embed, components: this.createJoinButton()})
			if (this.canceled) return;
			this.message.channel.send(`A game of blackjack has been started with ${this.players.intoArrayValues().length} players!\n${this.players.intoArrayValues().map(p => `• ${p.isDealer ? '**[DEALER]** ' : ''}${p.user}`).join('\n')}`)
			this.start()
		})
	}
	createJoinButton() {
	    let over = (this.ended || this.started || this.canceled)
	    const joinb = new MessageButton()
		.setLabel('Join')
		.setStyle(over ? 'red' : 'blurple')
		.setID('join');
		const leaveb = new MessageButton()
		.setLabel('Leave')
		.setStyle(over ? 'red' : 'blurple')
		.setID('leave')
		const startb = new MessageButton()
		.setLabel('Start')
		.setStyle(over ? 'red' : 'blurple')
		.setID('start')
		const cancelb = new MessageButton()
		.setLabel('Cancel')
		.setStyle(over ? 'red' : 'blurple')
		.setID('cancel')
		if (over) {
		    joinb.setDisabled();
		    leaveb.setDisabled();
		    startb.setDisabled();
		    cancelb.setDisabled();
		}
		const row1 = new MessageActionRow()
		.addComponent(joinb)
		.addComponent(leaveb);
		const row2 = new MessageActionRow()
		.addComponent(startb)
		.addComponent(cancelb)
		return [row1, row2]
	}
	createbjbutton() {
	    let ended = this.ended;
	    const hitb = new MessageButton()
		.setLabel('Hit')
		.setStyle(ended ? 'red' : 'blurple')
		.setID('hit');
		const standb = new MessageButton()
		.setLabel('Stand')
		.setStyle(ended ? 'red' : 'blurple')
		.setID('stand');
		const doubleb = new MessageButton()
		.setLabel('Double Down')
		.setStyle(ended ? 'red' : 'blurple')
		.setID('doubledown');
		const splitb = new MessageButton()
		.setLabel('Split')
		.setStyle(ended ? 'red' : 'blurple')
		.setID('split');
		const splitmsgb = new MessageButton()
		.setLabel('Splitting Options')
		.setStyle('grey')
		.setID('msg')
		.setDisabled();
		const lhitb = new MessageButton()
		.setLabel('Hit Left')
		.setStyle(ended ? 'red' : 'blurple')
		.setID('hit_left');
		const rhitb = new MessageButton()
		.setLabel('Hit Right')
		.setStyle(ended ? 'red' : 'blurple')
		.setID('hit_right');
		const lstandb = new MessageButton()
		.setLabel('Stand Left')
		.setStyle(ended ? 'red' : 'blurple')
		.setID('stand_left');
		const rstandb = new MessageButton()
		.setLabel('Stand Right')
		.setStyle(ended ? 'red' : 'blurple')
		.setID('stand_right');
		if (ended) {
		    hitb.setDisabled();
		    standb.setDisabled();
		    doubleb.setDisabled();
		    splitb.setDisabled();
		    lhitb.setDisabled();
		    rhitb.setDisabled();
		    lstandb.setDisabled();
		    rstandb.setDisabled();
		}
		const row1 = new MessageActionRow()
		.addComponent(hitb)
		.addComponent(standb)
		.addComponent(doubleb)
		.addComponent(splitb);
		const row2 = new MessageActionRow()
		.addComponent(splitmsgb);
		const row3 = new MessageActionRow()
		.addComponent(lhitb)
		.addComponent(rhitb);
		const row4 = new MessageActionRow()
		.addComponent(lstandb)
		.addComponent(rstandb);
		return [row1, row2, row3, row4]
	}
	async addPlayer(member, button = null) {
		if (member instanceof Discord.GuildMember || member instanceof Discord.User || member instanceof Discord.ClientUser) member = member.id
		let {user} = await this.client.resolveMember(member, this.message.guild)
		if (member === this.dealerId) user = this.client.user;
		if (!user) return false;
		const userData = await this.client.findOrCreateUser({
			id: user.id
		})
		if (!userData) return false;
		if (user.id !== this.dealerId && userData.money < this.bet) {
			if (button) button.reply.send(`You don't have enough money! You must have atleast **${this.data.config.currencyLogo}${this.bet.commas()}**.`, {ephemeral: true})
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
		this.msg = await this.message.channel.send({embed: this.createEmbed(), components: this.createbjbutton()});
		const filter = b => this.client.blackjackGame[this.gameId]['players'][b.clicker.user.id]
		const collector = this.msg.createButtonCollector(filter, {
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
			if (unfinishedPlayers.length > 0) this.message.channel.send(`${unfinishedPlayers.join(' ')}, You got 10 seconds left to stand. Otherwise you will automatically stands.`)
			return
		}, 50000)
		collector.on('collect', async b => {
			const { id } = b;
			if (id === 'hit') {
				if (this.players[b.clicker.user.id].split) return b.defer(true);
				if (this.players[b.clicker.user.id].stand['left'] || this.players[b.clicker.user.id].won['left'] !== null) return b.defer(true);
				await this.userHit(b.clicker.user, 'left')
				await this.msg.edit({embed: this.createEmbed(), components: this.createbjbutton()})
				b.defer(true);
			}
			if (id === "stand") {
				if (this.players[b.clicker.user.id].split) return b.defer(true);
				this.userStand(b.clicker.user, "left")
				await this.msg.edit({embed: this.createEmbed(), components: this.createbjbutton()})
				b.defer(true);
			}
			if (id === "doubledown") {
				if (this.players[b.clicker.user.id].split) {
					return b.reply.send(`You cannot double-down when you split your card.`, {ephemeral: true})
				}
				if (this.players[b.clicker.user.id].stand['left'] || this.players[b.clicker.user.id].won['left'] !== null) return b.defer(true);
				if (this.players[b.clicker.user.id].value["left"].score < 9 || this.players[b.clicker.user.id].value["left"].score > 12) {
					return b.reply.send(`You can only double-down when you have 9-12 total card value.`, {ephemeral: true})
				}
				let res = await this.userDoubledown(b.clicker.user);
				if (res) {
					return b.reply.send(res, {ephemeral: true});
				}
				await this.msg.edit({embed: this.createEmbed(), components: this.createbjbutton()})
				b.defer(true);
			}
			if (id === "split") {
				if (this.players[b.clicker.user.id].split) {
					return await b.reply.send(`You've already split you cards.`, {ephemeral: true})
				}
				if (this.players[b.clicker.user.id].stand['left'] || this.players[b.clicker.user.id].won['left'] !== null) return b.defer(true);
				if (!this.checkSameValueCard(b.clicker.user)) {
					return b.reply.send(`You must have 2 cards with the same value to be able to split.`, {ephemeral: true});
				}
				const res = await this.userSplit(b.clicker.user);
				if (res) {
					return b.reply.send(res, {ephemeral: true});
				}
				await this.msg.edit({embed: this.createEmbed(), components: this.createbjbutton()})
				b.defer(true);
			}
			if (id.indexOf('hit_') !== -1) {
			    let hand = id.replace('hit_', '')
			    if (!this.players[b.clicker.user.id].split) return b.defer(true)
			    if (this.players[b.clicker.user.id].stand[hand] || this.players[b.clicker.user.id].won[hand] !== null) return b.defer(true);
			    await this.userHit(b.clicker.user, hand);
			    await this.msg.edit({embed: this.createEmbed(), components: this.createbjbutton()})
			    b.defer(true);
			}
			if (id.indexOf('stand_') !== -1) {
			    let hand = id.replace('stand_', '')
			    if (!this.players[b.clicker.user.id].split) return b.defer(true)
			    if (this.players[b.clicker.user.id].stand[hand] || this.players[b.clicker.user.id].won[hand] !== null) return b.defer(true);
			    await this.userStand(b.clicker.user, hand);
			    await this.msg.edit({embed: this.createEmbed(), components: this.createbjbutton()})
			    b.defer(true);
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
	    this.ended = true;
	    let leftHand = {};
	    let rightHand = {};
		const cLogo = this.data.config.currencyLogo;
		const players = this.players.intoArrayValues().filter(function(p) {
			if (p.isDealer) return false;
			//Left hand
			if (p.stand['left'] && p.won['left'] === null) leftHand[p.user.id] = true;
			//Right hand
			if (p.split) {
			    if (p.stand['right'] && p.won['right'] === null) rightHand[p.user.id] = true;
			}
			return (leftHand[p.user.id] || rightHand[p.user.id]);
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
				if (!leftHand[player.user.id] && !rightHand[player.user.id]) return
				let hands = [];
				if (leftHand[player.user.id]) hands.push('left')
				if (player.split && rightHand[player.user.id]) hands.push('right')
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
			await this.msg.edit({embed: this.createEmbed(), components: this.createbjbutton()});
		} else {
		    await this.msg.edit({embed: this.createEmbed(), components: this.createbjbutton()});
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
		const cards = player.cards[hand].map(c => c.realValue)
		return (cards[0] === cards[1])
	}
	async botHit() {
		const cLogo = this.data.config.currencyLogo;
		const player = this.players[this.client.user.id];
		let total = player.value['left'].score;
		while (total < 21 && total < 17) {
			await this.client.wait(2000)
			await this.addUserCard(player, [new Card(this.randCard())])
			total = this.players[player.user.id].value['left'].score;
			await this.msg.edit({embed: this.createEmbed(), components: this.createbjbutton()})
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