const languages = require('../languages/language-meta.json')
	.map(l => l.moment)
	.filter(l => l !== 'en');
languages.forEach(l => {
	require(`moment/locale/${l}.js`);
});

module.exports = {
	/**
	 * Gets message prefix
	 * @param {object} message The Discord message
	 * @returns The prefix
	 */
	getPrefix(message, data) {
		if (message.channel.type !== 'dm') {
			const prefixes = [
				`<@!${message.client.user.id}> `,
				`<@${message.client.user.id}> `,
				message.client.user.username.toLowerCase(),
				data.guild.prefix
			];
			let prefix = null;
			prefixes.forEach(p => {
				if (
					message.content.startsWith(p) ||
					message.content.toLowerCase().startsWith(p)
				) {
					prefix = p;
				}
			});
			return prefix;
		} else {
			return true;
		}
	},

	// This function return a valid link to the support server
	async supportLink(client) {
		const guild = client.guilds.cache.get(client.config.support.id);
		const member = guild.me;
		const channel = guild.channels.cache.find(ch =>
			ch.permissionsFor(member.id).has('CREATE_INSTANT_INVITE')
		);
		if (channel) {
			const invite = await channel.createInvite({ maxAge: 0 }).catch(() => {});
			return invite ? invite.url : null;
		} else {
			return 'https://atlanta-bot.fr';
		}
	},

	// This function sort an array
	sortByKey(array, key) {
		return array.sort(function(a, b) {
			const x = a[key];
			const y = b[key];
			return x < y ? 1 : x > y ? -1 : 0;
		});
	},

	// This function return a shuffled array
	shuffle(pArray) {
		const array = [];
		pArray.forEach(element => array.push(element));
		let currentIndex = array.length,
			temporaryValue,
			randomIndex;
		// While there remain elements to shuffle...
		while (0 !== currentIndex) {
			// Pick a remaining element...
			randomIndex = Math.floor(Math.random() * currentIndex);
			currentIndex -= 1;
			// And swap it with the current element.
			temporaryValue = array[currentIndex];
			array[currentIndex] = array[randomIndex];
			array[randomIndex] = temporaryValue;
		}
		return array;
	},

	// This function return a random number between min and max
	randomNum(min, max) {
		min = Math.ceil(min);
		max = Math.floor(max);
		return Math.floor(Math.random() * (max - min + 1)) + min;
	},

	convertTime(guild, time) {
		const absoluteSeconds = Math.floor((time / 1000) % 60);
		const absoluteMinutes = Math.floor((time / (1000 * 60)) % 60);
		const absoluteHours = Math.floor((time / (1000 * 60 * 60)) % 24);
		const absoluteDays = Math.floor(time / (1000 * 60 * 60 * 24));

		const d = absoluteDays
			? absoluteDays === 1
				? guild.translate('time:ONE_DAY')
				: guild.translate('time:DAYS', { amount: absoluteDays })
			: null;
		const h = absoluteHours
			? absoluteHours === 1
				? guild.translate('time:ONE_HOUR')
				: guild.translate('time:HOURS', { amount: absoluteHours })
			: null;
		const m = absoluteMinutes
			? absoluteMinutes === 1
				? guild.translate('time:ONE_MINUTE')
				: guild.translate('time:MINUTES', { amount: absoluteMinutes })
			: null;
		const s = absoluteSeconds
			? absoluteSeconds === 1
				? guild.translate('time:ONE_SECOND')
				: guild.translate('time:SECONDS', { amount: absoluteSeconds })
			: null;

		const absoluteTime = [];
		if (d) absoluteTime.push(d);
		if (h) absoluteTime.push(h);
		if (m) absoluteTime.push(m);
		if (s) absoluteTime.push(s);

		return absoluteTime.join(', ');
	},
	calculateLevel(xp) {
		return Math.floor(0.1 * Math.sqrt(xp));
	},
	calculateXp(level) {
		return Math.floor(100 * level ** 2);
	},
	percentCalc(wonPercent, money) {
		return parseInt(Math.floor((money * wonPercent) / 100));
	},
	calcAmount(amount, data, bet = true, message) {
		if (typeof amount === 'string' && amount.toLowerCase() === 'all')
			amount = parseInt(data.userData.money);
		else if (
			(typeof amount === 'string' && amount.toLowerCase() === 'max') ||
			(typeof amount === 'string' && amount.toLowerCase() === 'full')
		) {
			if (!bet) amount = parseInt(data.userData.money);
			if (bet && data.userData.money <= data.config.maxBet)
				amount = parseInt(data.userData.money);
			else if (bet && data.userData.money > data.config.maxBet)
				amount = parseInt(data.config.maxBet);
		}
		if (isNaN(amount) || amount < 0) {
			message.error('misc:INVALID_NUMBER')
			return false
		}
		amount = Math.round(amount);
		if (amount > data.userData.money) {
			message.error('economy/slots:NOT_ENOUGH', {
				money: amount.commas()
			});
			return false
		}
		if (bet && amount < data.config.minBet) {
			message.error('misc:GAMBLE_MIN', {
				min: data.config.minBet.commas()
			});
			return false
		}
		if (bet && amount > data.config.maxBet) {
			message.error('misc:GAMBLE_MAX', {
				max: data.config.maxBet.commas()
			});
			return false
		}
		return isNaN(Number(amount.toString())) ? parseInt(amount) : Number(amount) 
	}
};
