const Command = require('../../base/Command.js'),
    Discord = require('discord.js');

class Daily extends Command {
	constructor(client) {
		super(client, {
			name: 'daily',
			dirname: __dirname,
			enabled: true,
			guildOnly: true,
			aliases: [],
			memberPermissions: [],
			botPermissions: ['SEND_MESSAGES', 'EMBED_LINKS'],
			nsfw: false,
			ownerOnly: false,
			cooldown: 1000
		});
	}

	async run(message, args, data) {
		// if the member is already in the cooldown db
		const isInCooldown = data.userData.cooldowns.daily;
		if(isInCooldown){
			/*if the timestamp recorded in the database indicating 
            when the member will be able to execute the order again 
            is greater than the current date, display an error message */
			if(isInCooldown > Date.now()){
				return message.error("economy/daily:COOLDOWN", {
					time: message.convertTime(isInCooldown, "to", true)
				});
			}
		}

		if(Date.now() > data.userData.cooldowns.daily+(24*3600000)){
		if(data.userData.dailyStreak && data.userData.dailyStreak > 0) message.reply(message.translate('economy/daily:STREAK_LOST'))
			data.userData.dailyStreak = 0;
		}

		// Records in the database the time when the member will be able to execute the command again (in 1 day)
		const toWait = Date.now() + (24*3600000);
		data.userData.cooldowns.daily = toWait;
		data.userData.markModified("cooldowns");

		let daily = 5000;
		const streak = data.userData.dailyStreak;
		let streakBonus = Math.floor(10 * Math.sqrt(streak));
		streakBonus = parseInt((((streakBonus <= 0 ? 1 : streakBonus) * daily / 100) + daily).toFixed(0));
		if (streakBonus < daily) streakBonus = daily;
		
	    const embed = new Discord.MessageEmbed()
	    .setTitle(`${message.author.username}'s daily`)
	    .setDescription(message.translate('economy/daily:DAILY_MESSAGE', {username: message.author.username, amount: streakBonus.commas() }))
	    .setFooter(`Streak: ${streak}${streakBonus > daily ? `   (+${(streakBonus - daily).commas()} from streak)` : ''}`)
	    .defaultColor();
	    data.userData.money += parseInt(streakBonus)
	    data.userData.dailyStreak += 1
	    await message.channel.send(embed)
	}
}

module.exports = Daily;