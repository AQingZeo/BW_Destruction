// KL Field Poster - Word Frequency Visualization
// Layer 1: Truth (P) - Words from frequency list in light grey
// Layer 2: Model (Q) - User input text, iteratively degraded
// Layer 3: KL Field - Primary visual: Damage(i) = P(i) * log(P(i)/Q(i))

// Word list is loaded from wordList.js
// The wordList constant is defined in wordList.js and should be available globally

let P = []; // Truth distribution (word frequencies)

// Text layout
let pWords = []; // Array of {word, x, y, fontSize, prob}
let userInput = "";
let accumulatedWords = []; // Accumulate all input words across multiple inputs
let customFont; // Google Font variable

// Input entries - each entry has its own independent degradation timeline
let inputEntries = []; // Array of {words, inputFreq, qWords, Q, klField, degradationStep, entryId}
let nextEntryId = 0;

// Layout parameters
let minFontSize = 32; // Uniform font size
let maxFontSize = 32; // Uniform font size
let lineHeight = 1.2;
let margin = 20;

// Degradation parameters
let maxDegradationSteps = 100;
let samplingBias = 0.1;
let compressionLoss = 0.08; // Reduced from 0.15 to prevent Q from disappearing too quickly
let noiseLevel = 0.05;
let censorshipRegions = [];
let censorshipProbability = 0.3; // Probability of applying censorship (reduced to prevent total erasure)

// Exponential time factor for KL divergence amplification
// This exponentially increases the "loss" visualization over time
// Formula: KL_amplified = KL_base * exp(klTimeExponent * degradationStep)
// Higher klTimeExponent = more dramatic loss visualization
let klTimeExponent = 0.01; // Exponential growth rate (0.04 means ~4% growth per step, compounded) - REDUCED for slower change
let klBaseMultiplier = 1.5; // Base multiplier to amplify initial KL values

function setup() {
    let canvas = createCanvas(windowWidth, windowHeight);
    canvas.parent('canvas-container');
    
    // Load Google Font (Doto)
    // Note: p5.js doesn't directly load Google Fonts, so we use CSS font-family
    // The font will be available via CSS, we just need to set it in textFont
    textFont('Doto, sans-serif');
    
    // Setup text input
    setupTextInput();
    
    // Initialize P distribution with word list
    initializePDistribution();
    
    // Initialize input entries
    accumulatedWords = []; // Initialize accumulated words
    inputEntries = [];
    nextEntryId = 0;
    
    // Initialize censorship regions
    initializeCensorship();
    
    // No initial KL field calculation needed - entries will calculate their own
}

function setupTextInput() {
    // Use the input handler module
    if (typeof inputHandler !== 'undefined') {
        inputHandler.setup(processUserInput);
    }
}

