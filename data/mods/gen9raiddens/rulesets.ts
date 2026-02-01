/**
 * Raid Den Battle Ruleset
 * Implements special rules for raid den battles where multiple participants fight a powerful boss
 */

export const Rulesets: import('../sim/dex-formats').FormatDataTable = {
	raiddens: {
		effectType: 'ValidatorRule',
		name: 'Raid Dens',
		desc: 'Raid Den battle rules: Boss with boosted HP, turn limit, special healing and reset mechanics',
		
		onBattleStart() {
			// Initialize raid data
			this.raidData = {
				maxTurns: 10,
				bossMoveCount: 1,
				participantCount: 4,
				startTurn: this.turn,
			};

			// Mark which side is the boss (p2)
			for (const side of this.sides) {
				if (side.id === 'p2') {
					side.isRaidBoss = true;
					const bossPokemon = side.pokemon[0];
					if (bossPokemon) {
						// 5x HP multiplier for boss
						const multiplier = 5;
						bossPokemon.baseMaxhp = Math.floor(bossPokemon.baseMaxhp * multiplier);
						bossPokemon.maxhp = bossPokemon.baseMaxhp;
						bossPokemon.hp = bossPokemon.maxhp;
					}
				} else {
					side.isRaidBoss = false;
				}
			}
		},

		onResidualOrder: 100,
		onResidual(pokemon) {
			// End of turn effects
			const battle = pokemon.battle;
			
			// Heal fainted participants
			for (const side of battle.sides) {
				if (!side.isRaidBoss) {
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
			if (pokemon.side.isRaidBoss) {
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
			if (!pokemon.side.isRaidBoss) {
				const stats: BoostID[] = ['atk', 'def', 'spa', 'spd', 'spe', 'accuracy', 'evasion'];
				for (const stat of stats) {
					if (pokemon.boosts[stat] > 0) {
						pokemon.boosts[stat] = 0;
					}
				}
			}
		},

		onBeforeTurn(pokemon) {
			// Check turn limit
			const battle = pokemon.battle;
			if (battle.raidData) {
				const turnsElapsed = battle.turn - battle.raidData.startTurn;
				if (turnsElapsed >= battle.raidData.maxTurns) {
					// Participants lose on turn limit
					for (const side of battle.sides) {
						if (!side.isRaidBoss) {
							battle.win(side.foe);
							return;
						}
					}
				}
			}
		},
	},
};
