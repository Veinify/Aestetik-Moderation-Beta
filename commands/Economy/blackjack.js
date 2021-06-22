const Command = require('../../base/Command.js'),
	{ MessageEmbed } = require('discord.js'),
	{ MessageButton, MessageActionRow } = require('discord-buttons'),
	blackjack = require('../../Commands Class/blackjack');

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
			cooldown: 5000,
			requiredLocation: 'CASINO'
		});
	}

	async run(message, args, data) {
		const { client } = this;
		let bet;
		let endp = false;
		function createbtn() {
			const bet1 = new MessageButton()
				.setLabel('100')
				.setStyle(endp ? 'red' : 'blurple')
				.setID('100');
			const bet2 = new MessageButton()
				.setLabel('1,000')
				.setStyle(endp ? 'red' : 'blurple')
				.setID('1000');
			const bet3 = new MessageButton()
				.setLabel('10,000')
				.setStyle(endp ? 'red' : 'blurple')
				.setID('10000');
			const bet4 = new MessageButton()
				.setLabel('50,000')
				.setStyle(endp ? 'red' : 'blurple')
				.setID('50000');
			const bet5 = new MessageButton()
				.setLabel('100,000')
				.setStyle(endp ? 'red' : 'blurple')
				.setID('100000');
			if (endp) {
				bet1.setDisabled();
				bet2.setDisabled();
				bet3.setDisabled();
				bet4.setDisabled();
				bet5.setDisabled();
			}
			const row = new MessageActionRow()
				.addComponent(bet1)
				.addComponent(bet2)
				.addComponent(bet3)
				.addComponent(bet4)
				.addComponent(bet5);
			return row;
		}
		const embed = new MessageEmbed()
			.setDescription('How much bet you wanna put?')
			.defaultColor()
			.defaultFooter();
		const msg = await message.channel.send({
			embed: embed,
			components: createbtn()
		});
		const filter = b => b.clicker.user.id === message.author.id;
		const collector = msg.createButtonCollector(filter, { time: 20000 });
		collector.on('collect', b => {
			const { id } = b;
			if (data.userData.money < id)
				return b.reply.send(
					`You don't have enough money! You need **${
						data.config.currencyLogo
					}${(parseInt(id) - data.userData.money).commas()}** more.`,
					{ ephemeral: true }
				);
			bet = parseInt(id);
			b.defer(true);
			collector.stop();
		});
		collector.on('end', async () => {
		    endp = true
			if (!bet) {
				msg.edit({
					embed: embed,
					components: createbtn()
				});
				return message.inlineReply(
					`Times up you didn't place your bet in time.`
				);
			}
			await msg.edit({
				embed: embed,
				components: createbtn()
			});
			const bj = new blackjack(this, data, message, bet);
			bj.init();
		});
		return;
	}
}
module.exports = Blackjack;
