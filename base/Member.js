const mongoose = require("mongoose");

module.exports = mongoose.model("Member", new mongoose.Schema({

	/* REQUIRED */
	id: { type: String }, // Discord ID of the user
	guildID: { type: String }, // ID of the guild to which the member is connected


	/* STATS */
	registeredAt: { type: Number, default: Date.now() }, // Registered date of the member


	/* OTHER INFORMATIONS */
	sanctions: { type: Array, default: [] }, // Array of the member sanctions (mute, ban, kick, etc...)
	mute: { type: Object, default: { // The member mute infos
		muted: false,
		case: null,
		endDate: null
	}},
    
}));