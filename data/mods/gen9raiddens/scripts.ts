import {Utils} from '../../../lib/utils';
import {toID} from '../../../sim/dex-data';

export const Scripts: ModdedBattleScriptsData = {
	inherit: 'gen9',
	gen: 9,

	side: {
		choose(input: string) {
			// Check if this is a boss side making multiple moves
			const isBoss = this.sideConditions && this.sideConditions['raidboss'];
			
			if (isBoss && input.startsWith('move ')) {
				// Check for boss move count pattern: "move <count>"
				const match = input.match(/^move\s+(\d+)$/);
				if (match) {
					const count = parseInt(match[1], 10);
					// Store the boss move count in battle data
					if (!this.battle.formatData.raidData) {
						this.battle.formatData.raidData = {
							maxTurns: 10,
							bossMoveCount: 1,
							participantCount: 4,
							startTurn: 0,
							healingDone: false,
						};
					}
					this.battle.formatData.raidData.bossMoveCount = count;
					
					// Change input to 'auto' to auto-select a move
					input = 'auto';
				}
			}

			// Need to access the inherited choose method
			// In JavaScript, after Object.assign, we lost the prototype chain
			// So we need to manually parse and choose as the base implementation does
			if (!this.requestState) {
				return this.emitChoiceError(
					this.battle.ended ? `Can't do anything: The game is over` : `Can't do anything: It's not your turn`
				);
			}

			if (this.choice.cantUndo) {
				return this.emitChoiceError(`Can't undo: A trapping/disabling effect would cause undo to leak information`);
			}

			this.clearChoice();

			const choiceStrings = (input.startsWith('team ') ? [input] : input.split(','));

			if (choiceStrings.length > this.active.length) {
				return this.emitChoiceError(
					`Can't make choices: You sent choices for ${choiceStrings.length} Pokémon, but this is a ${this.battle.gameType} game!`
				);
			}

			for (const choiceString of choiceStrings) {
				let [choiceType, data] = Utils.splitFirst(choiceString.trim(), ' ');
				data = data.trim();
				if (choiceType === 'testfight') {
					choiceType = 'move';
					data = 'testfight';
				}

				switch (choiceType) {
				case 'move':
					const original = data;
					const error = () => this.emitChoiceError(`Conflicting arguments for "move": ${original}`);
					let targetLoc: number | undefined;
					let event: 'mega' | 'megax' | 'megay' | 'zmove' | 'ultra' | 'dynamax' | 'terastallize' | '' = '';
					while (true) {
						if (/\s(?:-|\+)?[1-3]$/.test(data) && toID(data) !== 'conversion2') {
							if (targetLoc !== undefined) return error();
							targetLoc = parseInt(data.slice(-2));
							data = data.slice(0, -2).trim();
						} else if (data.endsWith(' mega')) {
							if (event) return error();
							event = 'mega';
							data = data.slice(0, -5);
						} else if (data.endsWith(' megax')) {
							if (event) return error();
							event = 'megax';
							data = data.slice(0, -6);
						} else if (data.endsWith(' megay')) {
							if (event) return error();
							event = 'megay';
							data = data.slice(0, -6);
						} else if (data.endsWith(' zmove')) {
							if (event) return error();
							event = 'zmove';
							data = data.slice(0, -6);
						} else if (data.endsWith(' ultra')) {
							if (event) return error();
							event = 'ultra';
							data = data.slice(0, -6);
						} else if (data.endsWith(' dynamax')) {
							if (event) return error();
							event = 'dynamax';
							data = data.slice(0, -8);
						} else if (data.endsWith(' gigantamax')) {
							if (event) return error();
							event = 'dynamax';
							data = data.slice(0, -11);
						} else if (data.endsWith(' max')) {
							if (event) return error();
							event = 'dynamax';
							data = data.slice(0, -4);
						} else if (data.endsWith(' terastal')) {
							if (event) return error();
							event = 'terastallize';
							data = data.slice(0, -9);
						} else if (data.endsWith(' terastallize')) {
							if (event) return error();
							event = 'terastallize';
							data = data.slice(0, -13);
						} else {
							break;
						}
					}
					if (!this.chooseMove(data, targetLoc, event)) return false;
					break;
				case 'switch':
					this.chooseSwitch(data);
					break;
				case 'shift':
					if (data) return this.emitChoiceError(`Unrecognized data after "shift": ${data}`);
					if (!this.chooseShift()) return false;
					break;
				case 'team':
					if (!this.chooseTeam(data)) return false;
					break;
				case 'pass':
				case 'skip':
					if (data) return this.emitChoiceError(`Unrecognized data after "pass": ${data}`);
					if (!this.choosePass()) return false;
					break;
				case 'auto':
				case 'default':
					this.autoChoose();
					break;
				default:
					this.emitChoiceError(`Unrecognized choice: ${choiceString}`);
					break;
				}
			}

			return !this.choice.error;
		},
	},

	queue: {
		resolveAction(action: ActionChoice, midTurn = false): Action[] {
			// We need to manually do what the parent resolveAction does
			// because we can't easily call the parent in this mod system
			
			if (!action) throw new Error(`Action not passed to resolveAction`);
			if (action.choice === 'pass') return [];
			const actions = [action];

			if (!action.side && action.pokemon) action.side = action.pokemon.side;
			if (!action.move && action.moveid) action.move = this.battle.dex.getActiveMove(action.moveid);
			if (!action.order) {
				const orders: { [choice: string]: number } = {
					team: 1,
					start: 2,
					instaswitch: 3,
					beforeTurn: 4,
					beforeTurnMove: 5,
					revivalblessing: 6,

					runSwitch: 101,
					switch: 103,
					megaEvo: 104,
					megaEvoX: 104,
					megaEvoY: 104,
					runDynamax: 105,
					terastallize: 106,
					priorityChargeMove: 107,

					shift: 200,
					// default is 200 (for moves)

					residual: 300,
				};
				if (action.choice in orders) {
					action.order = orders[action.choice];
				} else {
					action.order = 200;
					if (!['move', 'event'].includes(action.choice)) {
						throw new Error(`Unexpected orderless action ${action.choice}`);
					}
				}
			}
			
			// Continue with parent logic for move actions
			if (!midTurn) {
				if (action.choice === 'move') {
					if (!action.zmove && !action.maxMove && action.move.beforeTurnCallback) {
						actions.unshift({
							choice: 'beforeTurnMove', pokemon: action.pokemon, move: action.move, targetLoc: action.targetLoc,
						});
					}
					if (action.mega && !action.pokemon.isSkyDropped()) {
						actions.unshift({
							choice: 'megaEvo',
							pokemon: action.pokemon,
						});
					}
					if (action.maxMove && !action.pokemon.volatiles['dynamax']) {
						actions.unshift({
							choice: 'runDynamax',
							pokemon: action.pokemon,
						});
					}
					if (action.terastallize && !action.pokemon.terastallized) {
						actions.unshift({
							choice: 'terastallize',
							pokemon: action.pokemon,
						});
					}
					action.fractionalPriority = this.battle.runEvent('FractionalPriority', action.pokemon, null, action.move, 0);
				} else if (['switch', 'instaswitch'].includes(action.choice)) {
					if (typeof action.pokemon.switchFlag === 'string') {
						action.sourceEffect = this.battle.dex.moves.get(action.pokemon.switchFlag as ID) as any;
					}
					action.pokemon.switchFlag = false;
				}
			}

			const deferPriority = this.battle.gen === 7 && action.mega && action.mega !== 'done';
			if (action.move) {
				let target = null;
				action.move = this.battle.dex.getActiveMove(action.move);

				if (!action.targetLoc) {
					target = this.battle.getRandomTarget(action.pokemon, action.move);
					// TODO: what actually happens here?
					if (target) action.targetLoc = action.pokemon.getLocOf(target);
				}
				action.originalTarget = action.pokemon.getAtLoc(action.targetLoc);
			}
			if (!deferPriority) this.battle.getActionSpeed(action);
			
			// NOW add boss multiple moves
			if (action.choice === 'move' && action.pokemon && !midTurn) {
				const isBoss = action.pokemon.side.sideConditions && action.pokemon.side.sideConditions['raidboss'];
				
				if (isBoss && this.battle.formatData.raidData) {
					const bossMoveCount = this.battle.formatData.raidData.bossMoveCount || 1;
					
					// Add additional boss moves (already have first move from actions array)
					for (let i = 1; i < bossMoveCount; i++) {
						// Randomly select a move from the boss's moveset
						const moveSlots = action.pokemon.moveSlots.filter((m: any) => !m.disabled && m.pp > 0);
						if (moveSlots.length === 0) continue;
						
						const randomMoveSlot = this.battle.sample(moveSlots);
						const randomMove = this.battle.dex.getActiveMove(randomMoveSlot.id);
						
						// Get random target from participants
						const participantPokemon = this.battle.getAllActive().filter((p: Pokemon) => {
							return !p.side.sideConditions || !p.side.sideConditions['raidboss'];
						});
						if (participantPokemon.length === 0) continue;
						
						const randomTarget = this.battle.sample(participantPokemon);
						const targetLoc = action.pokemon.getLocOf(randomTarget);
						
						// Get the original action as MoveAction to copy properties
						const originalMove = actions[0] as MoveAction;
						
						// Create a new action for the additional boss move
						// Use lower speed to ensure it executes after the previous move
						const extraAction: MoveAction = {
							choice: 'move',
							order: 200,
							priority: originalMove.priority || 0,
							fractionalPriority: (originalMove.fractionalPriority || 0) - (i * 0.01),
							speed: (originalMove.speed || 1) - (i * 1000),
							pokemon: action.pokemon,
							targetLoc: targetLoc,
							originalTarget: randomTarget,
							moveid: randomMove.id,
							move: randomMove,
							mega: false,
						};
						actions.push(extraAction);
					}
					
					// Don't reset boss move count here - let it persist for the queue
					// It will be reset at turn start instead
				}
			}

			return actions as any;
		},
	},
};
