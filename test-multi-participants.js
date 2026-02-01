/**
 * Test for Multiple Participant Pokemon in Raid Den Battle format
 * Run with: node test-multi-participants.js
 */

'use strict';

const Sim = require('./dist/sim');
const Dex = Sim.Dex;

// Create a raid den battle
const format = Dex.formats.get('[Gen 9] Raid Den Battle');
console.log('Testing Multiple Participant Pokemon');
console.log('Format:', format.name);
console.log('');

const battle = new Sim.Battle({
	formatid: format.id,
	seed: [1, 2, 3, 4],
});

// Set up teams - P1 with 4 Pokemon, P2 with 1 boss
battle.setPlayer('p1', {
	name: 'Challengers',
	team: [
		{species: 'Pikachu', ability: 'static', moves: ['thunderbolt', 'quickattack'], level: 50},
		{species: 'Charizard', ability: 'blaze', moves: ['flamethrower', 'airslash'], level: 50},
		{species: 'Blastoise', ability: 'torrent', moves: ['icebeam', 'hydropump'], level: 50}, // Changed surf to icebeam
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
console.log('P1 active slots:', battle.p1.active.length);
console.log('P1 active Pokemon:', battle.p1.active.map(p => p?.name || 'null'));
console.log('');
console.log('P2 team size:', battle.p2.pokemon.length);
console.log('P2 active slots:', battle.p2.active.length);
console.log('P2 active Pokemon:', battle.p2.active.map(p => p?.name || 'null'));
console.log('');

// Check boss HP multiplier
const bossPokemon = battle.p2.pokemon[0];
console.log('Boss:', bossPokemon.name);
console.log('Boss Max HP:', bossPokemon.maxhp);
console.log('');

// Test making moves with comma-separated input for multiple participants
console.log('--- Turn 1: All participants make moves ---');
try {
	// With 4 active on p1 and 1 on p2, each p1 Pokemon targets the boss
	// Boss is at position 1 from p1's perspective
	battle.makeChoices('move 1 1, move 1 1, move 1 1, move 1 1', 'move 2');
	
	console.log('After Turn 1:');
	console.log('Participant Pokemon:');
	for (let i = 0; i < battle.p1.active.length; i++) {
		const p = battle.p1.active[i];
		if (p) {
			console.log(`  ${p.name}: ${p.hp}/${p.maxhp} HP`);
		}
	}
	console.log('Boss Pokemon:', battle.p2.pokemon[0].hp, '/', battle.p2.pokemon[0].maxhp, 'HP');
	console.log('');
	
	// Check move count in log
	const turnLog = battle.log.join('\n');
	const p1MoveCount = (turnLog.match(/\|move\|p1[a-z]:/g) || []).length;
	const p2MoveCount = (turnLog.match(/\|move\|p2a:/g) || []).length;
	console.log('P1 moves this turn:', p1MoveCount);
	console.log('P2 moves this turn:', p2MoveCount);
} catch (e) {
	console.error('Error during battle:', e.message);
}

console.log('');
console.log('Test completed!');
