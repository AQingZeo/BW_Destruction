// KL Field Poster - Word Frequency Visualization
// Layer 1: Truth (P) - Words from frequency list in light grey
// Layer 2: Model (Q) - User input text, iteratively degraded
// Layer 3: KL Field - Primary visual: Damage(i) = P(i) * log(P(i)/Q(i))

// Word list from wordList.md (most frequently used words)
const wordList = [
    'say', 'get', 'make', 'go', 'know', 'think', 'see', 'come', 'want', 'look',
    'use', 'find', 'give', 'tell', 'work', 'call', 'try', 'ask', 'need', 'feel',
    'time', 'people', 'way', 'day', 'thing', 'man', 'woman', 'life', 'child', 'world',
    'school', 'state', 'family', 'student', 'group', 'problem', 'fact', 'hand', 'place', 'case',
    'good', 'new', 'first', 'last', 'long', 'great', 'little', 'own', 'other', 'old',
    'right', 'big', 'high', 'different', 'small', 'large', 'next', 'early', 'young', 'important',
    'very', 'really', 'just', 'only', 'even', 'still', 'already', 'often', 'always', 'usually'
];

let P = []; // Truth distribution (word frequencies)
let Q = []; // Model distribution (user input, degraded)
let klField = []; // KL divergence field

// Text layout
let pWords = []; // Array of {word, x, y, fontSize, prob}
let qWords = []; // Array of {word, x, y, fontSize, prob}
let userInput = "";

// Layout parameters
let minFontSize = 12;
let maxFontSize = 72;
let lineHeight = 1.2;
let margin = 20;

// Degradation parameters
let degradationStep = 0;
let maxDegradationSteps = 100;
let samplingBias = 0.1;
let compressionLoss = 0.15;
let noiseLevel = 0.05;
let censorshipRegions = [];

function setup() {
    let canvas = createCanvas(windowWidth, windowHeight);
    canvas.parent('canvas-container');
    
    // Setup text input
    setupTextInput();
    
    // Initialize P distribution with word list
    initializePDistribution();
    
    // Initialize Q with empty input (will be updated when user types)
    initializeQDistribution("");
    
    // Initialize censorship regions
    initializeCensorship();
    
    // Calculate initial KL field
    calculateKLField();
}

function setupTextInput() {
    // Input is created in HTML, just set up event listener
    let input = select('#textInput');
    let ui = select('#ui');
    if (input && ui) {
        // Handle Enter key
        input.elt.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') {
                userInput = input.value();
                processUserInput(userInput);
                input.value('');
            }
        });
        
        // Show UI on focus
        input.elt.addEventListener('focus', function() {
            ui.elt.classList.add('active');
        });
        
        // Hide UI on blur (after a short delay, unless hovering)
        input.elt.addEventListener('blur', function() {
            setTimeout(function() {
                if (document.activeElement !== input.elt && !ui.elt.matches(':hover')) {
                    ui.elt.classList.remove('active');
                }
            }, 300);
        });
        
        // Show UI when mouse moves near top-left corner
        let hideTimer;
        document.addEventListener('mousemove', function(e) {
            clearTimeout(hideTimer);
            if (e.clientX < 350 && e.clientY < 100) {
                ui.elt.classList.add('active');
            } else {
                // Hide after mouse leaves the area (unless focused or hovering)
                if (document.activeElement !== input.elt) {
                    hideTimer = setTimeout(function() {
                        if (!ui.elt.matches(':hover') && !ui.elt.matches(':focus-within')) {
                            ui.elt.classList.remove('active');
                        }
                    }, 1000);
                }
            }
        });
    }
}

