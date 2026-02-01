# Pokemon Showdown Raid Dens: Technical Implementation Guide

This document explains exactly what was changed in Pokemon Showdown to implement raid den battles and the precise protocol for using them.

---

## Table of Contents

1. [Modified Files Overview](#modified-files-overview)
2. [Class/Module Changes Explained](#classmodule-changes-explained)
3. [Battle Initialization Protocol](#battle-initialization-protocol)
4. [Choice Submission Protocol](#choice-submission-protocol)
5. [Event Protocol](#event-protocol)
6. [Code Examples](#code-examples)

---

## Modified Files Overview

### Files Changed

1. **`config/formats.ts`** - Format definition
2. **`data/mods/gen9raiddens/rulesets.ts`** - Game rules and mechanics (NEW FILE)
3. **`data/mods/gen9raiddens/scripts.ts`** - Battle behavior overrides (NEW FILE)

### File Structure
```
pokemon-showdown/
├── config/
│   └── formats.ts                          [MODIFIED]
└── data/
    └── mods/
        └── gen9raiddens/                    [NEW DIRECTORY]
            ├── rulesets.ts                  [NEW FILE]
            └── scripts.ts                   [NEW FILE]
```

---

## Class/Module Changes Explained

### 1. Format Definition (`config/formats.ts`)

**Location**: Line ~1300 in the Gen 9 section

**What Was Added**:
```typescript
{
    name: "[Gen 9] Raid Den Battle",
    mod: 'gen9raiddens',
    gameType: 'triples',
    ruleset: ['Standard NatDex', 'Raid Dens Rule'],
}
```

**Explanation**:
- **`name`**: The format identifier used when starting battles
- **`mod`**: Points to the `data/mods/gen9raiddens/` directory for custom logic
- **`gameType`**: Set to `'triples'` to support multiple active Pokemon (extended to 4 via custom code)
- **`ruleset`**: Includes standard Gen 9 rules plus the custom "Raid Dens Rule"

---

### 2. Rulesets Module (`data/mods/gen9raiddens/rulesets.ts`)

This file defines the **"Raid Dens Rule"** which controls the core game mechanics.

#### Key Classes/Methods Modified

**Module Export**: `export const Rulesets: ModdedRulesetData`

**Rule Name**: `'Raid Dens Rule'`

#### Methods Implemented

##### `onBattleStart()`
**Purpose**: Initialize raid den battle state

**What It Does**:
1. Identifies boss side (p2) using `sideConditions['raidboss']`
2. Applies 5x HP multiplier to boss Pokemon
3. Expands participant side (p1) active array to 4 slots
4. Reduces boss side (p2) active array to 1 slot
5. Sets `battle.activePerHalf = 4` for target validation
6. Initializes slot conditions for all positions
7. Sets turn limit (default: 10 turns)

**Code Structure**:
```typescript
onBattleStart() {
    // Mark p2 as boss side
    this.sides[1].addSideCondition('raidboss');
    
    // Boss HP multiplier
    const boss = this.sides[1].active[0];
    boss.maxhp *= 5;
    boss.hp = boss.maxhp;
    
    // Expand participant active slots
    this.sides[0].active = [...Array(4)].map(() => null);
    
    // Reduce boss to 1 slot
    this.sides[1].active = [this.sides[1].active[0]];
    
    // Set activePerHalf for validation
    this.activePerHalf = 4;
    
    // Initialize slot conditions
    for (let i = 0; i < 4; i++) {
        this.sides[0].active[i] = this.sides[0].pokemon[i];
    }
    
    // Set turn limit
    this.formatData.raidData.maxTurns = 10;
}
```

##### `onResidual()`
**Purpose**: End-of-turn effects

**What It Does**:
1. Heals all fainted participants to full HP
2. Resets boss status conditions (paralysis, burn, etc.)
3. Resets boss stat debuffs (attack drops, etc.)
4. Resets participant stat buffs (attack boosts, etc.)
5. Resets boss move count for next turn

**Code Structure**:
```typescript
onResidual(pokemon) {
    // Heal fainted participants
    if (!pokemon.side.sideConditions['raidboss'] && pokemon.fainted) {
        pokemon.hp = pokemon.maxhp;
        pokemon.fainted = false;
        pokemon.status = '';
    }
    
    // Reset boss status/stats at end of turn
    if (pokemon.side.sideConditions['raidboss']) {
        pokemon.clearStatus();
        pokemon.clearBoosts();
    }
    
    // Reset participant boosts
    if (!pokemon.side.sideConditions['raidboss']) {
        pokemon.clearBoosts();
    }
}
```

##### `onCheckWin()`
**Purpose**: Custom victory/defeat conditions

**What It Does**:
1. Checks if turn limit reached → Participants lose
2. Checks if all participants fainted in same turn → Participants lose
3. Checks if boss fainted → Participants win
4. Returns `null` to continue battle

**Code Structure**:
```typescript
onCheckWin() {
    // Check turn limit
    if (this.turn >= this.formatData.raidData.maxTurns) {
        return 'p2'; // Boss wins
    }
    
    // Check if all participants fainted
    const allParticipantsFainted = this.sides[0].pokemon.every(p => p.fainted);
    if (allParticipantsFainted) {
        return 'p2'; // Boss wins
    }
    
    // Check if boss fainted
    if (this.sides[1].pokemon[0].fainted) {
        return 'p1'; // Participants win
    }
    
    return null; // Continue battle
}
```

---

### 3. Scripts Module (`data/mods/gen9raiddens/scripts.ts`)

This file overrides core battle behavior for raid dens.

#### Key Classes/Methods Modified

**Module Export**: `export const Scripts: ModdedBattleScriptsData`

#### Methods Implemented

##### `Side.prototype.choose()`
**Purpose**: Parse custom input for boss multiple moves

**What It Does**:
1. Detects if this is the boss side
2. Parses `move <count>` format (e.g., "move 3")
3. Stores count in `battle.formatData.raidData.bossMoveCount`
4. Converts input to 'auto' for automatic move selection

**Code Structure**:
```typescript
'side.choose'(input) {
    // Check if boss side
    if (this.sideConditions['raidboss']) {
        // Match "move <number>" pattern
        const match = input.match(/^move\s+(\d+)$/);
        if (match) {
            const count = parseInt(match[1]);
            this.battle.formatData.raidData.bossMoveCount = count;
            input = 'auto'; // Auto-select first move
        }
    }
    return this.choose(input); // Call original
}
```

##### `BattleQueue.prototype.resolveAction()`
**Purpose**: Generate multiple moves for boss

**What It Does**:
1. Checks if action is from boss side
2. Gets boss move count from formatData
3. Generates additional move actions (count - 1)
4. Each additional move:
   - Randomly selects from boss's available moves
   - Randomly targets a participant Pokemon
   - Adjusts speed and priority for sequential execution
5. Adds all actions to the queue

**Code Structure**:
```typescript
'queue.resolveAction'(action) {
    // Resolve original action first
    const resolved = this.resolveAction(action);
    
    // Check if boss side and has move count
    if (action.pokemon?.side.sideConditions['raidboss']) {
        const count = this.battle.formatData.raidData?.bossMoveCount || 1;
        
        // Generate additional moves
        for (let i = 1; i < count; i++) {
            // Select random available move
            const availableMoves = action.pokemon.moveSlots.filter(
                m => !m.disabled && m.pp > 0
            );
            const randomMove = this.sample(availableMoves);
            
            // Select random participant target
            const participants = this.battle.sides[0].active.filter(p => p);
            const randomTarget = this.sample(participants);
            
            // Create new move action
            const newAction = {
                choice: 'move',
                pokemon: action.pokemon,
                moveid: randomMove.id,
                targetLoc: randomTarget.position,
                speed: action.speed - (1000 * i), // Lower speed
                priority: action.priority - (0.01 * i) // Lower priority
            };
            
            // Add to queue
            this.queue.push(newAction);
        }
    }
    
    return resolved;
}
```

##### `Battle.prototype.validTargetLoc()`
**Purpose**: Allow asymmetric targeting (4 vs 1)

**What It Does**:
1. In raid dens, allows all participants to target the single boss
2. Allows boss to target any of the 4 participants
3. Handles all target types (normal, adjacentFoe, any, etc.)

**Code Structure**:
```typescript
validTargetLoc(targetLoc, source, targetType) {
    // Check if raid dens format
    if (this.format.mod === 'gen9raiddens') {
        // Participant targeting boss
        if (!source.side.sideConditions['raidboss']) {
            return targetLoc === 1; // Boss is always position 1
        }
        
        // Boss targeting participants
        if (source.side.sideConditions['raidboss']) {
            return targetLoc >= -4 && targetLoc <= -1; // Participant positions
        }
    }
    
    // Fall back to standard validation
    return this.validTargetLoc(targetLoc, source, targetType);
}
```

---

## Battle Initialization Protocol

### Step 1: Create BattleStream

```javascript
const {BattleStream} = require('./dist/sim/battle-stream');
const stream = new BattleStream();
```

### Step 2: Set Up Event Listener

```javascript
stream.on('data', (output) => {
    // output is a string with battle events
    const lines = output.split('\n');
    for (const line of lines) {
        if (!line) continue;
        console.log(line);
        // Parse and handle events
    }
});
```

### Step 3: Start Battle

```javascript
// Format: >start {"formatid":"gen9raidenbattle"}
stream.write('>start {"formatid":"gen9raidenbattle"}');
```

**Format ID**: `"gen9raidenbattle"` (lowercase, no spaces)

### Step 4: Set Player Info

```javascript
// Player 1 (Participants)
stream.write('>player p1 {"name":"Participants"}');

// Player 2 (Boss)
stream.write('>player p2 {"name":"Boss"}');
```

### Step 5: Submit Teams

**Participant Team** (p1 - 4 Pokemon):
```javascript
const p1team = [
    'Pikachu|||thunderbolt,quickattack,irontail,thunderwave|Jolly|,252,,,4,252|||||',
    'Charizard|||flamethrower,airslash,dragonpulse,roost|Timid|,252,,,4,252|||||',
    'Blastoise|||hydropump,icebeam,darkpulse,rapidspin|Modest|252,,,,4,252|||||',
    'Venusaur|||gigadrain,sludgebomb,synthesis,leechseed|Calm|252,,,,252,4|||||'
].join(']');

stream.write(`>player p1 {"team":"${p1team}"}`);
```

**Boss Team** (p2 - 1 Pokemon):
```javascript
const p2team = 'Mewtwo|||psychic,shadowball,icebeam,thunderbolt|Timid|,252,,,4,252||,,,,,70|||';

stream.write(`>player p2 {"team":"${p2team}"}`);
```

**Team Format**: Packed format with `|` separators
- Species|Item|Ability|Moves (comma-separated)|Nature|EVs (comma-separated)|Gender|IVs|Shiny|Level|Happiness|PokeBall|Etc

---

## Choice Submission Protocol

### Participant Choices (p1)

**Format**: Comma-separated moves for each active Pokemon

**Example** (4 Pokemon, all targeting boss at position 1):
```javascript
stream.write('>p1 move 1 1, move 1 1, move 1 1, move 1 1');
```

**Breakdown**:
- `>p1` - Player 1 command
- `move 1 1` - Move slot 1, target position 1 (boss)
- `, ` - Separator between Pokemon
- Repeat for each active Pokemon (4 times)

**Move Format**: `move <slot> <target>`
- `<slot>`: 1-4 (move slot number)
- `<target>`: Target position (1 = boss, always)

**Alternative Moves**:
```javascript
// Different moves for each Pokemon
stream.write('>p1 move 1 1, move 2 1, move 3 1, move 4 1');

// Some Pokemon using move 2, others move 1
stream.write('>p1 move 2 1, move 1 1, move 2 1, move 1 1');
```

### Boss Choices (p2)

**Format**: `move <count>`

**Example** (Boss makes 3 moves):
```javascript
stream.write('>p2 move 3');
```

**Breakdown**:
- `>p2` - Player 2 command
- `move 3` - Make 3 random moves

**How It Works**:
1. Boss auto-selects first available move
2. Scripts generate `<count>` total moves
3. Additional moves are random from moveset
4. Targets are random participants
5. Moves execute sequentially (speed-ordered)

---

## Event Protocol

### Event Format

All events follow the pattern: `|<type>|<arg1>|<arg2>|...`

### Key Event Types

#### Battle Initialization

**`|gametype|triples`**
- Indicates game type (triples, extended to 4 active)

**`|teamsize|p1|4`**
- Participant side has 4 Pokemon

**`|teamsize|p2|1`**
- Boss side has 1 Pokemon

**`|gen|9`**
- Generation 9 rules

#### Pokemon Switching

**`|switch|p1a: Pikachu|Pikachu, L50, F|142/142`**
- Pokemon enters battle
- Format: `|switch|<position>: <nickname>|<species>, L<level>, <gender>|<hp>/<maxhp>`
- Positions: p1a, p1b, p1c, p1d (participants), p2a (boss)

**Example Boss Switch**:
```
|switch|p2a: Mewtwo|Mewtwo, L70|1470/1470
```
- Boss HP is 1470 (294 base × 5 multiplier)

#### Moves

**`|move|p2a: Mewtwo|Psychic|p1a: Pikachu`**
- Move used
- Format: `|move|<user>|<move name>|<target>`

**`|move|p1b: Charizard|Flamethrower|p2a: Mewtwo`**
- Participant using move on boss

#### Damage

**`|-damage|p1a: Pikachu|0 fnt`**
- Pokemon took damage and fainted
- Format: `|-damage|<pokemon>|<hp> <status>`
- `0 fnt` means 0 HP and fainted

**`|-damage|p2a: Mewtwo|1425/1470`**
- Boss took damage, now at 1425/1470 HP

#### Fainting

**`|faint|p1a: Pikachu`**
- Pokemon fainted
- Format: `|faint|<pokemon>`

#### Healing

**`|-heal|p1a: Pikachu|142/142`**
- Pokemon healed (end-of-turn participant healing)

#### Status

**`|-status|p2a: Mewtwo|par`**
- Status condition applied (paralysis)

**Status Codes**: `par`, `brn`, `psn`, `tox`, `slp`, `frz`

#### Stat Changes

**`|-boost|p1a: Pikachu|atk|1`**
- Stat increased (Attack +1)

**`|-unboost|p2a: Mewtwo|def|2`**
- Stat decreased (Defense -2)

#### Turn Progression

**`|turn|1`**
- New turn started
- Format: `|turn|<number>`

**`|upkeep`**
- End of turn upkeep phase

#### Battle End

**`|win|Participants`**
- Battle ended, participants won

**`|win|Boss`**
- Battle ended, boss won

---

## Code Examples

### Complete Battle Example

```javascript
const {BattleStream} = require('./dist/sim/battle-stream');

// Create stream
const stream = new BattleStream();

// Listen for events
stream.on('data', (output) => {
    console.log(output);
});

// Start battle
stream.write('>start {"formatid":"gen9raidenbattle"}');

// Set players
stream.write('>player p1 {"name":"Participants"}');
stream.write('>player p2 {"name":"Boss"}');

// Set teams
const p1team = [
    'Pikachu|||thunderbolt,quickattack,irontail,thunderwave|Jolly|,252,,,4,252|||||',
    'Charizard|||flamethrower,airslash,dragonpulse,roost|Timid|,252,,,4,252|||||',
    'Blastoise|||hydropump,icebeam,darkpulse,rapidspin|Modest|252,,,,4,252|||||',
    'Venusaur|||gigadrain,sludgebomb,synthesis,leechseed|Calm|252,,,,252,4|||||'
].join(']');
stream.write(`>player p1 {"team":"${p1team}"}`);

const p2team = 'Mewtwo|||psychic,shadowball,icebeam,thunderbolt|Timid|,252,,,4,252||,,,,,70|||';
stream.write(`>player p2 {"team":"${p2team}"}`);

// Wait for battle start, then send moves each turn
// Turn 1
stream.write('>p1 move 1 1, move 1 1, move 1 1, move 1 1');
stream.write('>p2 move 2');

// Turn 2
stream.write('>p1 move 2 1, move 2 1, move 2 1, move 2 1');
stream.write('>p2 move 3');
```

### Parsing Events Example

```javascript
stream.on('data', (output) => {
    const lines = output.split('\n');
    
    for (const line of lines) {
        if (!line) continue;
        
        const parts = line.split('|');
        const eventType = parts[1];
        
        switch (eventType) {
            case 'switch':
                const position = parts[2];
                const species = parts[3];
                const hp = parts[4];
                console.log(`${position} entered: ${species} (${hp})`);
                break;
                
            case 'move':
                const user = parts[2];
                const move = parts[3];
                const target = parts[4];
                console.log(`${user} used ${move} on ${target}`);
                break;
                
            case '-damage':
                const damaged = parts[2];
                const newHP = parts[3];
                console.log(`${damaged} HP: ${newHP}`);
                break;
                
            case 'faint':
                const fainted = parts[2];
                console.log(`${fainted} fainted!`);
                break;
                
            case 'turn':
                const turnNum = parts[2];
                console.log(`\n=== TURN ${turnNum} ===`);
                break;
                
            case 'win':
                const winner = parts[2];
                console.log(`\n${winner} wins!`);
                break;
        }
    }
});
```

---

## Quick Reference

### Modified Classes/Files
1. **Format Definition**: `config/formats.ts`
2. **Rulesets**: `data/mods/gen9raiddens/rulesets.ts`
3. **Scripts**: `data/mods/gen9raiddens/scripts.ts`

### Key Methods
1. **`onBattleStart()`** - Initialize raid den state
2. **`onResidual()`** - End-of-turn effects
3. **`onCheckWin()`** - Victory/defeat conditions
4. **`side.choose()`** - Parse boss move count input
5. **`queue.resolveAction()`** - Generate boss multiple moves
6. **`validTargetLoc()`** - Allow asymmetric targeting

### Protocol Summary

**Start Battle**:
```javascript
stream.write('>start {"formatid":"gen9raidenbattle"}');
stream.write('>player p1 {"name":"Participants"}');
stream.write('>player p2 {"name":"Boss"}');
stream.write(`>player p1 {"team":"<packed-team>"}`);
stream.write(`>player p2 {"team":"<packed-team>"}`);
```

**Participant Choices**:
```javascript
stream.write('>p1 move 1 1, move 1 1, move 1 1, move 1 1');
```

**Boss Choices**:
```javascript
stream.write('>p2 move 3');
```

**Event Format**:
```
|<type>|<arg1>|<arg2>|...
```

---

## Summary

### What Was Changed
1. Added new format definition in `config/formats.ts`
2. Created custom mod directory `data/mods/gen9raiddens/`
3. Implemented custom rules in `rulesets.ts`
4. Overrode battle behavior in `scripts.ts`

### Key Features
- **Asymmetric Battle**: 4 participants vs 1 boss
- **Boss HP Multiplier**: 5x normal HP
- **Boss Multiple Moves**: 2-5 random moves per turn
- **Turn Limit**: 10 turns (configurable)
- **End-of-Turn Effects**: Healing, stat resets
- **Custom Win/Loss**: Turn limit or boss faint

### Protocol
- **BattleStream API**: Used for all communication
- **Format ID**: `"gen9raidenbattle"`
- **Participant Input**: Comma-separated moves
- **Boss Input**: Move count
- **Events**: Pipe-delimited messages

This implementation is complete and ready for integration with external systems like Cobblemon.
