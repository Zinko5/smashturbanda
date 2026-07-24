// Control Keys Configuration
let controls = {
    p1: {
        left: 'KeyA',
        right: 'KeyD',
        up: 'KeyW',
        down: 'KeyS',
        jump: 'KeyW',
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
    },
    p3: {
        left: 'KeyF',
        right: 'KeyH',
        up: 'KeyT',
        down: 'KeyG',
        jump: 'KeyT',
        attackA: 'KeyY',
        attackB: 'KeyU',
        shield: 'KeyI',
        grab: 'KeyO'
    },
    p4: {
        left: 'Numpad4',
        right: 'Numpad6',
        up: 'Numpad8',
        down: 'Numpad5',
        jump: 'Numpad8',
        attackA: 'Numpad7',
        attackB: 'Numpad9',
        shield: 'NumpadDivide',
        grab: 'NumpadMultiply'
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

// Gamepad bindings: index = player slot (0-3), value = gamepad index or null
// gamepadBindings[0] = null means P1 uses no gamepad (keyboard only)
// gamepadBindings[0] = 0 means P1 uses gamepad at index 0
let gamepadBindings = [null, null, null, null];

// Gamepad button mapping for DualShock / standard gamepad
// Based on the W3C Gamepad API standard layout
const GAMEPAD_BUTTON_MAP = {
    jump: 0,       // Cross (×) / A
    attackA: 2,    // Square (□) / X
    attackB: 3,    // Triangle (△) / Y
    shield: 6,     // L2 / LT (analog trigger)
    grab: 5,       // R1 / RB
    // Extra alternatives
    shieldAlt: 4,  // L1 / LB
    start: 9,      // Options / Start
    select: 8,     // Share / Back
};

// Axis thresholds
const AXIS_THRESHOLD = 0.35;

// Load settings if stored
try {
    const saved = localStorage.getItem('smashturbanda_settings');
    if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.controls) {
            // Merge saved controls, preserving defaults for missing keys
            controls.p1 = { ...controls.p1, ...(parsed.controls.p1 || {}) };
            controls.p2 = { ...controls.p2, ...(parsed.controls.p2 || {}) };
            controls.p3 = { ...controls.p3, ...(parsed.controls.p3 || {}) };
            controls.p4 = { ...controls.p4, ...(parsed.controls.p4 || {}) };
        }
        if (parsed.gamepadBindings) {
            gamepadBindings = parsed.gamepadBindings;
        }
        
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

// =============================================
// Gamepad API System
// =============================================

// Cache of previous gamepad button states (for edge detection)
const gamepadPrevStates = {}; // keyed by gamepad index

/**
 * Get connected gamepads from the browser.
 * Returns an array where index = gamepad slot, value = Gamepad or null.
 */
function getConnectedGamepads() {
    if (!navigator.getGamepads) return [];
    return Array.from(navigator.getGamepads());
}

/**
 * Read the digital state of a gamepad given its index.
 * Returns an object: { left, right, up, down, jump, attackA, attackB, shield, grab, anyButton }
 */
function readGamepadState(gamepadIndex) {
    const gamepads = getConnectedGamepads();
    const gp = gamepads[gamepadIndex];
    if (!gp || !gp.connected) return null;

    const b = gp.buttons;
    const axes = gp.axes;

    // D-Pad (buttons 12-15 on standard layout)
    const dpadUp    = b[12] && b[12].pressed;
    const dpadDown  = b[13] && b[13].pressed;
    const dpadLeft  = b[14] && b[14].pressed;
    const dpadRight = b[15] && b[15].pressed;

    // Analog sticks (axes 0=LX, 1=LY)
    const stickLeft  = axes[0] !== undefined && axes[0] < -AXIS_THRESHOLD;
    const stickRight = axes[0] !== undefined && axes[0] > AXIS_THRESHOLD;
    const stickUp    = axes[1] !== undefined && axes[1] < -AXIS_THRESHOLD;
    const stickDown  = axes[1] !== undefined && axes[1] > AXIS_THRESHOLD;

    const left   = stickLeft  || dpadLeft;
    const right  = stickRight || dpadRight;
    const up     = stickUp    || dpadUp;
    const down   = stickDown  || dpadDown;

    const jump    = (b[GAMEPAD_BUTTON_MAP.jump]    && b[GAMEPAD_BUTTON_MAP.jump].pressed)    || up;
    const attackA = (b[GAMEPAD_BUTTON_MAP.attackA] && b[GAMEPAD_BUTTON_MAP.attackA].pressed);
    const attackB = (b[GAMEPAD_BUTTON_MAP.attackB] && b[GAMEPAD_BUTTON_MAP.attackB].pressed);
    const shield  = (b[GAMEPAD_BUTTON_MAP.shield]  && b[GAMEPAD_BUTTON_MAP.shield].value > 0.1) ||
                    (b[GAMEPAD_BUTTON_MAP.shieldAlt] && b[GAMEPAD_BUTTON_MAP.shieldAlt].pressed);
    const grab    = (b[GAMEPAD_BUTTON_MAP.grab]    && b[GAMEPAD_BUTTON_MAP.grab].pressed);

    // anyButton: any face button or direction pressed (for CSS selection detection)
    let anyButton = left || right || up || down;
    for (let i = 0; i < Math.min(b.length, 16); i++) {
        if (b[i] && b[i].pressed) { anyButton = true; break; }
    }

    return { left, right, up, down, jump, attackA, attackB, shield, grab, anyButton };
}

/**
 * Get combined input state for a player slot (0-indexed).
 * Merges keyboard state and gamepad state with OR logic.
 * playerSlot: 0=P1, 1=P2, 2=P3, 3=P4
 */
function getPlayerInputState(playerSlot) {
    const pKey = `p${playerSlot + 1}`; // 'p1', 'p2', 'p3', 'p4'
    const layout = controls[pKey] || controls.p1;

    // Keyboard state
    const kb = {
        left:    keysPressed[layout.left]    || false,
        right:   keysPressed[layout.right]   || false,
        up:      keysPressed[layout.up]      || false,
        down:    keysPressed[layout.down]    || false,
        jump:    keysPressed[layout.jump]    || false,
        attackA: keysPressed[layout.attackA] || false,
        attackB: keysPressed[layout.attackB] || false,
        shield:  keysPressed[layout.shield]  || false,
        grab:    keysPressed[layout.grab]    || false,
    };

    // Gamepad state
    const gpIndex = gamepadBindings[playerSlot];
    if (gpIndex !== null && gpIndex !== undefined) {
        const gp = readGamepadState(gpIndex);
        if (gp) {
            return {
                left:    kb.left    || gp.left,
                right:   kb.right   || gp.right,
                up:      kb.up      || gp.up,
                down:    kb.down    || gp.down,
                jump:    kb.jump    || gp.jump,
                attackA: kb.attackA || gp.attackA,
                attackB: kb.attackB || gp.attackB,
                shield:  kb.shield  || gp.shield,
                grab:    kb.grab    || gp.grab,
            };
        }
    }

    return kb;
}

/**
 * Detect which player slot (0-3) is pressing any button on a gamepad.
 * Returns the player slot index, or -1 if none.
 * Used to auto-detect who is selecting in the CSS.
 */
function detectActiveGamepadPlayer() {
    const gamepads = getConnectedGamepads();
    for (let gpIdx = 0; gpIdx < gamepads.length; gpIdx++) {
        const gp = gamepads[gpIdx];
        if (!gp || !gp.connected) continue;

        // Find which player slot is bound to this gamepad
        const playerSlot = gamepadBindings.indexOf(gpIdx);
        if (playerSlot === -1) continue;

        const state = readGamepadState(gpIdx);
        if (state && state.anyButton) {
            // Check it's a new press (edge detection)
            const prev = gamepadPrevStates[gpIdx];
            if (!prev || !prev.anyButton) {
                return playerSlot;
            }
        }
    }
    return -1;
}

/**
 * Update previous gamepad states. Call once per frame or at detection time.
 */
function updateGamepadPrevStates() {
    const gamepads = getConnectedGamepads();
    for (let gpIdx = 0; gpIdx < gamepads.length; gpIdx++) {
        const gp = gamepads[gpIdx];
        if (!gp || !gp.connected) continue;
        const state = readGamepadState(gpIdx);
        gamepadPrevStates[gpIdx] = state;
    }
}

// Listen for gamepad connect/disconnect events
window.addEventListener('gamepadconnected', (e) => {
    console.log(`[Gamepad] Connected: ${e.gamepad.id} at index ${e.gamepad.index}`);
    // Notify the UI if it's ready
    if (typeof onGamepadConnected === 'function') {
        onGamepadConnected(e.gamepad);
    }
});

window.addEventListener('gamepaddisconnected', (e) => {
    console.log(`[Gamepad] Disconnected: ${e.gamepad.id} at index ${e.gamepad.index}`);
    // Clear any binding that pointed to this gamepad
    for (let i = 0; i < gamepadBindings.length; i++) {
        if (gamepadBindings[i] === e.gamepad.index) {
            gamepadBindings[i] = null;
        }
    }
    if (typeof onGamepadDisconnected === 'function') {
        onGamepadDisconnected(e.gamepad);
    }
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