function initializePDistribution() {
    // Create P: fill screen with words from wordList
    // Prioritize font size, choose words randomly
    
    pWords = [];
    let currentY = margin;
    let currentX = margin;
    let shuffledWords = [...wordList].sort(() => random() - 0.5); // Randomize word order
    let wordIndex = 0;
    
    // Calculate word frequencies (simple: equal weight for now, can be adjusted)
    let wordFreq = {};
    wordList.forEach(word => {
        wordFreq[word] = 1.0 / wordList.length;
    });
    
    // Fill page with words
    textSize(maxFontSize); // Set initial size for measurement
    while (currentY < height - margin && wordIndex < shuffledWords.length * 20) {
        let word = shuffledWords[wordIndex % shuffledWords.length];
        let capitalizedWord = word.charAt(0).toUpperCase() + word.slice(1);
        
        // Determine font size (prioritize larger sizes, but vary)
        let fontSize = random(minFontSize, maxFontSize);
        textSize(fontSize);
        let wordWidth = textWidth(capitalizedWord);
        
        // Check if word fits on current line
        if (currentX + wordWidth > width - margin) {
            // Move to next line
            let maxFontOnLine = 0;
            // Find max font size on current line to determine line height
            for (let j = pWords.length - 1; j >= 0; j--) {
                if (pWords[j].y === currentY) {
                    maxFontOnLine = max(maxFontOnLine, pWords[j].fontSize);
                } else {
                    break;
                }
            }
            currentY += (maxFontOnLine > 0 ? maxFontOnLine : fontSize) * lineHeight;
            currentX = margin;
            
            if (currentY >= height - margin) break;
        }
        
        // Store word position and properties
        let prob = wordFreq[word] || 0.0001;
        pWords.push({
            word: capitalizedWord,
            x: currentX,
            y: currentY,
            fontSize: fontSize,
            prob: prob
        });
        
        // Update position (no space between words)
        currentX += wordWidth;
        
        wordIndex++;
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
        userInput = "";
        initializeQDistribution("");
        calculateKLField();
        return;
    }
    
    userInput = inputText;
    
    // Parse user input into words (remove punctuation, lowercase)
    let inputWords = inputText.toLowerCase()
        .replace(/[^\w\s]/g, ' ')
        .split(/\s+/)
        .filter(w => w.length > 0);
    
    // Count word frequencies in input
    let inputFreq = {};
    inputWords.forEach(word => {
        inputFreq[word] = (inputFreq[word] || 0) + 1;
    });
    
    // Normalize input frequencies
    let total = inputWords.length;
    if (total > 0) {
        Object.keys(inputFreq).forEach(word => {
            inputFreq[word] = inputFreq[word] / total;
        });
    }
    
    // Create Q distribution matching P layout
    initializeQDistribution(inputText, inputFreq);
    
    // Reset degradation
    degradationStep = 0;
    
    // Apply initial degradation
    applyDegradation();
    applyDegradation();
    
    // Calculate KL field
    calculateKLField();
}

