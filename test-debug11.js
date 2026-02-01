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

// Try targeting position 1 (the boss)
const r1 = battle.p1.choose('move 1 1, move 1 1, move 1 1, move 1 1');
console.log('P1 Result:', r1, 'Actions:', battle.p1.choice.actions.length, 'Error:', battle.p1.choice.error);

const r2 = battle.p2.choose('move 2'); // Boss makes 2 moves
console.log('P2 Result:', r2, 'Actions:', battle.p2.choice.actions.length);

if (r1 && r2) {
battle.commitChoices();
console.log('\nChoices committed!');
console.log('P1 Pokemon HP:');
for (const p of battle.p1.active) {
if (p) console.log(`  ${p.name}: ${p.hp}/${p.maxhp}`);
}
console.log('P2 Pokemon HP:', battle.p2.active[0].hp, '/', battle.p2.active[0].maxhp);
}
