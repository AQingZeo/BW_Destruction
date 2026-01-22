// Input Handler - Manages text input UI and user interaction
// This file handles all input-related UI logic and delegates processing to a callback

let inputHandler = {
    // Callback function to be set by sketch.js
    onInputSubmit: null,
    
    // Initialize the text input UI
    setup: function(onSubmitCallback) {
        this.onInputSubmit = onSubmitCallback;
        
        let input = select('#textInput');
        let ui = select('#ui');
        
        if (input && ui) {
            // Handle Enter key
            input.elt.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') {
                    let userInput = input.value();
                    if (this.onInputSubmit) {
                        this.onInputSubmit(userInput);
                    }
                    input.value('');
                }
            });
            
            // Show UI on focus
            input.elt.addEventListener('focus', () => {
                ui.elt.classList.add('active');
            });
            
            // Hide UI on blur (after a short delay, unless hovering)
            input.elt.addEventListener('blur', () => {
                setTimeout(() => {
                    if (document.activeElement !== input.elt && !ui.elt.matches(':hover')) {
                        ui.elt.classList.remove('active');
                    }
                }, 300);
            });
            
            // Show UI when mouse moves near top-left corner
            let hideTimer;
            document.addEventListener('mousemove', (e) => {
                clearTimeout(hideTimer);
                if (e.clientX < 350 && e.clientY < 100) {
                    ui.elt.classList.add('active');
                } else {
                    // Hide after mouse leaves the area (unless focused or hovering)
                    if (document.activeElement !== input.elt) {
                        hideTimer = setTimeout(() => {
                            if (!ui.elt.matches(':hover') && !ui.elt.matches(':focus-within')) {
                                ui.elt.classList.remove('active');
                            }
                        }, 1000);
                    }
                }
            });
        }
    },
    
    // Clear the input field (useful for reset)
    clear: function() {
        let input = select('#textInput');
        if (input) {
            input.value('');
        }
    }
};
