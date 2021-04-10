const Command = require('../../base/Command.js'),
	Discord = require('discord.js'),
	Notification = require('../../base/Notification');

const fighting = new Set();

class Fight extends Command {
	constructor(client) {
		super(client, {
			name: 'fight',
			dirname: __dirname,
			enabled: true,
			guildOnly: true,
			aliases: [],
			memberPermissions: [],
			botPermissions: ['SEND_MESSAGES', 'EMBED_LINKS'],
			nsfw: false,
			ownerOnly: false,
			cooldown: 30000
		});
	}

	async run(message, args, data) {
		const client = this.client;

		const usage = message.translate(
			`${this.help.category.toLowerCase()}/${this.help.name}:USAGE`,
			{
				prefix: data.guild.prefix
			}
		);
		const pepegaclap = client.customEmojis['Pepega Clap'];
		const pogu = client.customEmojis['PogU'];

		let opponent = args[0];
		let amount = args[1];
		if (!opponent || !amount) {
			return message.error('economy/fight:MISSING_ARGS', {
				usage: usage
			});
		}
		opponent = await client.resolveMember(opponent, message.guild);
		if (!opponent) {
			return message.error('economy/fight:NOT_FOUND');
		}
		if (opponent.id === message.author.id) {
			return message.error('economy/fight:YOURSELF');
		}
		let opponentData = client.findOrCreateUser({ id: opponent.id });
		if (opponentData.money < amount) {
			return message.error('economy/fight:OPPONENT_NOT_ENOUGH', {
				amount: amount
			});
		}
		let percentCalc = (percent, money) => {
			return this.client.functions.percentCalc(percent, money);
		};
		let randomNum = (min, max) => {
			return this.client.functions.randomNum(min, max);
		};

		amount = this.client.functions.calcAmount(amount, data, true, message);
		if (!amount) return;
		if (fighting.has(message.author.id) || fighting.has(opponent.id)) {
			return message.error('economy/fight:IS_FIGHTING');
		}
		add();
		message.channel.send(
			message.translate('economy/fight:CONFIRM', {
				opponent: opponent,
				author: message.author.tag,
				amount: amount.commas()
			})
		);
		let runner;

		try {
			const verify = await message.channel.awaitMessages(
				res => res.author.id === opponent.id,
				{ max: 1, time: 15000, errors: ['time'] }
			);
			if (!['yes', 'y'].includes(verify.first().content.toLowerCase())) {
				remove();
				return message.reply(message.translate('economy/fight:DENIED'));
			}
			let userStats = {
				health: 100,
				shield: false
			};
			let opponentStats = {
				health: 100,
				shield: false
			};
			let userTurn = false;
			let guard = false;
			const reset = () => {
				if (userTurn) {
					userTurn = false;
				} else {
					userTurn = true;
				}
			};
			const dealDamage = damage => {
				if (userTurn) {
					opponentStats.health -= damage;
					opponentStats.shield = false;
				} else {
					userStats.health -= damage;
					userStats.shield = false;
				}
			};
			while (userStats.health > 0 && opponentStats.health > 0) {
				// eslint-disable-line no-unmodified-loop-condition
				const username = userTurn
					? message.author.username
					: opponent.user.username;
				const opponentname = userTurn
					? opponent.user.username
					: message.author.username;
				const id = userTurn ? message.author.id : opponent.user.id;
				const oppostats = userTurn ? opponentStats : userStats;
				await message.channel.send(
					message.translate('economy/fight:OPTIONS', {
						id: id,
						user: message.author.username,
						userhp: userStats.health,
						opponent: opponent.user.username,
						opponenthp: opponentStats.health
					})
				);
				try {
					const turn = await message.channel.awaitMessages(
						res => res.author.id === id,
						{ max: 1, time: 20000, errors: ['time'] }
					);
					const choice = turn.first().content.toLowerCase();
					if (choice === 'fight') {
						let damage = randomNum(1, 50);
						let newdamage;
						if (oppostats.shield) newdamage = percentCalc(65, damage);
						dealDamage(newdamage ? newdamage : damage);
						if (newdamage)
							message.channel.send(
								`${message.translate('economy/fight:DAMAGE', {
									username: username,
									damage: newdamage
								})} ${message.translate('economy/fight:DAMAGE_SHIELD', {
									damage: damage - newdamage
								})}`
							);
						else
							message.channel.send(
								message.translate('economy/fight:DAMAGE', {
									username: username,
									damage: damage
								})
							);
						reset();
					} else if (choice === 'shield') {
						if (userTurn) {
							if (userStats.shield)
								message.error('economy/fight:SHIELD_IS_ON', {
									username: username
								});
							else {
								reset();
								message.success('economy/fight:SHIELD', { username: username });
								userStats.shield = true;
							}
						} else {
							if (opponentStats.shield)
								message.error('economy/fight:SHIELD_IS_ON', {
									username: username
								});
							else {
								reset();
								message.success('economy/fight:SHIELD', { username: username });
								opponentStats.shield = true;
							}
						}
					} else if (choice === 'shoot') {
						const hit = randomNum(1, 3);
						if (hit === 2) {
							let damage = randomNum(50, 100);
							let newdamage;
							if (oppostats.shield) newdamage = percentCalc(65, damage);
							dealDamage(newdamage ? newdamage : damage);
							if (newdamage)
								message.channel.send(
									`${message.translate('economy/fight:SHOOT_SUCCESS', {
										username: username,
										opponent: opponentname,
										damage: newdamage,
										emote: pogu
									})} ${message.translate('economy/fight:DAMAGE_SHIELD', {
										damage: damage - newdamage
									})}`
								);
							else
								message.channel.send(
									message.translate('economy/fight:SHOOT_SUCCESS', {
										username: username,
										opponent: opponentname,
										damage: damage,
										emote: pogu
									})
								);
							reset();
						} else {
							message.channel.send(
								message.translate('economy/fight:SHOOT_FAIL', {
									username: username,
									opponent: opponentname,
									emote: pepegaclap
								})
							);
							reset();
						}
					} else if (choice === 'run') {
						message.channel.send(
							message.translate('economy/fight:RUN', {
								username: username,
								opponent: opponentname
							})
						);
						runner = id;
						break;
					} else {
						turn
							.first()
							.inlineReply(message.translate('economy/fight:INVALID_OPTION'));
					}
				} catch (err) {
					message.channel.send(
						message.translate('economy/fight:FIGHT_TIMED_OUT', {
							username: username,
							opponent: opponentname
						})
					);
					runner = id;
					break;
				}
			}
			remove();
			let winner =
				userStats.health > opponentStats.health
					? message.author
					: opponent.user;
			if (runner)
				winner = message.author.id === runner ? opponent.user : message.author;
			won(winner);
			return message.channel.send(
				message.translate('economy/fight:RESULT', {
					id: winner.id,
					username: message.author.username,
					userhp: userStats.health,
					opponent: opponent.user.username,
					opponenthp: opponentStats.health,
					bet: amount.commas()
				})
			);
		} catch (err) {
			remove();
			message.reply(message.translate('economy/fight:TIMED_OUT'));
			return;
		}
		function won(winner) {
			if (winner.id === opponent.id) {
				data.userData.money -= amount;
				opponentData += amount;
				winner = message.author;
			} else {
				data.userData.money += amount;
				opponentData -= amount;
				winner = opponent;
			}
		}
		function remove() {
			fighting.delete(message.author.id);
			fighting.delete(opponent.id);
		}
		function add() {
			fighting.add(message.author.id);
			fighting.add(opponent.id);
		}
	}
}
module.exports = Fight;
