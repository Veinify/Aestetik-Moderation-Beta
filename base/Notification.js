const { MessageEmbed, Util, Collection, Client } = require('discord.js');

class Notification {
	constructor(client, userData, options) {
		/**
		 * The title of the notification
		 * @type {String}
		 */
		this.title = options.title;
		/**
		 * The notification Message
		 * @type {String}
		 */
		this.message = options.message;
		/**
		 * The category of the notification
		 * @type {String}
		 */
		this.category = options.category;
		/**
		 * The User userData
		 * @type {Object}
		 */
		this.userData = userData;
		/**
		 * The Discord client
		 * @type {Discord.Client}
		 */
		this.client = client;

		this.pushNotif();
		if (this.userData.settings.dmNotification) this.sendNotif();
	}
	pushNotif() {
		this.userData.notifications.unshift({
			title: this.title,
			message: this.message,
			category: this.category,
			date: Date.now()
		});
	}
	async sendNotif() {
		const user = await this.client.resolveUser(this.userData.id);
		const embed = new MessageEmbed()
			.setAuthor(`Notification: \`${this.category}\``)
			.setTitle(this.title)
			.setDescription(this.message)
			.setColor(this.client.config.embed.color)
			.setFooter(this.client.config.embed.footer);
		await user.send(embed);
	}
}
module.exports = Notification;
