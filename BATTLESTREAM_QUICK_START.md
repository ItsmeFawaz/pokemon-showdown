# BattleStream Tests - Quick Start Guide

This guide helps you quickly test and understand the raid den battle system using BattleStream.

## Quick Test

Run these commands to see raid den battles in action:

```bash
# Build the project (first time only)
npm run build

# Run basic test
node test-battlestream-raid.js

# Run parsed test with event analysis
node test-battlestream-parsed.js
```

## What You'll See

### Basic Test Output

The `test-battlestream-raid.js` script shows raw BattleStream protocol output:

```
================================================================================
RAID DEN BATTLE - BattleStream Test
================================================================================

update
|t:|1769964192
|gametype|triples
--------------------------------------------------------------------------------
update
|player|p1|Raid Participants||
--------------------------------------------------------------------------------
update
|player|p2|Raid Boss Mewtwo||
|gen|9
|tier|[Gen 9] Raid Den Battle
|teamsize|p1|4
|teamsize|p2|1
|start
|switch|p1a: Pikachu|Pikachu, L50, F|142/142
|switch|p1b: Charizard|Charizard, L50, M|185/185
|switch|p1c: Blastoise|Blastoise, L50, F|186/186
|switch|p1d: Venusaur|Venusaur, L50, M|187/187
|switch|p2a: Mewtwo|Mewtwo, L70|1470/1470
|turn|1
```

**Key Things to Notice**:
- `|gametype|triples` - Format supports multiple active
- `|teamsize|p1|4` - Four participants
- `|teamsize|p2|1` - One boss
- `p2a: Mewtwo|1470/1470` - Boss has 5x HP (normal would be 294)

### Parsed Test Output

The `test-battlestream-parsed.js` script shows structured event parsing:

```
[GAME TYPE] triples
[PLAYER] p1: Raid Participants
[PLAYER] p2: Boss
[TEAM SIZE] p1: 4 Pokemon
[TEAM SIZE] p2: 1 Pokemon
[SWITCH] p1a: Pikachu (142/142)
[SWITCH] p1b: Charizard (185/185)
[SWITCH] p1c: Blastoise (186/186)
[SWITCH] p1d: Venusaur (187/187)
[SWITCH] p2a: Mewtwo (1470/1470)

========== TURN 1 ==========
[MOVE] Mewtwo used Psychic on Pikachu
[DAMAGE] Pikachu HP: 0 fnt
[FAINT] Pikachu fainted!
[MOVE] Charizard used Flamethrower on Mewtwo
[DAMAGE] Mewtwo HP: 1425/1470
[MOVE] Venusaur used Giga Drain on Mewtwo
[DAMAGE] Mewtwo HP: 1389/1470
[MOVE] Blastoise used Hydro Pump on Mewtwo
[DAMAGE] Mewtwo HP: 1338/1470
[MOVE] Mewtwo used Thunderbolt on Charizard
[DAMAGE] Charizard HP: 0 fnt
[FAINT] Charizard fainted!
```

**Key Things to Notice**:
- Boss makes multiple moves per turn (Psychic, then Thunderbolt)
- All participants attack the boss
- Clean, readable event format
- Easy to understand battle flow

### Battle Summary

At the end of the parsed test, you'll see event statistics:

```
================================================================================
BATTLE SUMMARY
================================================================================
Total events: 60
Total turns: 3

Event counts by type:
  -damage              : 16
  switch               : 10
  move                 : 10
  turn                 : 3
  faint                : 2
  -status              : 1
```

## Understanding the Protocol

### Message Format

All battle events follow this format:

```
|<type>|<param1>|<param2>|...
```

**Examples**:

```
|move|p1a: Pikachu|Thunderbolt|p2a: Mewtwo
```
- Type: `move`
- Param 1: `p1a: Pikachu` (attacker)
- Param 2: `Thunderbolt` (move name)
- Param 3: `p2a: Mewtwo` (target)

```
|-damage|p2a: Mewtwo|1200/1470
```
- Type: `-damage`
- Param 1: `p2a: Mewtwo` (Pokemon)
- Param 2: `1200/1470` (new HP)

### Pokemon Identifiers

- `p1a` - Participant slot 1 (Pikachu)
- `p1b` - Participant slot 2 (Charizard)
- `p1c` - Participant slot 3 (Blastoise)
- `p1d` - Participant slot 4 (Venusaur)
- `p2a` - Boss slot 1 (Mewtwo)

