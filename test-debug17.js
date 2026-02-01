const Sim = require('./dist/sim');
const Dex = Sim.Dex;

const format = Dex.formats.get('[Gen 9] Raid Den Battle');
const battle = new Sim.Battle({formatid: format.id, seed: [1, 2, 3, 4]});

battle.setPlayer('p1', {
name: 'Challengers',
team: [
{species: 'Pikachu', ability: 'static', moves: ['thunderbolt', 'quickattack'], level: 50},
{species: 'Charizard', ability: 'blaze', moves: ['flamethrower', 'airslash'], level: 50},
{species: 'Blastoise', ability: 'torrent', moves: ['icebeam', 'hydropump'], level: 50},
{species: 'Venusaur', ability: 'overgrow', moves: ['gigadrain', 'sludgebomb'], level: 50},
],
});

battle.setPlayer('p2', {
name: 'Boss',
team: [{species: 'Mewtwo', ability: 'pressure', moves: ['psychic', 'shadowball', 'recover', 'calmmind'], level: 70}],
});

try {
battle.makeChoices('move 1 1, move 1 1, move 1 1, move 1 1', 'move 2');
console.log('Success!');
} catch (e) {
console.log('Error:', e.message);
console.log('Stack:', e.stack);
}
