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

// Make choices separately
const r1 = battle.p1.choose('move 1 1, move 1 1, move 1 1, move 1 1');
console.log('P1 choose result:', r1);
console.log('P1 active length:', battle.p1.active.length);
console.log('P1 actions length:', battle.p1.choice.actions.length);
console.log('P1 isChoiceDone:', battle.p1.isChoiceDone());

const r2 = battle.p2.choose('move 2'); // Boss makes 2 moves
console.log('\nP2 choose result:', r2);
console.log('P2 active length:', battle.p2.active.length);
console.log('P2 actions length:', battle.p2.choice.actions.length);
console.log('P2 isChoiceDone:', battle.p2.isChoiceDone());

console.log('\nallChoicesDone:', battle.allChoicesDone());
