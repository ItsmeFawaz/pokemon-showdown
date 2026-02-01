# Raid Den Battles - Complete Implementation Guide

## Project Overview

This project implements raid den battles where multiple participants fight against a powerful boss Pokemon. It consists of two components:

1. **Pokemon Showdown Raid Den Format** - Battle simulator with custom raid mechanics
2. **Cobblemon Raid Dens Fabric Mod** - Minecraft integration with Cobblemon

---

## Part 1: Pokemon Showdown Implementation

### Status: ✅ WORKING IMPLEMENTATION

### Repository
- **GitHub**: https://github.com/ItsmeFawaz/pokemon-showdown
- **Branch**: `copilot/add-raid-den-battles-format`

### Files Modified/Created
```
config/formats.ts                        # Added raid den format
data/mods/gen9raiddens/
├── scripts.ts                           # Mod definition (inherits gen9)
└── rulesets.ts                          # Raid den battle rules
test-raid-dens.js                        # Test script
RAID_DENS_README.md                      # Documentation
```

### Implemented Features

#### 1. Boss HP Multiplier (5x)
- Applied on battle start to p2 (boss side)
- **Verified**: Mewtwo HP 250 → 1250

#### 2. Turn Limit (10 turns default)
- Configurable in `formatData.raidData.maxTurns`
- Checked at start of each turn
- Participants lose if limit reached

#### 3. End-of-Turn Healing
- All fainted participants revived
- HP restored to maximum
- Executes once per turn using flag

#### 4. Stat Resets
- **Boss**: Status conditions cleared, negative stat boosts reset
- **Participants**: Positive stat boosts reset
- Executes once per turn per Pokemon

#### 5. Custom Win/Loss
- **Win**: Boss Pokemon faints
- **Loss**: Turn limit reached OR all participants faint in one turn

### Technical Implementation

#### Type Safety
- Uses `battle.formatData.raidData` for raid-specific data
- Uses `side.sideConditions['raidboss']` for boss tracking
- Avoids TypeScript type conflicts

#### Execution Control
- Flags prevent duplicate execution:
  - `healingDone`: Ensures healing runs once per turn
  - `turnChecked`: Ensures turn limit checked once per turn
- Event hooks:
  - `onBattleStart`: Initialize raid data, apply boss HP multiplier
  - `onResidual`: Healing and stat resets
  - `onBeforeTurn`: Turn limit checking

### Testing

Run test:
```bash
cd /home/runner/work/pokemon-showdown/pokemon-showdown
node test-raid-dens.js
```

Expected output:
```
Boss Max HP: 1250
Boss Current HP: 1250
Winner: Raid Boss (or Challengers if participants win)
```

### Remaining Work for Showdown

1. **Boss Multiple Moves**
   - Input format: `p2 move 3`
   - Queue multiple move actions in battle-queue
   - Execute sequentially at different speeds

2. **Participant Multi-Actor Moves**
   - Input format: `p1 move 2 move 3, move 3, move 1`
   - Parse multiple moves from single input
   - Queue all moves for execution

3. **Full Testing**
   - Verify turn limit causes loss
   - Verify healing revives fainted Pokemon
   - Verify stat resets work correctly
   - Test multi-turn battles

---

## Part 2: Fabric Mod Implementation

### Status: 🚧 STRUCTURE COMPLETE, INTEGRATION PENDING

### Location
`/tmp/cobblemon-raid-dens-mod/`

### Project Structure
```
cobblemon-raid-dens-mod/
├── build.gradle                        # Build configuration
├── gradle.properties                   # Project properties
├── README.md                           # User documentation
├── IMPLEMENTATION_GUIDE.md             # Developer guide
└── src/main/
    ├── java/com/yourname/raiddens/
    │   ├── RaidDensMod.java           # Main mod class
    │   ├── battle/
    │   │   ├── RaidBattle.java        # Battle wrapper
    │   │   └── ShowdownBridge.java    # JS bridge
    │   ├── command/
    │   │   └── RaidDensCommand.java   # Commands
    │   └── integration/
    │       └── CobblemonIntegration.java # Cobblemon hooks
    └── resources/
        ├── fabric.mod.json            # Mod metadata
        └── showdown/dist/             # Bundled Showdown (copied)
```

### Key Components

#### 1. ShowdownBridge.java
**Purpose**: Runs Pokemon Showdown JavaScript in JVM using GraalVM

```java
Context jsContext = Context.newBuilder("js")
    .allowAllAccess(true)
    .build();

// Load Showdown scripts from resources
jsContext.eval(Source.newBuilder("js", script, "showdown.js").build());

// Create battle
Value battle = battleSimulator.invokeMember("Battle", format);
```

#### 2. RaidBattle.java
**Purpose**: Java wrapper for Showdown battle

Methods:
- `makeChoice(side, choice)` - Send move to Showdown
- `getLog()` - Get battle messages
- `isEnded()` - Check if battle finished
- `getWinner()` - Get winner name

