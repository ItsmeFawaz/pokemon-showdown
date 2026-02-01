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

// Try individually
for (let i = 0; i < 4; i++) {
const result = battle.p1.choose(`move 1 1`);
console.log(`Choice ${i+1}: result=${result}, actions=${battle.p1.choice.actions.length}, error="${battle.p1.choice.error}"`);
if (!result) break;
}
