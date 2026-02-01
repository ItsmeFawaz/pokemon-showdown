/**
 * Raid Den Battle Ruleset
 * Implements special rules for raid den battles where multiple participants fight a powerful boss
 */

export const Rulesets: import('../../../sim/dex-formats').FormatDataTable = {
	raiddens: {
		effectType: 'ValidatorRule',
		name: 'Raid Dens',
		desc: 'Raid Den battle rules: Boss with boosted HP, turn limit, special healing and reset mechanics',
		
		onBattleStart() {
			// Initialize raid data using formatData for type safety
			this.formatData.raidData = {
				maxTurns: 10,
				bossMoveCount: 1,
				participantCount: 4,
				startTurn: this.turn,
				healingDone: false, // Track if healing already done this turn
			};

			// Mark which side is the boss (p2)
			for (const side of this.sides) {
				if (side.id === 'p2') {
					// Use side-specific storage instead of modifying Side type
					if (!side.sideConditions) side.sideConditions = {};
					side.sideConditions['raidboss'] = true;
					
					const bossPokemon = side.pokemon[0];
					if (bossPokemon) {
						// 5x HP multiplier for boss
						const multiplier = 5;
						bossPokemon.baseMaxhp = Math.floor(bossPokemon.baseMaxhp * multiplier);
						bossPokemon.maxhp = bossPokemon.baseMaxhp;
						bossPokemon.hp = bossPokemon.maxhp;
					}
				}
			}
		},

		onResidualOrder: 100,
		onResidual(pokemon) {
			// Only run once per turn using a flag
			const battle = pokemon.battle;
			if (battle.formatData.raidData && battle.formatData.raidData.healingDone) {
				return; // Already processed this turn
			}
			
			// Mark as done for this turn
			if (battle.formatData.raidData) {
				battle.formatData.raidData.healingDone = true;
				// Reset boss move count for next turn (after moves have been executed)
				battle.formatData.raidData.bossMoveCount = 1;
			}
			
			// Heal fainted participants
			for (const side of battle.sides) {
				const isBoss = side.sideConditions && side.sideConditions['raidboss'];
				if (!isBoss) {
					for (const p of side.pokemon) {
						if (p.fainted) {
							p.hp = p.maxhp;
							p.fainted = false;
							p.status = '';
							p.statusState = {};
							side.pokemonLeft++;
						}
					}
				}
			}

			// Reset boss status and negative boosts
			const isBoss = pokemon.side.sideConditions && pokemon.side.sideConditions['raidboss'];
			if (isBoss) {
				if (pokemon.status) {
					pokemon.setStatus('');
				}
				
				const stats: BoostID[] = ['atk', 'def', 'spa', 'spd', 'spe', 'accuracy', 'evasion'];
				for (const stat of stats) {
					if (pokemon.boosts[stat] < 0) {
						pokemon.boosts[stat] = 0;
					}
				}
			}

			// Reset participant positive boosts
			if (!isBoss) {
				const stats: BoostID[] = ['atk', 'def', 'spa', 'spd', 'spe', 'accuracy', 'evasion'];
				for (const stat of stats) {
					if (pokemon.boosts[stat] > 0) {
						pokemon.boosts[stat] = 0;
					}
				}
			}
		},

		onBeforeTurn(pokemon) {
			// Only check turn limit once per turn
			const battle = pokemon.battle;
			if (!battle.formatData.raidData || battle.formatData.raidData.turnChecked) {
				return;
			}
			
			// Mark as checked for this turn
			battle.formatData.raidData.turnChecked = true;
			
			// Reset healing flag for next turn
			battle.formatData.raidData.healingDone = false;
			
			// Check turn limit
			const turnsElapsed = battle.turn - battle.formatData.raidData.startTurn;
			if (turnsElapsed >= battle.formatData.raidData.maxTurns) {
				// Participants lose on turn limit
				for (const side of battle.sides) {
					const isBoss = side.sideConditions && side.sideConditions['raidboss'];
					if (!isBoss) {
						battle.win(side.foe);
						return;
					}
				}
			}
		},
	},
};
