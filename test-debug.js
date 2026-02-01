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

console.log('P1 active length:', battle.p1.active.length);
console.log('P2 active length:', battle.p2.active.length);
console.log('P1 request state:', battle.p1.requestState);
console.log('P2 request state:', battle.p2.requestState);

// Try different input formats
console.log('\nTrying: move 1');
const result1 = battle.p1.choose('move 1');
console.log('Result:', result1);
console.log('P1 choice actions length:', battle.p1.choice.actions.length);
console.log('P1 choice error:', battle.p1.choice.error);
