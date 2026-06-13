// KL Field Poster - Word Frequency Visualization
import { createInputBridge } from './bridge.js';

const INPUT_CONFIG = {
  project: 'destruction',
  broadcastChannel: 'destruction-kl-input',
};

let inputBridge;
const pendingInputTexts = [];
let posterReady = false;

function setupInputBridge() {
    inputBridge = createInputBridge(INPUT_CONFIG);
    inputBridge.onText((text) => {
        if (posterReady) {
            processUserInput(text);
        } else {
            pendingInputTexts.push(text);
        }
    });
}

setupInputBridge();

// Layer 1: Truth (P) - Words from frequency list in light grey
// Layer 2: Model (Q) - User input text, iteratively degraded
// Layer 3: KL Field - Primary visual: Damage(i) = P(i) * log(P(i)/Q(i))

let P = []; // Truth distribution (word frequencies)

// Text layout
let pWords = []; // Array of {word, x, y, fontSize, prob}
let customFont; // Google Font variable

// Input entries - each entry is placed at a random screen position
let inputEntries = []; // Array of {text, x, y, fontSize, chars, Q, klField, degradationStep, entryId}
let nextEntryId = 0;

// Layout parameters
let minFontSize = 32;
let maxFontSize = 32;
let lineHeight = 1.2;
let margin = 20;

// Degradation parameters
let maxDegradationSteps = 100;
let samplingBias = 0.1;
let compressionLoss = 0.08;
let noiseLevel = 0.05;
let censorshipRegions = [];
let censorshipProbability = 0.3;

let klTimeExponent = 0.01;
let klBaseMultiplier = 1.5;

function assertHttpRuntime() {
    if (window.location.protocol === 'file:') {
        console.error(
            'Destruction must be served over HTTP.\n' +
            'Relay: cd relay && npm start → http://localhost:8765/destruction/\n' +
            'Or: python -m http.server 8765 in Destruction/ (BroadcastChannel fallback)'
        );
    }
}

function setup() {
    assertHttpRuntime();

    let canvas = createCanvas(windowWidth, windowHeight);
    canvas.parent('canvas-container');

    textFont('Doto, sans-serif');

    posterReady = true;
    while (pendingInputTexts.length > 0) {
        processUserInput(pendingInputTexts.shift());
    }

    initializePDistribution();

    inputEntries = [];
    nextEntryId = 0;

    initializeCensorship();
}

function initializePDistribution() {
    pWords = [];

    let shuffledWords = [...wordList].sort(() => random() - 0.5);
    let wordIndex = 0;

    let wordFreq = {};
    wordList.forEach(word => {
        wordFreq[word] = 1.0 / wordList.length;
    });

    let startY = -height * 0.2;
    let endY = height * 1.2;
    let currentY = startY;

    let wordsOnScreen = new Set();

    while (currentY < endY) {
        let shiftAmount = random(-width * 0.3, -width * 0.1);
        let lineX = shiftAmount;

        let lineWords = [];
        let lineWordIndices = [];
        let maxFontOnLine = minFontSize;
        let wordsInCurrentLine = new Set();

        textSize(maxFontSize);

        let endX = width + width * 0.3;

        while (lineX < endX) {
            let word = null;
            let searchIndex = wordIndex;
            let attempts = 0;
            let maxAttempts = shuffledWords.length * 2;

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

            let isVisible = lineX >= -width * 0.1 && lineX <= width * 1.1 &&
                           currentY >= -height * 0.1 && currentY <= height * 1.1;

            if (isVisible) {
                wordsOnScreen.add(word);
            }

            lineX += textWidth(capitalizedWord);
        }

        let concatenatedString = lineWords.join('');

        textSize(maxFontOnLine);
        let avgProb = 0;
        for (let i = 0; i < lineWordIndices.length; i++) {
            let originalWord = lineWordIndices[i];
            avgProb += wordFreq[originalWord] || 0.0001;
        }
        avgProb = avgProb / lineWords.length;

        let wordPositions = [];
        let charOffset = 0;
        textSize(maxFontOnLine);
        let cumulativeWidth = 0;

        for (let w = 0; w < lineWords.length; w++) {
            let word = lineWords[w];
            let wordWidth = textWidth(word);
            let wordX = shiftAmount + cumulativeWidth;

            wordPositions.push({
                word: word,
                originalWord: lineWordIndices[w],
                startChar: charOffset,
                endChar: charOffset + word.length,
                x: wordX,
                width: wordWidth
            });
            charOffset += word.length;
            cumulativeWidth += wordWidth;
        }

        pWords.push({
            word: concatenatedString,
            x: shiftAmount,
            y: currentY,
            fontSize: maxFontOnLine,
            prob: avgProb,
            wordPositions: wordPositions
        });

        currentY += maxFontOnLine * lineHeight;
    }

    P = pWords.map(p => p.prob);

    let sumP = P.reduce((a, b) => a + b, 0);
    if (sumP > 0) {
        P = P.map(p => p / sumP);
        for (let i = 0; i < pWords.length; i++) {
            pWords[i].prob = P[i];
        }
    }
}

