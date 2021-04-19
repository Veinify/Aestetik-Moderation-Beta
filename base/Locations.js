const allemojis = require('../emojis.json');

module.exports = {
	list: {
		0: 'HOME',
		1: 'STORE',
		2: 'CASINO',
		3: 'STREET',
		get HOME() {
			return 0;
		},
		get STORE() {
			return 1;
		},
		get CASINO() {
			return 2;
		},
		get STREET() {
			return 3;
		},
		ANY: 'ANY'
	},
	
	// How far is the places from the house in meters
	metersFromHouse: {
	    0: 0,
	    1: 468,
	    2: 1047,
	    3: 153,
	    get HOME() {
			return this[0];
		},
		get STORE() {
			return this[1];
		},
		get CASINO() {
			return this[2];
		},
		get STREET() {
			return this[3];
		},
	},
	
	// Emojis for all of the locations
	emojis: {
	    0: '🏠',
	    1: allemojis.store,
	    2: '🎰',
	    3: '🛣',
	    get HOME() {
			return this[0];
		},
		get STORE() {
			return this[1];
		},
		get CASINO() {
			return this[2];
		},
		get STREET() {
			return this[3];
		}
	},
	
	get array() {
	    return this.list.intoArray().filter(l => isNaN(Object.keys(l)[0]) && !this.isAny(Object.keys(l)[0]))
	},
	
	commonPeople: {
		0: [
			'Dad',
			'Mom',
			'Brother',
			'Sister',
			'Daughter',
			'Cat',
			'Dog',
			'Fish',
			'Ant'
		],
		1: [
			'Store Owner',
			'Manager',
			'Cashier',
			'Security',
			'Janitor',
			'Random People',
			'Homeless Man',
			'Cat',
			'Dog'
		],
		2: ['Owner', 'Manager', 'Security', 'Janitor', 'Random People'],
		3: [
			'Jake Paul',
			'Donald Trump',
			'Bill Gates',
			'Elon Musk',
			'Ariana Grande',
			'Thanos',
			'Sans',
			'Michael Jordan',
			'Mike Wazowski',
			'Gordon Ramsay',
			'Obama',
			'Robbie Rotten',
			'Nicki Minaj',
			'Cardi B',
			'DaBaby',
			'Taylor Swift',
			'Michael Rosen',
			'Amogus',
			'imsofate',
			'LeBron James',
			'Will Smith',
			'Jimmy Neutron',
			'Random Person'
		],
		get HOME() {
			return this[0];
		},
		get STORE() {
			return this[1];
		},
		get CASINO() {
			return this[2];
		},
		get STREET() {
			return this[3];
		}
	},
	
	findLocation(location, toNumber = false) {
		let val;
		if (!isNaN(Number(location)) || /^\d+$/.test(location)) {
			val = this.list[Number(location)];
		} else if (
			!val &&
			typeof location === 'string' &&
			!/^\d+$/.test(location)
		) {
			val = location.toUpperCase();
		}
		if (this.list[val] === undefined) return null; //Compare to undefined instead because 0 is basically null
		return toNumber ? this.list[val] : val;
	},
	getDestinationLength(current, destination) {
	    current = this.findLocation(current, true);
	    destination = this.findLocation(destination, true);
	    if (current == null || destination == null) return 0;
	    return (this.metersFromHouse[current] + this.metersFromHouse[destination]);
	},
	isAny(location) {
		return (location + '').toUpperCase() === this.list.ANY;
	},
	isSameLocation(current, destination) {
	    if (current == undefined || destination == undefined) return false;
	    return (this.isAny(destination) || this.findLocation(current) === this.findLocation(destination));
	}
};
