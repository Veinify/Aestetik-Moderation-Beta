const Command = require("../../base/Command.js"),
    { MessageEmbed } = require('discord.js');

class Goto extends Command {

	constructor (client) {
		super(client, {
			name: "goto",
			dirname: __dirname,
			enabled: true,
			guildOnly: false,
			aliases: [ "travel", "to" ],
			memberPermissions: [],
			botPermissions: [ "SEND_MESSAGES", "EMBED_LINKS" ],
			nsfw: false,
			ownerOnly: false,
			cooldown: 3000
		});
	}

	async run (message, args, data) {
	    if (args[0] === 'list') {
	        const embed = new MessageEmbed()
	        .setTitle(message.translate('economy/goto:LIST'))
	        .setDescription(this.client.locations.array.map(l => `• ${Object.keys(l)}`).join('\n'))
	        .defaultColor()
	        .defaultFooter();
	        return message.inlineReply({embed: embed})
	    }
	    const location = this.client.locations.findLocation(args[0]);
	    if (!location) {
	        return message.error('economy/goto:INVALID', {prefix: data.guild.prefix})
	    }
	    const travelLength = Math.round(this.client.locations.getDestinationLength(data.userData.currentLocation, location));
	    const calculateCost = Math.round(travelLength*0.4);
	    if (data.userData.money < calculateCost) {
	        return message.error('economy/goto:NOT_ENOUGH', {amount: calculateCost.commas()})
	    }
	    
	    const embed = new MessageEmbed()
	    .setTitle(`Goto ${location.toLowerCase()} confirmation`)
	    .setDescription(message.translate('economy/goto:CONFIRM', {destination: location.toLowerCase(), amount: calculateCost.commas()}))
	    .defaultColor()
	    .defaultFooter();
	    const msg = await message.inlineReply({embed: embed})
	    let answered = false;
	    let timed = false;
	    const res = await msg.channel.awaitMessages(m => m.author.id === message.author.id, {max: 1, time: 15000, errors: ['time']}).catch(() => {timed = true});
	    
	    if (timed) {
	        return message.error('misc:TIMES_UP')
	    }
	    
	    if (/(y|yes|ye)/g.test(res.first().content)) answered = true;
		if (!answered) {
			return msg.error('economy/goto:CANCELED')
		}
		
		const successembed = new MessageEmbed()
		.setTitle(`${this.client.locations.emojis[location]} You have arrived!`)
		.setDescription(message.translate('economy/goto:ARRIVED', {meter: travelLength.commas()}))
		.successColor()
		.defaultFooter();
		
		data.userData.currentLocation = this.client.locations.findLocation(location, true);
		message.inlineReply({embed: successembed})
	}

}

module.exports = Goto;