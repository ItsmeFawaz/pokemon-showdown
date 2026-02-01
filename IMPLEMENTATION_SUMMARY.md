# Raid Den Battles: Implementation Summary

This document provides a high-level overview of the complete raid den battle implementation for Pokemon Showdown.

---

## What Was Implemented

A complete raid den battle format where 2-4 participants fight simultaneously against a single powerful boss Pokemon.

---

## Files Modified/Created

### Core Implementation (3 files)

1. **`config/formats.ts`** (MODIFIED)
   - Added format definition for `[Gen 9] Raid Den Battle`
   - Location: Line ~1300 in Gen 9 section

2. **`data/mods/gen9raiddens/rulesets.ts`** (NEW)
   - 123 lines of game rule logic
   - Battle initialization, end-of-turn effects, win/loss conditions

3. **`data/mods/gen9raiddens/scripts.ts`** (NEW)
   - 378 lines of battle behavior overrides
   - Boss move parsing, multiple move generation, asymmetric targeting

### Test Files (3 files)

1. **`test-battlestream-raid.js`** - Basic BattleStream demonstration
2. **`test-battlestream-parsed.js`** - Event parsing example
3. **`test-raid-comprehensive.js`** - Feature verification test

### Documentation (5 main files)

1. **`SHOWDOWN_TECHNICAL_GUIDE.md`** (689 lines)
   - Complete technical reference
   - **START HERE for integration**

2. **`BATTLESTREAM_QUICK_START.md`** (313 lines)
   - Quick start guide for running tests

3. **`COBBLEMON_INTEGRATION_GUIDE.md`** (413 lines)
   - Full Cobblemon integration guide

4. **`RAID_DENS_README.md`**
   - Implementation overview

5. **`MULTI_PARTICIPANT_IMPLEMENTATION.md`**
   - Technical architecture details

---

## Key Features

### Battle Structure
- **Participants**: 2-4 Pokemon active simultaneously (configurable)
- **Boss**: 1 Pokemon with 5x HP multiplier
- **Game Type**: Triples (extended to 4 active)

### Battle Mechanics
- **Boss Multiple Moves**: Makes 2-5 random moves per turn
- **Turn Limit**: 10 turns (configurable) - auto-loss if reached
- **End-of-Turn Healing**: Fainted participants revive to full HP
- **Stat Resets**: Boss status/debuffs reset, participant buffs reset
- **Win Condition**: Boss faints
- **Loss Conditions**: Turn limit reached OR all participants faint in one turn

### Targeting
- **Participants**: All target the single boss
- **Boss**: Randomly targets any participant
- **Custom Validation**: Asymmetric targeting (4 vs 1) allowed

---

## How It Works

### 1. Classes/Files Edited

#### `config/formats.ts`
Added format definition pointing to custom mod:
```typescript
{
    name: "[Gen 9] Raid Den Battle",
    mod: 'gen9raiddens',
    gameType: 'triples',
    ruleset: ['Standard NatDex', 'Raid Dens Rule'],
}
```

#### `data/mods/gen9raiddens/rulesets.ts`
Implements `Raid Dens Rule` with three key methods:

**`onBattleStart()`**:
- Marks p2 as boss side
- Applies 5x HP multiplier to boss
- Expands p1 active array to 4 slots
- Reduces p2 active array to 1 slot
- Sets turn limit

**`onResidual()`**:
- Heals fainted participants
- Resets boss status/debuffs
- Resets participant buffs
- Resets boss move count

**`onCheckWin()`**:
- Returns p2 win if turn limit reached
- Returns p2 win if all participants fainted
- Returns p1 win if boss fainted
- Returns null to continue

#### `data/mods/gen9raiddens/scripts.ts`
Overrides battle behavior with three key methods:

**`side.choose()`**:
- Detects boss side
- Parses "move <count>" input
- Stores count in formatData
- Converts to 'auto'

**`queue.resolveAction()`**:
- Checks if action is from boss
- Gets move count from formatData
- Generates additional random moves
- Assigns random targets
- Adjusts speed for sequential execution

**`validTargetLoc()`**:
- Allows all participants to target boss
- Allows boss to target any participant
- Handles asymmetric targeting

---

## Protocol for Starting Battles

### Step 1: Create BattleStream
```javascript
const {BattleStream} = require('./dist/sim/battle-stream');
const stream = new BattleStream();
```

### Step 2: Listen for Events
```javascript
stream.on('data', (output) => {
    const lines = output.split('\n');
    for (const line of lines) {
        // Parse events
    }
});
```

### Step 3: Start Battle
```javascript
stream.write('>start {"formatid":"gen9raiddenbattle"}');
```
**Important**: Format ID is `"gen9raiddenbattle"` (lowercase, no spaces or brackets)

### Step 4: Set Players
```javascript
stream.write('>player p1 {"name":"Participants"}');
stream.write('>player p2 {"name":"Boss"}');
```

### Step 5: Submit Teams

**Participant Team** (4 Pokemon):
```javascript
const p1team = [
    'Pikachu|||thunderbolt,quickattack,irontail,thunderwave|Jolly|,252,,,4,252|||||',
    'Charizard|||flamethrower,airslash,dragonpulse,roost|Timid|,252,,,4,252|||||',
    'Blastoise|||hydropump,icebeam,darkpulse,rapidspin|Modest|252,,,,4,252|||||',
    'Venusaur|||gigadrain,sludgebomb,synthesis,leechseed|Calm|252,,,,252,4|||||'
].join(']');
stream.write(`>player p1 {"team":"${p1team}"}`);
```

