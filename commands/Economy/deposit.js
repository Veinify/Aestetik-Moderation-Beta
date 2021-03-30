const Command = require("../../base/Command.js");

class Deposit extends Command {

	constructor (client) {
		super(client, {
			name: "deposit",
			dirname: __dirname,
			enabled: true,
			guildOnly: true,
			aliases: [ "bank", "banque", "dep" ],
			memberPermissions: [],
			botPermissions: [ "SEND_MESSAGES", "EMBED_LINKS" ],
			nsfw: false,
			ownerOnly: false,
			cooldown: 1000
		});
	}

	async run (message, args, data) {
        
		let amount = args[0];

		if(!(parseInt(data.userData.money, 10) > 0)) {
			return message.error("economy/deposit:NO_CREDIT");
		}

		if(args[0] === "all"){
			amount = parseInt(data.userData.money, 10);
		} else if (args[0] === "max") {
		    if (data.userData.money > (data.userData.bankSpace - data.userData.bankSold)) amount = parseInt(data.userData.bankSpace - data.userData.bankSold)
		    else amount = parseInt(data.userData.money);
		} else {
			if(isNaN(amount) || parseInt(amount, 10) < 1){
				return message.error("economy/deposit:MISSING_AMOUNT");
			}
			amount = parseInt(amount, 10);
		}
        
		if(data.userData.money < amount){
			return message.error("economy/deposit:NOT_ENOUGH_CREDIT", {
				money: amount.commas()
			});
		}
		const available = data.userData.bankSpace - data.userData.bankSold;
		if (amount > available) {
		    return message.error("economy/deposit:TOO_LARGE", {available: data.userData.bankSpace.commas()})
		}

		data.userData.money = data.userData.money - amount;
		data.userData.bankSold = data.userData.bankSold + amount;

		message.success("economy/deposit:SUCCESS", {
			money: amount.commas()
		});
	}

}

module.exports = Deposit;