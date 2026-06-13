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

### Relay (recommended — all three projects + WebSocket)

From the workspace root:

```bash
cd relay
npm install
npm start
```

Open http://localhost:8765/ for links. Example:

- Poster: http://localhost:8765/destruction/
- Input: http://localhost:8765/destruction/input/

Poster can run on a separate display or machine; input connects via WebSocket.

### Standalone (single project, same-browser tabs)

```bash
cd Destruction
python -m http.server 8765
```

Uses BroadcastChannel fallback when WebSocket is unavailable.

## Customization

Edit `sketch.js` to modify:
- `commonPhrase`: Change the text used for the poster
- `gridSize`: Adjust the resolution of the grid
- `samplingBias`, `compressionLoss`, `noiseLevel`: Control degradation intensity
- `maxDegradationSteps`: Number of degradation iterations

## Technical Details

Built with [p5.js](https://p5js.org/) for creative coding and visualization.

