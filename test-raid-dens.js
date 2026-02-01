/**
 * Manual test for Raid Den Battle format
 * Run with: node test-raid-dens.js
 */

'use strict';

const Sim = require('./dist/sim');
const Dex = Sim.Dex;

// Create a raid den battle
const format = Dex.formats.get('[Gen 9] Raid Den Battle');
console.log('Format:', format.name);
console.log('Mod:', format.mod);
console.log('Game Type:', format.gameType);
console.log('');

const battle = new Sim.Battle({
	formatid: format.id,
	seed: [1, 2, 3, 4], // Fixed seed for reproducibility
});

// Set up teams
// P1: Participant side (4 players, 1 Pokemon each)
battle.setPlayer('p1', {
	name: 'Challengers',
	team: [
		{species: 'Pikachu', ability: 'static', moves: ['thunderbolt', 'quickattack'], level: 50, evs: {spa: 252, spe: 252}},
	],
});

// P2: Boss side (1 Pokemon with buffed stats)
battle.setPlayer('p2', {
	name: 'Raid Boss',
	team: [
		{species: 'Mewtwo', ability: 'pressure', moves: ['psychic', 'shadowball', 'recover', 'calmmind'], level: 70},
	],
});

console.log('Battle created!');
console.log('P1 team:', battle.p1.pokemon.map(p => p.name));
console.log('P2 team:', battle.p2.pokemon.map(p => p.name));
console.log('');

// Start the battle
battle.start();

console.log('Battle started!');
console.log('Turn:', battle.turn);
console.log('P1 active:', battle.p1.active.map(p => p?.name));
console.log('P2 active:', battle.p2.active.map(p => p?.name));
console.log('');

// Check boss HP multiplier
const bossPokemon = battle.p2.pokemon[0];
console.log('Boss Pokemon:', bossPokemon.name);
console.log('Boss Max HP:', bossPokemon.maxhp);
console.log('Boss Current HP:', bossPokemon.hp);
console.log('');

// Make some moves
console.log('--- Turn 1 ---');
// P1 makes a move
battle.makeChoices('move thunderbolt', 'move 2'); // Boss makes 2 moves
console.log('After Turn 1:');
console.log('P1 Pokemon HP:', battle.p1.pokemon[0].hp, '/', battle.p1.pokemon[0].maxhp);
console.log('P2 Pokemon HP:', battle.p2.pokemon[0].hp, '/', battle.p2.pokemon[0].maxhp);
console.log('');

// Check if battle is still going
if (!battle.ended) {
	console.log('--- Turn 2 ---');
	battle.makeChoices('move quickattack', 'move 3'); // Boss makes 3 moves
	console.log('After Turn 2:');
	console.log('P1 Pokemon HP:', battle.p1.pokemon[0].hp, '/', battle.p1.pokemon[0].maxhp);
	console.log('P2 Pokemon HP:', battle.p2.pokemon[0].hp, '/', battle.p2.pokemon[0].maxhp);
	console.log('');
}

// Check if battle ended
if (battle.ended) {
	console.log('Battle ended!');
	console.log('Winner:', battle.winner);
} else {
	console.log('Battle still ongoing...');
}

console.log('\nTest completed!');