function initializePDistribution() {
    // Create P: fill screen with words from wordList
    // Group words into lines (20 words per line), concatenate without spaces
    // Overfill all directions with shifted start points
    // Variable font sizes with less drastic changes
    
    pWords = [];
    
    // Shuffle words to randomize order, but ensure no repeats
    let shuffledWords = [...wordList].sort(() => random() - 0.5);
    let wordIndex = 0;
    
    // Calculate word frequencies (equal weight)
    let wordFreq = {};
    wordList.forEach(word => {
        wordFreq[word] = 1.0 / wordList.length;
    });
    
    // Start before screen top and extend beyond bottom
    let startY = -height * 0.2; // Start 20% above screen
    let endY = height * 1.2; // Extend 20% below screen
    let currentY = startY;
    
    // Track words visible on screen to ensure no repeats within visible area
    let wordsOnScreen = new Set();
    
    // Fill page with words - overfill all directions
    // Each row fills based on screen width (first/last word can be off screen)
    while (currentY < endY) {
        // Each line starts before screen edge (shifted left)
        let shiftAmount = random(-width * 0.3, -width * 0.1); // Start 10-30% before screen
        let lineX = shiftAmount;
        
        // Collect words for this line until we pass the right edge
        let lineWords = [];
        let lineWordIndices = [];
        let maxFontOnLine = minFontSize;
        let wordsInCurrentLine = new Set(); // Track words used in current line to avoid duplicates
        
        // Set font size for measuring
        textSize(maxFontSize);
        
        // Keep adding words until we pass the right edge of screen (with overfill)
        let endX = width + width * 0.3; // End 30% past right edge
        
        while (lineX < endX) {
            // Find next word that's not used on screen AND not used in current line
            let word = null;
            let searchIndex = wordIndex;
            let attempts = 0;
            let maxAttempts = shuffledWords.length * 2;
            
            // Try to find an unused word
            while (attempts < maxAttempts && word === null) {
                let candidate = shuffledWords[searchIndex % shuffledWords.length];
                if (!wordsOnScreen.has(candidate) && !wordsInCurrentLine.has(candidate)) {
                    word = candidate;
                    wordIndex = (searchIndex + 1) % shuffledWords.length;
                    wordsInCurrentLine.add(candidate);
                } else {
                    searchIndex++;
                    attempts++;
                }
            }
            
            // Fallback if no unique word found
            if (word === null) {
                wordsOnScreen.clear();
                let fallbackAttempts = 0;
                while (fallbackAttempts < shuffledWords.length && word === null) {
                    let candidate = shuffledWords[wordIndex % shuffledWords.length];
                    if (!wordsInCurrentLine.has(candidate)) {
                        word = candidate;
                        wordsInCurrentLine.add(candidate);
                    }
                    wordIndex = (wordIndex + 1) % shuffledWords.length;
                    fallbackAttempts++;
                }
                if (word === null) {
                    word = shuffledWords[wordIndex % shuffledWords.length];
                    wordIndex = (wordIndex + 1) % shuffledWords.length;
                }
            }
            
            let capitalizedWord = word.charAt(0).toUpperCase() + word.slice(1);
            lineWords.push(capitalizedWord);
            lineWordIndices.push(word);
            
            let fontSize = random(minFontSize, maxFontSize);
            maxFontOnLine = max(maxFontOnLine, fontSize);
            
            // Check if word is visible on screen
            let isVisible = lineX >= -width * 0.1 && lineX <= width * 1.1 && 
                           currentY >= -height * 0.1 && currentY <= height * 1.1;
            
            if (isVisible) {
                wordsOnScreen.add(word);
            }
            
            // Advance lineX by word width
            lineX += textWidth(capitalizedWord);
        }
        
        // Concatenate all words into one string without spaces
        let concatenatedString = lineWords.join('');
        
        // Use max font size for this line
        textSize(maxFontOnLine);
        let stringWidth = textWidth(concatenatedString);
        
        // Store as single word entry for the entire concatenated string
        // Use average probability of words in the line
        let avgProb = 0;
        for (let i = 0; i < lineWordIndices.length; i++) {
            let originalWord = lineWordIndices[i]; // Now stores the word directly
            avgProb += wordFreq[originalWord] || 0.0001;
        }
        avgProb = avgProb / lineWords.length;
        
        // Store individual word positions within the concatenated string
        let wordPositions = [];
        let charOffset = 0;
        textSize(maxFontOnLine);
        // Calculate cumulative width for accurate positioning
        let cumulativeWidth = 0;
        
        for (let w = 0; w < lineWords.length; w++) {
            let word = lineWords[w];
            let wordWidth = textWidth(word);
            let wordX = shiftAmount + cumulativeWidth;
            
            wordPositions.push({
                word: word,
                originalWord: lineWordIndices[w], // Use stored original word directly
                startChar: charOffset,
                endChar: charOffset + word.length,
                x: wordX,
                width: wordWidth
            });
            charOffset += word.length;
            cumulativeWidth += wordWidth; // Use actual measured width, not estimated
        }
        
        pWords.push({
            word: concatenatedString,
            x: shiftAmount,
            y: currentY,
            fontSize: maxFontOnLine,
            prob: avgProb,
            wordPositions: wordPositions // Store individual word positions
        });
        
        // Move to next line based on max font size on this line
        currentY += maxFontOnLine * lineHeight;
    }
    
    // Create P distribution array (one entry per word)
    P = pWords.map(p => p.prob);
    
    // Normalize P
    let sumP = P.reduce((a, b) => a + b, 0);
    if (sumP > 0) {
        P = P.map(p => p / sumP);
        // Update probabilities in pWords
        for (let i = 0; i < pWords.length; i++) {
            pWords[i].prob = P[i];
        }
    }
}

