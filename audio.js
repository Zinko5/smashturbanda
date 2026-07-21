// Web Audio API Context for Synthesis
let audioCtx = null;
let sfxVolume = 0.15;

function initAudio() {
    if (!audioCtx) {
        audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    }
}

function playSynthSound(type) {
    if (!audioCtx) return;
    if (audioCtx.state === 'suspended') {
        audioCtx.resume();
    }

    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.connect(gain);
    gain.connect(audioCtx.destination);

    const now = audioCtx.currentTime;
    gain.gain.setValueAtTime(sfxVolume * 0.4, now);

    if (type === 'jump') {
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(150, now);
        osc.frequency.exponentialRampToValueAtTime(600, now + 0.15);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.15);
        osc.start(now);
        osc.stop(now + 0.15);
    } else if (type === 'hit') {
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(400, now);
        osc.frequency.setValueAtTime(100, now + 0.05);
        gain.gain.setValueAtTime(sfxVolume * 0.6, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.1);
        osc.start(now);
        osc.stop(now + 0.1);
    } else if (type === 'heavy_hit') {
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(200, now);
        osc.frequency.exponentialRampToValueAtTime(60, now + 0.25);
        gain.gain.setValueAtTime(sfxVolume * 0.8, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.3);
        osc.start(now);
        osc.stop(now + 0.3);
    } else if (type === 'explosion') {
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(120, now);
        osc.frequency.exponentialRampToValueAtTime(40, now + 0.2);
        gain.gain.setValueAtTime(sfxVolume * 0.35, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.25);
        osc.start(now);
        osc.stop(now + 0.25);
    } else if (type === 'shield') {
        osc.type = 'sine';
        osc.frequency.setValueAtTime(800, now);
        osc.frequency.linearRampToValueAtTime(400, now + 0.1);
        gain.gain.setValueAtTime(sfxVolume * 0.3, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.1);
        osc.start(now);
        osc.stop(now + 0.1);
    } else if (type === 'shield_break') {
        osc.type = 'square';
        osc.frequency.setValueAtTime(880, now);
        osc.frequency.setValueAtTime(440, now + 0.08);
        osc.frequency.setValueAtTime(220, now + 0.16);
        gain.gain.setValueAtTime(sfxVolume * 0.6, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.3);
        osc.start(now);
        osc.stop(now + 0.3);
    } else if (type === 'death') {
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(600, now);
        osc.frequency.linearRampToValueAtTime(50, now + 0.6);
        gain.gain.setValueAtTime(sfxVolume * 0.8, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.6);
        osc.start(now);
        osc.stop(now + 0.6);
    } else if (type === 'shoot') {
        osc.type = 'sine';
        osc.frequency.setValueAtTime(300, now);
        osc.frequency.exponentialRampToValueAtTime(900, now + 0.1);
        gain.gain.setValueAtTime(sfxVolume * 0.2, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.1);
        osc.start(now);
        osc.stop(now + 0.1);
    }
}

function playSoundFile(filePath, durationMs = null) {
    try {
        const audio = new Audio(filePath);
        audio.volume = sfxVolume;
        audio.play().catch(e => console.warn("Failed to play sound file:", e));

        if (durationMs) {
            setTimeout(() => {
                // Smooth fade out before pausing
                let fadeInterval = setInterval(() => {
                    if (audio.volume > 0.02) {
                        audio.volume = Math.max(0, audio.volume - 0.02);
                    } else {
                        clearInterval(fadeInterval);
                        audio.pause();
                    }
                }, 30);
            }, durationMs);
        }
    } catch (e) {
        console.warn("Error playing sound file:", e);
    }
}

// Menu Background Music Manager
let menuMusic = null;

function playMenuMusic() {
    try {
        if (!menuMusic) {
            menuMusic = new Audio('sound/main-theme.mp3');
            menuMusic.loop = true;
        }
        menuMusic.volume = sfxVolume;
        if (menuMusic.paused) {
            menuMusic.play().catch(e => {
                console.warn("Autoplay prevented for menu music:", e);
            });
        }
    } catch (e) {
        console.warn("Error playing menu music:", e);
    }
}

function stopMenuMusic() {
    if (menuMusic) {
        menuMusic.pause();
        menuMusic.currentTime = 0;
    }
}

function updateMenuMusicVolume() {
    if (menuMusic) {
        menuMusic.volume = sfxVolume;
    }
}

// Enable Audio & Menu Music on User Interaction
function enableMenuMusicOnInteraction() {
    const handleStart = () => {
        initAudio();
        if (typeof gameEngine === 'undefined' || !gameEngine.running) {
            playMenuMusic();
        }
        window.removeEventListener('click', handleStart);
        window.removeEventListener('keydown', handleStart);
    };
    window.addEventListener('click', handleStart);
    window.addEventListener('keydown', handleStart);
}

// Try to play immediately; if autoplay is blocked, fall back to first interaction
(function tryAutoplayMenuMusic() {
    try {
        if (!menuMusic) {
            menuMusic = new Audio('sound/main-theme.mp3');
            menuMusic.loop = true;
        }
        menuMusic.volume = sfxVolume;
        menuMusic.play().then(() => {
            // Autoplay succeeded, no need for the interaction fallback
        }).catch(() => {
            // Blocked by browser policy — wait for first user interaction
            enableMenuMusicOnInteraction();
        });
    } catch (e) {
        enableMenuMusicOnInteraction();
    }
})();