function randomEntryPosition(text, fontSize) {
    textSize(fontSize);
    let textW = textWidth(text);
    let minX = margin;
    let maxX = max(margin, width - margin - textW);
    let minY = margin + fontSize;
    let maxY = max(minY, height - margin);

    return {
        x: random(minX, maxX),
        y: random(minY, maxY)
    };
}

function processUserInput(inputText) {
    if (!inputText || inputText.trim() === "") {
        return;
    }

    let displayText = inputText.trim();
    if (displayText.length === 0) return;

    let fontSize = minFontSize;
    let position = randomEntryPosition(displayText, fontSize);

    let entryId = nextEntryId++;
    let entry = {
        entryId: entryId,
        text: displayText,
        x: position.x,
        y: position.y,
        fontSize: fontSize,
        chars: displayText.split(''),
        Q: [],
        klField: [],
        degradationStep: 0
    };

    initializeQDistributionForEntry(entry);

    applyDegradationForEntry(entry);
    applyDegradationForEntry(entry);

    calculateKLFieldForEntry(entry);

    inputEntries.push(entry);
}

function initializeQDistributionForEntry(entry) {
    let n = entry.chars.length;
    if (n === 0) {
        entry.Q = [];
        return;
    }

    let uniform = 1.0 / n;
    entry.Q = entry.chars.map(() => uniform);
}

