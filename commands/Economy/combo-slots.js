const Command = require('../../base/Command.js'),
    Discord = require('discord.js'),
	AsciiTable = require('ascii-table'),
	{ SlotMachine, SlotSymbol } = require('slot-machine');
const slotemojis = require('../../emojis')['slot-machine'];
// Slot machine layout
const vertical = 4;
const horizontal = 5;
//Spin bonus payout (in percent)
const spinMin = 10;
const spinMax = 300;
var SlotSymbols = [
    new SlotSymbol('spin', {
        display: slotemojis['spin'],
        weight: 20
    }),
	new SlotSymbol('single-bar', {
		display: slotemojis['single-bar'],
		weight: 20 //rarity of it
	}),
	new SlotSymbol('double-bar', {
		display: slotemojis['double-bar'],
		weight: 17 //rarity of it
	}),
	new SlotSymbol('triple-bar', {
		display: slotemojis['triple-bar'],
		weight: 13 //rarity of it
	}),
	new SlotSymbol('green_seven', {
		display: slotemojis['green_seven'],
		weight: 10 //rarity of it
	}),
	new SlotSymbol('red_seven', {
		display: slotemojis['red_seven'],
		weight: 5 //rarity of it
	}),
	new SlotSymbol('bell', {
		display: slotemojis['bell'],
		weight: 30 //rarity of it
	}),
	new SlotSymbol('horseshoe', {
		display: slotemojis['horseshoe'],
		weight: 35 //rarity of it
	}),
	new SlotSymbol('cockpit', {
		display: slotemojis['cockpit'],
		weight: 55 //rarity of it
	}),
	new SlotSymbol('cherry', {
		display: slotemojis['cherry'],
		weight: 65 //rarity of it
	}),
	new SlotSymbol('lemon', {
		display: slotemojis['lemon'],
		weight: 65 //rarity of it
	}),
	new SlotSymbol('orange', {
		display: slotemojis['orange'],
		weight: 65 //rarity of it
	}),
	new SlotSymbol('watermelon', {
		display: slotemojis['watermelon'],
		weight: 65 //rarity of it
	})
];
/**
 * 3x spin = trigger spin bonus
 * 5x red_seven = 10000%
 * 4x red_seven = 4000%
 * 3x red_seven = 1600%
 * 2x red_seven = 600%
 * 5x green_seven = 5000%
 * 4x green_seven = 2000%
 * 3x green_seven = 800%
 * 2x green_seven = 300%
 * 5x any_seven = 2000%
 * 4x any_seven = 900%
 * 3x any_seven = 400%
 * 2x any_seven = 180%
 * 3x triple-bar = 200%
 * 2x triple-bar = 90%
 * 3x double-bar = 100%
 * 2x double-bar = 45%
 * 3x single-bar = 75%
 * 2x single-bar = 30%
 * 3x bell = 50%
 * 2x bell = 25%
 * 3x horseshoe = 35%
 * 2x horseshoe = 15%
 * 3x cockpit = 30%
 * 2x cockpit = 10%
 * 5x fruits = 10%
 * 4x fruits = 5%
 */
