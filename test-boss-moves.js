/**
 * Test for Boss Multiple Moves in Raid Den Battle format
 * Run with: node test-boss-moves.js
 */

'use strict';

const Sim = require('./dist/sim');
const Dex = Sim.Dex;

// Create a raid den battle
const format = Dex.formats.get('[Gen 9] Raid Den Battle');
console.log('Testing Boss Multiple Moves');
console.log('Format:', format.name);
console.log('');

const battle = new Sim.Battle({
	formatid: format.id,
	seed: [1, 2, 3, 4], // Fixed seed for reproducibility
});

// Set up teams
battle.setPlayer('p1', {
	name: 'Challengers',
	team: [
		{species: 'Blissey', ability: 'naturalcure', moves: ['seismictoss', 'softboiled'], level: 100, evs: {hp: 252, def: 252, spd: 252}},
	],
});

battle.setPlayer('p2', {
	name: 'Raid Boss',
	team: [
		{species: 'Mewtwo', ability: 'pressure', moves: ['psychic', 'shadowball', 'recover', 'calmmind'], level: 70},
	],
});

console.log('Battle started!');
console.log('Boss Pokemon:', battle.p2.pokemon[0].name);
console.log('Boss Max HP:', battle.p2.pokemon[0].maxhp);
console.log('');

// Test boss making multiple moves
console.log('--- Turn 1: Boss makes 2 moves ---');
battle.makeChoices('move seismictoss', 'move 2');

console.log('After Turn 1:');
console.log('P1 Pokemon HP:', battle.p1.pokemon[0].hp, '/', battle.p1.pokemon[0].maxhp);
console.log('P2 Pokemon HP:', battle.p2.pokemon[0].hp, '/', battle.p2.pokemon[0].maxhp);

// Count moves in the log
const turnLog = battle.log.join('\n');
const moveCount = (turnLog.match(/\|move\|p2a:/g) || []).length;
console.log('Boss moves this turn:', moveCount);
console.log('');

if (!battle.ended) {
	console.log('--- Turn 2: Boss makes 3 moves ---');
	battle.makeChoices('move softboiled', 'move 3');
	
	console.log('After Turn 2:');
	console.log('P1 Pokemon HP:', battle.p1.pokemon[0].hp, '/', battle.p1.pokemon[0].maxhp);
	console.log('P2 Pokemon HP:', battle.p2.pokemon[0].hp, '/', battle.p2.pokemon[0].maxhp);
	
	// Count moves in current turn
	const turn2Log = battle.log.slice(-20).join('\n');
	const moveCount2 = (turn2Log.match(/\|move\|p2a:/g) || []).length;
	console.log('Boss moves this turn:', moveCount2);
}

console.log('');
if (battle.ended) {
	console.log('Battle ended!');
	console.log('Winner:', battle.winner);
} else {
	console.log('Battle still ongoing...');
}

console.log('\nTest completed!');
