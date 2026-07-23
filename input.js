// Control Keys Configuration
let controls = {
    p1: {
        left: 'KeyA',
        right: 'KeyD',
        up: 'KeyW',
        down: 'KeyS',
        jump: 'KeyW', // Also support double tap up or separate jump button
        attackA: 'KeyJ',
        attackB: 'KeyK',
        shield: 'KeyL',
        grab: 'KeyU'
    },
    p2: {
        left: 'ArrowLeft',
        right: 'ArrowRight',
        up: 'ArrowUp',
        down: 'ArrowDown',
        jump: 'ArrowUp',
        attackA: 'Numpad1',
        attackB: 'Numpad2',
        shield: 'Numpad3',
        grab: 'Numpad0'
    }
};

// Fallback keyboard alternative keys if Numpad doesn't exist
const alternateP2Controls = {
    left: 'ArrowLeft',
    right: 'ArrowRight',
    up: 'ArrowUp',
    down: 'ArrowDown',
    jump: 'ArrowUp',
    attackA: 'KeyZ',
    attackB: 'KeyX',
    shield: 'KeyC',
    grab: 'KeyV'
};

// Load settings if stored
try {
    const saved = localStorage.getItem('smashturbanda_settings');
    if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.controls) controls = parsed.controls;
        
        if (parsed.masterVolume !== undefined) {
            masterVolume = parsed.masterVolume;
        } else if (parsed.volume !== undefined) {
            masterVolume = parsed.volume;
        }
        
        if (parsed.musicVolume !== undefined) {
            musicVolume = parsed.musicVolume;
        }
        
        if (parsed.sfxVolume !== undefined) {
            sfxVolume = parsed.sfxVolume;
        }
    }
} catch (e) {
    console.warn("Could not load controls settings", e);
}

// Active keys state
const keysPressed = {};

window.addEventListener('keydown', (e) => {
    keysPressed[e.code] = true;
    initAudio(); // Initialize on user interaction
});

window.addEventListener('keyup', (e) => {
    keysPressed[e.code] = false;
});

// Update DOM slider values once loaded
document.addEventListener('DOMContentLoaded', () => {
    const sliderFloating = document.getElementById('volume-range-floating');
    if (sliderFloating) {
        sliderFloating.value = masterVolume;
    }
    const sliderMusic = document.getElementById('slider-music');
    if (sliderMusic) {
        sliderMusic.value = musicVolume;
    }
    const sliderSfx = document.getElementById('slider-sfx');
    if (sliderSfx) {
        sliderSfx.value = sfxVolume;
    }
});
