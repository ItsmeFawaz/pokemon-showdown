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

// Clear any previous choice
battle.p1.clearChoice();

// Try comma-separated
const input = 'move 1 1, move 1 1, move 1 1, move 1 1';
const parts = input.split(',').map(s => s.trim());
console.log('Input parts:', parts);

const result = battle.p1.choose(input);
console.log('Result:', result);
console.log('Actions:', battle.p1.choice.actions.length);
console.log('Error:', battle.p1.choice.error);

// Check what happened to each action
for (let i = 0; i < battle.p1.choice.actions.length; i++) {
const action = battle.p1.choice.actions[i];
console.log(`Action ${i}:`, action.choice, action.pokemon?.name, action.moveid);
}
