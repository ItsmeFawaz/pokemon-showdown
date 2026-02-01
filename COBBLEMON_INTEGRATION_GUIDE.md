# Cobblemon Integration Guide for Raid Den Battles

This guide explains how to integrate the Pokemon Showdown raid den battle system with Cobblemon.

## Overview

The raid den battle system allows multiple participants (2-4 players) to fight against a single powerful boss Pokemon. The battle runs in Pokemon Showdown's simulator and communicates via BattleStream, which you can integrate into your Cobblemon mod.

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                         Minecraft                            │
│  ┌────────────┐  ┌────────────┐  ┌────────────┐            │
│  │  Player 1  │  │  Player 2  │  │  Player 3  │  etc...    │
│  └─────┬──────┘  └─────┬──────┘  └─────┬──────┘            │
│        │                │                │                    │
│        └────────────────┴────────────────┘                    │
│                         │                                     │
│                         v                                     │
│              ┌──────────────────────┐                        │
│              │  Cobblemon Mod       │                        │
│              │  - Battle Coordinator│                        │
│              │  - State Manager     │                        │
│              └──────────┬───────────┘                        │
│                         │                                     │
└─────────────────────────┼─────────────────────────────────────┘
                          │
                          │ BattleStream I/O
                          │
┌─────────────────────────┼─────────────────────────────────────┐
│                         v                                     │
│              ┌──────────────────────┐                        │
│              │ Pokemon Showdown     │                        │
│              │ - Battle Simulator   │                        │
│              │ - Raid Dens Format   │                        │
│              └──────────────────────┘                        │
│                                                               │
└───────────────────────────────────────────────────────────────┘
```

## BattleStream Protocol

### Starting a Battle

Write these commands to the stream to initialize a battle:

```javascript
>start {"formatid":"[Gen 9] Raid Den Battle"}
>player p1 {"name":"Raid Participants","team":"<packed team>"}
>player p2 {"name":"Raid Boss","team":"<packed boss team>"}
```

**Team Format**: Use `Sim.Teams.pack()` to pack teams. See example in test scripts.

### Receiving Battle Events

Read from the stream to get battle updates. Each chunk contains multiple lines starting with `|`:

```
|player|p1|Raid Participants||
|player|p2|Raid Boss||
|gametype|triples
|teamsize|p1|4
|teamsize|p2|1
|switch|p1a: Pikachu|Pikachu, L50, F|142/142
|turn|1
|move|p1a: Pikachu|Thunderbolt|p2a: Mewtwo
|-damage|p2a: Mewtwo|1200/1470
```

### Sending Player Choices

Each turn, send move choices for all participants:

```javascript
>p1 move 1 1, move 2 1, move 1 1, move 3 1
>p2 move 2
```

**Format Explanation**:
- `>p1 move 1 1, move 2 1, move 1 1, move 3 1` 
  - Four moves separated by commas (one per participant)
  - First number: move slot (1-4)
  - Second number: target (always 1 for the boss at position p2a)
  
- `>p2 move 2`
  - Number indicates how many random moves the boss should make this turn

## Battle Events Reference

### Initial Setup Events

| Event | Format | Description |
|-------|--------|-------------|
| `player` | `\|player\|p1\|Name\|\|` | Player information |
| `gametype` | `\|gametype\|triples` | Game type (triples for raid dens) |
| `teamsize` | `\|teamsize\|p1\|4` | Number of Pokemon per side |
| `gen` | `\|gen\|9` | Generation number |
| `tier` | `\|tier\|[Gen 9] Raid Den Battle` | Format name |

### Pokemon Events

| Event | Format | Description |
|-------|--------|-------------|
| `switch` | `\|switch\|p1a: Pikachu\|Pikachu, L50\|142/142` | Pokemon enters battle |
| `faint` | `\|faint\|p1a: Pikachu` | Pokemon faints |

### Turn Events

| Event | Format | Description |
|-------|--------|-------------|
| `turn` | `\|turn\|1` | New turn begins |
| `move` | `\|move\|p1a: Pikachu\|Thunderbolt\|p2a: Mewtwo` | Pokemon uses move |
| `-damage` | `\|-damage\|p2a: Mewtwo\|1200/1470` | Pokemon takes damage |
| `-heal` | `\|-heal\|p1a: Pikachu\|100/142` | Pokemon heals |
| `-status` | `\|-status\|p2a: Mewtwo\|brn` | Status condition applied |
| `-curestatus` | `\|-curestatus\|p2a: Mewtwo\|brn` | Status cured |
| `-boost` | `\|-boost\|p1a: Pikachu\|atk\|1` | Stat increased |
| `-unboost` | `\|-unboost\|p2a: Mewtwo\|def\|1` | Stat decreased |
| `-clearboost` | `\|-clearboost\|p1a: Pikachu` | All stat changes cleared |

### Battle End Events

| Event | Format | Description |
|-------|--------|-------------|
| `win` | `\|win\|Raid Participants` | Battle won |
| `tie` | `\|tie` | Battle tied |

### Request Events

The `request` event contains JSON data about available moves and Pokemon state. This is sent to each player separately via `sideupdate`.

## Implementation Steps for Cobblemon

### 1. Create BattleStream Wrapper

Create a Java/Kotlin class to manage the BattleStream process:

```java
public class ShowdownBattleStream {
    private Process process;
    private BufferedReader reader;
    private BufferedWriter writer;
    
