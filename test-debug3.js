const Sim = require('./dist/sim');
const Dex = Sim.Dex;

const format = Dex.formats.get('[Gen 9] Raid Den Battle');
const battle = new Sim.Battle({formatid: format.id, seed: [1, 2, 3, 4]});

battle.setPlayer('p1', {
name: 'Challengers',
team: [
{species: 'Pikachu', ability: 'static', moves: ['seismictoss'], level: 50}, // No target needed
{species: 'Charizard', ability: 'blaze', moves: ['seismictoss'], level: 50},
{species: 'Blastoise', ability: 'torrent', moves: ['seismictoss'], level: 50},
{species: 'Venusaur', ability: 'overgrow', moves: ['seismictoss'], level: 50},
],
});

battle.setPlayer('p2', {
name: 'Boss',
team: [{species: 'Mewtwo', ability: 'pressure', moves: ['psychic'], level: 70}],
});

console.log('Trying without targets:');
const r1 = battle.p1.choose('move 1, move 1, move 1, move 1');
console.log('P1 Result:', r1, 'Error:', battle.p1.choice.error, 'Actions:', battle.p1.choice.actions.length);

const r2 = battle.p2.choose('move 1');
console.log('P2 Result:', r2, 'Error:', battle.p2.choice.error, 'Actions:', battle.p2.choice.actions.length);

try {
battle.commitChoices();
console.log('Choices committed!');
console.log('Turn:', battle.turn);
} catch (e) {
console.log('Error:', e.message);
}