### Important Event Types

| Event | When it occurs |
|-------|----------------|
| `|turn|N` | Start of turn N |
| `|switch|` | Pokemon enters battle |
| `|move|` | Pokemon uses a move |
| `|-damage|` | Pokemon takes damage |
| `|-heal|` | Pokemon heals |
| `|faint|` | Pokemon faints |
| `|win|` | Battle ends with winner |

## Sending Commands

To control the battle, write commands to the stream:

### Starting a Battle

```javascript
>start {"formatid":"[Gen 9] Raid Den Battle"}
>player p1 {"name":"Raid Participants","team":"<packed team>"}
>player p2 {"name":"Raid Boss","team":"<packed boss team>"}
```

### Making Moves

**Participants (all 4 Pokemon):**
```javascript
>p1 move 1 1, move 1 1, move 1 1, move 1 1
```
- Four moves separated by commas
- `move 1 1` means: use move slot 1, target position 1 (boss)

**Boss (multiple moves):**
```javascript
>p2 move 2
```
- Boss will make 2 random moves
- Each targets a random participant

## Test Script Breakdown

### test-battlestream-raid.js

This script demonstrates:
1. Creating a BattleStream
2. Setting up a battle with 4 participants vs 1 boss
3. Running 3 turns of combat
4. Boss making 2-3 moves per turn
5. Outputting raw protocol data

**Use this when**: You want to see the exact protocol output for debugging or understanding message format.

### test-battlestream-parsed.js

This script demonstrates:
1. Creating a battle event parser
2. Categorizing events by type
3. Tracking battle state
4. Generating readable output
5. Producing battle statistics

**Use this when**: You want to understand how to parse and handle events in your own code.

## For Cobblemon Integration

The test scripts show you:

1. **What to expect** - All the message types you'll receive
2. **How to parse** - Simple split by `|` delimiter
3. **Battle flow** - Order of events from start to finish
4. **Multiple moves** - How boss multiple moves appear
5. **State tracking** - What information to track

See `COBBLEMON_INTEGRATION_GUIDE.md` for complete integration details including:
- Java/Kotlin code examples
- Architecture diagrams
- Implementation steps
- Performance tips
- Error handling

## Customizing the Tests

Want to test different scenarios? Edit the test scripts:

### Change Participant Count

In `test-battlestream-raid.js`, modify the team:

```javascript
// Add or remove Pokemon from this array
const p1team = Sim.Teams.pack([
	{species: 'Pikachu', ...},
	{species: 'Charizard', ...},
	{species: 'Blastoise', ...},
	{species: 'Venusaur', ...},
	// Add more here...
]);
```

### Change Boss Move Count

Modify the move commands:

```javascript
stream.write(`>p2 move 3`);  // Boss makes 3 moves
stream.write(`>p2 move 5`);  // Boss makes 5 moves
```

### Change Pokemon

Replace species, moves, items:

```javascript
{
	species: 'Garchomp',  // Change to any Pokemon
	ability: 'Rough Skin',
	item: 'Focus Sash',
	moves: ['earthquake', 'dragonclaw', 'stoneedge', 'swordsdance'],
	evs: {hp: 252, atk: 252, def: 4},
	nature: 'Jolly',
	level: 50
}
```

## Troubleshooting

### "Cannot find module './dist/sim/index.js'"

**Solution**: Run `npm run build` first.

### Battle shows singles instead of triples

**Solution**: Make sure you're using the full format name:
```javascript
formatid: "[Gen 9] Raid Den Battle"  // Correct
formatid: "gen9raiddens"              // Wrong - defaults to singles
```

### Boss only makes 1 move

**Solution**: Check that you're sending `>p2 move N` where N > 1.

### Error: "Can't make choices"

**Solution**: Make sure the number of moves matches the number of active participants.

## Next Steps

1. **Run the tests** to see the battle system in action
2. **Read the output** to understand the protocol
3. **Review COBBLEMON_INTEGRATION_GUIDE.md** for implementation details
4. **Start coding** your Cobblemon integration

## Questions?

Check these files for more information:
- `COBBLEMON_INTEGRATION_GUIDE.md` - Complete integration guide
- `RAID_DENS_README.md` - Implementation details
- `MULTI_PARTICIPANT_IMPLEMENTATION.md` - Technical documentation
- `PROTOCOL.md` - Pokemon Showdown protocol reference

Good luck with your Cobblemon integration!
