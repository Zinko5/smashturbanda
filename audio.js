// Web Audio API Context for Synthesis and Buffer Playback
let audioCtx = null;
let sfxVolume = 0.15;

// Audio buffer cache for preloaded effects (loaded & decoded in RAM)
const audioBuffers = {};

// Sound files registry - Only effects go here for RAM preloading
const SOUND_FILES = {
    'fernan-embestida': 'sound/efectos/fernan-embestida.mp3',
    'puma': 'sound/efectos/puma.mp3',
    'strike': 'sound/efectos/strike.mp3'
};

function initAudio() {
    if (!audioCtx) {
        audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    }
}

// Preload and decode all defined audio files in RAM (sound/efectos only)
async function preloadAudioFiles() {
    initAudio();
    for (const [key, path] of Object.entries(SOUND_FILES)) {
        if (audioBuffers[path]) continue;
        try {
            const response = await fetch(path);
            const arrayBuffer = await response.arrayBuffer();
            audioCtx.decodeAudioData(arrayBuffer, (decodedBuffer) => {
                audioBuffers[path] = decodedBuffer;
            }, (err) => {
                console.warn(`Error decoding audio file: ${path}`, err);
            });
        } catch (e) {
            console.warn(`Failed to fetch audio file: ${path}`, e);
        }
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
    if (!audioCtx) return;
    if (audioCtx.state === 'suspended') {
        audioCtx.resume();
    }

    const buffer = audioBuffers[filePath];
    if (!buffer) {
        // Fallback to HTML5 audio if not decoded yet
        try {
            const audio = new Audio(filePath);
            audio.volume = sfxVolume;
            audio.play().catch(e => console.warn("Failed to play sound file fallback:", e));
            if (durationMs) {
                setTimeout(() => {
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
            console.warn("Error playing fallback sound file:", e);
        }
        return;
    }

    try {
        const source = audioCtx.createBufferSource();
        source.buffer = buffer;
        const gainNode = audioCtx.createGain();
        gainNode.gain.setValueAtTime(sfxVolume, audioCtx.currentTime);
        source.connect(gainNode);
        gainNode.connect(audioCtx.destination);
        source.start(0);

        if (durationMs) {
            setTimeout(() => {
                gainNode.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.15);
                setTimeout(() => {
                    try { source.stop(); } catch (e) {}
                }, 150);
            }, durationMs);
        }
    } catch (e) {
        console.warn("Error playing audio buffer:", e);
    }
}

// Menu Background Music Manager (HTML5 Audio Streaming for long songs)
let menuMusic = null;

function playMenuMusic() {
    try {
        if (!menuMusic) {
            menuMusic = new Audio('sound/musica/main-theme.mp3');
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

// Enable Audio, preloading, and music on User Interaction
function enableMenuMusicOnInteraction() {
    const handleStart = () => {
        initAudio();
        preloadAudioFiles();
        if (typeof gameEngine === 'undefined' || !gameEngine.running) {
            playMenuMusic();
        }
        window.removeEventListener('click', handleStart);
        window.removeEventListener('keydown', handleStart);
    };
    window.addEventListener('click', handleStart);
    window.addEventListener('keydown', handleStart);
}

// Try autoplay immediately; if blocked, fall back to first interaction
(function tryAutoplayMenuMusic() {
    try {
        // Try playing immediately using HTML5 Audio (can succeed if browser allows)
        if (!menuMusic) {
            menuMusic = new Audio('sound/musica/main-theme.mp3');
            menuMusic.loop = true;
        }
        menuMusic.volume = sfxVolume;
        menuMusic.play().then(() => {
            // Autoplay succeeded, but still bind interaction to preload SFX
            const preloadOnAction = () => {
                preloadAudioFiles();
                window.removeEventListener('click', preloadOnAction);
                window.removeEventListener('keydown', preloadOnAction);
            };
            window.addEventListener('click', preloadOnAction);
            window.addEventListener('keydown', preloadOnAction);
        }).catch(() => {
            enableMenuMusicOnInteraction();
        });
    } catch (e) {
        enableMenuMusicOnInteraction();
    }
})();
