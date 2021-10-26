const Discord = require('discord.js'),
	{
		Message, MessageEmbed
	} = require("discord.js"),
	AestetikModeration = require("../base/AestetikModeration");
const {
	Game, Card, Color, Value
} = require("uno-engine-test");
const emojis = require("../emojis.json")['uno'];
const nums = ["zero", "one", "two", "three", "four", "five", "six", "seven", "eight", "nine"];
const commands = [
{
	name: 'play',
	description: 'play a card',
	usage: 'play [color] [value]',
	example: 'play red five'
},
{
	name: 'draw',
	description: 'draw a random card',
	usage: 'draw',
	example: 'draw'
},
{
	name: 'pass',
	description: 'pass your turn (must have drawn atleast one card)',
	usage: 'pass',
	example: 'pass'
},
{
	name: 'uno!',
	description: 'Yell uno (misuse will result 2+ card)',
	usage: 'uno!',
	example: 'uno!'
},
{
    name: 'end',
    description: 'Force end the game.',
    usage: 'end',
    example: 'end'
}]
class Uno {
	constructor(cmd, data, message) {
		this.message = message;
		this.data = data;
		this.client = this.message.client;
		this.botId = this.client.user.id;
		this.channelId = this.message.channel.id;
		this.subprefix = 'uno'
			/*The max amount of user per this.client.blackjackGame */
		this.maxUser = 5;
		/*If the game is canceled or not*/
		this.canceled = false;
		/*If the game is ended or not*/
		this.ended = false;
		/*The main embed message */
		this.msg = null;
		this.unogame = null;
	}
	async init() {
		//if (this.game) return this.message.inlineReply(`There is already an ongoing uno match in this channel!`)
		this.client.unoGame[this.channelId] = {
			players: []
		}
		this.addPlayer(this.message.author.id)
		const embed = new MessageEmbed().setTitle('Uno Game').setDescription(`${this.message.author.tag} is starting a multiplayer uno game! to join you must type \`${this.subprefix} join\`.\nStarting in 30 seconds!`).defaultColor().defaultFooter();
		await this.message.channel.send(embed)
		const filter = msg => !msg.author.bot;
		const collector = this.message.channel.createMessageCollector(filter, {
			time: 30000
		});
		collector.on('collect', async msg => {
		    if (!msg.content.startsWith(this.subprefix)) {
		        return;
		    }
			var args = msg.content.toLowerCase().replace(this.subprefix + ' ', '').split(' ')
			if (args[0] === "join") {
				//Adding +1 because the dealer doesn't count.
				if (this.players.size >= this.max + 1) return msg.inlineReply(`The game is qurrently full! Please wait for others to leave or wait for the next match!`)
				if (this.players.includes(msg.author.id)) return msg.inlineReply("You're already in!")
				const add = await this.addPlayer(msg.member);
				if (add) return msg.inlineReply(`You have joined the multi-player blackjack!\nType \`${this.subprefix} leave\` to leave the match.`)
			}
			if (args[0] === 'leave') {
				if (msg.member.id === this.message.author.id) return msg.inlineReply('You are the host and cannot leave the match.')
				let i = this.players.indexOf(msg.author.id)
			    if (i < 0) return msg.inlineReply("You're not in the match!")
			    delete this.players[i];
				return msg.inlineReply('Successfully left the match.')
			}
			if (args[0] === 'start') {
				if (msg.member.id !== this.message.author.id) return msg.inlineReply('Only the host can start the match!')
				collector.stop()
			}
			if (args[0] === 'cancel') {
				if (msg.member.id !== this.message.author.id) return msg.inlineReply(`Only the host can cancel the match!`)
				delete this.client.unoGame[this.gameId];
				this.canceled = true;
				this.message.channel.send(`The match has been canceled by the host.`)
			}
		})
		collector.on('end', async() => {
			if (this.canceled) return;
			if (this.players && this.players.length === 1) {
				this.message.channel.send(`Nobody joined... I will play!`);
				await this.addPlayer(this.client.user.id);
			}
			let start = await this.startGame();
			if (start) {
				this.doBotTurn();
			}
		})
	}
	async addPlayer(member) {
		if (member instanceof Discord.GuildMember || member instanceof Discord.User || member instanceof AestetikModeration) member = member.id
		let {
			user
		} = await this.client.resolveMember(member, this.message.guild)
			//if (member === this.botId) user = this.client.user;
		if (!user) return false;
		this.players.push(user.id)
		return true;
	}
	createDmEmbed(cards) {
		let emojis = [];
		for (const e of cards) {
			emojis.push(this.getCardEmoji(e))
		}
		const e = new MessageEmbed().setTitle('Your uno cards').setDescription(`This is the list of your uno cards in ${this.message.channel}\n${emojis.join('')}\n\nCurrent card: ${this.getCardEmoji(this.unogame.discardedCard)}\n\n\nTo use your cards, type \`play [color] [value]\` when it's your turn.`).defaultColor().defaultFooter();
		return e;
	}
	createCommandsEmbed() {
		const e = new MessageEmbed().setTitle('Uno Commands').setDescription(commands.map(c => `Name: **${c.name}**\nDescription: **${c.description}**\nUsage: **${c.usage}**\nExample: **${c.example}**`).join('\n\n')).defaultFooter().defaultColor();
		return e;
	}
	async createMainEmbed() {
		const e = new MessageEmbed().setTitle('Uno Multiplayer').setDescription(`Before you play, read all the commands above.`).defaultFooter().defaultColor();
		for (const player of this.players) {
		    let cards = player.hand;
		    let sliced = false;
		    if (cards.length > 20) {
		        cards = cards.slice(0, 19);
		        sliced = true;
		    }
			let member = (await this.client.resolveMember(player.name, this.message.guild)).user;
			let emotes = [];
			for (const card of cards) {
				if (!this.ended) {
				    emotes.push(emojis['UNKNOWN'])
				}
				else {
				    emotes.push(this.getCardEmoji(card))
				}
			}
			e.addField(`${member.username}'s cards`, `${emotes.join('')} ${sliced ? 'and more...' : ''}\nTotal cards: **${emotes.length}**`)
		}
		e.addField('Current Player', `<@${(this.unogame.currentPlayer).name}>`).addField('Next Player', `<@${(this.unogame.nextPlayer).name}>`)
		return e;
	}
	quickPlainEmbed(description) {
	    const e = new MessageEmbed()
	    .setTitle('Uno Multiplayer')
	    .setDescription(description+'')
	    .defaultColor()
	    .defaultFooter();
	    return e;
	}
	getCardEmoji(card) {
	    let {color, value} = this.cardString(card);
		if (card.isWildCard() && !color) return emojis[value];
		return emojis[color][value];
	}
	getCard(args, attempt) {
		let color = args[0];
		let value = args[1];
		if (color.match(/^(r|red)$/i)) {
			color = "red";
		} else if (color.match(/^(g|green)$/i)) {
			color = "green";
		} else if (color.match(/^(y|yellow)$/i)) {
			color = "yellow";
		} else if (color.match(/^(b|blue)$/i)) {
			color = "blue";
		}
		if (value.match(/^(r|rev|reverse)$/i)) {
			value = "reverse";
		} else if (value.match(/^(s|skip)$/i)) {
			value = "skip";
		} else if (!isNaN(value) && parseInt(value, 10) >= 0 && parseInt(value, 10) <= 9) {
			value = this.findCardValue(value, true);
		} else if (value.match(/^(dt|draw|drawtwo)$/i)) {
			value = "draw_two";
		} else if (value.match(/^(w|wild)$/i)) {
			value = "wild";
		} else if (value.match(/^(wd4|wilddraw|wilddraw4|wilddrawfour)$/i)) {
			value = "wild_draw_four";
		}
		color = color.toUpperCase();
		value = value.toUpperCase();
		const c = this.findCardColor(color);
		const v = this.findCardValue(value);
		// Comparing to undefined because 0 is basically undefined
		if (c == undefined || v == undefined) {
			if (attempt) {
				return null;
			}
			return this.getCard(args.reverse(), 1); // support backward args
		}
		let card = new Card(v, c);
		let ncard;
        if (value.includes("WILD") || value.includes("WILD_DRAW_FOUR")) {
			ncard = this.unogame.currentPlayer.getCardByValue(v);
			ncard.color = c;
		}
		return ncard ? ncard : card;
	}
	countOccurrences(arr, val) {
		if (!val) {
			return arr.reduce((prev, curr) => (prev[curr] = ++prev[curr] || 1, prev), {}); // eslint-disable-line
		}
		return arr.reduce((a, v) => (v === val ? a + 1 : a), 0);
	}
	async doBotTurn() {
	    if (this.msg.deleted) {
		  this.collector.stop();
		  this.resetGame()
		  return;
		}
		const player = this.unogame.currentPlayer;
		let currentHand = player.hand;
		let botMatchingHand = currentHand.filter(card => (card.color === this.unogame.discardedCard.color || card.value === this.unogame.discardedCard.value || Value[card.value].includes("WILD")));
		if (botMatchingHand.length === 0) {
			await this.client.wait(2000);
			await this.message.channel.send('draw');
			this.unogame.draw();
			currentHand = this.unogame.currentPlayer.hand;
			botMatchingHand = currentHand.filter(card => (card.color === this.unogame.discardedCard.color || card.value === this.unogame.discardedCard.value || Value[card.value].includes("WILD")));
			if (botMatchingHand.length === 0) {
				// console.log(`\n\n${botMatchingHand}\n\n`);
				await this.client.wait(2000);
				await this.message.channel.send('pass')
				this.unogame.pass();
				// console.log("bot passed");
				await this.client.wait(1000);
				if (player.hand.length === 0) {
					return;
				}
				const check = await this.nextTurn();
				if (check) {
					this.doBotTurn();
				}
			} else {
				await this.client.wait(2000);
				this.doBotTurn();
			}
		} else {
			await this.client.wait(1000);
			// wild and wd4 set color
			const cardColor = [];
			player.hand.filter(card => !Value[card.value].includes("WILD")).forEach((card) => {
				cardColor.push(Color[card.color]);
			});
			const cardCols = this.countOccurrences(cardColor);
			// console.log(`\n\n${JSON.stringify(cardCols, null, 2)}\n\n`);
			const keys = Object.keys(cardCols);
			const mostColor = keys.reduce((a, e) => ((cardCols[e] > cardCols[a]) ? e : a), keys[0]);
			// console.log(`\n\n${mostColor}\n\n`);
			let card = botMatchingHand[0];
			let ncard;
			if (Value[card.value].includes("WILD")) {
				// console.log(`\n\n${mostColor}\n\n`);
				ncard = this.unogame.currentPlayer.getCardByValue(card.value)
				ncard.color = Color[mostColor];
			}
			if (ncard) card = ncard;
			if (player.hand.length === 2) {
				this.unogame.uno();
				await this.message.channel.send('UNO!');
			}
			let {color, value} = this.cardString(card);
			const commandColor = (color+"").toLowerCase();
			const val = value+"";
			const commandValue = (val.includes("_")) ? val.split("_").map(word => ((word !== "FOUR") ? word.charAt(0) : "4")).join("").toLowerCase() : val.toLowerCase();
			await this.message.channel.send(`play ${commandColor} ${commandValue}`);
			this.unogame.play(card);
			await this.client.wait(1000);
			if (player.hand.length === 0) {
				return;
			}
			const check = await this.nextTurn(this.client, this.message);
			if (check) {
				this.doBotTurn(this.client, this.message);
			}
		}
	}
	async resetGame() {
	    this.ended = true
	    await this.msg.edit(await this.createMainEmbed())
		delete this.client.unoGame[this.channelId];
		this.collector.stop()
		return true
	}
	async nextTurn() {
		if (!this.unogame) {
			return null;
		}
		if (this.msg.deleted) {
		  this.resetGame()
		  return;
		}
		const member = await this.client.resolveMember(this.unogame.currentPlayer.name, this.message.guild);
		const {color, value} = this.cardString(this.unogame.discardedCard);
		const n2 = (value.includes("WILD_DRAW")) ? `${color} WD4` : (value.includes("DRAW")) ? `${color} DT` : `${color} ${value}`;
		await this.msg.inlineReply(`You're up ${member} - Current Card: ${n2} [${this.getCardEmoji(this.unogame.discardedCard)}]`);
		if (this.unogame.currentPlayer.name === this.client.user.id) {
			await this.client.wait(2000);
			return this.client.user.id;
			/* `doBotTurn(bot, msg);`
				but then recursive requires,
				so pass a value back up the stack instead */
		}
		return null;
	}
	async startGame() {
		this.unogame = new Game(this.players);
		this.unogame.newGame();
		this.unogame.on("end", async ({ winner, score }) => {
		    this.ended = true
			await this.msg.inlineReply(`The game has concluded!\n<@${winner.name}> wins! Score: ${score}`);
			this.resetGame();
		});
		this.unogame.on('nextplayer', async player => {
		    await this.showHand(player.player);
		    await this.msg.edit(await this.createMainEmbed());
		})
		await this.message.channel.send(`A game of Uno has been started!`);
		await this.client.wait(2000);
		await this.message.channel.send(this.createCommandsEmbed())
		await this.client.wait(5000);
		await this.message.channel.send('Good Luck!')
		await this.client.wait(2000)
		this.msg = await this.message.channel.send(await this.createMainEmbed())
		for (const p of this.players) {
		    await this.showHand(p)
		}
		this.message.channel.send('Players cards have been sent to theirs dms!')
		const filter = msg => {
		    if (msg.author.bot) return;
		    let u = this.players.find(p => p.name === msg.author.id)
		    return u;
		};
		this.collector = this.message.channel.createMessageCollector(filter, {
			time: 600000
		})
		this.collector.on('collect', async msg => {
		    if (this.msg.deleted) {
		        this.collector.stop();
		        this.resetGame()
		        return;
		    }
				var content = msg.content.toLowerCase();
				var args = content.split(' ')
				if (args[0] === 'play') {
					if (msg.author.id !== this.unogame.currentPlayer.name) {
						await msg.inlineReply("It's not your turn");
						return;
					}
					const player = this.unogame.currentPlayer;
					const args = msg.content.toLowerCase().split(" ").slice(1);
					if (args.length !== 2) {
						if (args[0] && args[0].match(/^(w|wild|wd4)$/i)) {
				msg.inlineReply("You must provide a color to switch to.");
							return;
						}
						await msg.inlineReply("You must specify both/only a card value and color");
						return;
					}
					try {
						const card = this.getCard(args);
						if (!card) {
							await msg.inlineReply("Couldn't find card matching the given input.");
							return;
						}
						const player = this.unogame.play(card);
						if (player) {
						    return msg.inlineReply(`You forgot to say uno! Two extra cards have been added to you.`)
						}
					} catch (e) {
						if (e.message.includes("does not have card")) {
							await msg.inlineReply("You do not have that card.");
							return;
						}
						if (e.message.includes("from discard pile, does not match")) {
							await msg.inlineReply("That card can't be played now.");
							return;
						}
						console.error(e);
						return;
					}
					if (player.hand.length === 0) {
					    //Game over, player wins.
					    return;
					}
					const check = await this.nextTurn(); 
					if (check) {       this.doBotTurn(); 		}
				}
				if (args[0] === 'draw') {
				    if (msg.author.id !== this.unogame.currentPlayer.name) {				await msg.inlineReply("It's not your turn");				return;			}			this.unogame.draw();			const card = this.unogame.currentPlayer.hand[this.unogame.currentPlayer.hand.length - 1];
				    const name = (card.color) ? card.toString() : Value[card.value];
				    const n2 = (name.includes("WILD_DRAW")) ? `${name.split(" ")[0]} WD4` : (name.includes("DRAW")) ? `${name.split(" ")[0]} DT` : name;
				    await msg.inlineReply(`You drew a ${emojis['UNKNOWN']} (check dm)`);
				    await msg.author.send(this.quickPlainEmbed(`You drew a ${n2.toLowerCase()} [${this.getCardEmoji(card)}] in ${msg.channel}`)).catch(() => {
				this.message.channel.send(`${msg.author}, You must have your dms open to be able to see your uno cards!`)
			});
				}
				if (args[0] === 'pass') {
				    if (msg.author.id !== this.unogame.currentPlayer.name) {				await msg.inlineReply("It's not your turn");				return;			}
				    try {
				this.unogame.pass();
			} catch (e) {
				if (e.message.includes("must draw at least one card")) {
					await msg.inlineReply("You must draw before passing.");
					return;
				}
			}
			const check = await this.nextTurn();
			if (check) {
				this.doBotTurn();
			}
				}
				if (args[0] === 'uno!') {
				    const player = this.unogame.getPlayer(msg.author.id)
				    try {
				    const uno = this.unogame.uno(player);
				    if (!uno || Array.isArray(uno) && uno.length > 0) {
				        return msg.inlineReply('False uno yell! Two penalty cards have been added to you.')
				    }
				    this.message.channel.send(`${msg.author} yelled UNO!`)
				    } catch (e) {
				        if (e.message.includes('already yell uno!')) return msg.inlineReply('You\'ve already yelled uno!')
				        if (e.message.includes('cooldown')) return msg.inlineReply('You did a false uno before. You have to wait 20 seconds before yelling uno again.')
				    }
				}
				if (args[0] === 'end') {
				    let answered = false;
				    msg.inlineReply('Are you sure you want to end this uno match? (yes/no)')
				    const col = await msg.channel.awaitMessages(m => m.author.id === msg.author.id, {max: 1, time: 10000, errors: ['time']}).catch(() => {});
				    if (/(y|yes|ye)/g.test(col?.first()?.content)) answered = true;
				    if (!answered) {
				        return msg.inlineReply('Uno game will continue.')
				    }
				    this.message.channel.send(`${this.unogame.players.map(u => `<@${u.name}>`).join(' ')}, The host has canceled the uno match!`)
				    this.resetGame();
				}
				}) 
				const check = await this.nextTurn(); // Pass the bot id all the way back up the stack
			return check;
		}
		async showHand(player) {
			let p = player;
			if (player.name) {
				p = player.name;
			}
			let member = await this.client.resolveMember(p, this.message.guild)
			if (!member) return false;
			if (member.user.bot) return false;
			const handArr = this.unogame.getPlayer(p).hand; // .toString().toLowerCase().split(",");
			const embed = this.createDmEmbed(handArr);
			await member.send(embed).catch(() => {
				this.message.channel.send(`${member}, You must have your dms open to be able to see your uno cards!`)
			})
			return true;
		}
		cardString(card, spaces) {
		    let color = this.findCardColor(card.color, true);
		    let value = this.findCardValue(card.value, true);
		    if (spaces) {
		        value = value.replace(/_/g, ' ')
		    }
		    return {
		        color: color,
		        value: value
		    }
		}
		findCardColor(str, toString) {
		    let val;
		    if (!isNaN(Number(str)) || /^\d+$/.test(str)) {
		        val = Color[Number(str)]
		    } else if (!val && typeof str === 'string' && !/^\d+$/.test(str)) {
		        val = str.toUpperCase();
		    }
		    if (Color[val] == undefined) return null; //Compare to undefined instead because 0 is basically null
		    return toString ? val+'' : Color[val];
		}
		findCardValue(str, toString) {
		    let val;
		    if (!isNaN(Number(str)) || /^\d+$/.test(str)) {
		        val = Value[Number(str)]
		    } else if (!val && typeof str === 'string' && !/^\d+$/.test(str)) {
		        val = str.toUpperCase();
		    }
		    if (Value[val] == undefined) return null; //Compare to undefined instead because 0 is basically null
		    return toString ? val+'' : Value[val];
		}
		get game() {
			if (!this.client.unoGame[this.channelId]) return null;
			return this.client.unoGame[this.channelId];
		}
		get players() {
			if (!this.game) return null;
			if (typeof this.game['players'] !== 'object') return null;
			if (this.unogame) return this.unogame.players;
			return this.client.unoGame[this.channelId].players;
		}
	}
	module.exports = Uno;