let emojisData = {
    "3x spin": {
        multi: 'trigger the bonus spin',
        removePercent: true,
        emoji: `${slotemojis['spin']}${slotemojis['spin']}${slotemojis['spin']}`,
        message: 'The rewards are between 10-300% of your bet.'
        },
     "5x red_seven": {
         multi: 10000,
         emoji: `${slotemojis['red_seven']}${slotemojis['red_seven']}${slotemojis['red_seven']}${slotemojis['red_seven']}${slotemojis['red_seven']}`,
         newline: true
     },
     "4x red_seven": {
         multi: 4000,
         emoji: `${slotemojis['red_seven']}${slotemojis['red_seven']}${slotemojis['red_seven']}${slotemojis['red_seven']}`
     },
     "3x red_seven": {
         multi: 1600,
         emoji: `${slotemojis['red_seven']}${slotemojis['red_seven']}${slotemojis['red_seven']}`
     },
     "2x red_seven": {
         multi: 600,
         emoji: `${slotemojis['red_seven']}${slotemojis['red_seven']}`
     },
     "5x green_seven": {
         multi: 5000,
         emoji: `${slotemojis['green_seven']}${slotemojis['green_seven']}${slotemojis['green_seven']}${slotemojis['green_seven']}${slotemojis['green_seven']}`,
         newline: true
     },
     "4x green_seven": {
         multi: 2000,
         emoji: `${slotemojis['green_seven']}${slotemojis['green_seven']}${slotemojis['green_seven']}${slotemojis['green_seven']}`
     },
     "3x green_seven": {
         multi: 800,
         emoji: `${slotemojis['green_seven']}${slotemojis['green_seven']}${slotemojis['green_seven']}`
     },
     "2x green_seven": {
         multi: 300,
         emoji: `${slotemojis['green_seven']}${slotemojis['green_seven']}`
     },
     "5x any_seven": {
         multi: 2000,
         emoji: `${slotemojis['any_seven']}${slotemojis['any_seven']}${slotemojis['any_seven']}${slotemojis['any_seven']}${slotemojis['any_seven']}`,
         newline: true
     },
     "4x any_seven": {
         multi: 900,
         emoji: `${slotemojis['any_seven']}${slotemojis['any_seven']}${slotemojis['any_seven']}${slotemojis['any_seven']}`
     },
     "3x any_seven": {
         multi: 400,
         emoji: `${slotemojis['any_seven']}${slotemojis['any_seven']}${slotemojis['any_seven']}`
     },
     "2x any_seven": {
         multi: 180,
         emoji: `${slotemojis['any_seven']}${slotemojis['any_seven']}`,
         message: `NOTE: Only extra seven/unused seven will count as any seven.`
     },
     "3x triple-bar": {
         multi: 200,
         emoji: `${slotemojis['triple-bar']}${slotemojis['triple-bar']}${slotemojis['triple-bar']}`,
         newline: true
     },
     "2x triple-bar": {
         multi: 90,
         emoji: `${slotemojis['triple-bar']}${slotemojis['triple-bar']}`
     },
     "3x double-bar": {
         multi: 100,
         emoji: `${slotemojis['double-bar']}${slotemojis['double-bar']}${slotemojis['double-bar']}`,
         newline: true
     },
     "2x double-bar": {
         multi: 45,
         emoji: `${slotemojis['double-bar']}${slotemojis['double-bar']}`
     },
     "3x single-bar": {
         multi: 75,
         emoji: `${slotemojis['single-bar']}${slotemojis['single-bar']}${slotemojis['single-bar']}`,
         newline: true
     },
     "2x single-bar": {
         multi: 30,
         emoji: `${slotemojis['single-bar']}${slotemojis['single-bar']}`
     },
     "3x bell": {
         multi: 50,
         emoji: `${slotemojis['bell']}${slotemojis['bell']}${slotemojis['bell']}`,
         newline: true
     }, 
     "2x bell": {
         multi: 25,
         emoji: `${slotemojis['bell']}${slotemojis['bell']}`
     },
     "3x horseshoe": {
         multi: 35,
         emoji: `${slotemojis['horseshoe']}${slotemojis['horseshoe']}${slotemojis['horseshoe']}`,
         newline: true
     },
     "2x horseshoe": {
         multi: 15,
         emoji: `${slotemojis['horseshoe']}${slotemojis['horseshoe']}`
     },
     "3x cockpit": {
         multi: 30,
         emoji: `${slotemojis['cockpit']}${slotemojis['cockpit']}${slotemojis['cockpit']}`,
         newline: true
     },
     "2x cockpit": {
         multi: 10,
         emoji: `${slotemojis['cockpit']}${slotemojis['cockpit']}`
     },
     "5x cherry": {
         multi: 10,
         emoji: `${slotemojis['cherry']}${slotemojis['cherry']}${slotemojis['cherry']}${slotemojis['cherry']}${slotemojis['cherry']}`,
         newline: true
     },
     "4x cherry": {
         multi: 5,
         emoji: `${slotemojis['cherry']}${slotemojis['cherry']}${slotemojis['cherry']}${slotemojis['cherry']}`
     },
     "5x lemon": {
         multi: 10,
         emoji: `${slotemojis['lemon']}${slotemojis['lemon']}${slotemojis['lemon']}${slotemojis['lemon']}${slotemojis['lemon']}`,
         newline: true
     },
     "4x lemon": {
         multi: 5,
         emoji: `${slotemojis['lemon']}${slotemojis['lemon']}${slotemojis['lemon']}${slotemojis['lemon']}`
     },
     "5x orange": {
         multi: 10,
         emoji: `${slotemojis['orange']}${slotemojis['orange']}${slotemojis['orange']}${slotemojis['orange']}${slotemojis['orange']}`,
         newline: true
     },
     "4x orange": {
         multi: 5,
         emoji: `${slotemojis['orange']}${slotemojis['orange']}${slotemojis['orange']}${slotemojis['orange']}`
     },
     "5x watermelon": {
         multi: 10,
         emoji: `${slotemojis['watermelon']}${slotemojis['watermelon']}${slotemojis['watermelon']}${slotemojis['watermelon']}${slotemojis['watermelon']}`,
         newline: true
     },
     "4x watermelon": {
         multi: 5,
         emoji: `${slotemojis['watermelon']}${slotemojis['watermelon']}${slotemojis['watermelon']}${slotemojis['watermelon']}`
     }
 }