function initializeQDistribution(inputText, inputFreq = {}) {
    // Create Q words matching P layout positions
    qWords = [];
    
    if (Object.keys(inputFreq).length === 0) {
        // No input, set Q to very small values
        for (let i = 0; i < pWords.length; i++) {
            qWords.push({
                word: pWords[i].word,
                x: pWords[i].x,
                y: pWords[i].y,
                fontSize: pWords[i].fontSize,
                prob: 0.0001
            });
        }
    } else {
        for (let i = 0; i < pWords.length; i++) {
            let pWord = pWords[i];
            let wordKey = pWord.word.toLowerCase();
            
            // Get frequency from input, or use small default
            let freq = inputFreq[wordKey] || 0.0001;
            
            qWords.push({
                word: pWord.word,
                x: pWord.x,
                y: pWord.y,
                fontSize: pWord.fontSize,
                prob: freq
            });
        }
    }
    
    // Create Q distribution array
    Q = qWords.map(q => q.prob);
    
    // Normalize Q
    let sumQ = Q.reduce((a, b) => a + b, 0);
    if (sumQ > 0) {
        Q = Q.map(q => q / sumQ);
        // Update probabilities in qWords
        for (let i = 0; i < qWords.length; i++) {
            qWords[i].prob = Q[i];
        }
    } else {
        // If sum is 0, set all to equal small values
        let smallVal = 1.0 / Q.length;
        Q = Q.map(() => smallVal);
        for (let i = 0; i < qWords.length; i++) {
            qWords[i].prob = smallVal;
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

function applyDegradation() {
    if (degradationStep >= maxDegradationSteps) return;
    
    degradationStep++;
    
    // Apply sampling bias
    applySamplingBias();
    
    // Apply lossy compression
    applyLossyCompression();
    
    // Apply noise injection
    applyNoiseInjection();
    
    // Apply censorship
    applyCensorship();
    
    // Normalize Q after degradation
    let sumQ = Q.reduce((a, b) => a + b, 0);
    if (sumQ > 0) {
        Q = Q.map(q => q / sumQ);
        // Update probabilities in qWords
        for (let i = 0; i < qWords.length; i++) {
            qWords[i].prob = Q[i];
        }
    }
    
    // Calculate KL divergence field
    calculateKLField();
}

function applySamplingBias() {
    // Bias towards certain regions (center bias)
    for (let i = 0; i < Q.length; i++) {
        let word = qWords[i];
        let centerX = width / 2;
        let centerY = height / 2;
        let dist = sqrt((word.x - centerX) ** 2 + (word.y - centerY) ** 2);
        let maxDist = sqrt(centerX ** 2 + centerY ** 2);
        let bias = 1 - (dist / maxDist) * samplingBias;
        Q[i] *= bias;
    }
}

function applyLossyCompression() {
    // Quantize values (lossy compression)
    let quantizationLevels = 8;
    for (let i = 0; i < Q.length; i++) {
        Q[i] = floor(Q[i] * quantizationLevels) / quantizationLevels;
        Q[i] *= (1 - compressionLoss);
    }
}

function applyNoiseInjection() {
    // Add random noise
    for (let i = 0; i < Q.length; i++) {
        Q[i] += random(-noiseLevel, noiseLevel);
        Q[i] = max(0, Q[i]); // Ensure non-negative
    }
}

function applyCensorship() {
    // Zero out censorship regions
    for (let region of censorshipRegions) {
        for (let i = 0; i < qWords.length; i++) {
            let word = qWords[i];
            if (word.x >= region.x && word.x <= region.x + region.w &&
                word.y >= region.y && word.y <= region.y + region.h) {
                Q[i] = 0;
            }
        }
    }
}

function calculateKLField() {
    // Damage(i) = P(i) * log(P(i) / Q(i))
    klField = [];
    for (let i = 0; i < P.length; i++) {
        if (Q[i] > 0 && P[i] > 0) {
            klField[i] = P[i] * log(P[i] / Q[i]);
        } else if (P[i] > 0) {
            klField[i] = Infinity; // Handle division by zero
        } else {
            klField[i] = 0;
        }
    }
}

function draw() {
    background(0);
    
    // Apply degradation over time
    if (frameCount % 30 == 0 && degradationStep < maxDegradationSteps && userInput !== "") {
        applyDegradation();
    }
    
    // Layer 1: Truth (P) - Light grey words
    drawLayer1();
    
    // Layer 2: Model (Q) - User input words (if any)
    if (userInput !== "") {
        drawLayer2();
    }
    
    // Layer 3: KL Field - Primary Visual (fracture effects on words)
    if (userInput !== "") {
        drawLayer3();
    }
}

function drawLayer1() {
    // Draw P words in light grey
    push();
    fill(200, 200, 200, 100); // Light grey, semi-transparent
    noStroke();
    textAlign(LEFT, BASELINE);
    
    for (let i = 0; i < pWords.length; i++) {
        let word = pWords[i];
        textSize(word.fontSize);
        text(word.word, word.x, word.y);
    }
    pop();
}

function drawLayer2() {
    // Draw Q words (user input) - visible but may be degraded
    push();
    fill(255, 255, 255, 180);
    noStroke();
    textAlign(LEFT, BASELINE);
    
    for (let i = 0; i < qWords.length; i++) {
        let word = qWords[i];
        if (Q[i] > 0.0001) { // Only draw if probability is significant
            textSize(word.fontSize);
            // Fade based on degradation
            let alpha = map(Q[i], 0, max(Q), 100, 255);
            fill(255, 255, 255, alpha);
            text(word.word, word.x, word.y);
        }
    }
    pop();
}

function drawLayer3() {
    // Draw KL Field effects on words
    // Map KL divergence to:
    // - Text fragmentation
    // - Character displacement
    // - Opacity changes
    
    let finiteKLs = klField.filter(k => isFinite(k) && k > 0);
    let maxKL = finiteKLs.length > 0 ? max(finiteKLs) : 0.001;
    if (maxKL == 0) maxKL = 0.001;
    
    push();
    textAlign(LEFT, BASELINE);
    
    for (let i = 0; i < klField.length; i++) {
        let kl = klField[i];
        if (!isFinite(kl) || kl < 0) {
            kl = maxKL * 1.5;
        }
        
        let normalizedKL = min(kl / maxKL, 1.0);
        
        // Only draw effects if KL is significant
        if (normalizedKL > 0.1) {
            let word = qWords[i];
            let pWord = pWords[i];
            
            // Map to visual effects
            let intensity = map(normalizedKL, 0, 1, 0, 255);
            let displacement = normalizedKL * 10;
            
            // Draw fragmented/displaced characters
            if (normalizedKL > 0.3) {
                textSize(word.fontSize);
                fill(255, intensity * 0.8);
                noStroke();
                
                // Displace characters
                let offsetX = sin(word.x * 0.1) * displacement;
                let offsetY = cos(word.y * 0.1) * displacement;
                
                // Draw word with displacement and fragmentation
                let chars = word.word.split('');
                let charX = word.x + offsetX;
                for (let j = 0; j < chars.length; j++) {
                    if (random() > normalizedKL * 0.3) { // Some characters missing (fragmentation)
                        text(chars[j], charX, word.y + offsetY);
                    }
                    charX += textWidth(chars[j]);
                }
            }
        }
    }
    
    pop();
}

function windowResized() {
    resizeCanvas(windowWidth, windowHeight);
    // Reinitialize P distribution with new dimensions
    initializePDistribution();
    // Reinitialize Q if there's user input
    if (userInput !== "") {
        processUserInput(userInput);
    } else {
        initializeQDistribution("");
    }
    initializeCensorship();
    calculateKLField();
}