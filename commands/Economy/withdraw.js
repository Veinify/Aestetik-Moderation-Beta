const Command = require("../../base/Command.js");

class Withdraw extends Command {

	constructor (client) {
		super(client, {
			name: "withdraw",
			dirname: __dirname,
			enabled: true,
			guildOnly: true,
			aliases: [ "with" ],
			memberPermissions: [],
			botPermissions: [ "SEND_MESSAGES", "EMBED_LINKS" ],
			nsfw: false,
			ownerOnly: false,
			cooldown: 1000
		});
	}

	async run (message, args, data) {
        
		let amount = args[0];

		if(!(parseInt(data.userData.bankSold, 10) > 0)) {
			return message.error("economy/withdraw:NO_CREDIT");
		}

		if(args[0] === "all"){
			amount = parseInt(data.userData.bankSold, 10);
		} else {
			if(isNaN(amount) || parseInt(amount, 10) < 1){
				return message.error("economy/withdraw:MISSING_AMOUNT");
			}
			amount = parseInt(amount, 10);
		}
        
		if(data.userData.bankSold < amount){
			return message.error("economy/withdraw:NOT_ENOUGH", {
				money: amount.commas()
			});
		}

		data.userData.money += amount;
		data.userData.bankSold -= amount;

		message.success("economy/withdraw:SUCCESS", {
			money: amount.commas()
		});
	}

}

module.exports = Withdraw;