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

// Test targets for each position
for (let pos = 0; pos < 4; pos++) {
console.log(`\nPosition ${pos} (${battle.p1.active[pos].name}):`);
for (let target = -3; target <= 3; target++) {
battle.p1.clearChoice();
// Skip to the right position
for (let i = 0; i < pos; i++) {
battle.p1.choose('pass');
}
const result = battle.p1.choose(`move 1 ${target}`);
if (result) {
console.log(`  Target ${target}: OK`);
}
}
}