function processUserInput(inputText) {
    if (!inputText || inputText.trim() === "") {
        return;
    }
    
    // Parse new input words
    let newWords = inputText.toLowerCase()
        .replace(/[^\w\s]/g, ' ')
        .split(/\s+/)
        .filter(w => w.length > 0);
    
    if (newWords.length === 0) return;
    
    // Add new words to accumulated list (for display)
    accumulatedWords = accumulatedWords.concat(newWords);
    userInput = accumulatedWords.join(' '); // Store for display purposes
    
    // Count word frequencies for THIS entry only (not accumulated)
    let inputFreq = {};
    newWords.forEach(word => {
        inputFreq[word] = (inputFreq[word] || 0) + 1;
    });
    
    // Normalize input frequencies for this entry
    let total = newWords.length;
    if (total > 0) {
        Object.keys(inputFreq).forEach(word => {
            inputFreq[word] = inputFreq[word] / total;
        });
    }
    
    // Find overlapping words for THIS entry
    let overlappingIndices = [];
    for (let i = 0; i < pWords.length; i++) {
        let pWord = pWords[i];
        
        // Check if this P word has wordPositions (individual words within concatenated string)
        if (pWord.wordPositions) {
            // Check each individual word in the concatenated string
            for (let w = 0; w < pWord.wordPositions.length; w++) {
                let wordPos = pWord.wordPositions[w];
                let originalWord = wordPos.originalWord.toLowerCase();
                
                // Check if this individual word matches any input word
                if (inputFreq[originalWord] !== undefined) {
                    overlappingIndices.push(i);
                    break; // Found a match in this P string, no need to check other words
                }
            }
        }
    }
    
    // Create a new entry with its own independent degradation timeline
    let entryId = nextEntryId++;
    let entry = {
        entryId: entryId,
        words: newWords,
        inputFreq: inputFreq,
        qWords: [],
        Q: [],
        klField: [],
        degradationStep: 0,
        overlappingIndices: overlappingIndices
    };
    
    // Initialize Q distribution for this entry
    initializeQDistributionForEntry(entry);
    
    // Apply initial degradation for this entry
    applyDegradationForEntry(entry);
    applyDegradationForEntry(entry);
    
    // Calculate KL field for this entry
    calculateKLFieldForEntry(entry);
    
    // Add entry to the list
    inputEntries.push(entry);
}

function initializeQDistributionForEntry(entry) {
    // Create Q words only for individual words that match input (not entire concatenated strings)
    entry.qWords = [];
    
    if (entry.overlappingIndices.length === 0) {
        entry.Q = [];
        return;
    }
    
    // Only create Q entries for individual words that match user input
    for (let i = 0; i < entry.overlappingIndices.length; i++) {
        let pIndex = entry.overlappingIndices[i];
        let pWord = pWords[pIndex];
        
        // Check each individual word within the concatenated string
        if (pWord.wordPositions) {
            for (let w = 0; w < pWord.wordPositions.length; w++) {
                let wordPos = pWord.wordPositions[w];
                let originalWord = wordPos.originalWord.toLowerCase();
                
                // Check if this individual word matches any input word
                if (entry.inputFreq[originalWord] !== undefined) {
                    let freq = entry.inputFreq[originalWord];
                    
                    entry.qWords.push({
                        word: wordPos.word,
                        x: wordPos.x, // Use the stored word position x
                        y: pWord.y,
                        fontSize: pWord.fontSize,
                        prob: freq,
                        pIndex: pIndex,  // Store reference to P index
                        wordPosition: wordPos, // Store word position info
                        entryId: entry.entryId // Track which entry this belongs to
                    });
                }
            }
        }
    }
    
    // Create Q distribution array (only for overlapping words)
    entry.Q = entry.qWords.map(q => q.prob);
    
    // Normalize Q
    let sumQ = entry.Q.reduce((a, b) => a + b, 0);
    if (sumQ > 0) {
        entry.Q = entry.Q.map(q => q / sumQ);
        // Update probabilities in qWords
        for (let i = 0; i < entry.qWords.length; i++) {
            entry.qWords[i].prob = entry.Q[i];
        }
    } else {
        // If sum is 0, set all to equal small values
        if (entry.Q.length > 0) {
            let smallVal = 1.0 / entry.Q.length;
            entry.Q = entry.Q.map(() => smallVal);
            for (let i = 0; i < entry.qWords.length; i++) {
                entry.qWords[i].prob = smallVal;
            }
        }
    }
}