#### 3. CobblemonIntegration.java (stub)
**Purpose**: Convert between Cobblemon and Showdown formats

Needs:
- Event hooks (`BattleStartEvent`, `MoveSelectionEvent`)
- Pokemon data conversion
- Battle result application

#### 4. RaidDensCommand.java (stub)
**Purpose**: Minecraft commands for raids

Planned commands:
- `/raiddens start <pokemon> <level>`
- `/raiddens join <raid-id>`
- `/raiddens leave`

### Dependencies
```groovy
minecraft: 1.20.1
fabricLoader: 0.15.11+
fabric-api: 0.92.2+
cobblemon: 1.5.2+
graalvm-js: 23.1.2
```

### Building

```bash
cd /tmp/cobblemon-raid-dens-mod
./gradlew build
```

Output: `build/libs/cobblemon-raid-dens-1.0.0.jar`

### Remaining Work for Fabric Mod

1. **Complete ShowdownBridge**
   - Implement JavaScript file loading from resources
   - Test Showdown initialization
   - Test battle creation

2. **Implement CobblemonIntegration**
   - Hook into Cobblemon battle events
   - Convert Cobblemon Pokemon → Showdown format:
     ```json
     {
       "species": "Pikachu",
       "level": 50,
       "moves": ["thunderbolt", "quickattack"],
       "ability": "static",
       "evs": {"spa": 252, "spe": 252},
       "nature": "Timid"
     }
     ```
   - Apply Showdown results → Cobblemon Pokemon
   - Update HP, status, handle fainting

3. **Implement Commands**
   - Register with Fabric command API
   - Create raid coordination system
   - Handle multiplayer state

4. **Testing**
   - Test with actual Cobblemon installation
   - Verify battles work end-to-end
   - Test multiplayer coordination

---

## Integration Flow

```
Player: /raiddens start Mewtwo 70
    ↓
RaidDensCommand creates RaidBattle
    ↓
ShowdownBridge initializes Showdown JS
    ↓
CobblemonIntegration converts Pokemon data
    ↓
Battle runs in Showdown with raid rules
    ↓
Players make moves → relayed through bridge
    ↓
Battle results → applied to Cobblemon
    ↓
Rewards distributed
```

---

## Configuration

### Showdown (in code)
```typescript
formatData.raidData = {
    maxTurns: 10,           // Turn limit
    bossMoveCount: 1,       // Moves per turn (future)
    participantCount: 4,    // Number of participants
};
```

### Fabric Mod (future config file)
```json
{
    "turnLimit": 10,
    "bossHpMultiplier": 5.0,
    "maxParticipants": 4,
    "rewards": {
        "exp": 5000,
        "items": ["rare_candy", "master_ball"]
    }
}
```

---

## Next Steps

### Immediate Priority
1. Complete boss multiple moves in Showdown
2. Test Showdown mechanics thoroughly
3. Complete ShowdownBridge JavaScript loading

### Short Term
1. Implement Cobblemon event hooks
2. Create Pokemon data converters
3. Test basic battles end-to-end

### Long Term
1. Multiplayer synchronization
2. Raid den world structures
3. Reward system
4. GUI/HUD elements
5. Performance optimization

---

## Testing Checklist

### Showdown
- [x] Boss HP multiplier works
- [x] Basic battle runs
- [ ] Turn limit causes loss
- [ ] Healing revives Pokemon
- [ ] Status/stat resets work
- [ ] Boss multiple moves
- [ ] Participant multi-moves

### Fabric Mod
- [ ] Mod loads in Minecraft
- [ ] Showdown JS initializes
- [ ] Battle creates successfully
- [ ] Moves relay correctly
- [ ] Results apply to Cobblemon
- [ ] Commands work
- [ ] Multiplayer works

---

## Documentation

- **Showdown**: `/home/runner/work/pokemon-showdown/pokemon-showdown/RAID_DENS_README.md`
- **Fabric Mod**: `/tmp/cobblemon-raid-dens-mod/README.md`
- **Implementation**: `/tmp/cobblemon-raid-dens-mod/IMPLEMENTATION_GUIDE.md`
- **Summary**: `/tmp/COMPLETE_IMPLEMENTATION_SUMMARY.md`
- **This Guide**: Complete overview of both projects

---

## Troubleshooting

### Showdown Build Errors
```bash
cd /home/runner/work/pokemon-showdown/pokemon-showdown
node build
```

### Showdown Test Failures
Check `test-raid-dens.js` output for specific errors

### Fabric Mod Build Errors
```bash
cd /tmp/cobblemon-raid-dens-mod
./gradlew clean build --stacktrace
```

### JavaScript Loading Issues
- Verify `showdown/dist/` is in JAR
- Check GraalVM dependency included
- Enable debug logging

---

## License

Both projects use MIT License

## Credits

- Pokemon Showdown team - Battle simulator
- Cobblemon team - Pokemon mod for Minecraft
- Fabric team - Modding framework
- GraalVM team - JavaScript runtime
