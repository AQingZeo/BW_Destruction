# KL Field Theory: What Actually Happens Over Time

## Your Understanding vs. Reality

### Your Question: "Selected Q words become more permanent, non-selected ones less visible?"

**Partially correct, but with important nuances:**

1. **Only overlapping words are in Q**: 
   - Q only contains words that appear in BOTH your input AND the word list (P)
   - Words not in your input are NOT in Q at all (they're not "selected")
   - Words in your input but not in the word list are also NOT in Q

2. **What happens to Q words over time:**
   - **Sampling Bias**: Words near center get HIGHER probability (more "permanent")
   - **Words away from center**: Get LOWER probability (less visible)
   - **Lossy Compression**: ALL Q words lose 15% per step (exponentially decreasing)
   - **Noise Injection**: Adds randomness (±5%) - creates CHAOS
   - **Censorship**: Some words get Q = 0 (completely erased)
   - **Normalization**: After all degradation, probabilities are redistributed

3. **The normalization effect:**
   - After degradation, Q is normalized so sum(Q) = 1
   - This means: if some words decrease, others MUST increase relatively
   - Words with higher initial Q or favorable bias become MORE prominent
   - Words with lower Q or unfavorable bias become LESS prominent
   - **Result**: Yes, some words become "more permanent" (relatively) while others fade

## Chaos: Does It Increase Over Time?

**YES, chaos increases exponentially!**

### Sources of Chaos:

1. **Noise Injection** (±5% random noise each step):
   - Each step adds random noise
   - Over time: noise accumulates and compounds
   - Creates unpredictable variations

2. **Lossy Compression** (quantization + 15% loss):
   - Quantization creates discrete jumps (chaotic transitions)
   - 15% loss per step compounds: 0.85^n after n steps
   - Creates exponential decay with quantization artifacts

3. **Sampling Bias** (spatial bias):
   - Creates spatial patterns (center vs. edges)
   - But combined with noise, creates chaotic spatial distribution

4. **Censorship** (random regions):
   - Random regions get zeroed out
   - Creates sudden, unpredictable erasures

5. **Normalization** (redistribution):
   - After degradation, probabilities redistribute
   - This amplifies differences and creates more extreme distributions
   - **Chaos increases because small differences get amplified**

### Exponential Chaos Growth:

- **Step 0**: Q matches input frequencies (ordered)
- **Step 10**: Noise + compression create moderate chaos
- **Step 50**: Exponential decay + accumulated noise = high chaos
- **Step 100**: Maximum chaos - distribution is highly unpredictable

**Visual Result**: Words become increasingly fragmented, displaced, and chaotic over time.

## The Theory Behind KL Field

### Information Theory Foundation:

**KL Divergence** measures:
- **Information loss** when using Q to approximate P
- **Surprise** or **unexpectedness** when Q differs from P
- **Entropy difference** between the two distributions

### Mathematical Meaning:

```
KL(P || Q) = Σ P(i) * log(P(i) / Q(i))
```

**Interpretation:**
- **P(i)**: "True" probability (what should be)
- **Q(i)**: "Model" probability (what we have)
- **log(P(i)/Q(i))**: "Surprise" when Q differs from P
- **P(i) * log(...)**: Weighted by true probability

### What KL Field Represents:

1. **Information Loss Map**:
   - High KL = high information loss
   - Low KL = low information loss
   - KL = 0 = perfect preservation

2. **Damage/Scar Map**:
   - Shows where information was destroyed
   - Visualizes the "wounds" in the distribution
   - The "poster is the loss" - the visualization IS the damage

3. **Entropy Visualization**:
   - KL divergence is related to entropy
   - Higher KL = higher entropy (more disorder/chaos)
   - The field shows increasing entropy over time

### Temporal Evolution Theory:

**As time → ∞:**

1. **Q Distribution**:
   - Becomes increasingly different from P
   - Some words → 0 (censored/compressed away)
   - Remaining words redistribute (normalization)
   - Distribution becomes more extreme and chaotic

2. **KL Divergence**:
   - Increases exponentially (with time factor)
   - Some words: KL → ∞ (complete loss)
   - Other words: KL → large finite values (partial loss)
   - Total KL → maximum possible divergence

3. **Visual Chaos**:
   - Fragmentation increases (more characters missing)
   - Displacement increases (characters scatter more)
   - Opacity varies more (more visual noise)
   - The "scar map" becomes more pronounced

## What Actually Happens in Your Implementation:

### Initial State (t=0):
- Q initialized from user input frequencies
- Q matches input (some words have high probability, others low)
- KL divergence: moderate (Q already differs from uniform P)

### Over Time (t increases):

1. **Selected words (in Q)**:
   - Words near center: Probability increases (bias)
   - Words away from center: Probability decreases (bias)
   - All words: Lose 15% per step (compression)
   - All words: Get ±5% random noise (chaos)
   - Some words: Get zeroed (censorship)

2. **After normalization**:
   - Probabilities redistribute
   - Words with favorable conditions: Become MORE prominent
   - Words with unfavorable conditions: Become LESS prominent
   - **Result**: Some words "survive" better, others "fade away"

3. **KL divergence**:
   - Base KL increases (Q diverges from P)
   - Time factor: exp(0.2 * t) amplifies exponentially
   - **Result**: Visual chaos increases exponentially

### Non-Selected Words (not in Q):
- These words are NOT in Q at all
- They only appear in P (light grey background)
- They have KL = 0 (no divergence, no damage)
- They remain static and unchanged

## Summary:

1. **Selected Q words**: Some become more permanent (center bias), others fade (edge bias + compression)
2. **Chaos**: YES, increases exponentially due to:
   - Accumulated noise
   - Exponential compression decay
   - Quantization artifacts
   - Normalization amplification
3. **KL Field Theory**: 
   - Measures information loss
   - Visualizes entropy/damage
   - Shows increasing chaos over time
   - The "poster is the loss" - the destruction IS the art

The KL field is essentially a **map of information destruction** that becomes more chaotic and pronounced as time progresses.
