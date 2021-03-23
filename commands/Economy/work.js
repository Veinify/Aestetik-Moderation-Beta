const Command = require("../../base/Command.js"),
	Discord = require("discord.js"),
	svgCaptcha = require('svg-captcha'),
	{ svg2png } = require('svg-png-converter');


class Work extends Command {

	constructor (client) {
		super(client, {
			name: "work",
			dirname: __dirname,
			enabled: true,
			guildOnly: true,
			aliases: [ "salaire", "salary", "travail", "daily", "dailies" ],
			memberPermissions: [],
			botPermissions: [ "SEND_MESSAGES", "EMBED_LINKS" ],
			nsfw: false,
			ownerOnly: false,
			cooldown: 3000
		});
	}

	async run (message, args, data) {

		// if the member is already in the cooldown db
		const isInCooldown = data.memberData.cooldowns.work;
		if(isInCooldown){
			/*if the timestamp recorded in the database indicating 
            when the member will be able to execute the order again 
            is greater than the current date, display an error message */
			if(isInCooldown > Date.now()){
				return message.error("economy/work:COOLDOWN", {
					time: message.convertTime(isInCooldown, "to", true)
				});
			}
		}

		if(Date.now() > data.memberData.cooldowns.work+(24*3600000)){
		if(data.memberData.workStreak && data.memberData.workStreak > 0) message.reply(message.translate('economy/work:STREAK_LOST'))
			data.memberData.workStreak = 0;
		}

		// Records in the database the time when the member will be able to execute the command again (in 12 hours)
		const toWait = Date.now() + 3600000;
		data.memberData.cooldowns.work = toWait;
		data.memberData.markModified("cooldowns");
		await data.memberData.save()
		
		var captcha = svgCaptcha.create({
		    width: 80,
		    height:25,
		    fontSize: 30,
		    color: true,
		    background: '#ffffff'
		});
		const topng = await svg2png({
		    input: captcha.data,
		    encoding: 'buffer',
		    format: 'png'
		})
		const image = new Discord.MessageAttachment(topng, 'captcha.png')
		const workembed = new Discord.MessageEmbed()
		.setTitle(`${message.author.tag}'s work`)
		.setDescription(message.translate('economy/work:WORK_MESSAGE'))
		.attachFiles(image)
		.setImage('attachment://captcha.png')
		.setColor(this.client.config.embed.color);
		await message.reply(workembed);
		const filter = res => {
		    return res.author.id === message.author.id;
		}
		let correct = false;
		const answer = await message.channel.awaitMessages(filter, { max: 1, time: 20000, errors: ['time'] }).catch(() => {})
		if(answer && answer.first().content.toLowerCase() === captcha.text.toLowerCase()) correct = true;
		
		let lostamount = 250;
		
		if (!correct) {
		    data.memberData.workStreak = 0;
		    data.memberData.money += lostamount;
		    await data.memberData.save();
		    message.error('economy/work:WORK_FAIL', {tag: message.author.tag, amount: lostamount});
		    return
		}

		data.memberData.workStreak = (data.memberData.workStreak || 0) + 1;
		await data.memberData.save();

		const embed = new Discord.MessageEmbed()
			.setFooter(message.translate("economy/work:AWARD"), message.author.displayAvatarURL())
			.setColor(data.config.embed.color);
        
		const award = [
			this.client.customEmojis.letters.a,
			this.client.customEmojis.letters.w,
			this.client.customEmojis.letters.a,
			this.client.customEmojis.letters.r,
			this.client.customEmojis.letters.d
		];
		let max = 2000
		let min = 500
		let won = Math.floor(Math.random() * (max - min + 1)) + min;

		if(data.memberData.workStreak >= 5){
			won += 500;
			embed.addField(message.translate("economy/work:SALARY"), message.translate("economy/work:SALARY_CONTENT", {
				won
			}))
				.addField(message.translate("economy/work:STREAK"), message.translate("economy/work:STREAK_CONTENT"));
			data.memberData.workStreak = 0;
		} else {
			for(let i = 0; i < award.length; i++){
				if(data.memberData.workStreak > i){
					const letter = Discord.Util.parseEmoji(award[i]).name.split("_")[1];
					award[i] = `:regional_indicator_${letter.toLowerCase()}:`;
				}
			}
			embed.addField(message.translate("economy/work:SALARY"), message.translate("economy/work:SALARY_CONTENT", {
				won
			}))
				.addField(message.translate("economy/work:STREAK"), award.join(""));
		}

		data.memberData.money = data.memberData.money + won;
		data.memberData.save();

		const messageOptions = { embed };
		if(!data.userData.achievements.work.achieved){
			data.userData.achievements.work.progress.now += 1;
			if(data.userData.achievements.work.progress.now === data.userData.achievements.work.progress.total){
				messageOptions.files = [
					{
						name: "unlocked.png",
						attachment: "./assets/img/achievements/achievement_unlocked1.png"
					}
				];
				data.userData.achievements.work.achieved = true;
			}
			data.userData.markModified("achievements.work");
			data.userData.save();
		}

		// Send the embed in the current channel
		message.channel.send(messageOptions).catch(() => {});

	}

}

module.exports = Work;