let payoutTable = [];
for (let e in emojisData) {
    e = emojisData[e];
    payoutTable.push(`${e.newline ? '\n' : ''}${e.emoji} = ${e.multi}${!e.removePercent ? '%' : ''} ${e.message ? `\n${e.message}` : ''}`);
}
payoutTable = payoutTable.toPages(13)

class ComboSlots extends Command {
	constructor(client) {
		super(client, {
			name: 'combo-slots',
			dirname: __dirname,
			enabled: true,
			guildOnly: true,
			aliases: ['cslots', 'cslot', 'comboslots', 'comboslot'],
			memberPermissions: [],
			botPermissions: ['SEND_MESSAGES', 'EMBED_LINKS'],
			nsfw: false,
			ownerOnly: false,
			cooldown: 5000
		});
	}

	async run(message, args, data) {
	    if (args[0] && args[0].toLowerCase() === 'table') {
	        let page = args[1];
	        if (!page) page = 1
	        if (page > payoutTable.length) return message.error('Invalid Page.')
	        const embed = new Discord.MessageEmbed()
	        .setTitle('Combo Slot payout table')
	        .setDescription(`${message.translate('economy/combo-slots:tableDescription')}\n${payoutTable[page-1].join('\n')}`)
	        .defaultColor()
	        .setFooter(`Viewing page ${page} out of ${payoutTable.length} pages.\n${data.guild.prefix}${this.help.name} table [page]`)
	        return message.channel.send(embed)
	    }
	    let amount = args[0];
	    amount = this.client.functions.calcAmount(amount, data, true, message);
	    if (!amount) return;
		data.userData.money -= amount
		let msg = '\`[ 🎰 |    Combo Slot   ]\n------------------------\`\n';
		const machine = new SlotMachine(5, SlotSymbols);
		const results = machine.play();

		let symbols = [];
		let emojis = [];
		let totalemojis = {};

		for (let i in results.lines) {
			for (let s of results.lines[i].symbols) {
				symbols.push({ name: s.name, display: s.display });
				emojis.push(s.display);
			}
		}
		// cut array and make it into separate pages to make it easier
		symbols = symbols.slice(0, vertical * horizontal);
		emojis = emojis.slice(0, vertical * horizontal).toPages(horizontal);
		for (let e of symbols) {
		    totalemojis[e.name] ? totalemojis[e.name]++ : totalemojis[e.name] = 1;
		    if (/seven/g.test(e.name)) {
		    totalemojis['any_seven'] ? totalemojis['any_seven']++ : totalemojis['any_seven'] = 1;
		    }
		}
		//add the slots structure
		for (let e of emojis) {
			try {
				//ignore an element thats not array
				if (!Array.isArray(e)) return;
			} finally {
				msg += `\`||\` ${e.join('  |  ')} \`||\`\n`
			}
		}
		msg += '\`------------------------\n[                      ]\`\n'
		const embed = new Discord.MessageEmbed()
		.setTitle(`${message.author.username}'s Combo Slot`)
		.setDescription(msg)
		.defaultColor()
		.defaultFooter();
		const msgembed = await message.inlineReply({ embed: embed, allowedMentions: { repliedUser: false } })

		//CALCULATE SLOT PAYOUT 
		const red_seven = totalemojis['red_seven']
		const green_seven = totalemojis['green_seven']
		let any_seven = totalemojis['any_seven']
		const tbar = totalemojis['triple-bar']
		const dbar = totalemojis['double-bar']
		const sbar = totalemojis['single-bar']
		const bell = totalemojis['bell']
		const horseshoe = totalemojis['horseshoe']
		const cockpit = totalemojis['cockpit']
		const cherry = totalemojis['cherry']
		const lemon = totalemojis['lemon']
		const orange = totalemojis['orange']
		const watermelon = totalemojis['watermelon']
		const spin = totalemojis['spin']
		let triggerspin = false;
		
		const cLogo = this.client.config.currencyLogo;
		let percentCalc = (percent, money) => {
			return this.client.functions.percentCalc(percent, money);
		};
		let payoutmsg = ''
		let totalwon = 0;
		// Time to CALCULATE
		if (spin) {
		    if (spin >= 3) {
		        const data = emojisData['3x spin'];
		        triggerspin = true;
		        msg += `${data.emoji} = bonus spin\n`
		    }
		}
		if (red_seven) {
		    if (red_seven >= 5) {
		        let data = emojisData['5x red_seven']
		        let won = percentCalc(data.multi, amount)
		        payoutmsg += `${data.emoji} = ${cLogo}${won.commas()}\n`
		        any_seven -= 5
		        totalwon += won;
		    } else if (red_seven === 4) {
		        let data = emojisData['4x red_seven']
		        let won = percentCalc(data.multi, amount)
		        payoutmsg += `${data.emoji} = ${cLogo}${won.commas()}\n`
		        any_seven -= 4;
		        totalwon += won;
		    } else if (red_seven === 3) {
		        let data = emojisData['3x red_seven']
		        let won = percentCalc(data.multi, amount)
		        payoutmsg += `${data.emoji} = ${cLogo}${won.commas()}\n`
		        any_seven -= 3
		        totalwon += won;
		    } else if (red_seven === 2) {
		        let data = emojisData['2x red_seven']
		        let won = percentCalc(data.multi, amount)
		        payoutmsg += `${data.emoji} = ${cLogo}${won.commas()}\n`
		        any_seven -= 2
		        totalwon += won;
		    }
		}
		if (green_seven) {
		    if (green_seven >= 5) {
		        let data = emojisData['5x green_seven']
		        let won = percentCalc(data.multi, amount)
		        payoutmsg += `${data.emoji} = ${cLogo}${won.commas()}\n`
		        any_seven -= 5
		        totalwon += won;
		    } else if (green_seven === 4) {
		        let data = emojisData['4x green_seven']
		        let won = percentCalc(data.multi, amount)
		        payoutmsg += `${data.emoji} = ${cLogo}${won.commas()}\n`
		        any_seven -= 4;
		        totalwon += won;
		    } else if (green_seven === 3) {
		        let data = emojisData['3x green_seven']
		        let won = percentCalc(data.multi, amount)
		        payoutmsg += `${data.emoji} = ${cLogo}${won.commas()}\n`
		        any_seven -= 3
		        totalwon += won;
		    } else if (green_seven === 2) {
		        let data = emojisData['2x green_seven']
		        let won = percentCalc(data.multi, amount)
		        payoutmsg += `${data.emoji} = ${cLogo}${won.commas()}\n`
		        any_seven -= 2
		        totalwon += won;
		    }
		}
		if (any_seven) {
		    if (any_seven >= 5) {
		        let data = emojisData['5x any_seven']
		        let won = percentCalc(data.multi, amount)
		        payoutmsg += `${data.emoji} = ${cLogo}${won.commas()}\n`
		        totalwon += won;
		    } else if (any_seven === 4) {
		        let data = emojisData['4x any_seven']
		        let won = percentCalc(data.multi, amount)
		        payoutmsg += `${data.emoji} = ${cLogo}${won.commas()}\n`
		        totalwon += won;
		    } else if (any_seven === 3) {
		        let data = emojisData['3x any_seven']
		        let won = percentCalc(data.multi, amount)
		        payoutmsg += `${data.emoji} = ${cLogo}${won.commas()}\n`
		        totalwon += won;
		    } else if (any_seven === 2) {
		        let data = emojisData['2x any_seven']
		        let won = percentCalc(data.multi, amount)
		        payoutmsg += `${data.emoji} = ${cLogo}${won.commas()}\n`
		        totalwon += won;
		    }
		}
		if (tbar) {
		    if (tbar >= 3) {
		        let data = emojisData['3x triple-bar']
		        let won = percentCalc(data.multi, amount);
		        payoutmsg += `${data.emoji} = ${cLogo}${won.commas()}\n`
		        totalwon += won
		    } else if (tbar === 2) {
		        let data = emojisData['2x triple-bar']
		        let won = percentCalc(data.multi, amount)
		        payoutmsg += `${data.emoji} = ${cLogo}${won.commas()}\n`
		        totalwon += won;
		    }
		}
		if (dbar) {
		    if (dbar >= 3) {
		        let data = emojisData['3x double-bar']
		        let won = percentCalc(data.multi, amount);
		        payoutmsg += `${data.emoji} = ${cLogo}${won.commas()}\n`
		        totalwon += won
		    } else if (dbar === 2) {
		        let data = emojisData['2x double-bar']
		        let won = percentCalc(data.multi, amount)
		        payoutmsg += `${data.emoji} = ${cLogo}${won.commas()}\n`
		        totalwon += won;
		    }
		}
		if (sbar) {
		    if (sbar >= 3) {
		        let data = emojisData['3x single-bar']
		        let won = percentCalc(data.multi, amount);
		        payoutmsg += `${data.emoji} = ${cLogo}${won.commas()}\n`
		        totalwon += won
		    } else if (sbar === 2) {
		        let data = emojisData['2x single-bar']
		        let won = percentCalc(data.multi, amount)
		        payoutmsg += `${data.emoji} = ${cLogo}${won.commas()}\n`
		        totalwon += won;
		    }
		}
		if (bell) {
		    if (bell >= 3) {
		        let data = emojisData['3x bell']
		        let won = percentCalc(data.multi, amount);
		        payoutmsg += `${data.emoji} = ${cLogo}${won.commas()}\n`
		        totalwon += won
		    } else if (bell === 2) {
		        let data = emojisData['2x bell']
		        let won = percentCalc(data.multi, amount)
		        payoutmsg += `${data.emoji} = ${cLogo}${won.commas()}\n`
		        totalwon += won;
		    }
		}
		if (horseshoe) {
		    if (horseshoe >= 3) {
		        let data = emojisData['3x horseshoe']
		        let won = percentCalc(data.multi, amount);
		        payoutmsg += `${data.emoji} = ${cLogo}${won.commas()}\n`
		        totalwon += won
		    } else if (horseshoe === 2) {
		        let data = emojisData['2x horseshoe']
		        let won = percentCalc(data.multi, amount)
		        payoutmsg += `${data.emoji} = ${cLogo}${won.commas()}\n`
		        totalwon += won;
		    }
		}
		if (cockpit) {
		    if (cockpit >= 3) {
		        let data = emojisData['3x cockpit']
		        let won = percentCalc(data.multi, amount);
		        payoutmsg += `${data.emoji} = ${cLogo}${won.commas()}\n`
		        totalwon += won
		    } else if (cockpit === 2) {
		        let data = emojisData['2x cockpit']
		        let won = percentCalc(data.multi, amount)
		        payoutmsg += `${data.emoji} = ${cLogo}${won.commas()}\n`
		        totalwon += won;
		    }
		}
		if (cherry) {
		    if (cherry >= 5) {
		        let data = emojisData['5x cherry']
		        let won = percentCalc(data.multi, amount);
		        payoutmsg += `${data.emoji} = ${cLogo}${won.commas()}\n`
		        totalwon += won
		    } else if (cherry === 4) {
		        let data = emojisData['4x cherry']
		        let won = percentCalc(data.multi, amount)
		        payoutmsg += `${data.emoji} = ${cLogo}${won.commas()}\n`
		        totalwon += won;
		    }
		}
		if (lemon) {
		    if (lemon >= 5) {
		        let data = emojisData['5x lemon']
		        let won = percentCalc(data.multi, amount);
		        payoutmsg += `${data.emoji} = ${cLogo}${won.commas()}\n`
		        totalwon += won
		    } else if (lemon === 4) {
		        let data = emojisData['4x lemon']
		        let won = percentCalc(data.multi, amount)
		        payoutmsg += `${data.emoji} = ${cLogo}${won.commas()}\n`
		        totalwon += won;
		    }
		}
		if (orange) {
		    if (orange >= 5) {
		        let data = emojisData['5x orange']
		        let won = percentCalc(data.multi, amount);
		        payoutmsg += `${data.emoji} = ${cLogo}${won.commas()}\n`
		        totalwon += won
		    } else if (orange === 4) {
		        let data = emojisData['4x orange']
		        let won = percentCalc(data.multi, amount)
		        payoutmsg += `${data.emoji} = ${cLogo}${won.commas()}\n`
		        totalwon += won;
		    }
		}
		if (watermelon) {
		    if (watermelon >= 5) {
		        let data = emojisData['5x watermelon']
		        let won = percentCalc(data.multi, amount);
		        payoutmsg += `${data.emoji} = ${cLogo}${won.commas()}\n`
		        totalwon += won
		    } else if (watermelon === 4) {
		        let data = emojisData['4x watermelon']
		        let won = percentCalc(data.multi, amount)
		        payoutmsg += `${data.emoji} = ${cLogo}${won.commas()}\n`
		        totalwon += won;
		    }
		}
		if (triggerspin) bonusSpin(message, data, amount);
		msg += payoutmsg;
		msg += message.translate('economy/combo-slots:slotBottom', {
		    amount: amount.commas(),
		    totalwon: totalwon.commas(),
		    profit: (totalwon - amount).commas(),
		    cmd: `${data.guild.prefix}${this.help.name}`
		})
		embed.setDescription(msg);
		data.userData.money += totalwon;
		setTimeout(() => {msgembed.edit(embed)}, 1000)
	}
}
module.exports = ComboSlots;