function initializeCensorship() {
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

function getCharPosition(entry, charIndex) {
    textSize(entry.fontSize);
    let charX = entry.x;
    for (let i = 0; i < charIndex; i++) {
        charX += textWidth(entry.chars[i]);
    }
    return { x: charX, y: entry.y };
}

function applyDegradationForEntry(entry) {
    if (entry.degradationStep >= maxDegradationSteps) return;

    entry.degradationStep++;

    applySamplingBiasForEntry(entry);
    applyLossyCompressionForEntry(entry);
    applyNoiseInjectionForEntry(entry);
    applyCensorshipForEntry(entry);

    let sumQ = entry.Q.reduce((a, b) => a + b, 0);
    if (sumQ > 0) {
        entry.Q = entry.Q.map(q => q / sumQ);
    }

    calculateKLFieldForEntry(entry);
}

function applySamplingBiasForEntry(entry) {
    for (let i = 0; i < entry.Q.length; i++) {
        let centerX = width / 2;
        let centerY = height / 2;
        let dist = sqrt((entry.x - centerX) ** 2 + (entry.y - centerY) ** 2);
        let maxDist = sqrt(centerX ** 2 + centerY ** 2);
        let bias = 1 - (dist / maxDist) * samplingBias;
        entry.Q[i] *= bias;
    }
}

function applyLossyCompressionForEntry(entry) {
    let quantizationLevels = 8;
    let timeBasedLoss = compressionLoss * (1 + entry.degradationStep * 0.01);
    let actualLoss = min(timeBasedLoss, 0.12);

    for (let i = 0; i < entry.Q.length; i++) {
        entry.Q[i] = floor(entry.Q[i] * quantizationLevels) / quantizationLevels;
        entry.Q[i] *= (1 - actualLoss);
        entry.Q[i] = max(entry.Q[i], 0.0001);
    }
}

function applyNoiseInjectionForEntry(entry) {
    for (let i = 0; i < entry.Q.length; i++) {
        entry.Q[i] += random(-noiseLevel, noiseLevel);
        entry.Q[i] = max(0, entry.Q[i]);
    }
}

function applyCensorshipForEntry(entry) {
    let timeBasedCensorshipProb = min(censorshipProbability * (1 + entry.degradationStep * 0.02), 0.6);

    for (let region of censorshipRegions) {
        for (let i = 0; i < entry.chars.length; i++) {
            let pos = getCharPosition(entry, i);
            if (pos.x >= region.x && pos.x <= region.x + region.w &&
                pos.y >= region.y && pos.y <= region.y + region.h) {
                if (random() < timeBasedCensorshipProb) {
                    entry.Q[i] *= 0.1;
                }
            }
        }
    }
}

function calculateKLFieldForEntry(entry) {
    entry.klField = [];

    let n = entry.chars.length;
    if (n === 0) return;

    let uniformP = 1.0 / n;
    let timeFactor = exp(klTimeExponent * entry.degradationStep);

    for (let i = 0; i < n; i++) {
        let qProb = entry.Q[i];

        if (qProb > 0 && uniformP > 0) {
            let baseKL = uniformP * log(uniformP / qProb);
            entry.klField[i] = baseKL * klBaseMultiplier * timeFactor;
        } else if (uniformP > 0) {
            entry.klField[i] = Infinity;
        } else {
            entry.klField[i] = 0;
        }
    }
}

function draw() {
    background(0);

    if (frameCount % 60 == 0) {
        for (let entry of inputEntries) {
            if (entry.degradationStep < maxDegradationSteps) {
                applyDegradationForEntry(entry);
            }
        }
    }

    drawLayer1();

    for (let entry of inputEntries) {
        drawLayer3ForEntry(entry);
    }
}

function drawLayer1() {
    push();
    fill(200, 200, 200, 50);
    noStroke();
    textAlign(LEFT, BASELINE);
    textFont('Doto, sans-serif');

    for (let i = 0; i < pWords.length; i++) {
        let word = pWords[i];
        textSize(word.fontSize);
        text(word.word, word.x, word.y);
    }
    pop();
}

function drawLayer3ForEntry(entry) {
    if (entry.chars.length === 0) return;

    let finiteKLs = entry.klField.filter(kl => isFinite(kl) && kl > 0);
    let maxKL = finiteKLs.length > 0 ? max(finiteKLs) : 0.001;
    if (maxKL == 0) maxKL = 0.001;

    push();
    textAlign(LEFT, BASELINE);
    textSize(entry.fontSize);
    textFont('Doto, sans-serif');

    let timeEntropyFactor = 1 + (entry.degradationStep / maxDegradationSteps) * 1;
    let timeMultiplier = 1 + (entry.degradationStep / maxDegradationSteps) * 1.5;
    let scatterAmount = entry.degradationStep * 0.8;

    let chaosX = sin(entry.x * 0.1 + frameCount * 0.01) * timeMultiplier * 4;
    let chaosY = cos(entry.y * 0.1 + frameCount * 0.015) * timeMultiplier * 4;

    let charX = entry.x + chaosX;

    for (let j = 0; j < entry.chars.length; j++) {
        let kl = entry.klField[j];

        if (!isFinite(kl) || kl < 0) {
            kl = maxKL * 1.5;
        }

        let normalizedKL = min(kl / maxKL, 1.0);

        if (normalizedKL > 0) {
            let entropyKL = min(normalizedKL * timeEntropyFactor, 1.0);

            let baseIntensity = map(entropyKL, 0, 1, 150, 255);
            let timeBasedOpacity = baseIntensity * (1 - entry.degradationStep / maxDegradationSteps * 0.5);
            let intensity = constrain(timeBasedOpacity, 50, 255);

            let baseDisplacement = entropyKL * 8;
            let displacement = baseDisplacement * timeMultiplier;

            let flicker = sin(frameCount * 0.1 + charX * 0.01) * (entry.degradationStep / maxDegradationSteps) * 30;
            intensity += flicker;
            intensity = constrain(intensity, 30, 255);

            fill(255, intensity);
            noStroke();

            let baseFragmentProb = entropyKL * 0.5;
            let timeFragmentBoost = (entry.degradationStep / maxDegradationSteps) * 0.15;
            let fragmentProb = min(baseFragmentProb + timeFragmentBoost, 0.8);

            let charScatterX = random(-scatterAmount, scatterAmount);
            let charScatterY = random(-scatterAmount, scatterAmount);
            let charDisplacementX = sin(charX * 0.1 + j * 0.5) * displacement;
            let charDisplacementY = cos(entry.y * 0.1 + j * 0.3) * displacement;

            if (random() > fragmentProb) {
                text(
                    entry.chars[j],
                    charX + charScatterX + charDisplacementX,
                    entry.y + chaosY + charScatterY + charDisplacementY
                );
            }

            charX += textWidth(entry.chars[j]);
        } else {
            charX += textWidth(entry.chars[j]);
        }
    }

    pop();
}

function windowResized() {
    resizeCanvas(windowWidth, windowHeight);
    initializePDistribution();
    inputEntries = [];
    nextEntryId = 0;
    initializeCensorship();
}

window.setup = setup;
window.draw = draw;
window.windowResized = windowResized;
