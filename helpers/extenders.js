const { Guild, Message, MessageEmbed, Util } = require('discord.js');
const config = require('../config');

var emojis = require('../emojis')
var cLogo = config.currencyLogo;


Message.prototype.translate = function(key, args = {}) {
	if (args && typeof args === 'object') args['cLogo'] = cLogo;
	let lang = 'en-US'
	if (this.author.userData) {
	    if (this.author.userData.settings.language) lang = this.author.userData.settings.language;
	}
	let language = this.client.translations.get(lang);
	//If not found, try using the default language
	if (!language) language = this.client.translations.get('en-US')
	//If still no languages found
	if (!language) throw 'Message: Invalid language set in data.';
	return language(key, args);
};

// Wrapper for sendT with error emoji
Message.prototype.error = function(key, args, options = {}) {
	options.prefixEmoji = 'error';
	return this.sendT(key, args, options);
};

// Wrapper for sendT with success emoji
Message.prototype.success = function(key, args, options = {}) {
	options.prefixEmoji = 'success';
	return this.sendT(key, args, options);
};

// Translate and send the message
Message.prototype.sendT = function(key, args = {}, options = {}) {
	if (args && typeof args === 'object') args['cLogo'] = cLogo;
	let string = this.translate(key, args);
	if (options.prefixEmoji) {
		string = `${this.client.customEmojis[options.prefixEmoji]} | ${string}`;
	}
	if (options.edit) {
		return this.edit(string);
	} else {
		return this.channel.send(string);
	}
};

// Format a date
Message.prototype.printDate = function(date, format) {
    let lang = 'en-US'
	if (this.author.userData) {
	    if (this.author.userData.settings.language) lang = this.author.userData.settings.language;
	}
	return this.client.printDate(date, format, lang);
};

// Convert time
Message.prototype.convertTime = function(time, type, noPrefix) {
    let lang = 'en-US'
	if (this.author.userData) {
	    if (this.author.userData.settings.language) lang = this.author.userData.settings.language;
	}
	return this.client.convertTime(
		time,
		type,
		noPrefix,
		lang
	);
};

Message.prototype.reactSuccess = function() {
    const emoji = Util.parseEmoji(emojis['success'])
    if (!emoji.id) return this;
    this.react(emoji.id).catch(() => {})
    return this;
}

Message.prototype.reactError = function() {
    const emoji = Util.parseEmoji(emojis['error'])
    if (!emoji.id) return this;
    this.react(emoji.id).catch(() => {})
    return this;
}

MessageEmbed.prototype.errorColor = function() {
	this.setColor('#ff5858');
	return this;
};

MessageEmbed.prototype.successColor = function() {
	this.setColor('#19F37F');
	return this;
};

MessageEmbed.prototype.waitColor = function() {
	this.setColor('#FBEF01');
	return this;
};

MessageEmbed.prototype.defaultColor = function() {
	this.setColor(config.embed.color);
	return this;
};

MessageEmbed.prototype.defaultFooter = function() {
	this.setFooter(config.embed.footer);
	return this;
};

Number.prototype.commas = function() {
	return this.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
};

Object.defineProperty(Array.prototype, 'toPages', {
	value: function(chunkSize) {
		var array = this;
		return [].concat.apply(
			[],
			array.map(function(elem, i) {
				return i % chunkSize ? [] : [array.slice(i, i + chunkSize)];
			})
		);
	}
});
Object.defineProperty(Object.prototype, 'intoArray', {
	value: function() {
		let arr = [];
		for (const [key, value] of Object.entries(this)) {
			let o = {};
            o[key] = value
			arr.push(o);
		}
		return arr;
	},
	writable: true
});
Object.defineProperty(Object.prototype, 'intoArrayValues', {
	value: function() {
		let arr = [];
		for (const obj of Object.keys(this)) {
			arr.push(this[obj]);
		}
		return arr;
	},
	writable: true
});