    public void start(String formatId) {
        // Start Pokemon Showdown process
        ProcessBuilder pb = new ProcessBuilder(
            "node", 
            "pokemon-showdown/simulate-battle"
        );
        process = pb.start();
        reader = new BufferedReader(
            new InputStreamReader(process.getInputStream())
        );
        writer = new BufferedWriter(
            new OutputStreamWriter(process.getOutputStream())
        );
        
        // Send start command
        write(">start {\"formatid\":\"" + formatId + "\"}");
    }
    
    public void write(String command) throws IOException {
        writer.write(command + "\n");
        writer.flush();
    }
    
    public String read() throws IOException {
        // Read until a complete chunk is received
        StringBuilder chunk = new StringBuilder();
        String line;
        while ((line = reader.readLine()) != null) {
            if (line.isEmpty()) break;
            chunk.append(line).append("\n");
        }
        return chunk.toString();
    }
}
```

### 2. Parse Battle Events

```java
public class BattleEventParser {
    public List<BattleEvent> parse(String chunk) {
        List<BattleEvent> events = new ArrayList<>();
        String[] lines = chunk.split("\n");
        
        for (String line : lines) {
            if (!line.startsWith("|")) continue;
            
            String[] parts = line.split("\\|");
            if (parts.length < 2) continue;
            
            String eventType = parts[1];
            
            switch (eventType) {
                case "move":
                    events.add(new MoveEvent(
                        parts[2], // attacker
                        parts[3], // move name
                        parts.length > 4 ? parts[4] : null // target
                    ));
                    break;
                    
                case "-damage":
                    events.add(new DamageEvent(
                        parts[2], // pokemon
                        parts[3]  // new HP
                    ));
                    break;
                    
                case "faint":
                    events.add(new FaintEvent(parts[2]));
                    break;
                    
                // ... handle other event types
            }
        }
        
        return events;
    }
}
```

### 3. Map to Minecraft Events

```java
public class RaidBattleRenderer {
    public void handleEvent(BattleEvent event) {
        if (event instanceof MoveEvent) {
            MoveEvent move = (MoveEvent) event;
            // Show attack animation in Minecraft
            playAttackAnimation(move.getAttacker(), move.getMove());
            
        } else if (event instanceof DamageEvent) {
            DamageEvent damage = (DamageEvent) event;
            // Update health bar
            updateHealthBar(damage.getPokemon(), damage.getNewHP());
            
        } else if (event instanceof FaintEvent) {
            FaintEvent faint = (FaintEvent) event;
            // Play faint animation
            playFaintAnimation(faint.getPokemon());
        }
    }
}
```

### 4. Coordinate Multiple Players

```java
public class RaidBattleCoordinator {
    private Map<UUID, PlayerChoice> playerChoices = new HashMap<>();
    private int participantCount;
    
    public void onPlayerChoice(UUID playerId, int moveSlot) {
        playerChoices.put(playerId, new PlayerChoice(moveSlot, 1));
        
        if (playerChoices.size() == participantCount) {
            submitAllChoices();
        }
    }
    
