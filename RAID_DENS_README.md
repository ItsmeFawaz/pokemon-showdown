# Raid Den Battle Implementation

## Overview
This implementation adds a Raid Den Battle format to Pokemon Showdown where multiple participants fight against a powerful boss Pokemon.

## Features Implemented

###  1. Boss HP Multiplier
- Boss Pokemon (p2) gets 5x HP multiplier
- Applied on battle start via `onBattleStart` hook

### 2. Turn Limit
- Configurable max turns (default: 10)
- Participants lose if turn limit is reached

### 3. End-of-Turn Effects
- **Participant Healing**: Fainted participant Pokemon are revived at end of turn
- **Boss Status Reset**: Boss status conditions are cleared at end of turn
- **Boss Stat Debuff Reset**: Negative stat changes on boss are reset
- **Participant Buff Reset**: Positive stat changes on participants are reset

### 4. Custom Win/Loss Conditions
- **Win**: Boss Pokemon faints
- **Loss**: Turn limit reached OR all participants faint in one turn

## File Structure

```
/data/mods/gen9raiddens/
├── scripts.ts          # Mod inheritance from gen9
├── rulesets.ts         # Raid Dens ruleset with battle logic
```

```
/config/formats.ts      # Format definition
```

## Input Format (To Be Implemented)

The system should support these input formats:

### Participant Side (p1)
```
p1 move 2 move 3, move 3, move 1
```
- Multiple moves from different "actors" on the same side
- Each move executes sequentially

### Boss Side (p2)
```
p2 move <count>
```
- Boss makes `<count>` random moves at random targets
- Moves execute sequentially

## Current Status

✅ Basic battle mechanics working
✅ Boss HP multiplier (5x)
✅ Boss side identification
✅ Format definition
✅ Ruleset structure

⏳ Pending:
- Boss multiple moves per turn
- Participant multiple-actor move input parsing
- End-of-turn healing (needs testing)
- End-of-turn stat/status resets (needs testing)
- Turn limit checking (needs testing)

## Testing

Run the test with:
```bash
node test-raid-dens.js
```

## Next Steps for Fabric Mod Integration

### Phase 1: Complete Showdown Implementation
1. Implement boss multiple moves per turn
2. Implement participant multi-actor input parsing
3. Test all end-of-turn effects
4. Test win/loss conditions

### Phase 2: Create Fabric Mod
1. Set up Fabric mod project structure
2. Bundle modified Showdown
3. Create Cobblemon integration layer
4. Implement raid trigger mechanism
5. Test with Cobblemon

## Configuration

Default values can be modified in `rulesets.ts`:
- `maxTurns`: 10 (turn limit)
- `bossMoveCount`: 1 (moves per turn for boss)
- `participantCount`: 4 (number of participants)
- HP multiplier: 5x (in onBattleStart)

## Technical Notes

- Uses Pokemon Showdown's mod system with `inherit: 'gen9'`
- Leverages format rulesets for battle logic
- Relies on event hooks: `onBattleStart`, `onResidual`, `onBeforeTurn`
- Boss identified by side ID (`p2`)
