/**
 * BattleStream Test with Parsed Output for Cobblemon Integration
 * 
 * This script demonstrates how to parse BattleStream output for Cobblemon.
 * It shows structured event handling that Cobblemon can replicate.
 * 
 * Run: node test-battlestream-parsed.js
 */

const Sim = require('./dist/sim/index.js');

// Event parser for Cobblemon integration
class BattleEventParser {
	constructor() {
		this.events = [];
		this.currentTurn = 0;
		this.playerPokemon = {};
	}

	parse(chunk) {
		const lines = chunk.split('\n');
		for (const line of lines) {
			if (!line.trim() || line.startsWith('|c|') || line.startsWith('|debug|')) {
				continue; // Skip chat and debug
			}

			const parts = line.split('|').filter(p => p !== '');
			if (parts.length === 0) continue;

			const messageType = parts[0];
			const event = {
				type: messageType,
				raw: line,
				turn: this.currentTurn,
			};

			switch (messageType) {
				case 'player':
					event.playerID = parts[1];
					event.playerName = parts[2];
					this.events.push(event);
					console.log(`[PLAYER] ${parts[1]}: ${parts[2]}`);
					break;

				case 'teamsize':
					event.playerID = parts[1];
					event.teamSize = parseInt(parts[2]);
					this.events.push(event);
					console.log(`[TEAM SIZE] ${parts[1]}: ${parts[2]} Pokemon`);
					break;

				case 'gametype':
					event.gameType = parts[1];
					this.events.push(event);
					console.log(`[GAME TYPE] ${parts[1]}`);
					break;

				case 'gen':
					event.generation = parseInt(parts[1]);
					this.events.push(event);
					console.log(`[GENERATION] ${parts[1]}`);
					break;

				case 'switch':
				case 'drag':
					const pokemonInfo = parts[1].split(': ');
					event.position = pokemonInfo[0];
					event.pokemon = pokemonInfo[1];
					event.details = parts[2];
					event.hp = parts[3];
					this.playerPokemon[event.position] = event.pokemon;
					this.events.push(event);
					console.log(`[SWITCH] ${event.position}: ${event.pokemon} (${event.hp})`);
					break;

				case 'turn':
					this.currentTurn = parseInt(parts[1]);
					event.turnNumber = this.currentTurn;
					this.events.push(event);
					console.log(`\n========== TURN ${this.currentTurn} ==========`);
					break;

				case 'move':
					const attacker = parts[1].split(': ');
					event.attackerPos = attacker[0];
					event.attackerName = attacker[1];
					event.moveName = parts[2];
					if (parts[3]) {
						const target = parts[3].split(': ');
						event.targetPos = target[0];
						event.targetName = target[1];
					}
					this.events.push(event);
					console.log(`[MOVE] ${event.attackerName} used ${event.moveName}${event.targetName ? ' on ' + event.targetName : ''}`);
					break;

				case '-damage':
					const damagedPokemon = parts[1].split(': ');
					event.position = damagedPokemon[0];
					event.pokemon = damagedPokemon[1];
					event.newHP = parts[2];
					this.events.push(event);
					console.log(`[DAMAGE] ${event.pokemon} HP: ${event.newHP}`);
					break;

				case '-heal':
					const healedPokemon = parts[1].split(': ');
					event.position = healedPokemon[0];
					event.pokemon = healedPokemon[1];
					event.newHP = parts[2];
					event.source = parts[3];
					this.events.push(event);
					console.log(`[HEAL] ${event.pokemon} HP: ${event.newHP}${event.source ? ' from ' + event.source : ''}`);
					break;

				case '-status':
					const statusPokemon = parts[1].split(': ');
					event.position = statusPokemon[0];
					event.pokemon = statusPokemon[1];
					event.status = parts[2];
					this.events.push(event);
					console.log(`[STATUS] ${event.pokemon} is now ${event.status}`);
					break;

				case '-curestatus':
					const curedPokemon = parts[1].split(': ');
					event.position = curedPokemon[0];
					event.pokemon = curedPokemon[1];
					event.status = parts[2];
					this.events.push(event);
					console.log(`[CURE STATUS] ${event.pokemon} cured of ${event.status}`);
					break;

				case '-boost':
				case '-unboost':
					const boostedPokemon = parts[1].split(': ');
					event.position = boostedPokemon[0];
					event.pokemon = boostedPokemon[1];
					event.stat = parts[2];
					event.amount = parseInt(parts[3]);
					this.events.push(event);
					console.log(`[${messageType === '-boost' ? 'BOOST' : 'UNBOOST'}] ${event.pokemon} ${event.stat} ${messageType === '-boost' ? '+' : ''}${event.amount}`);
					break;

				case '-clearboost':
				case '-clearallboost':
					const clearedPokemon = parts[1].split(': ');
					event.position = clearedPokemon[0];
					event.pokemon = clearedPokemon[1];
					this.events.push(event);
					console.log(`[CLEAR BOOST] ${event.pokemon} stats reset`);
					break;

				case 'faint':
					const faintedPokemon = parts[1].split(': ');
					event.position = faintedPokemon[0];
					event.pokemon = faintedPokemon[1];
					this.events.push(event);
					console.log(`[FAINT] ${event.pokemon} fainted!`);
					break;

				case 'win':
					event.winner = parts[1];
					this.events.push(event);
					console.log(`\n[VICTORY] ${event.winner} wins!`);
					break;

				case 'tie':
					this.events.push(event);
					console.log(`\n[TIE] Battle ended in a tie!`);
					break;

				case 'request':
					// Request for player action - includes active Pokemon and available moves
					event.requestData = parts[1];
					this.events.push(event);
					break;

				default:
					// Log other message types for debugging
					if (messageType.startsWith('-')) {
						this.events.push(event);
						// console.log(`[${messageType.toUpperCase()}] ${line}`);
					}
					break;
			}
		}
	}

