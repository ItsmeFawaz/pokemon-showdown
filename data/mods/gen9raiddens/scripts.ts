export const Scripts: ModdedBattleScriptsData = {
	inherit: 'gen9',
	gen: 9,

	pokemon: {
		// Override getActionSpeed to make boss moves execute at different times
		getActionSpeed() {
			let speed = this.getStat('spe', false, false);
			// Raid boss gets a speed modifier to ensure moves execute in sequence
			if (this.side.isRaidBoss && this.side.battle.raidData?.currentBossMoveIndex) {
				speed -= this.side.battle.raidData.currentBossMoveIndex * 1000;
			}
			return speed;
		},
	},

	battle: {
		onBattleStart() {
			// Initialize raid data
			if (!this.raidData) {
				this.raidData = {
					maxTurns: 10,
					bossMoveCount: 1,
					participantCount: 4,
					startTurn: this.turn,
					currentBossMoveIndex: 0,
				};
			}

			// Mark which side is the boss
			this.add('raw', `<div class="broadcast-blue"><strong>Raid Den Battle started!</strong></div>`);
			for (const side of this.sides) {
				if (side.id === 'p2') {
					// Boss side
					side.isRaidBoss = true;
					this.add('raw', `<div class="broadcast-red"><strong>${side.name} is the Raid Boss!</strong></div>`);
					
					// Set custom HP for boss
					const bossPokemon = side.pokemon[0];
					if (bossPokemon) {
						// Override HP to a custom value (e.g., 5x normal)
						const multiplier = 5;
						bossPokemon.baseMaxhp = Math.floor(bossPokemon.baseMaxhp * multiplier);
						bossPokemon.maxhp = bossPokemon.baseMaxhp;
						bossPokemon.hp = bossPokemon.maxhp;
						this.add('-heal', bossPokemon, bossPokemon.getHealth, '[silent]');
					}
				} else {
					// Participant side
					side.isRaidBoss = false;
					this.add('raw', `<div class="broadcast-blue"><strong>${side.name} are the challengers!</strong></div>`);
				}
			}
			
			this.add('raw', `<div class="broadcast-blue">Turn Limit: ${this.raidData.maxTurns}</div>`);
		},

		checkWin(faintData) {
			// Check if max turns reached
			const turnsElapsed = this.turn - (this.raidData?.startTurn || 0);
			if (turnsElapsed >= (this.raidData?.maxTurns || 10)) {
				this.add('raw', `<div class="broadcast-red"><strong>Max turns reached! Raid failed!</strong></div>`);
				// Participants lose
				for (const side of this.sides) {
					if (!side.isRaidBoss) {
						this.win(side.foe);
						return true;
					}
				}
			}

			// Check if boss fainted
			for (const side of this.sides) {
				if (side.isRaidBoss && side.pokemonLeft === 0) {
					this.add('raw', `<div class="broadcast-blue"><strong>Raid Boss defeated! Challengers win!</strong></div>`);
					this.win(side.foe);
					return true;
				}
			}

			// Check if all participants fainted in a single turn
			if (faintData) {
				let allParticipantsFainted = true;
				for (const side of this.sides) {
					if (!side.isRaidBoss) {
						for (const pokemon of side.active) {
							if (pokemon && !pokemon.fainted) {
								allParticipantsFainted = false;
								break;
							}
						}
					}
				}
				
				if (allParticipantsFainted) {
					this.add('raw', `<div class="broadcast-red"><strong>All challengers fainted! Raid failed!</strong></div>`);
					for (const side of this.sides) {
						if (side.isRaidBoss) {
							this.win(side);
							return true;
						}
					}
				}
			}

			return false;
		},

		endTurn() {
			// Heal fainted participants
			for (const side of this.sides) {
				if (!side.isRaidBoss) {
					for (const pokemon of side.pokemon) {
						if (pokemon.fainted) {
							pokemon.hp = pokemon.maxhp;
							pokemon.fainted = false;
							pokemon.status = '';
							pokemon.statusState = {};
							this.add('-heal', pokemon, pokemon.getHealth, '[silent]');
							this.add('raw', `<div class="message"><small>${pokemon.name} was revived!</small></div>`);
						}
					}
				}
			}

			// Reset boss status conditions and stat debuffs
			for (const side of this.sides) {
				if (side.isRaidBoss) {
					for (const pokemon of side.pokemon) {
						if (pokemon && !pokemon.fainted) {
							// Clear status
							if (pokemon.status) {
								pokemon.setStatus('');
								this.add('-curestatus', pokemon, pokemon.status, '[silent]');
							}

							// Reset negative stat boosts
							const stats: BoostID[] = ['atk', 'def', 'spa', 'spd', 'spe', 'accuracy', 'evasion'];
							let hasNegativeBoosts = false;
							for (const stat of stats) {
								if (pokemon.boosts[stat] < 0) {
									pokemon.boosts[stat] = 0;
									hasNegativeBoosts = true;
								}
							}
							if (hasNegativeBoosts) {
								this.add('-clearboost', pokemon, '[silent]');
							}
						}
					}
				}
			}

			// Reset participant stat buffs
			for (const side of this.sides) {
				if (!side.isRaidBoss) {
					for (const pokemon of side.pokemon) {
						if (pokemon && !pokemon.fainted) {
							const stats: BoostID[] = ['atk', 'def', 'spa', 'spd', 'spe', 'accuracy', 'evasion'];
							let hasPositiveBoosts = false;
							for (const stat of stats) {
								if (pokemon.boosts[stat] > 0) {
									pokemon.boosts[stat] = 0;
									hasPositiveBoosts = true;
								}
							}
							if (hasPositiveBoosts) {
								this.add('-clearboost', pokemon, '[silent]');
							}
						}
					}
				}
			}

			// Call parent endTurn
			const parentBattle = Object.getPrototypeOf(Object.getPrototypeOf(this));
			return parentBattle.endTurn.call(this);
		},
	},

	side: {
		// Override choose to parse boss move count
		choose(input: string) {
			// Check if this is a boss side and parse move count
			if (this.isRaidBoss && input.startsWith('move ')) {
				// Parse "move <count>" format
				const match = input.match(/^move\s+(\d+)$/);
				if (match) {
					const count = parseInt(match[1]);
					// Store the boss move count
					if (!this.battle.raidData) {
						this.battle.raidData = {
							maxTurns: 10,
							bossMoveCount: 1,
							participantCount: 4,
							startTurn: 0,
							currentBossMoveIndex: 0,
						};
					}
					this.battle.raidData.bossMoveCount = count;
					
					// Auto-select a random move
					input = 'auto';
				}
			}

			// Call parent choose method
			const parentSide = Object.getPrototypeOf(Object.getPrototypeOf(this));
			return parentSide.choose.call(this, input);
		},
	},

	queue: {
		resolveAction(action, midTurn = false) {
			// Call parent resolveAction
			const parentQueue = Object.getPrototypeOf(Object.getPrototypeOf(this));
			const actions: any[] = parentQueue.resolveAction.call(this, action, midTurn);

			// If this is a boss move, queue additional moves
			if (action.choice === 'move' && action.pokemon?.side.isRaidBoss && !midTurn) {
				const bossMoveCount = this.battle.raidData?.bossMoveCount || 1;
				
				// Add additional boss moves
				for (let i = 1; i < bossMoveCount; i++) {
					// Randomly select a move from the boss's moveset
					const moveSlots = action.pokemon.moveSlots.filter((m: any) => !m.disabled && m.pp > 0);
					if (moveSlots.length === 0) continue;
					
					const randomMoveSlot = this.battle.sample(moveSlots);
					const randomMove = this.battle.dex.getActiveMove(randomMoveSlot.id);
					
					// Get random target from participants
					const participantPokemon = this.battle.getAllActive().filter((p: Pokemon) => !p.side.isRaidBoss);
					const randomTarget = this.battle.sample(participantPokemon);
					const targetLoc = randomTarget ? action.pokemon.getLocOf(randomTarget) : 0;
					
					// Create a new action for the additional boss move
					const extraAction = {
						choice: 'move' as 'move',
						order: 200,
						priority: action.priority,
						fractionalPriority: action.fractionalPriority - (i * 0.01),
						speed: action.speed - (i * 1000),
						pokemon: action.pokemon,
						targetLoc: targetLoc,
						originalTarget: randomTarget,
						moveid: randomMove.id,
						move: randomMove,
						mega: false as false,
					};
					actions.push(extraAction);
				}
			}

			return actions;
		},
	},
};