async function bonusSpin(message, data, amount) {
    let first;
    let second;
    let third;
    let stopTime = message.client.functions.randomNum(10, 20) //The time in second the spinner will stop
    const msg = await message.sendT('Loading...', null, {prefixEmoji: "loading"})
    const i = setInterval(() => {
    third = second || '???'
    second = first || '???'
    first = message.client.functions.percentCalc(message.client.functions.randomNum(spinMin, spinMax), amount);
    let embed = cembed();
    embed.defaultColor();
    msg.edit(`${message.author}`, embed)
    }, 2000)
    setTimeout(() => {
        clearInterval(i);
        end();
    }, `${stopTime+2}000`) //extra two seconds cause it takes 2 seconds to edit the message
    function end() {
        const embed = cembed()
        embed.successColor();
        let won = parseInt(second);
        if (isNaN(won)) won = 0;
        data.userData.money += won;
        msg.edit(embed)
        message.inlineReply(message.translate('economy/combo-slots:bonusEnd', {won: won.commas()}))
    }
    function cembed() {
    const embed = new Discord.MessageEmbed()
    .setTitle(`${message.author.username}'s bonus spin`)
    .setDescription(`${message.translate('economy/combo-slots:bonusDescription', {time: stopTime})}\n\`\`\`css\n  ${first.commas()}\n> ${typeof second === 'number' ? second.commas() : second} <\n  ${typeof third === 'number' ? third.commas() : third}\`\`\``)
    .defaultFooter()
    return embed;
    }
}
