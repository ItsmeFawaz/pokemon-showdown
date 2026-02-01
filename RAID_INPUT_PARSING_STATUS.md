# Raid Den Input Parsing Implementation Summary

## What Was Implemented

### ✅ Boss Multiple Moves (COMPLETE)
**Input Format:** `p2 move <count>`

**Example:** `p2 move 3` - Boss makes 3 random moves

**Implementation:**
1. **Input Parsing** (`scripts.ts` - `side.choose()`):
   - Detects pattern `^move\s+(\d+)$` for boss side
   - Extracts move count and stores in `battle.formatData.raidData.bossMoveCount`
   - Converts input to 'auto' to select first move automatically

2. **Move Generation** (`scripts.ts` - `queue.resolveAction()`):
   - Checks if action is from boss side
   - Generates additional move actions based on `bossMoveCount`
   - Each additional move:
     - Randomly selects from boss's available moveset
     - Randomly targets a participant Pokemon
     - Has lower speed (-1000 per move) to execute sequentially
     - Has fractional priority adjustment (-0.01 per move)

3. **State Management** (`rulesets.ts` - `onResidual()`):
   - Boss move count is reset to 1 at end of each turn
   - Ensures fresh count for next turn

**Testing:**
- ✅ Boss making 2 moves per turn
- ✅ Boss making 3 moves per turn  
- ✅ Sequential execution verified
- ✅ Random move selection working
- ✅ Random target selection working

**Files Modified:**
- `data/mods/gen9raiddens/scripts.ts` - Added choose() and resolveAction() overrides
- `data/mods/gen9raiddens/rulesets.ts` - Added boss move count reset
- `test-boss-moves.js` - Test script demonstrating functionality

---

## What Remains: Participant Multi-Actor Moves

### ⏸️ Status: ARCHITECTURE DECISION NEEDED

**Desired Input Format:** `p1 move 2 move 3, move 3, move 1`

**Meaning:** 4 participants each make a move:
- Participant 1: move 2
- Participant 2: move 3
- Participant 3: move 3
- Participant 4: move 1

### Challenge

The current format uses `gameType: 'singles'` which only supports:
- 1 active Pokemon per side
- Input format: single move choice per side

To support multiple participants, we need:
- Multiple active Pokemon on p1 side simultaneously
- Parse input with multiple move choices
- Track which Pokemon makes which move

### Possible Solutions

#### Option A: Change to Multi/FFA Format
**Pros:**
- Native support for multiple players
- Each player controls their own Pokemon
- Input already supports multiple choices

**Cons:**
- Requires 4 separate "players" (p1, p3, p4, p1a)
- Complex for single user controlling all participants
- Not how typical raid battles work

#### Option B: Custom Game Type
**Pros:**
- Full control over battle mechanics
- Can have asymmetric active counts (4 vs 1)
- Clean implementation

**Cons:**
- Requires modifying core battle engine
- Significant code changes
- May conflict with other battle systems

#### Option C: Doubles with Special Parsing
**Pros:**
- Uses existing doubles infrastructure
- Can have 2 active per side (could extend to 4)
- Input format already supports comma-separated choices

**Cons:**
- Limited to 2 active by default (would need 4)
- Triples format could work but not standard for Gen 9

#### Option D: Virtual Actors (Single Pokemon, Multiple Moves)
**Pros:**
- Minimal changes to format
- Compatible with singles format
- Easy to implement

**Cons:**
- Not "true" multi-participant
- Single Pokemon takes multiple actions
- Doesn't match conceptual model of raid

### Recommended Approach

**Use a custom battle initialization in `scripts.ts`:**

1. Keep `gameType: 'singles'` for compatibility
2. In `onBattleStart`, modify p1 to have multiple "virtual" active slots
3. Parse participant input to queue moves for each virtual actor
4. Execute moves sequentially targeting the boss

**Implementation sketch:**
```typescript
// In scripts.ts
battle: {
	onBattleStart() {
		// Allow p1 to have multiple "actors"
		for (const side of this.sides) {
			if (side.id === 'p1') {
				// Mark as multi-actor side
				side.raidActorCount = 4;
				// Ensure all Pokemon are available
				for (let i = 0; i < side.pokemon.length && i < 4; i++) {
					side.pokemon[i].raidActor = true;
				}
			}
		}
	}
}

side: {
	choose(input: string) {
		if (this.id === 'p1' && this.raidActorCount) {
			// Parse "move 2 move 3, move 3, move 1" format
			// Split by commas or detect multiple "move" keywords
			// Queue all moves
		}
	}
}
```

### Files That Would Need Changes

1. **`scripts.ts`:**
   - Modify `battle.onBattleStart()` to set up multi-actor mode
   - Modify `side.choose()` to parse multi-actor input
   - Modify `queue.resolveAction()` to queue all actor moves

2. **`rulesets.ts`:**
   - Update healing logic for multiple participants
   - Ensure all actors are healed/reset properly

3. **Test files:**
   - Create comprehensive test for multi-actor input
   - Verify all actors make moves
   - Verify execution order

### Estimated Complexity

- **Time:** 2-4 hours of development
- **Risk:** Medium (requires careful handling of battle state)
- **Testing:** Extensive (many edge cases)

---

## Current Status

✅ **Boss multiple moves:** FULLY IMPLEMENTED AND TESTED

⏸️ **Participant multi-actor:** REQUIRES ARCHITECTURAL DECISION AND SIGNIFICANT ADDITIONAL WORK

The boss move implementation demonstrates that the queue system works correctly and can handle multiple moves per turn. The participant multi-actor feature is conceptually similar but requires resolving how to represent multiple "actors" within the battle system.