function initializeCensorship() {
    // Create random censorship regions
    censorshipRegions = [];
    let numRegions = 3;
    for (let i = 0; i < numRegions; i++) {
        censorshipRegions.push({
            x: random(width * 0.2, width * 0.8),
            y: random(height * 0.2, height * 0.8),
            w: random(50, 150),
            h: random(50, 150)
        });
    }
}

function applyDegradationForEntry(entry) {
    // Apply degradation to a specific entry independently
    if (entry.degradationStep >= maxDegradationSteps) return;
    
    entry.degradationStep++;
    
    // Apply sampling bias
    applySamplingBiasForEntry(entry);
    
    // Apply lossy compression
    applyLossyCompressionForEntry(entry);
    
    // Apply noise injection
    applyNoiseInjectionForEntry(entry);
    
    // Apply censorship
    applyCensorshipForEntry(entry);
    
    // Normalize Q after degradation
    let sumQ = entry.Q.reduce((a, b) => a + b, 0);
    if (sumQ > 0) {
        entry.Q = entry.Q.map(q => q / sumQ);
        // Update probabilities in qWords
        for (let i = 0; i < entry.qWords.length; i++) {
            entry.qWords[i].prob = entry.Q[i];
        }
    }
    
    // Calculate KL divergence field for this entry
    calculateKLFieldForEntry(entry);
}

function applySamplingBiasForEntry(entry) {
    // Bias towards certain regions (center bias) - only on overlapping words for this entry
    for (let i = 0; i < entry.Q.length; i++) {
        let word = entry.qWords[i];
        let centerX = width / 2;
        let centerY = height / 2;
        let dist = sqrt((word.x - centerX) ** 2 + (word.y - centerY) ** 2);
        let maxDist = sqrt(centerX ** 2 + centerY ** 2);
        let bias = 1 - (dist / maxDist) * samplingBias;
        entry.Q[i] *= bias;
    }
}

function applyLossyCompressionForEntry(entry) {
    // Quantize values (lossy compression) - only on overlapping words for this entry
    // Make compression less aggressive to prevent Q from disappearing
    let quantizationLevels = 8;
    // Time-dependent compression: less aggressive early, more later
    let timeBasedLoss = compressionLoss * (1 + entry.degradationStep * 0.01); // Gradually increase
    let actualLoss = min(timeBasedLoss, 0.12); // Cap at 12% to prevent total loss
    
    for (let i = 0; i < entry.Q.length; i++) {
        entry.Q[i] = floor(entry.Q[i] * quantizationLevels) / quantizationLevels;
        entry.Q[i] *= (1 - actualLoss);
        entry.Q[i] = max(entry.Q[i], 0.0001); // Ensure minimum value to prevent complete disappearance
    }
}

function applyNoiseInjectionForEntry(entry) {
    // Add random noise - only on overlapping words for this entry
    for (let i = 0; i < entry.Q.length; i++) {
        entry.Q[i] += random(-noiseLevel, noiseLevel);
        entry.Q[i] = max(0, entry.Q[i]); // Ensure non-negative
    }
}

function applyCensorshipForEntry(entry) {
    // Apply censorship with probability - only on overlapping words for this entry
    // Make it time-dependent: more censorship over time, but not all at once
    let timeBasedCensorshipProb = min(censorshipProbability * (1 + entry.degradationStep * 0.02), 0.6);
    
    for (let region of censorshipRegions) {
        for (let i = 0; i < entry.qWords.length; i++) {
            let word = entry.qWords[i];
            if (word.x >= region.x && word.x <= region.x + region.w &&
                word.y >= region.y && word.y <= region.y + region.h) {
                // Apply censorship with probability, and make it partial (not complete zero)
                if (random() < timeBasedCensorshipProb) {
                    entry.Q[i] *= 0.1; // Reduce to 10% instead of zeroing completely
                }
            }
        }
    }
}

