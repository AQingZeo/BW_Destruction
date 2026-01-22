# KL Divergence as Time → ∞

## Mathematical Analysis

The KL divergence formula is:
```
KL(i) = P(i) * log(P(i) / Q(i))
```

### Case 1: Q(i) → 0 while P(i) > 0

As degradation continues:
- **Censorship**: Sets Q(i) = 0 for words in censored regions
- **Compression + Bias**: Reduces Q(i) values over time
- **Normalization**: After normalization, some Q(i) values approach very small numbers

**Mathematical limit:**
```
As Q(i) → 0:
  P(i) / Q(i) → ∞
  log(P(i) / Q(i)) → log(∞) → ∞
  KL(i) = P(i) * ∞ → ∞
```

**Result**: KL(i) → **∞** (Infinity)

This represents **complete information loss** for that word.

### Case 2: Q(i) → P(i) (Perfect Match)

If somehow Q(i) approaches P(i):
```
As Q(i) → P(i):
  P(i) / Q(i) → 1
  log(1) = 0
  KL(i) = P(i) * 0 = 0
```

**Result**: KL(i) → **0** (No damage)

This represents **perfect preservation** of information.

### Case 3: Q(i) → Some Finite Value ≠ P(i)

If Q(i) stabilizes at a value different from P(i):
```
KL(i) = P(i) * log(P(i) / Q(i))
```

This is a **finite positive value** representing partial information loss.

## What Happens in Practice (Time → ∞)

### Degradation Effects Over Time:

1. **Sampling Bias**: 
   - Reduces Q(i) for words away from center
   - Effect accumulates but is bounded

2. **Lossy Compression**:
   - Each step: Q(i) *= 0.85 (15% loss)
   - After n steps: Q(i) *= 0.85^n
   - As n → ∞: Q(i) → 0 (exponentially)

3. **Noise Injection**:
   - Adds random ±5% noise
   - Can increase or decrease Q(i) randomly
   - Net effect: some words decrease, some increase (but bounded)

4. **Censorship**:
   - Sets Q(i) = 0 for words in censored regions
   - Immediate: KL(i) = ∞ for those words

5. **Normalization**:
   - After each degradation step, Q is normalized
   - This prevents Q(i) from reaching exactly 0 (except censored)
   - But relative differences from P increase

### Theoretical Limit (Time → ∞):

**For censored words:**
- Q(i) = 0
- KL(i) = **∞** (Infinity)

**For non-censored words:**
- With compression: Q(i) → 0 exponentially
- But normalization keeps sum(Q) = 1
- So Q(i) values approach a distribution where:
  - Some words have very small Q(i) (high KL)
  - Some words have larger Q(i) (lower KL)
  - The distribution becomes increasingly different from P

**Asymptotic behavior:**
- Words in censored regions: KL(i) = ∞
- Words with heavy degradation: KL(i) → very large finite values
- Words with less degradation: KL(i) → moderate finite values
- **Total KL divergence**: Approaches maximum possible value

## In the Current Implementation

The code has:
- `maxDegradationSteps = 100` (stops after 100 steps)
- Normalization after each step
- Censorship creates Q(i) = 0 → KL(i) = ∞

**After 100 steps:**
- Censored words: KL = ∞
- Heavily degraded words: KL ≈ very large values
- The KL field shows maximum "scars" or "damage"

**If time → ∞ (no step limit):**
- All words would eventually be affected by censorship (if regions move)
- Or compression would reduce all Q(i) → 0
- After normalization, the distribution would be maximally different from P
- KL divergence would approach its theoretical maximum

## Visual Interpretation

As time → ∞:
- **Layer 1 (P)**: Unchanged (light grey words)
- **Layer 2 (Q)**: Most words fade or disappear (high degradation)
- **Layer 3 (KL Field)**: Maximum fragmentation, displacement, and visual "scars"
- The poster becomes a "map of loss" showing where information was destroyed

## Mathematical Summary

```
lim(t→∞) KL(i) = {
  ∞,  if Q(i) = 0 and P(i) > 0  (complete loss)
  P(i) * log(P(i) / Q_final(i)),  if Q(i) → Q_final(i) ≠ P(i)  (partial loss)
  0,  if Q(i) → P(i)  (no loss, but unlikely due to degradation)
}
```

In practice, with the degradation processes:
- **Most words**: KL(i) → large finite values or ∞
- **Total KL**: Approaches maximum possible divergence
- **Visual result**: Complete "scar map" showing total information destruction
