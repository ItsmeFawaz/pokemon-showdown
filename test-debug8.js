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

// Build choice string character by character
let fullChoice = '';
for (let i = 0; i < 4; i++) {
if (i > 0) fullChoice += ', ';
fullChoice += 'move 1 2';
}

console.log('Full choice string:', fullChoice);
console.log('Length:', fullChoice.length);
console.log('Parts:', fullChoice.split(',').length);

const r1 = battle.p1.choose(fullChoice);
console.log('\nResult:', r1);
console.log('Error:', battle.p1.choice.error);
console.log('Actions:', battle.p1.choice.actions.length);

// Now try with boss move count syntax
battle.p1.clearChoice();
const r2 = battle.p2.choose('move 2'); // Boss makes 2 moves
console.log('\nBoss result:', r2);
console.log('Boss actions:', battle.p2.choice.actions.length);