function calculateKLFieldForEntry(entry) {
    // Damage(i) = P(i) * log(P(i) / Q(i)) * exp(klTimeExponent * t)
    // Exponential time factor amplifies loss over time
    // Only calculate for overlapping words for this entry
    entry.klField = [];
    
    // Calculate exponential time factor: exp(klTimeExponent * degradationStep)
    // This grows exponentially with degradation steps for THIS entry
    let timeFactor = exp(klTimeExponent * entry.degradationStep);
    
    // Initialize all to 0
    for (let i = 0; i < P.length; i++) {
        entry.klField[i] = 0;
    }
    
    // Calculate KL only for overlapping words in this entry
    for (let i = 0; i < entry.qWords.length; i++) {
        let qWord = entry.qWords[i];
        let pIndex = qWord.pIndex;
        let pProb = P[pIndex];
        let qProb = entry.Q[i];
        
        if (qProb > 0 && pProb > 0) {
            // Base KL divergence
            let baseKL = pProb * log(pProb / qProb);
            // Apply exponential time factor to amplify loss
            entry.klField[pIndex] = baseKL * klBaseMultiplier * timeFactor;
        } else if (pProb > 0) {
            // For censored words (Q = 0), KL is already infinity
            entry.klField[pIndex] = Infinity; // Handle division by zero
        }
    }
}

function draw() {
    background(0);
    
    // Apply degradation over time for each entry independently
    // Higher number = slower degradation (applies every 60 frames = ~1 second at 60fps)
    if (frameCount % 60 == 0) {
        for (let entry of inputEntries) {
            if (entry.degradationStep < maxDegradationSteps) {
                applyDegradationForEntry(entry);
            }
        }
    }
    
    // Layer 1: Truth (P) - Light grey words
    drawLayer1();
    
    // Layer 2: Model (Q) - HIDDEN (only showing destruction/distortion)
    // if (userInput !== "") {
    //     drawLayer2();
    // }
    
    // Layer 3: KL Field - Primary Visual (destruction/distortion effects only)
    // Draw effects for all entries independently
    for (let entry of inputEntries) {
        drawLayer3ForEntry(entry);
    }
}

function drawLayer1() {
    // Draw P words in dimmed light grey with custom font
    push();
    fill(200, 200, 200, 50); // Very dim: ~20% opacity (reduced from 80/31%)
    noStroke();
    textAlign(LEFT, BASELINE);
    textFont('Doto, sans-serif'); // Apply custom font
    
    for (let i = 0; i < pWords.length; i++) {
        let word = pWords[i];
        textSize(word.fontSize);
        text(word.word, word.x, word.y);
    }
    pop();
}

// drawLayer2 removed - only showing destruction effects (Layer 3)