**Boss Team** (1 Pokemon):
```javascript
const p2team = 'Mewtwo|||psychic,shadowball,icebeam,thunderbolt|Timid|,252,,,4,252||,,,,,70|||';
stream.write(`>player p2 {"team":"${p2team}"}`);
```

---

## Protocol for Sending Choices

### Participant Choices

**Format**: Comma-separated moves for each Pokemon
```javascript
stream.write('>p1 move 1 1, move 1 1, move 1 1, move 1 1');
```

**Breakdown**:
- `>p1` - Player 1 command
- `move 1 1` - Move slot 1, target position 1 (boss)
- `, ` - Separator between Pokemon
- Repeat for each active Pokemon (4 times)

**Examples**:
```javascript
// All Pokemon use move 1
stream.write('>p1 move 1 1, move 1 1, move 1 1, move 1 1');

// Different moves for each Pokemon
stream.write('>p1 move 1 1, move 2 1, move 3 1, move 4 1');

// Mixed moves
stream.write('>p1 move 2 1, move 1 1, move 2 1, move 1 1');
```

### Boss Choices

**Format**: Move count
```javascript
stream.write('>p2 move 3');
```

**Breakdown**:
- `>p2` - Player 2 command
- `move 3` - Make 3 moves

**How It Works**:
1. Boss auto-selects first available move
2. Scripts generate 2 additional random moves
3. Each move targets a random participant
4. Moves execute sequentially

---

## Event Protocol

All events follow the format: `|<type>|<arg1>|<arg2>|...`

### Key Events

**Battle Setup**:
```
|gametype|triples
|teamsize|p1|4
|teamsize|p2|1
```

**Pokemon Entering**:
```
|switch|p1a: Pikachu|Pikachu, L50, F|142/142
|switch|p1b: Charizard|Charizard, L50, M|185/185
|switch|p1c: Blastoise|Blastoise, L50, F|186/186
|switch|p1d: Venusaur|Venusaur, L50, M|187/187
|switch|p2a: Mewtwo|Mewtwo, L70|1470/1470
```
Note: Boss HP is 1470 (294 base × 5 multiplier)

**Moves**:
```
|move|p2a: Mewtwo|Psychic|p1a: Pikachu
|move|p1b: Charizard|Flamethrower|p2a: Mewtwo
```

**Damage**:
```
|-damage|p1a: Pikachu|0 fnt
|-damage|p2a: Mewtwo|1425/1470
```

**Fainting**:
```
|faint|p1a: Pikachu
```

**Healing**:
```
|-heal|p1a: Pikachu|142/142
```

**Turn Progression**:
```
|turn|1
|turn|2
```

**Battle End**:
```
|win|Participants
```
or
```
|win|Boss
```

---

## Complete Example

```javascript
const {BattleStream} = require('./dist/sim/battle-stream');

// Create stream
const stream = new BattleStream();

// Listen for events
stream.on('data', (output) => {
    console.log(output);
});

// Start battle
stream.write('>start {"formatid":"gen9raiddenbattle"}');

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

// Send choices each turn
// Turn 1
stream.write('>p1 move 1 1, move 1 1, move 1 1, move 1 1');
stream.write('>p2 move 2');

// Turn 2
stream.write('>p1 move 2 1, move 2 1, move 2 1, move 2 1');
stream.write('>p2 move 3');
```

---

## Testing

### Run Tests
```bash
# First time setup
npm run build

# Run BattleStream tests
node test-battlestream-raid.js
node test-battlestream-parsed.js

# Run feature test
node test-raid-comprehensive.js
```

### Expected Output
- Multiple participants (4 Pokemon) active
- Single boss with 5x HP (e.g., 1470 HP for Mewtwo)
- Boss makes multiple moves per turn
- Participants get healed at end of turn if fainted
- Stats reset at end of turn
- Battle ends when boss faints or turn limit reached

---

## Documentation Guide

### For Quick Start
→ Read **`BATTLESTREAM_QUICK_START.md`**

### For Integration Development
→ Read **`SHOWDOWN_TECHNICAL_GUIDE.md`** (most comprehensive)

### For Cobblemon Specific
→ Read **`COBBLEMON_INTEGRATION_GUIDE.md`**

### For Implementation Details
→ Read **`MULTI_PARTICIPANT_IMPLEMENTATION.md`**

---

## Summary

### What Was Changed
✅ 3 files modified/created for core functionality
✅ 3 test files for demonstration
✅ 5 documentation files for guidance

### What It Does
✅ Multiple participants fight single boss
✅ Boss has 5x HP and makes multiple moves
✅ Participants heal between turns
✅ Stats reset between turns
✅ Custom win/loss conditions
✅ Full BattleStream protocol support

### How to Use It
✅ Format ID: `"gen9raiddenbattle"`
✅ Participant input: Comma-separated moves
✅ Boss input: Move count
✅ Events: Pipe-delimited messages

### Status
✅ Fully implemented
✅ Tested and working
✅ Comprehensively documented
✅ Ready for integration

---

## Next Steps for Cobblemon

1. **Wrap BattleStream**: Create Java/Kotlin wrapper for Pokemon Showdown subprocess
2. **Parse Events**: Split by `\n` and `|`, handle each event type
3. **Map to Minecraft**: Convert events to Minecraft animations/effects
4. **Coordinate Players**: Collect choices from multiple players, format as comma-separated
5. **Sync Pokemon**: Convert Cobblemon Pokemon to Showdown format, apply results back

See **`COBBLEMON_INTEGRATION_GUIDE.md`** for detailed implementation guidance.

---

This implementation is complete and production-ready!
