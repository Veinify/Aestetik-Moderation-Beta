const Command = require("../../base/Command.js"),
	Discord = require("discord.js");
	
let persons = [
	'Donald Trump',
	'Bill Gates',
	'Elon Musk',
	'Ariana Grande',
	'Thanos',
	'Sans',
	'Michael Jordan',
	'Mike Wazowski',
	'Gordon Ramsay',
	'Obama',
	'Robbie Rotten',
	'Nicki Minaj',
	'Cardi B',
	'DaBaby',
	'Taylor Swift',
	'Michael Rosen',
	'Amogus',
	'imsofate',
	'LeBron James',
	'Will Smith'
];

let answers = {
	success: [
		'"Ok sure, have **{{amount}} coins**"',
		'"Come here and take my {{amount}} coins"',
		'"Take my **{{amount}} coins** and DONT let anyone knows"',
		'"Come here you little beggar, take my **{{amount}} coins**"'
	],
	fail: [
		'"Too bad i don\'t have any"',
		'"Nah mate, i only gives money to the poor"',
		'"Bro stop calling me bro."',
		'"I don\'t give money to a beggars like you"',
		'"no hablan Inglés"',
		'"Beggars can\'t be choosers"'
	],
	fined: [
		'A police has caught you begging on the street. You have been fined **{{amount}} coins**',
		'While walking on the street, you found a little poor dog thats hungry. You went to a Pet Store and bought a food for them for **{{amount}} coins**',
		'You got tripped by a rock and got your head hurt, you went to the Hospital and paid **{{amount}} coins**'
	],
	death: [
		'You begged too much that you forgot about your health. You ended up died and lost **{{amount}} coins** on your wallet'
	]
};

class Beg extends Command {
	constructor(client) {
		super(client, {
			name: 'beg',
			dirname: __dirname,
			enabled: true,
			guildOnly: true,
			aliases: [],
			memberPermissions: [],
			botPermissions: ['SEND_MESSAGES', 'EMBED_LINKS'],
			nsfw: false,
			ownerOnly: false,
			cooldown: 60000
		});
	}

	async run(message, args, data) {
	    let options = getRandom(persons, 3);
	    let optionslowercase = options.map(function(value) { return value.toLowerCase(); });
	    let optmsg = [];
	    for (const opt of options) {
	        optmsg.push(`\`${opt}\``)
	    }
	    await message.channel.send(message.translate('economy/beg:BEG_LIST', {options: optmsg.join(',')}))
	    const filter = res => {
		    return res.author.id === message.author.id;
		}
		const answer = await message.channel.awaitMessages(filter, { max: 1, time: 20000, errors: ['time'] }).catch(() => {})
		if (!answer) return message.channel.send(`${message.author}, ${message.translate('economy/beg:TIMED_OUT')}`)
		const result = (answer.first()).content;
		const chosen = optionslowercase.indexOf(result.toLowerCase())
		
		if (chosen < 0) return message.channel.send(`${message.author}, ${message.translate('economy/beg:NOT_FOUND')}`)
		options.splice(chosen, 1)
		const embed = new Discord.MessageEmbed()
		.setTitle(options.join(''))
		.setColor(this.client.config.embed.color)
		.setFooter(this.client.config.embed.footer);
		
		let payout;
		const random = Math.floor(Math.Random()*100) + 1;
		const min = 50;
		const max = 200;
		const payoutamount = Math.floor(Math.random() * (max - min + 1)) + min;
		/*
		1-30 = success
		30-60 = fail
		60-90 = fined
		90-100 = death
		*/
		if (random < 30) payout = 'success';
		else if (random > 30 && random < 60) payout = 'fail';
		else if (random > 60 && random < 90) payout = 'fined';
		else if(random > 90) payout = 'death';
		
		switch (payout) {
		    case 'success':
		        let successarr = answers['success']
		        embed.setDescription((successarr[Math.floor(Math.random() * successarr.length) + 1]).replace('{{amount}}', payoutamount))
		        data.memberData.money += payoutamount;
		        break;
		    case 'fail':
		        let failarr = answers['fail'];
		        embed.setDescription(failarr[Math.floor(Math.Random()*failarr.length)+1])
		        break;
		    case 'fined':
		        let finedarr = answers['fined'];
		        embed.setDescription((finedarr[Math.floor(Math.Random()*finedarr.length)+1]).replace('{{amount}}', payoutamount))
		        data.memberData.money -= payoutamount;
		        break;
		    case 'death':
		        let deatharr = answers['death'];
		        embed.setDescription(deatharr[Math.floor(Math.Random()*deatharr.length)+1])
		        data.memberData.money = 0;
		}
		
		await data.memberData.save()
		message.channel.send(message.author, embed)
	}
}

function getRandom(arr, n) {
	var result = new Array(n),
		len = arr.length,
		taken = new Array(len);
	if (n > len)
		throw new RangeError('getRandom: more elements taken than available');
	while (n--) {
		var x = Math.floor(Math.random() * len);
		result[n] = arr[x in taken ? taken[x] : x];
		taken[x] = --len in taken ? taken[len] : len;
	}
	return result;
}
