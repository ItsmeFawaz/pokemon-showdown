/**
 * Test for Participant Multi-Actor Moves in Raid Den Battle format
 * Tests multiple participants (Pokemon) making moves simultaneously
 * Run with: node test-participant-moves.js
 */

'use strict';

const Sim = require('./dist/sim');
const Dex = Sim.Dex;

// Create a raid den battle
const format = Dex.formats.get('[Gen 9] Raid Den Battle');
console.log('Testing Participant Multi-Actor Moves');
console.log('Format:', format.name);
console.log('');

const battle = new Sim.Battle({
	formatid: format.id,
	seed: [1, 2, 3, 4], // Fixed seed for reproducibility
});

// Set up teams
// P1: Multiple participants (4 Pokemon)
battle.setPlayer('p1', {
	name: 'Challengers',
	team: [
		{species: 'Pikachu', ability: 'static', moves: ['thunderbolt', 'quickattack'], level: 50},
		{species: 'Charizard', ability: 'blaze', moves: ['flamethrower', 'airslash'], level: 50},
		{species: 'Blastoise', ability: 'torrent', moves: ['surf', 'icebeam'], level: 50},
		{species: 'Venusaur', ability: 'overgrow', moves: ['gigadrain', 'sludgebomb'], level: 50},
	],
});

battle.setPlayer('p2', {
	name: 'Raid Boss',
	team: [
		{species: 'Mewtwo', ability: 'pressure', moves: ['psychic', 'shadowball', 'recover', 'calmmind'], level: 70},
	],
});

console.log('Battle started!');
console.log('P1 team size:', battle.p1.pokemon.length);
console.log('P1 team:', battle.p1.pokemon.map(p => p.name));
console.log('Boss:', battle.p2.pokemon[0].name, 'HP:', battle.p2.pokemon[0].maxhp);
console.log('');

// Test format: "move 2 move 3, move 3, move 1"
// This means: Pikachu uses move 2, Charizard uses move 3... wait, this doesn't make sense for singles
// The input format needs to match the game type

console.log('Note: Participant multi-actor moves require multiple active Pokemon.');
console.log('Current format is singles (1 active per side).');
console.log('To support "move 2 move 3, move 3, move 1" input,');
console.log('we need to change the format to support multiple active Pokemon.');
console.log('');

console.log('Test completed - format change needed!');
