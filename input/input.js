import { createInputBridge, normalizeUserInputText } from '../bridge.js';

const INPUT_CONFIG = {
  project: 'destruction',
  broadcastChannel: 'destruction-kl-input',
};

const textInput = document.getElementById('textInput');
const typewriterEl = document.getElementById('typewriter');
const bridge = createInputBridge(INPUT_CONFIG);

const PROMPTS = [
  'how do you feel',
  'what do you like',
  'anything',
  'who you are',
  'where you are from'
];

function submitEntry(chunk) {
  const normalized = normalizeUserInputText(chunk);
  if (!normalized.length) return;
  bridge.send(normalized);
  textInput.value = '';
}

textInput.addEventListener('keydown', (e) => {
  if (e.key === 'Enter' && !e.shiftKey) {
    e.preventDefault();
    const line = textInput.value;
    if (line.trim().length) {
      submitEntry(line);
    }
  }
});

function startTypewriter(el, phrases) {
  let phraseIndex = 0;
  let charIndex = 0;
  let deleting = false;

  const typeMs = 85;
  const deleteMs = 45;
  const pauseMs = 1800;

  const tick = () => {
    const phrase = phrases[phraseIndex];

    if (!deleting) {
      charIndex += 1;
      el.textContent = phrase.slice(0, charIndex);

      if (charIndex >= phrase.length) {
        deleting = true;
        setTimeout(tick, pauseMs);
        return;
      }
      setTimeout(tick, typeMs);
      return;
    }

    charIndex -= 1;
    el.textContent = phrase.slice(0, charIndex);

    if (charIndex <= 0) {
      deleting = false;
      phraseIndex = (phraseIndex + 1) % phrases.length;
      setTimeout(tick, typeMs);
      return;
    }
    setTimeout(tick, deleteMs);
  };

  tick();
}

startTypewriter(typewriterEl, PROMPTS);
