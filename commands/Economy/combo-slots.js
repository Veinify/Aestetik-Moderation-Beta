const Command = require('../../base/Command.js'),
	AsciiTable = require('ascii-table'),
	{ SlotMachine, SlotSymbol } = require('slot-machine');

const vertical = 4;
const horizontal = 5;
var SlotSymbols = [
	new SlotSymbol('single-bar', {
		display: '<:bar1:826285613665484830>',
		points: 0, // no need
		weight: 30 //rarity of it
	}),
	new SlotSymbol('double-bar', {
		display: '<:bar2:826285691453177866>',
		points: 0, // no need
		weight: 20 //rarity of it
	}),
	new SlotSymbol('triple-bar', {
		display: '<:bar3:826285734322503712>',
		points: 0, // no need
		weight: 10 //rarity of it
	}),
	new SlotSymbol('seven', {
		display: '<:seven:826285782318448651>',
		points: 0, // no need
		weight: 5 //rarity of it
	}),
	new SlotSymbol('bell', {
		display: '<:bell:826286055187546134>',
		points: 0, // no need
		weight: 25 //rarity of it
	}),
	new SlotSymbol('horseshoe', {
		display: '<:horseshoe:826285952199688213>',
		points: 0, // no need
		weight: 30 //rarity of it
	}),
	new SlotSymbol('cockpit', {
		display: '<:cockpit:826285993887793202>',
		points: 0, // no need
		weight: 50 //rarity of it
	}),
	new SlotSymbol('cherry', {
		display: '<:cherry:826286027752472586>',
		points: 0, // no need
		weight: 70 //rarity of it
	}),
	new SlotSymbol('lemon', {
		display: '<:lemon:826285902003306497>',
		points: 0, // no need
		weight: 70 //rarity of it
	}),
	new SlotSymbol('seven', {
		display: '',
		points: 0, // no need
		weight: 30 //rarity of it
	})
];

class ComboSlots extends Command {
	constructor(client) {
		super(client, {
			name: 'combo-slots',
			dirname: __dirname,
			enabled: true,
			guildOnly: true,
			aliases: ['cslots', 'cslot', 'comboslots', 'comboslot'],
			memberPermissions: [],
			botPermissions: ['SEND_MESSAGES', 'EMBED_LINKS'],
			nsfw: false,
			ownerOnly: false,
			cooldown: 5000
		});
	}

	async run(message, args) {
		const table = new AsciiTable();
		const machine = new SlotMachine(5, SlotSymbols);
		const results = machine.play();

		let symbols = [];

		for (let i in results.lines) {
			for (let s of results.lines[i].symbols) {
				symbols.push({ name: s.name, display: s.display });
			}
		}
		// cut array and make it into separate pages to make it easier
		symbols = symbols.slice(1, vertical * horizontal).toPages(horizontal);
		
		//add the symbols into table
		for (let s of symbols) {
		    try {
		    //ignore an element thats not array
		    if (!Array.isArray(s)) return;
		    } finally {
		        table.addRow(...s)
		    }
		}
		message.channel.send(table.toString())
	}
}
module.exports = ComboSlots;
