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

console.log('activePerHalf:', battle.activePerHalf);

// Check Pokemon locations
for (const p of battle.p1.active) {
if (p) {
const loc = p.getLocOf(p);
console.log(`${p.name} (position ${p.position}): getLocOf(self) = ${loc}`);
}
}

for (const p of battle.p2.active) {
if (p) {
const loc = p.getLocOf(p);
console.log(`${p.name} (position ${p.position}): getLocOf(self) = ${loc}`);
// Check what Pikachu sees this as
const locFromP1 = battle.p1.active[0].getLocOf(p);
console.log(`  From Pikachu's perspective: ${locFromP1}`);
}
}
