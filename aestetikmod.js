require("./helpers/extenders");
require('./helpers/MessageReply');

const Sentry = require("@sentry/node"),
	util = require("util"),
	fs = require("fs"),
	readdir = util.promisify(fs.readdir),
	mongoose = require("mongoose"),
	chalk = require("chalk")
	Discord = require('discord.js'),
	config = require("./config"),
	ms = require('ms'),
	progress = require('cli-progress');

if(config.apiKeys.sentryDSN){
	try {
		Sentry.init({ dsn: config.apiKeys.sentryDSN });
	} catch (e) {
		console.log(e);
		console.log(chalk.yellow("Looks like your Sentry DSN key is invalid. If you do not intend to use Sentry, please remove the key from the configuration file."));
	}
}

// Load AestetikModeration class
const AestetikModeration = require("./base/AestetikModeration"),
	intents = new Discord.Intents();

intents.add( "GUILD_PRESENCES", "GUILD_MEMBERS", "GUILDS", "GUILD_VOICE_STATES", "GUILD_MESSAGES", "GUILD_MESSAGE_REACTIONS");
	
const client = new AestetikModeration({
    ws: { intents: intents }, restTimeOffset: 0
});

const loadingBar = new progress.MultiBar({
	format: '{bar} | {name} | Current: {current} | {value}/{total} [{percentage}%] | ETA: {eta_formatted}',
	barsize:10,
	hideCursor: true,
	stopOnComplete: true,
	fps: 100,
	forceRedraw: false
}, progress.Presets.shades_classic);

function createLoadingBar(length, name, current) {
    return loadingBar.create(length, 0, {name: name, current: current})
}

const init = async () => {
    client.logger.log('Booting up Aestetik Moderation...', 'Load')
    let errors = []
    let now = Date.now();
    client.logger.log('Loading commands and events...', 'Load')
    let evtCurrent = 0;
	// Search for all commands
	let cmdCurrent = 0;
	let commandsLength = await getCommandsLength();
	let eventsLength = await getEventsLength();
		//Add loading bar
	const commandBar = createLoadingBar(commandsLength, chalk.cyan.bold('Commands'), '...')
	const eventBar = createLoadingBar(eventsLength, chalk.greenBright.bold('Events'), '...')
	const directories = await readdir("./commands/");
	for (const dir of directories) {
		let commandsdir = await readdir("./commands/"+dir+"/");
		commandsdir = commandsdir.filter((cmd) => cmd.split(".").pop() === "js")
		for (const cmd of commandsdir) {
		    cmdCurrent++
	    await commandBar.update(cmdCurrent, {current: cmd.toString()})
	    const response = await client.loadCommand(`./commands/${dir}`, cmd);
			if(response){
				errors.push(response)
			}
			}
	};

	// Then we load events, which will include our message and ready event.
	const evtFiles = await readdir("./events/")
	evtFiles.forEach(async (file) => {
		evtCurrent++;
		const eventName = file.split(".")[0];
		await eventBar.update(evtCurrent, {current: eventName.toString()})
		const event = new (require(`./events/${file}`))(client);
		client.on(eventName, (...args) => event.run(...args));
		delete require.cache[require.resolve(`./events/${file}`)];
	});
	//discord-buttons init
	require('discord-buttons')(client);
	//Due to the progress bar being buggy. Had to delay the code for the bar to be done
	await client.wait(2000);
	for (const err of errors) {
	    client.logger.log(err, "error");
	}
	client.logger.log(`Loaded a total of ${cmdCurrent} commands in ${directories.length} categories.`, "Load");
	client.logger.log(`Loaded a total of ${evtFiles.length} events.`, "Load");
    
	client.login(client.config.token); // Log in to the discord api
	
	// connect to mongoose database
	mongoose.connect(client.config.mongoDB, { useNewUrlParser: true, useUnifiedTopology: true }).then(() => {
		client.logger.log("Connected to the Mongodb database.", "log");
	}).catch((err) => {
		client.logger.log("Unable to connect to the Mongodb database. Error:"+err, "error");
	});

	const languages = require("./helpers/languages");
	client.translations = await languages();
    
	const autoUpdateDocs = require("./helpers/autoUpdateDocs.js");
	autoUpdateDocs.update(client);
	
	client.logger.log('Aestetik Moderation loaded in {time}!'.replace('{time}', ms(Date.now() - now)), 'Load')

};

init();

// if there are errors, log them
client.on("disconnect", () => client.logger.log("Bot is disconnecting...", "warn"))
	.on("reconnecting", () => client.logger.log("Bot reconnecting...", "log"))
	.on("error", (e) => client.logger.log(e, "error"))
	.on("warn", (info) => client.logger.log(info, "warn"));
// if there is an unhandledRejection, log them
process.on("unhandledRejection", (err) => {
	console.error(err);
});

async function getCommandsLength() {
    const commands = []
    const directories = await readdir("./commands/");
	for (const dir of directories) {
		let commandsdir = await readdir("./commands/"+dir+"/");
		commandsdir = commandsdir.filter((cmd) => cmd.split(".").pop() === "js")
		for (const cmd of commandsdir) {
		    commands.push(cmd)
		}
	};
	return commands.length;
}
async function getEventsLength() {
    const l = (await readdir("./events/")).length;
    return l
}