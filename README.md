# KL Field - Alphabet Poster Series

A web-based poster visualizing Kullback-Leibler divergence as a "scar map" showing the damage between truth (P) and degraded model (Q).

## Concept

The poster visualizes information loss through three layers:

1. **Layer 1 - Truth (P)**: The original phrase rendered faintly as an underlayer
2. **Layer 2 - Model (Q)**: The degraded version, iteratively corrupted through:
   - Sampling bias
   - Lossy compression
   - Noise injection
   - Censorship (zeroing regions)
3. **Layer 3 - KL Field**: The primary visual showing the KL divergence:
   ```
   Damage(i) = P(i) * log(P(i)/Q(i))
   ```

The KL divergence maps to visual effects:
- Stroke thickness
- Fragmentation probability
- Pixel displacement
- Fracture lines

## Setup

Open `index.html` in a web browser

## Customization

Edit `sketch.js` to modify:
- `commonPhrase`: Change the text used for the poster
- `gridSize`: Adjust the resolution of the grid
- `samplingBias`, `compressionLoss`, `noiseLevel`: Control degradation intensity
- `maxDegradationSteps`: Number of degradation iterations

## Technical Details

Built with [p5.js](https://p5js.org/) for creative coding and visualization.