	getSummary() {
		const summary = {
			totalEvents: this.events.length,
			totalTurns: this.currentTurn,
			eventsByType: {},
		};

		for (const event of this.events) {
			summary.eventsByType[event.type] = (summary.eventsByType[event.type] || 0) + 1;
		}

		return summary;
	}

	getEvents() {
		return this.events;
	}
}

async function runParsedRaidBattle() {
	console.log('='.repeat(80));
	console.log('PARSED RAID DEN BATTLE - For Cobblemon Integration');
	console.log('='.repeat(80));
	console.log();

	const stream = new Sim.BattleStream();
	const parser = new BattleEventParser();

	// Read from stream and parse
	const readPromise = (async () => {
		for await (const chunk of stream) {
			parser.parse(chunk);
		}
	})();

	// Battle configuration
	const spec = {
		formatid: "[Gen 9] Raid Den Battle",
	};

	// Participant team - 4 Pokemon
	const p1team = Sim.Teams.pack([
		{species: 'Pikachu', ability: 'Static', item: '', moves: ['thunderbolt', 'quickattack'], evs: {hp: 252}, nature: 'Hardy', level: 50},
		{species: 'Charizard', ability: 'Blaze', item: '', moves: ['flamethrower', 'airslash'], evs: {hp: 252}, nature: 'Hardy', level: 50},
		{species: 'Blastoise', ability: 'Torrent', item: '', moves: ['hydropump', 'icebeam'], evs: {hp: 252}, nature: 'Hardy', level: 50},
		{species: 'Venusaur', ability: 'Overgrow', item: '', moves: ['gigadrain', 'sludgebomb'], evs: {hp: 252}, nature: 'Hardy', level: 50},
	]);

	// Boss team
	const p2team = Sim.Teams.pack([
		{species: 'Mewtwo', ability: 'Pressure', item: '', moves: ['psychic', 'icebeam', 'thunderbolt', 'shadowball'], evs: {hp: 252}, nature: 'Hardy', level: 70},
	]);

	const p1spec = {
		name: "Raid Participants",
		team: p1team,
	};

	const p2spec = {
		name: "Boss",
		team: p2team,
	};

	// Start battle
	stream.write(`>start ${JSON.stringify(spec)}`);
	stream.write(`>player p1 ${JSON.stringify(p1spec)}`);
	stream.write(`>player p2 ${JSON.stringify(p2spec)}`);

	await new Promise(resolve => setTimeout(resolve, 100));

	// Turn 1
	stream.write(`>p1 move 1 1, move 1 1, move 1 1, move 1 1`);
	stream.write(`>p2 move 2`);
	await new Promise(resolve => setTimeout(resolve, 200));

	// Turn 2
	stream.write(`>p1 move 2 1, move 2 1, move 2 1, move 2 1`);
	stream.write(`>p2 move 3`);
	await new Promise(resolve => setTimeout(resolve, 200));

	// End battle
	stream.destroy();
	await readPromise;

	// Print summary
	console.log('\n' + '='.repeat(80));
	console.log('BATTLE SUMMARY');
	console.log('='.repeat(80));
	
	const summary = parser.getSummary();
	console.log(`Total events: ${summary.totalEvents}`);
	console.log(`Total turns: ${summary.totalTurns}`);
	console.log('\nEvent counts by type:');
	
	const sortedTypes = Object.entries(summary.eventsByType).sort((a, b) => b[1] - a[1]);
	for (const [type, count] of sortedTypes) {
		console.log(`  ${type.padEnd(20)} : ${count}`);
	}

	console.log('\n' + '='.repeat(80));
	console.log('COBBLEMON INTEGRATION GUIDE');
	console.log('='.repeat(80));
	console.log(`
To integrate with Cobblemon, you should:

1. CREATE A BATTLE LISTENER
   - Subscribe to battle events from the stream
   - Parse each output chunk line by line
   - Split by "|" to get message components

2. MAP EVENTS TO MINECRAFT
   - |move| -> Show attack animation
   - |-damage| -> Update health bars
   - |-heal| -> Show healing effect
   - |faint| -> Play faint animation
   - |turn| -> Update turn counter

3. HANDLE RAID-SPECIFIC FEATURES
   - Boss makes multiple moves per turn (you'll see multiple |move| for p2)
   - Multiple participants (p1a, p1b, p1c, p1d all acting)
   - End-of-turn healing (|-heal| with [from] Raid Healing)
   - Stat resets (|-clearboost|)

4. TRACK BATTLE STATE
   - Current HP of all Pokemon
   - Status conditions
   - Active Pokemon
   - Turn number
   - Whether battle is won/lost

5. SEND PLAYER CHOICES
   - Format: ">p1 move X Y, move X Y, move X Y, move X Y"
   - Where X is move slot (1-4) and Y is target (always 1 for boss)
   - Boss: ">p2 move N" where N is number of moves to make

Example parsing code structure:
   
   function parseBattleOutput(chunk) {
     const lines = chunk.split('\\n'); // Note: In actual code, use '\n' (single backslash)
     for (const line of lines) {
       const parts = line.split('|');
       const messageType = parts[1]; // First part after |
       
       switch (messageType) {
         case 'move':
           handleMove(parts[2], parts[3], parts[4]);
           break;
         case '-damage':
           handleDamage(parts[2], parts[3]);
           break;
         // ... etc
       }
     }
   }
`);
}

// Run the test
runParsedRaidBattle().catch(err => {
	console.error('Error:', err);
	process.exit(1);
});
