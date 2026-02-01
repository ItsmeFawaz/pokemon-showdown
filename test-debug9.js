const Sim = require('./dist/sim');
const Dex = Sim.Dex;

const format = Dex.formats.get('[Gen 9] Raid Den Battle');
const battle = new Sim.Battle({formatid: format.id, seed: [1, 2, 3, 4]});

battle.setPlayer('p1', {
name: 'Challengers',
team: [
{species: 'Pikachu', ability: 'static', moves: ['seismictoss'], level: 50},
{species: 'Charizard', ability: 'blaze', moves: ['seismictoss'], level: 50},
{species: 'Blastoise', ability: 'torrent', moves: ['seismictoss'], level: 50},
{species: 'Venusaur', ability: 'overgrow', moves: ['seismictoss'], level: 50},
],
});

battle.setPlayer('p2', {
name: 'Boss',
team: [{species: 'Mewtwo', ability: 'pressure', moves: ['psychic'], level: 70}],
});

console.log('activePerHalf:', battle.activePerHalf);
console.log('P1 active length:', battle.p1.active.length);
console.log('P2 active length:', battle.p2.active.length);

// Try single move
console.log('\nTrying single move from position 0:');
const r1 = battle.p1.choose('move 1 2');
console.log('Result:', r1, 'Error:', battle.p1.choice.error, 'Actions:', battle.p1.choice.actions.length);
