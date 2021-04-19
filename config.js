module.exports = {
	/* The token of your Discord Bot */
	token: process.env.token,
	/* For the support server */
	support: {
		id: "757419158542745630", // The ID of the support server
		logs: "797128645390761984", // And the ID of the logs channel of your server (new servers for example),
		errorLogs: '809839545524813865' //Will be sent to the channel when there's an error (on commands only)
	},
	/* Dashboard configuration */
	dashboard: {
		enabled: true, // whether the dashboard is enabled or not
		secret: process.env.secret, // Your discord client secret
		baseURL: "https://Aestetik-Moderation-Beta.mirzabhakti.repl.co", // The base URl of the dashboard
		logs: "809839545524813865", // The channel ID of logs
		port: 8080, // Dashboard port
		expressSessionPassword: Math.random().toString(36).replace(/[^a-z]+/g, ''), // Express session password (it can be what you want)
		failureURL: "https://aestetikmod.mirzabhakti.repl.co" // url on which users will be redirected if they click the cancel button (discord authentication)
	},
	mongoDB: process.env.mongodb, // The URl of the mongodb database
	prefix: "!", // The default prefix for the bot
	/* For the embeds (embeded messages) */
	embed: {
		color: "#0091fc", // The default color for the embeds
		footer: "Aestetik Moderation 2.0 BETA" // And the default footer for the embeds
	},
	/* Bot's owner informations */
	owner: {
		id: "331720578719416330", // The ID of the bot's owner
		name: "Veinify#1210" // And the name of the bot's owner
	},
	/* DBL votes webhook (optional) */
	votes: {
		port: 5000, // The port for the server
		password: "", // The webhook auth that you have defined on discordbots.org
		channel: "" // The ID of the channel that in you want the votes logs
	},
	/* The API keys that are required for certain commands */
	apiKeys: {
		// BLAGUE.XYZ: https://blague.xyz/
		blagueXYZ: process.env.blagueXYZ,
		// FORTNITE TRN: https://fortnitetracker.com/site-api
		fortniteTRN: process.env.fortniteTRN,
		// FORTNITE FNBR: https://fnbr.co/api/docs
		fortniteFNBR: process.env.fortniteFNBR,
		// DBL: https://discordbots.org/api/docs#mybots
		dbl: process.env.dbl,
		// AMETHYSTE: https://api.amethyste.moe
		amethyste: process.env.amethyste,
		// SENTRY: https://sentry.io (this is not required and not recommended - you can delete the field)
		sentryDSN: process.env.sentryDSN
	},
	/* The currency logo for economy commands */
	currencyLogo: '⌬ ',
	/* The maximum and minimum amount of money user are able to bet (slots, gamble, etc)*/
	maxBet: 100000,
	minBet: 100,
	/* The others utils links */
	others: {
		github: "https://github.com/Veinify", // Founder's github account
		donate: "https://patreon.com/Veinify" // Donate link
	},
	/* The Bot status */
	status: [
		{
			name: "!help",
			type: "PLAYING"
		}
	]
};
