# Raid Den Battles - Quick Reference

Complete raid den battle system for Pokemon Showdown. Multiple participants (2-4) fight a single powerful boss Pokemon.

---

## 🎯 Your Questions Answered

### What classes were edited?

**3 files** (see `SHOWDOWN_TECHNICAL_GUIDE.md` for details):

1. `config/formats.ts` - Format definition
2. `data/mods/gen9raiddens/rulesets.ts` - Game rules
3. `data/mods/gen9raiddens/scripts.ts` - Battle behavior

### How to start battles?

```javascript
const {BattleStream} = require('./dist/sim/battle-stream');
const stream = new BattleStream();

stream.write('>start {"formatid":"gen9raiddenbattle"}');
stream.write('>player p1 {"name":"Participants"}');
stream.write('>player p2 {"name":"Boss"}');
stream.write('>player p1 {"team":"<packed-team>"}');
stream.write('>player p2 {"team":"<packed-team>"}');
```

### How to send choices?

**Participants** (comma-separated):
```javascript
stream.write('>p1 move 1 1, move 1 1, move 1 1, move 1 1');
```

**Boss** (move count):
```javascript
stream.write('>p2 move 3');
```

---

## 📚 Documentation

| Document | Purpose | Lines |
|----------|---------|-------|
| **`SHOWDOWN_TECHNICAL_GUIDE.md`** ⭐ | **Complete technical reference** | 689 |
| **`IMPLEMENTATION_SUMMARY.md`** ⭐ | **High-level overview** | 350 |
| `BATTLESTREAM_QUICK_START.md` | Quick start guide | 313 |
| `COBBLEMON_INTEGRATION_GUIDE.md` | Cobblemon integration | 413 |
| `MULTI_PARTICIPANT_IMPLEMENTATION.md` | Architecture details | 262 |
| `RAID_DENS_README.md` | Implementation notes | - |

⭐ = **Start here**

---

## 🚀 Quick Start

```bash
# Build
npm run build

# Run tests
node test-battlestream-raid.js
node test-battlestream-parsed.js
```

---

## ✨ Features

- ✅ Multiple participants (2-4 Pokemon)
- ✅ Boss HP multiplier (5x)
- ✅ Boss multiple moves (2-5 per turn)
- ✅ Turn limit (10 turns)
- ✅ End-of-turn healing/resets
- ✅ Custom win/loss conditions
- ✅ Full BattleStream support

---

## 📖 Read More

**For integration development:**
→ `SHOWDOWN_TECHNICAL_GUIDE.md`

**For quick overview:**
→ `IMPLEMENTATION_SUMMARY.md`

**For running tests:**
→ `BATTLESTREAM_QUICK_START.md`

---

## ✅ Status

**Complete and production-ready!**
- All features implemented
- Fully tested
- Comprehensively documented
- Ready for Cobblemon integration
