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

const input = 'move 1 2, move 1 2, move 1 2, move 1 2';
const parts = input.split(',');
console.log('Input parts:', parts.length, parts);
console.log('P1 active length:', battle.p1.active.length);
console.log('');

const r1 = battle.p1.choose(input);
console.log('P1 Result:', r1);
console.log('P1 Error:', battle.p1.choice.error);
console.log('P1 Actions:', battle.p1.choice.actions.length);
console.log('');

// Check each choice index
for (let i = 0; i < battle.p1.choice.actions.length; i++) {
const action = battle.p1.choice.actions[i];
console.log(`Action ${i}:`, action.choice, action.pokemon?.name);
}
