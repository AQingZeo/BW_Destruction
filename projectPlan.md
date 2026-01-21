Same serie of other alphabet posters, with p5.js
Idea:
	•	P: Common phrase preloads fill screen 
	•	Q: same phrase(alphabets) passed through:
	•	sampling bias
	•	lossy compression
	•	noise injection
	•	censorship (zeroing regions)

KL becomes a scar map.


Layer 1 — Truth (Invisible or Fading)
	•	Render P faintly or as an underlayer
	•	This layer never changes

Layer 2 — Model (Visible)
	•	Render Q clearly
	•	Iteratively degrade it

Layer 3 — KL Field (Primary Visual)

\text{Damage}(i) = P(i)\log\frac{P(i)}{Q(i)}

Map to:
	•	Stroke thickness
	•	Fragmentation probability
	•	Pixel displacement
	•	Fracture lines

The poster is the loss.