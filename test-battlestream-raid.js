/**
 * BattleStream Test for Raid Den Battles
 * 
 * This script demonstrates how to use BattleStream to run raid den battles
 * and shows the complete output format for Cobblemon integration.
 * 
 * Run: node test-battlestream-raid.js
 */

const Sim = require('./dist/sim/index.js');

async function runRaidBattle() {
	console.log('='.repeat(80));
	console.log('RAID DEN BATTLE - BattleStream Test');
	console.log('='.repeat(80));
	console.log();

	// Create a new battle stream
	const stream = new Sim.BattleStream();

	// Store all output for analysis
	const outputLog = [];
	
	// Read from the stream
	const readPromise = (async () => {
		for await (const chunk of stream) {
			outputLog.push(chunk);
			console.log(chunk);
			console.log('-'.repeat(80));
		}
	})();

	// Battle configuration
	const spec = {
		formatid: "[Gen 9] Raid Den Battle",
	};

	// Participant team - 4 Pokemon
	const p1team = Sim.Teams.pack([
		{species: 'Pikachu', ability: 'Static', item: 'Light Ball', moves: ['thunderbolt', 'quickattack', 'irontail', 'thunderwave'], evs: {hp: 252, atk: 252, def: 4}, nature: 'Adamant', level: 50},
		{species: 'Charizard', ability: 'Blaze', item: 'Charcoal', moves: ['flamethrower', 'airslash', 'dragonpulse', 'roost'], evs: {hp: 252, spa: 252, def: 4}, nature: 'Modest', level: 50},
		{species: 'Blastoise', ability: 'Torrent', item: 'Mystic Water', moves: ['hydropump', 'icebeam', 'earthquake', 'rapidspin'], evs: {hp: 252, spa: 252, def: 4}, nature: 'Modest', level: 50},
		{species: 'Venusaur', ability: 'Overgrow', item: 'Miracle Seed', moves: ['gigadrain', 'sludgebomb', 'earthquake', 'synthesis'], evs: {hp: 252, spa: 252, def: 4}, nature: 'Modest', level: 50},
	]);

	// Boss team - 1 Pokemon with high stats
	const p2team = Sim.Teams.pack([
		{species: 'Mewtwo', ability: 'Pressure', item: 'Life Orb', moves: ['psychic', 'icebeam', 'thunderbolt', 'recover'], evs: {hp: 252, spa: 252, spe: 4}, nature: 'Timid', level: 70},
	]);

	const p1spec = {
		name: "Raid Participants",
		team: p1team,
	};

	const p2spec = {
		name: "Raid Boss Mewtwo",
		team: p2team,
	};

	// Start the battle
	stream.write(`>start ${JSON.stringify(spec)}`);
	stream.write(`>player p1 ${JSON.stringify(p1spec)}`);
	stream.write(`>player p2 ${JSON.stringify(p2spec)}`);

	// Wait a bit for initialization
	await new Promise(resolve => setTimeout(resolve, 100));

	console.log('\n' + '='.repeat(80));
	console.log('TURN 1 - All participants attack, boss makes 2 moves');
	console.log('='.repeat(80));
	
	// Turn 1: All 4 participants attack the boss, boss makes 2 moves
	stream.write(`>p1 move 1 1, move 1 1, move 1 1, move 1 1`);
	stream.write(`>p2 move 2`);

	await new Promise(resolve => setTimeout(resolve, 200));

	console.log('\n' + '='.repeat(80));
	console.log('TURN 2 - All participants attack, boss makes 3 moves');
	console.log('='.repeat(80));

	// Turn 2: All participants attack, boss makes 3 moves
	stream.write(`>p1 move 2 1, move 2 1, move 2 1, move 2 1`);
	stream.write(`>p2 move 3`);

	await new Promise(resolve => setTimeout(resolve, 200));

	console.log('\n' + '='.repeat(80));
	console.log('TURN 3 - Mixed attacks, boss makes 2 moves');
	console.log('='.repeat(80));

	// Turn 3: Mix different moves
	stream.write(`>p1 move 1 1, move 3 1, move 2 1, move 1 1`);
	stream.write(`>p2 move 2`);

	await new Promise(resolve => setTimeout(resolve, 200));

	// End the battle
	stream.destroy();

	// Wait for all output
	await readPromise;

	console.log('\n' + '='.repeat(80));
	console.log('BATTLE COMPLETE - Output Analysis');
	console.log('='.repeat(80));
	console.log();
	console.log('Total output chunks:', outputLog.length);
	console.log();
	console.log('Key message types you\'ll see:');
	console.log('  |player| - Player information');
	console.log('  |teamsize| - Team sizes');
	console.log('  |gametype| - Game type (triples for raid dens)');
	console.log('  |gen| - Generation');
	console.log('  |switch| - Pokemon switching in');
	console.log('  |turn| - Turn number');
	console.log('  |move| - Pokemon using a move');
	console.log('  |-damage| - Pokemon taking damage');
	console.log('  |-heal| - Pokemon being healed');
	console.log('  |-status| - Status condition applied');
	console.log('  |-curestatus| - Status condition cured');
	console.log('  |-boost| - Stat boost');
	console.log('  |-unboost| - Stat drop');
	console.log('  |faint| - Pokemon fainting');
	console.log('  |win| - Battle victory');
	console.log();
	console.log('For Cobblemon integration, you should:');
	console.log('  1. Parse the output line by line');
	console.log('  2. Split each line by "|" to get message parts');
	console.log('  3. First part after | is the message type');
	console.log('  4. Remaining parts are parameters');
	console.log();
	console.log('Example parsing:');
	console.log('  "|move|p1a: Pikachu|Thunderbolt|p2a: Mewtwo"');
	console.log('  -> type: "move"');
	console.log('  -> attacker: "p1a: Pikachu"');
	console.log('  -> move: "Thunderbolt"');
	console.log('  -> target: "p2a: Mewtwo"');
	console.log();
}

// Run the test
runRaidBattle().catch(err => {
	console.error('Error:', err);
	process.exit(1);
});
