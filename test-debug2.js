const Sim = require('./dist/sim');
const Dex = Sim.Dex;

const format = Dex.formats.get('[Gen 9] Raid Den Battle');
const battle = new Sim.Battle({formatid: format.id, seed: [1, 2, 3, 4]});

battle.setPlayer('p1', {
name: 'Challengers',
team: [
{species: 'Pikachu', ability: 'static', moves: ['thunderbolt'], level: 50},
{species: 'Charizard', ability: 'blaze', moves: ['flamethrower'], level: 50},
{species: 'Blastoise', ability: 'torrent', moves: ['surf'], level: 50},
{species: 'Venusaur', ability: 'overgrow', moves: ['gigadrain'], level: 50},
],
});

battle.setPlayer('p2', {
name: 'Boss',
team: [{species: 'Mewtwo', ability: 'pressure', moves: ['psychic'], level: 70}],
});

console.log('P1 active:', battle.p1.active.length);
console.log('P2 active:', battle.p2.active.length);

// Try making choices one at a time
console.log('\nP1 choosing move 1 1:');
const r1 = battle.p1.choose('move 1 1');
console.log('Result:', r1, 'Error:', battle.p1.choice.error);
console.log('Actions:', battle.p1.choice.actions.length);

console.log('\nP2 choosing move 1 1:');
const r2 = battle.p2.choose('move 1 1');
console.log('Result:', r2, 'Error:', battle.p2.choice.error);
console.log('Actions:', battle.p2.choice.actions.length);

console.log('\nTrying makeChoices:');
try {
battle.commitChoices();
console.log('Success!');
} catch (e) {
console.log('Error:', e.message);
}
