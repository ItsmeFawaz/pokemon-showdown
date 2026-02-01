const Sim = require('./dist/sim');
const Dex = Sim.Dex;

const format = Dex.formats.get('[Gen 9] Raid Den Battle');
const battle = new Sim.Battle({formatid: format.id, seed: [1, 2, 3, 4]});

battle.setPlayer('p1', {
name: 'Challengers',
team: [
{species: 'Pikachu', ability: 'static', moves: ['thunderbolt'], level: 50},
{species: 'Charizard', ability: 'blaze', moves: ['flamethrower'], level: 50},
{species: 'Blastoise', ability: 'torrent', moves: ['icebeam'], level: 50}, // Changed from surf
{species: 'Venusaur', ability: 'overgrow', moves: ['gigadrain'], level: 50},
],
});

battle.setPlayer('p2', {
name: 'Boss',
team: [{species: 'Mewtwo', ability: 'pressure', moves: ['psychic'], level: 70}],
});

// Try comma-separated
const result = battle.p1.choose('move 1 1, move 1 1, move 1 1, move 1 1');
console.log('Result:', result);
console.log('Actions:', battle.p1.choice.actions.length);
console.log('Error:', battle.p1.choice.error);

const r2 = battle.p2.choose('move 2');
console.log('\nP2 Result:', r2);
console.log('P2 Actions:', battle.p2.choice.actions.length);

if (result && r2) {
battle.commitChoices();
console.log('\nBattle turn completed!');
console.log('Turn:', battle.turn);
}