function drawLayer3ForEntry(entry) {
    // Draw KL Field effects on words for a specific entry
    // Map KL divergence to:
    // - Text fragmentation
    // - Character displacement
    // - Opacity changes
    
    if (entry.qWords.length === 0) return;
    
    // Get finite KL values only from overlapping words in this entry
    let finiteKLs = [];
    for (let i = 0; i < entry.qWords.length; i++) {
        let pIndex = entry.qWords[i].pIndex;
        let kl = entry.klField[pIndex];
        if (isFinite(kl) && kl > 0) {
            finiteKLs.push(kl);
        }
    }
    
    let maxKL = finiteKLs.length > 0 ? max(finiteKLs) : 0.001;
    if (maxKL == 0) maxKL = 0.001;
    
    push();
    textAlign(LEFT, BASELINE);
    
    // Only process overlapping words for this entry
    for (let i = 0; i < entry.qWords.length; i++) {
        let qWord = entry.qWords[i];
        let pIndex = qWord.pIndex;
        let kl = entry.klField[pIndex];
        
        if (!isFinite(kl) || kl < 0) {
            kl = maxKL * 1.5;
        }
        
        let normalizedKL = min(kl / maxKL, 1.0);
        
        // Draw effects for all words with KL > 0 (even small values show some effect)
        if (normalizedKL > 0) {
            // Time-based entropy factor: makes chaos increase over time for THIS entry
            let timeEntropyFactor = 1 + (entry.degradationStep / maxDegradationSteps) * 1; // 1x to 2x over time (reduced)
            let entropyKL = normalizedKL * timeEntropyFactor;
            let clampedEntropyKL = min(entropyKL, 1.0);
            
            // Map to visual effects with time-based amplification
            // Opacity decreases over time (harder to see) - entropy effect
            let baseIntensity = map(clampedEntropyKL, 0, 1, 150, 255);
            let timeBasedOpacity = baseIntensity * (1 - entry.degradationStep / maxDegradationSteps * 0.5); // Fade over time
            let intensity = constrain(timeBasedOpacity, 50, 255);
            
            // Displacement increases over time (more chaotic)
            // Start small, grow gradually over time
            let baseDisplacement = clampedEntropyKL * 8; // Smaller initial displacement
            // Slower growth: starts at 1x, grows to ~2.5x at max steps (reduced multiplier)
            let timeMultiplier = 1 + (entry.degradationStep / maxDegradationSteps) * 1.5; // 1x to 2.5x over time (reduced)
            let displacement = baseDisplacement * timeMultiplier;
            
            // Get the correct word position (individual word within concatenated string)
            let wordX = qWord.x;
            if (qWord.wordPosition) {
                wordX = qWord.wordPosition.x;
            }
            
            // Add time-based flicker for entropy effect (makes it harder to see)
            let flicker = sin(frameCount * 0.1 + wordX * 0.01) * (entry.degradationStep / maxDegradationSteps) * 30;
            intensity += flicker;
            intensity = constrain(intensity, 30, 255);
            
            textSize(qWord.fontSize);
            textFont('Doto, sans-serif'); // Apply custom font
            fill(255, intensity);
            noStroke();
            
            // Displace characters with time-based chaos
            // Add more chaotic displacement over time
            let chaosX = sin(wordX * 0.1 + frameCount * 0.01) * displacement;
            let chaosY = cos(qWord.y * 0.1 + frameCount * 0.015) * displacement;
            // Add per-character random scatter that increases dramatically over time
            let scatterAmount = entry.degradationStep * 0.8; // Reduced scatter over time
            
            // Draw word with displacement and fragmentation
            // Fragmentation: higher KL + time = more characters missing
            let chars = qWord.word.split('');
            let charX = wordX + chaosX;
            for (let j = 0; j < chars.length; j++) {
                // Fragmentation probability increases with KL and time
                let baseFragmentProb = clampedEntropyKL * 0.5;
                let timeFragmentBoost = (entry.degradationStep / maxDegradationSteps) * 0.15; // Up to 15% more fragmentation (reduced)
                let fragmentProb = min(baseFragmentProb + timeFragmentBoost, 0.8); // Cap at 80% missing
                
                // Per-character scatter (increases over time)
                let charScatterX = random(-scatterAmount, scatterAmount);
                let charScatterY = random(-scatterAmount, scatterAmount);
                
                if (random() > fragmentProb) { // Draw character if random > fragmentProb
                    // Apply per-character displacement for more chaos
                    text(chars[j], charX + charScatterX, qWord.y + chaosY + charScatterY);
                }
                // Always advance charX to maintain spacing even if character is missing
                charX += textWidth(chars[j]);
            }
        }
    }
    
    pop();
}

function windowResized() {
    resizeCanvas(windowWidth, windowHeight);
    // Reinitialize P distribution with new dimensions
    initializePDistribution();
    // Reinitialize all entries with new dimensions
    // Note: This will reset entries, but in a real app you might want to preserve them
    // For now, we'll clear entries on resize
    inputEntries = [];
    nextEntryId = 0;
    accumulatedWords = [];
    userInput = "";
    initializeCensorship();
}