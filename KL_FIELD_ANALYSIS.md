# KL Field Implementation Analysis

## What is KL Divergence?

The KL (Kullback-Leibler) divergence measures the information loss when using distribution Q to approximate distribution P. The formula used is:

```
Damage(i) = P(i) * log(P(i) / Q(i))
```

## Current Implementation

### P Distribution (Truth - Layer 1)
- **Static, never changes**
- Based on word frequencies from `wordList`
- Currently: All words have equal probability (1/wordList.length)
- Represents the "ground truth" or reference distribution
- Rendered in light grey, always visible

### Q Distribution (Model - Layer 2)
- **Dynamic, changes over time**
- Initialized from user input word frequencies
- Only includes words that overlap with P (words in both input and wordList)
- **Iteratively degraded** through:
  1. **Sampling Bias**: Center bias (words near center have higher probability)
  2. **Lossy Compression**: Quantization (reduces precision to 8 levels) + 15% loss
  3. **Noise Injection**: Random noise added (±5%)
  4. **Censorship**: Random regions zeroed out
- Normalized after each degradation step
- Rendered in white, visible only for overlapping words

### KL Field (Layer 3)
- Calculated as: `KL[i] = P[i] * log(P[i] / Q[i])`
- Only computed for overlapping words (words in both P and Q)
- Represents the "damage" or "scars" where Q differs from P
- Mapped to visual effects:
  - Text fragmentation (missing characters)
  - Character displacement
  - Opacity changes

## What KL Divergence Entropy Should Change/Affect

### 1. **Information Loss Measurement**
- **When Q = P**: KL = 0 (no damage, perfect match)
- **When Q ≠ P**: KL > 0 (damage increases with difference)
- **When Q(i) = 0 but P(i) > 0**: KL = Infinity (complete loss for that word)

### 2. **Temporal Evolution**
As degradation is applied iteratively:
- Q moves further away from P
- KL divergence **increases** over time
- Visual "scars" become more pronounced
- More fragmentation and displacement appear

### 3. **Visual Mapping**
Higher KL divergence should result in:
- **More fragmentation**: More characters missing from words
- **Greater displacement**: Characters shift further from original positions
- **Higher intensity**: Brighter/more visible effects
- **More damage**: The "scar map" becomes more apparent

## Potential Issues in Current Implementation

### Issue 1: P Distribution Uniformity
**Current**: All words in P have equal probability (uniform distribution)
**Impact**: KL divergence may not show meaningful differences if P is too uniform
**Suggestion**: Consider using actual word frequency data for P (e.g., from corpus statistics)

### Issue 2: Q Normalization After Degradation
**Current**: Q is normalized after each degradation step
**Impact**: Normalization might mask some degradation effects
**Note**: This is mathematically correct but may reduce visual impact

### Issue 3: KL Calculation Only for Overlapping Words
**Current**: KL is only calculated where P and Q overlap
**Impact**: Words in P but not in Q show no KL (set to 0)
**Note**: This is intentional - only overlapping words are "lighted up"

### Issue 4: Initial Q Already Differs from P
**Current**: Q starts with user input frequencies, which may already differ from P
**Impact**: KL starts > 0 even before degradation
**Note**: This is expected behavior - user input is already a "model" of P

## Expected Behavior

1. **Initial State**: 
   - User types input → Q initialized with input frequencies
   - KL calculated → Shows initial difference between P and Q
   - Visual effects appear based on initial KL

2. **Degradation Process**:
   - Every 30 frames, degradation is applied
   - Q probabilities change (bias, compression, noise, censorship)
   - KL divergence recalculated → Should **increase**
   - Visual effects intensify → More fragmentation/displacement

3. **Final State**:
   - After max degradation steps, Q is maximally corrupted
   - KL divergence is at maximum
   - Visual "scars" are most pronounced

## Recommendations

1. **Verify KL increases over time**: Add console logging to track KL values
2. **Consider non-uniform P**: Use actual word frequency data for more meaningful KL
3. **Visual feedback**: Ensure KL changes are clearly visible in the visualization
4. **Handle edge cases**: Better handling of Q(i) = 0 cases (currently set to Infinity)
