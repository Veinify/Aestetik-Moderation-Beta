const Command = require('../../base/Command.js'),
	Notification = require('../../base/Notification');

var minimum = 500;
var finePercent = 30;
var offsetPercent = 80;

class Rob extends Command {
	constructor(client) {
		super(client, {
			name: 'rob',
			dirname: __dirname,
			enabled: true,
			guildOnly: true,
			aliases: ['steal'],
			memberPermissions: [],
			botPermissions: ['SEND_MESSAGES', 'EMBED_LINKS'],
			nsfw: false,
			ownerOnly: false,
			cooldown: 60000
		});
	}

	async run(message, args, data) {
		const member = await this.client.resolveMember(args[0], message.guild);
		if (!member) {
			return message.error('economy/rob:MISSING_MEMBER');
		}

		if (member.id === message.author.id) {
			return message.error('economy/rob:YOURSELF');
		}
		
		let percentCalc = (percent, money) => { return this.client.functions.percentCalc(percent, money) }

		const memberData = await this.client.findOrCreateUser({ id: member.id });
		const isInCooldown = memberData.cooldowns.rob || 0;
		if (isInCooldown) {
			if (isInCooldown > Date.now()) {
				return message.error('economy/rob:COOLDOWN', {
					username: member.user.tag
				});
			}
		}
		if (memberData.money <= 0) {
			return message.error('economy/rob:NOT_ENOUGH_MEMBER', {
				username: member.user.tag
			});
		} else if (data.userData.money < 500) {
			return message.error('economy/rob:NOT_ENOUGH_AUTHOR', {
				moneyMin: minimum
			});
		}

		const chance = Math.floor(this.client.functions.randomNum(0, 100));
		let result;
		/*
		40% chance of winning
		60% fail
		Can be changed with items update
		*/
		if (chance < 50) result = 'win';
		else if (chance > 50) result = 'fail'
		else payout = 'win'; //if somehow an error occured
		
		const embed = new Discord.MessageEmbed()
		.defaultFooter();
		let payoutChance = Math.floor(this.client.functions.randomNum(1, 100));
		let payout;
		let msg;
		let failfined = percentCalc(finePercent, data.userData.money);
		if (failfined < 10000) failfined = 500;
		if (result === 'fail')
			msg = message.translate('economy/rob:CAUGHT', {
				fine: failfined.commas(),
				offset: percentCalc(offsetPercent, failfined).commas()
			});
		/*
		1-10 10% massive
		10-30 20% half
		30-65 35% small
		65-100 45% tiny
		*/
		if (result === 'fail') payoutChance = null;
		else if (payoutChance < 20) payoutChance = 'massive';
		else if (payoutChance > 20 && payoutChance < 40) payoutChance = 'decent';
		else if (payoutChance > 40 && payoutChance < 65) payoutChance = 'small';
		else if (payoutChance > 65) payoutChance = 'tiny';

		switch (payoutChance) {
			case 'massive':
				payout = Math.floor(this.client.functions.randomNum(70, 100));
				msg = message.translate('economy/rob:MASSIVE', {
					won: percentCalc(payout, memberData.money).commas()
				});
				break;
			case 'decent':
				payout = Math.floor(this.client.functions.randomNum(40, 70));
				msg = message.translate('economy/rob:DECENT', {
					won: percentCalc(payout, memberData.money).commas()
				});
				break;
			case 'small':
				payout = Math.floor(this.client.functions.randomNum(20, 40));
				msg = message.translate('economy/rob:SMALL', {
					won: percentCalc(payout, memberData.money).commas()
				});
				break;
			case 'tiny':
				payout = Math.floor(this.client.functions.randomNum(1, 20));
				msg = message.translate('economy/rob:TINY', {
					won: percentCalc(payout, memberData.money).commas()
				});
				break;
		}

		switch (result) {
			case 'win':
				let won = percentCalc(payout, memberData.money);
				data.userData.money += won;
				memberData.money -= won;
				const toWait = Date.now() + 10 * 60000;
				memberData.cooldowns.rob = toWait;
				memberData.markModified('cooldowns');
				new Notification(this.client, memberData, {
					title: 'You have been stolen from!',
					message: `Oh no, \`${message.author.tag}\` has stolen **${
						this.client.config.currencyLogo
					}${won.commas()}** from you in **${message.member.guild}**!`,
					category: this.help.name
				});
				embed.successColor();
				break;
			case 'fail':
				data.userData.money -= failfined;
				memberData.money += percentCalc(offsetPercent, failfined);
				new Notification(this.client, memberData, {
					title: 'Someone is trying to rob you!',
					message: `\`${message.author.tag}\` tried to rob you in **${
						message.guild
					}** but failed! They got fined **${
						this.client.config.currencyLogo
					}${failfined.commas()}** and **${
						this.client.config.currencyLogo
					}${percentCalc(offsetPercent, failfined).commas()}** will be given to you!`,
					category: this.help.name
				});
				embed.errorColor();
				break;
			default:
			throw new Error(`Cannot determines if user won the robbery or lose (${this.help.name} command`)
			break;
		}
		memberData.save();
		embed.setDescription(msg);
		message.channel.send(message.author.toString(), embed);
	}
}

module.exports = Rob;