    private void submitAllChoices() {
        StringBuilder choices = new StringBuilder(">p1 ");
        
        List<PlayerChoice> orderedChoices = getOrderedChoices();
        for (int i = 0; i < orderedChoices.size(); i++) {
            if (i > 0) choices.append(", ");
            PlayerChoice choice = orderedChoices.get(i);
            choices.append("move ")
                   .append(choice.moveSlot)
                   .append(" ")
                   .append(choice.target);
        }
        
        battleStream.write(choices.toString());
        
        // Boss automatically makes moves
        int bossMoveCount = determineBossMoveCount();
        battleStream.write(">p2 move " + bossMoveCount);
        
        playerChoices.clear();
    }
}
```

### 5. Sync with Cobblemon Pokemon Data

```java
public class PokemonDataSync {
    public String packTeam(List<CobblemonPokemon> pokemons) {
        List<ShowdownPokemon> packed = new ArrayList<>();
        
        for (CobblemonPokemon pokemon : pokemons) {
            ShowdownPokemon sp = new ShowdownPokemon();
            sp.species = pokemon.getSpecies().getName();
            sp.ability = pokemon.getAbility().getName();
            sp.moves = pokemon.getMoveSet().stream()
                .map(Move::getName)
                .collect(Collectors.toList());
            sp.level = pokemon.getLevel();
            sp.evs = pokemon.getEVs();
            sp.ivs = pokemon.getIVs();
            sp.nature = pokemon.getNature().getName();
            
            packed.add(sp);
        }
        
        return Teams.pack(packed);
    }
}
```

## Testing

Use the provided test scripts to understand the battle flow:

```bash
# Basic test
node test-battlestream-raid.js

# Parsed output with event handling
node test-battlestream-parsed.js
```

## Raid Den Specific Features

### Boss HP Multiplier

The boss Pokemon has 5x HP multiplier applied at battle start. You'll see this in the initial switch event:

```
|switch|p2a: Mewtwo|Mewtwo, L70|1470/1470
```

Normal Mewtwo at level 70 has ~294 HP, but with 5x multiplier it has 1470 HP.

### Boss Multiple Moves

When you send `>p2 move N`, the boss will make N random moves that turn, each targeting a random participant. You'll see multiple `|move|p2a: Mewtwo|...` events in sequence.

### End-of-Turn Effects

At the end of each turn (before `|turn|N+1`):
- All fainted participants are healed (you'll see `|-heal|` events)
- Boss status conditions are cured (you'll see `|-curestatus|` events)
- Boss stat changes are reset (you'll see `|-clearboost|` events)
- Participant stat boosts are reset

### Turn Limit

Battles have a configurable turn limit (default: 10). If the limit is reached, participants lose automatically.

## Example Battle Flow

```
1. Minecraft: Players gather at raid den
2. Cobblemon: Initialize BattleStream
3. Cobblemon: Pack teams and send start command
4. Showdown: Battle initializes, sends setup events
5. Cobblemon: Render Pokemon in battle arena
6. Loop:
   a. Showdown: Sends turn start and request events
   b. Cobblemon: Show move selection UI to players
   c. Players: Select moves
   d. Cobblemon: Collect all choices and send to Showdown
   e. Showdown: Process turn, send move/damage/etc events
   f. Cobblemon: Animate events in Minecraft
   g. Showdown: Send end-of-turn effects
7. Showdown: Sends win/loss event
8. Cobblemon: Show battle results, distribute rewards
```

## Performance Considerations

- **Process Management**: Keep the Showdown process alive for multiple battles to avoid startup overhead
- **Event Batching**: Process events in batches rather than one-by-one
- **Animation Queue**: Queue animations and play them at appropriate speed
- **Network Sync**: For multiplayer, sync battle state across all participants

## Error Handling

- **Invalid Moves**: Showdown will send `|error|` events if moves are invalid
- **Process Crashes**: Monitor the process and restart if needed
- **Timeout**: Implement timeouts for player choices
- **Desync**: Validate battle state periodically

## Configuration

Raid den battles support configuration via the ruleset:
- `participantCount`: Number of participants (2-4, default: 4)
- `maxTurns`: Turn limit (default: 10)
- `bossHPMultiplier`: HP multiplier for boss (default: 5)
- `bossMoveCount`: Base number of moves boss makes (default: 1, can be overridden per turn)

## Resources

- **Test Scripts**: `test-battlestream-raid.js`, `test-battlestream-parsed.js`
- **Documentation**: `RAID_DENS_README.md`, `MULTI_PARTICIPANT_IMPLEMENTATION.md`
- **Protocol**: `PROTOCOL.md` (Pokemon Showdown's main protocol documentation)
- **Battle Simulator**: `sim/SIMULATOR.md` (Showdown's simulator documentation)

## Support

For issues specific to the raid den implementation, check:
- `data/mods/gen9raiddens/rulesets.ts` - Raid den rules
- `data/mods/gen9raiddens/scripts.ts` - Battle scripts
- `config/formats.ts` - Format definition

For general Showdown integration questions, refer to the official Pokemon Showdown documentation.
