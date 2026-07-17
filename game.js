// Virtual coordinates resolution (for physics calculations and scaling)
const V_WIDTH = 1200;
const V_HEIGHT = 800;

// Preload player custom head images
const headImages = {
    'Alex': new Image(),
    'Martín': new Image(),
    'Víctor': new Image(),
    'Gabriel': new Image()
};
headImages['Alex'].src = 'img/alex-jugador.png';
headImages['Martín'].src = 'img/martin-jugador.png';
headImages['Víctor'].src = 'img/victor-jugador.png';
headImages['Gabriel'].src = 'img/gabriel-jugador.png';

// Web Audio API Context for Synthesis
let audioCtx = null;
let sfxVolume = 0.7;

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
        if (parsed.volume !== undefined) {
            sfxVolume = parsed.volume;
            document.getElementById('slider-sfx').value = sfxVolume;
        }
    }
} catch (e) {
    console.warn("Could not load controls settings", e);
}

// Character Templates
const CHARACTERS = {
    balanceado: {
        name: "Balanceado",
        color: "#60a5fa", // Blue
        colorAlt: "#3b82f6",
        width: 32,
        height: 48,
        weight: 100,
        speed: 6.0,
        jumpForce: 13.5,
        doubleJumpForce: 12.0,
        specials: {
            neutral: (p) => { // Projectile
                shootProjectile(p, 'fireball', p.facing * 10, 0, 15, 6);
            },
            up: (p) => { // Recovery
                p.vy = -16;
                p.vx = p.facing * 3;
                p.shieldStun = 20; // Locks out inputs during recovery
                playSynthSound('jump');
            }
        }
    },
    veloz: {
        name: "Veloz",
        color: "#fbbf24", // Yellow
        colorAlt: "#f59e0b",
        width: 28,
        height: 44,
        weight: 75,
        speed: 8.0,
        jumpForce: 15.5,
        doubleJumpForce: 14.5,
        specials: {
            neutral: (p) => { // Instant Dash Attack
                p.vx = p.facing * 18;
                p.vy = 0;
                p.shieldStun = 10;
                // Create hit box active immediately
                triggerMeleeHitbox(p, 40, 30, 8, 12, p.facing * 8, -5);
            },
            up: (p) => { // Rocket Jump
                p.vy = -19;
                p.vx = 0;
                p.shieldStun = 15;
                playSynthSound('jump');
            }
        }
    },
    pesado: {
        name: "Pesado",
        color: "#f87171", // Red
        colorAlt: "#ef4444",
        width: 42,
        height: 60,
        weight: 140,
        speed: 4.2,
        jumpForce: 11.5,
        doubleJumpForce: 10.0,
        specials: {
            neutral: (p) => { // Ground Slam
                p.vy = 16;
                p.shieldStun = 25;
                // Big hit frame on land
                p.onGroundSlam = true;
            },
            up: (p) => { // Spinning Slash
                p.vy = -13;
                p.vx = p.facing * 5;
                p.shieldStun = 30;
                playSynthSound('jump');
                // Trigger repeat spinning hitboxes
                for (let i = 0; i < 4; i++) {
                    setTimeout(() => {
                        if (gameEngine && gameEngine.running) {
                            triggerMeleeHitbox(p, 60, 60, 4, 8, 0, 0);
                        }
                    }, i * 80);
                }
            }
        }
    },
    zoner: {
        name: "Zoner",
        color: "#34d399", // Green
        colorAlt: "#10b981",
        width: 30,
        height: 48,
        weight: 90,
        speed: 5.0,
        jumpForce: 12.5,
        doubleJumpForce: 11.0,
        specials: {
            neutral: (p) => { // Arrow Shoot
                shootProjectile(p, 'arrow', p.facing * 14, 0, 10, 8);
            },
            up: (p) => { // Teleport / Hover
                p.vy = -7;
                p.vx = p.facing * 6;
                // Hover effect
                let count = 0;
                const interval = setInterval(() => {
                    if (gameEngine && gameEngine.running && count < 6) {
                        p.vy = -2;
                        count++;
                    } else {
                        clearInterval(interval);
                    }
                }, 50);
                playSynthSound('shield');
            }
        }
    }
};

// Stage Configurations
const STAGES = {
    battlefield: {
        platforms: [
            { x: 200, y: 550, w: 800, h: 40, semi: false }, // Main platform (widened from 600 to 800)
            { x: 280, y: 400, w: 220, h: 12, semi: true },  // Left platform (widened from 160 to 220)
            { x: 700, y: 400, w: 220, h: 12, semi: true },  // Right platform (widened from 160 to 220)
            { x: 450, y: 280, w: 300, h: 12, semi: true }   // Top platform (widened from 200 to 300)
        ],
        spawn: [
            { x: 300, y: 480 },
            { x: 480, y: 480 },
            { x: 720, y: 480 },
            { x: 900, y: 480 }
        ]
    },
    destination: {
        platforms: [
            { x: 150, y: 550, w: 900, h: 40, semi: false }  // Main flat platform (widened from 700 to 900)
        ],
        spawn: [
            { x: 250, y: 480 },
            { x: 450, y: 480 },
            { x: 750, y: 480 },
            { x: 950, y: 480 }
        ]
    },
    moving: {
        platforms: [
            { x: 225, y: 550, w: 750, h: 40, semi: false }, // Main platform (widened from 500 to 750)
            { x: 425, y: 350, w: 350, h: 12, semi: true, moving: true, rangeY: [200, 420], dirY: 1, speedY: 1.5 } // Moving platform (widened from 200 to 350)
        ],
        spawn: [
            { x: 300, y: 480 },
            { x: 480, y: 480 },
            { x: 720, y: 480 },
            { x: 900, y: 480 }
        ]
    }
};

// Game Mode configurations
let gameMode = 'stocks'; // 'stocks' or 'time'
let cpuDifficulty = 'medium'; // 'easy', 'medium', 'hard'
let activeStage = 'battlefield';

// Active keys state
const keysPressed = {};

window.addEventListener('keydown', (e) => {
    keysPressed[e.code] = true;
    initAudio(); // Initialize on user interaction
});
window.addEventListener('keyup', (e) => {
    keysPressed[e.code] = false;
});

// Helper functions for hit detection
function checkAABBCollision(rect1, rect2) {
    return rect1.x < rect2.x + rect2.w &&
           rect1.x + rect1.w > rect2.x &&
           rect1.y < rect2.y + rect2.h &&
           rect1.y + rect1.h > rect2.y;
}

function triggerMeleeHitbox(attacker, w, h, damage, baseKnockback, offsetX, offsetY) {
    let hitboxX;
    if (attacker.facing === 1) {
        // Starts inside the attacker's body (e.g. from the center of the attacker)
        hitboxX = attacker.x + attacker.w / 2 + offsetX - w / 3;
    } else {
        // Starts inside the attacker's body and extends left
        hitboxX = attacker.x + attacker.w / 2 - w - offsetX + w / 3;
    }
    
    const hitbox = {
        x: hitboxX,
        y: attacker.y + offsetY,
        w: w,
        h: h,
        damage: damage,
        knockback: baseKnockback,
        attackerId: attacker.id
    };
    
    // Find potential targets (all other players)
    gameEngine.players.forEach(opponent => {
        if (opponent.id === attacker.id || opponent.respawning || opponent.invulnerable > 0) return;
        
        const opponentRect = { x: opponent.x, y: opponent.y, w: opponent.w, h: opponent.h };
        if (checkAABBCollision(hitbox, opponentRect)) {
            applyHit(attacker, opponent, damage, baseKnockback);
        }
    });
}

function shootProjectile(attacker, type, vx, vy, damage, baseKnockback) {
    playSynthSound('shoot');
    const proj = {
        x: attacker.x + (attacker.facing === 1 ? attacker.w + 10 : -20),
        y: attacker.y + attacker.h / 3,
        w: type === 'fireball' ? 18 : 24,
        h: type === 'fireball' ? 18 : 6,
        vx: vx,
        vy: vy,
        type: type,
        attackerId: attacker.id,
        damage: damage,
        knockback: baseKnockback,
        life: 120 // 2 seconds
    };
    gameEngine.projectiles.push(proj);
}

function applyHit(attacker, victim, damage, knockback) {
    if (victim.shieldActive && victim.shieldStrength > 10) {
        // Shield absorbs hit
        victim.shieldStrength -= damage * 1.5;
        playSynthSound('shield');
        if (victim.shieldStrength <= 10) {
            victim.shieldActive = false;
            victim.shieldStun = 120; // Stunned!
            playSynthSound('shield_break');
        }
        return;
    }
    
    playSynthSound(knockback > 10 ? 'heavy_hit' : 'hit');
    victim.damage += damage;
    
    // Calculate knockback scaling
    const scale = (victim.damage / 100) * 1.2 + 0.8;
    const kbForce = knockback * scale;
    
    // Knockback angle
    const angle = attacker.x < victim.x ? -Math.PI / 6 : -5 * Math.PI / 6;
    victim.vx = Math.cos(angle) * kbForce * 0.9;
    victim.vy = Math.sin(angle) * kbForce * 0.8;
    
    // Hitstun duration
    victim.hitStun = Math.max(10, Math.floor(kbForce * 2.0));
    
    // Reset double jump so victim can try to recover
    victim.jumpsUsed = 1;
}

// Particle effect on death / launch
function createBlastParticles(x, y, color) {
    for (let i = 0; i < 20; i++) {
        gameEngine.particles.push({
            x: x,
            y: y,
            vx: (Math.random() - 0.5) * 15,
            vy: (Math.random() - 0.5) * 15,
            radius: Math.random() * 5 + 3,
            color: color,
            alpha: 1,
            life: 60
        });
    }
}

// Main Game Engine Object
class SmashGame {
    constructor(canvasId) {
        this.canvas = document.getElementById(canvasId);
        this.ctx = this.canvas.getContext('2d');
        this.players = [];
        this.projectiles = [];
        this.particles = [];
        this.platforms = [];
        
        this.running = false;
        this.mode = 'vs_local'; // 'vs_local', 'vs_cpu', 'vs_online', 'training'
        this.matchType = 'stocks'; // 'stocks', 'time'
        this.stocksLimit = 3;
        this.timeRemaining = 120 * 60; // 2 minutes in frames
        
        this.gameWinner = null;
        this.scale = 1;
        this.p1CharSelected = 'balanceado';
        this.p2CharSelected = 'veloz';
        
        this.resize();
        window.addEventListener('resize', () => this.resize());
    }
    
    resize() {
        this.canvas.width = window.innerWidth;
        this.canvas.height = window.innerHeight;
        
        const scaleX = this.canvas.width / V_WIDTH;
        const scaleY = this.canvas.height / V_HEIGHT;
        this.scale = Math.min(scaleX, scaleY);
    }
    
    setupMatch(mode, playersConfig, stageKey, matchType, stocksLimit = 3, timeLimitMinutes = 2, difficulty = 'medium') {
        this.mode = mode;
        this.matchType = matchType;
        this.stocksLimit = stocksLimit;
        activeStage = stageKey;
        cpuDifficulty = difficulty;
        this.gameWinner = null;
        
        this.timeRemaining = timeLimitMinutes * 60 * 60; // time in frames (60fps * 60secs * minutes)
        
        // Load Stage Platforms
        const stageConfig = STAGES[stageKey];
        this.platforms = JSON.parse(JSON.stringify(stageConfig.platforms));
        
        // Spawn players dynamically
        this.players = playersConfig.map((pConfig, idx) => {
            const char = CHARACTERS[pConfig.char];
            const spawn = stageConfig.spawn[idx] || stageConfig.spawn[idx % stageConfig.spawn.length];
            return {
                id: pConfig.id,
                name: pConfig.name,
                x: spawn.x,
                y: spawn.y,
                vx: 0,
                vy: 0,
                w: char.width,
                h: char.height,
                charData: char,
                facing: idx % 2 === 0 ? 1 : -1,
                damage: 0,
                stocks: this.stocksLimit,
                score: 0,
                jumpsUsed: 0,
                isGrounded: false,
                respawning: false,
                respawnTimer: 0,
                hitStun: 0,
                shieldStun: 0,
                shieldActive: false,
                shieldStrength: 100,
                invulnerable: 0,
                lastControlState: {},
                prevControlState: {},
                onGroundSlam: false
            };
        });
        
        this.projectiles = [];
        this.particles = [];
        
        // Show/Hide overlays
        document.getElementById('menu-main').classList.add('hidden');
        document.getElementById('menu-css').classList.add('hidden');
        document.getElementById('menu-lobby').classList.add('hidden');
        document.getElementById('menu-options').classList.add('hidden');
        document.getElementById('menu-pause').classList.add('hidden');
        
        const toast = document.getElementById('toast');
        if (toast) toast.classList.add('hidden');
        
        document.getElementById('game-hud').classList.remove('hidden');
        
        // Update controls overlay text
        const ctrlOverlay = document.getElementById('game-controls-overlay');
        const ctrlText = document.getElementById('game-controls-text');
        if (ctrlOverlay && ctrlText) {
            ctrlOverlay.classList.remove('hidden');
            const cleanKey = (k) => k.replace('Key', '').replace('Arrow', '←/→/↑/↓ ');
            if (mode === 'vs_local') {
                ctrlText.textContent = `P1: ${cleanKey(controls.p1.left)}/${cleanKey(controls.p1.right)} (Mov) | ${cleanKey(controls.p1.jump)} (Saltar) | ${cleanKey(controls.p1.attackA)} (Atq A)  ||  P2: ${cleanKey(controls.p2.left)}/${cleanKey(controls.p2.right)} (Mov) | ${cleanKey(controls.p2.jump)} (Saltar) | ${cleanKey(controls.p2.attackA)} (Atq A)`;
            } else if (mode === 'vs_online') {
                ctrlText.textContent = `Tus Controles: ${cleanKey(controls.p1.left)}/${cleanKey(controls.p1.right)} (Mover) | ${cleanKey(controls.p1.jump)} (Saltar) | ${cleanKey(controls.p1.attackA)} (Ataque A) | ${cleanKey(controls.p1.attackB)} (Especial B) | ${cleanKey(controls.p1.shield)} (Escudo)`;
            } else {
                ctrlText.textContent = `Controles: ${cleanKey(controls.p1.left)}/${cleanKey(controls.p1.right)} (Mover) | ${cleanKey(controls.p1.jump)} (Saltar) | ${cleanKey(controls.p1.attackA)} (Ataque A) | ${cleanKey(controls.p1.attackB)} (Especial B) | ${cleanKey(controls.p1.shield)} (Escudo)`;
            }
        }

        this.updateHUD();
        
        // Trigger loops
        this.startLoops();
    }
    
    startLoops() {
        this.running = true;
        
        if (this.updateInterval) clearInterval(this.updateInterval);
        
        this.updateInterval = setInterval(() => {
            if (this.running) {
                this.update();
            }
        }, 1000 / 60);
        
        this.loop();
    }
    
    updateHUD() {
        const hudContainer = document.getElementById('game-hud');
        if (!hudContainer) return;
        hudContainer.replaceChildren();
        
        const colors = ['#60a5fa', '#f87171', '#fbbf24', '#34d399'];
        
        this.players.forEach((p, idx) => {
            const playerDiv = document.createElement('div');
            playerDiv.className = `hud-player player-p${idx + 1}`;
            
            const nameSpan = document.createElement('span');
            nameSpan.className = 'hud-name';
            nameSpan.textContent = p.name;
            nameSpan.style.color = colors[idx % colors.length];
            playerDiv.appendChild(nameSpan);
            
            const damageSpan = document.createElement('span');
            damageSpan.className = 'hud-damage';
            damageSpan.textContent = `${Math.floor(p.damage)}%`;
            damageSpan.style.color = p.damage > 100 ? '#ef4444' : p.damage > 50 ? '#fbbf24' : '#ffffff';
            playerDiv.appendChild(damageSpan);
            
            const stocksDiv = document.createElement('div');
            stocksDiv.className = 'hud-stocks';
            if (this.matchType === 'stocks') {
                for (let i = 0; i < this.stocksLimit; i++) {
                    const dot = document.createElement('div');
                    dot.className = `stock-dot ${i >= p.stocks ? 'lost' : ''}`;
                    stocksDiv.appendChild(dot);
                }
            } else {
                stocksDiv.textContent = `Score: ${p.score}`;
            }
            playerDiv.appendChild(stocksDiv);
            
            hudContainer.appendChild(playerDiv);
        });
    }
    
    loop() {
        if (!this.running) return;
        
        this.render();
        
        requestAnimationFrame(() => this.loop());
    }
    
    update() {
        // Mode Time countdown
        if (this.matchType === 'time' && this.mode !== 'training') {
            this.timeRemaining--;
            if (this.timeRemaining <= 0) {
                this.endMatch();
            }
        }
        
        // Update platforms
        this.platforms.forEach(p => {
            if (p.moving) {
                p.y += p.speedY * p.dirY;
                if (p.y >= p.rangeY[1]) {
                    p.dirY = -1;
                } else if (p.y <= p.rangeY[0]) {
                    p.dirY = 1;
                }
            }
        });
        
        // Update Players
        this.players.forEach(p => {
            this.updatePlayer(p);
        });
        
        // Update Projectiles
        for (let i = this.projectiles.length - 1; i >= 0; i--) {
            const pr = this.projectiles[i];
            pr.x += pr.vx;
            pr.y += pr.vy;
            pr.life--;
            
            // Check collision with stage/screen bounds or oponent
            let active = pr.life > 0 && pr.x > 0 && pr.x < V_WIDTH && pr.y > 0 && pr.y < V_HEIGHT;
            
            if (active) {
                // Collide with any opponent
                for (let pl of this.players) {
                    if (pl.id !== pr.attackerId && !pl.respawning && pl.invulnerable <= 0) {
                        const victimRect = { x: pl.x, y: pl.y, w: pl.w, h: pl.h };
                        if (checkAABBCollision(pr, victimRect)) {
                            applyHit(this.players.find(attacker => attacker.id === pr.attackerId), pl, pr.damage, pr.knockback);
                            active = false;
                            break;
                        }
                    }
                }
            }
            
            if (!active) {
                this.projectiles.splice(i, 1);
            }
        }
        
        // Update Particles
        for (let i = this.particles.length - 1; i >= 0; i--) {
            const part = this.particles[i];
            part.x += part.vx;
            part.y += part.vy;
            part.alpha = Math.max(0, part.life / 60);
            part.life--;
            if (part.life <= 0) {
                this.particles.splice(i, 1);
            }
        }
    }
    
    updatePlayer(p) {
        if (p.respawning) {
            p.respawnTimer--;
            if (p.respawnTimer <= 0) {
                p.respawning = false;
                const stageConfig = STAGES[activeStage];
                const spawn = p.id === 'p1' ? stageConfig.spawn[0] : stageConfig.spawn[1];
                p.x = spawn.x;
                p.y = spawn.y;
                p.vx = 0;
                p.vy = 0;
                p.damage = 0;
                p.invulnerable = 120; // 2 seconds of invulnerability
            }
            return;
        }
        
        // Decr hit stun & shield stun
        if (p.hitStun > 0) p.hitStun--;
        if (p.shieldStun > 0) p.shieldStun--;
        if (p.invulnerable > 0) p.invulnerable--;
        
        // Shield recovery
        if (!p.shieldActive && p.shieldStrength < 100 && p.shieldStun <= 0) {
            p.shieldStrength = Math.min(100, p.shieldStrength + 0.2);
        } else if (p.shieldActive) {
            p.shieldStrength -= 0.6;
            if (p.shieldStrength <= 10) {
                p.shieldActive = false;
                p.shieldStun = 120; // Stunned!
                playSynthSound('shield_break');
            }
        }
        
        // Get Inputs
        const prevKeys = p.prevControlState || {};
        let keys = {};
        if (this.mode === 'vs_online') {
            if (p.id === 'p1') {
                keys = this.getPlayerInputs('p1');
            } else {
                keys = p.lastControlState || {};
            }
        } else {
            // Local VS / CPU / Training
            if (p.id === 'p1') {
                keys = this.getPlayerInputs('p1');
            } else if (p.id === 'p2') {
                if (this.mode === 'vs_local') {
                    keys = this.getPlayerInputs('p2');
                } else {
                    keys = this.getCPUInputs(p);
                }
            } else {
                // Players 3 and 4 are CPU in local mode
                keys = this.getCPUInputs(p);
            }
        }
        
        // Physics / Movement
        if (p.hitStun <= 0 && p.shieldStun <= 0) {
            // Shield toggle
            if (keys.shield && p.isGrounded) {
                p.shieldActive = true;
                p.vx *= 0.8; // Slide to a halt
            } else {
                p.shieldActive = false;
            }
            
            if (!p.shieldActive) {
                // Horizontal Move
                if (keys.left) {
                    p.vx = Math.max(-p.charData.speed, p.vx - 0.8);
                    p.facing = -1;
                } else if (keys.right) {
                    p.vx = Math.min(p.charData.speed, p.vx + 0.8);
                    p.facing = 1;
                } else {
                    // Friction
                    p.vx *= p.isGrounded ? 0.75 : 0.95;
                }
                
                // Jump / Double Jump
                if (keys.jump && !prevKeys.jump) {
                    if (p.isGrounded) {
                        p.vy = -p.charData.jumpForce;
                        p.isGrounded = false;
                        p.jumpsUsed = 1;
                        playSynthSound('jump');
                    } else if (p.jumpsUsed < 2) {
                        p.vy = -p.charData.doubleJumpForce;
                        p.jumpsUsed = 2;
                        playSynthSound('jump');
                    }
                }
                
                // Fast Fall
                if (keys.down && !p.isGrounded && p.vy > 0) {
                    p.vy = Math.min(18, p.vy + 2.5);
                }
                
                // Attacks
                if (keys.attackA && !prevKeys.attackA) {
                    // Attack standard
                    p.shieldStun = 15; // Animation / action lock
                    // Determine if Smash / direction
                    const hasDir = keys.left || keys.right || keys.up || keys.down;
                    if (keys.up) {
                        triggerMeleeHitbox(p, 45, 60, 9, 10, 0, -45); // Up Air/Tilt
                    } else if (keys.down) {
                        triggerMeleeHitbox(p, 65, 30, 8, 9, 5, 20);  // Down sweep
                    } else if (keys.left || keys.right) {
                        triggerMeleeHitbox(p, 60, 40, 11, 12, 10, -5); // Smash Forward
                    } else {
                        triggerMeleeHitbox(p, 45, 30, 6, 6, 10, -5);  // Neutral Jab
                    }
                } else if (keys.attackB && !prevKeys.attackB) {
                    // Attack Special
                    if (keys.up) {
                        p.charData.specials.up(p);
                    } else {
                        p.charData.specials.neutral(p);
                    }
                }
            }
        } else if (p.hitStun > 0) {
            // Apply drift control during hitstun (very light drift)
            if (keys.left) p.vx -= 0.05;
            if (keys.right) p.vx += 0.05;
        }
        
        p.lastControlState = keys;
        p.prevControlState = Object.assign({}, keys);
        
        // Apply Gravity
        if (!p.isGrounded) {
            p.vy = Math.min(20, p.vy + 0.5); // gravity terminal velocity 20
        }
        
        // Move coordinates
        p.x += p.vx;
        p.y += p.vy;
        
        // Ground slam hit (Pesado custom logic)
        if (p.onGroundSlam) {
            if (p.isGrounded || p.vy === 0) {
                p.onGroundSlam = false;
                triggerMeleeHitbox(p, 90, 40, 16, 18, 0, 10);
                playSynthSound('heavy_hit');
            }
        }
        
        // Platforms Collisions
        p.isGrounded = false;
        
        for (let plat of this.platforms) {
            // Fall through semi-platform
            if (plat.semi && keys.down && p.vy >= 0 && (p.y + p.h - p.vy <= plat.y + 2)) {
                continue;
            }
            
            // Solid collision from top
            if (p.vy >= 0 &&
                p.x + p.w * 0.2 < plat.x + plat.w &&
                p.x + p.w * 0.8 > plat.x &&
                p.y + p.h - p.vy <= plat.y + 8 &&
                p.y + p.h >= plat.y) {
                
                p.y = plat.y - p.h;
                p.vy = 0;
                p.isGrounded = true;
                p.jumpsUsed = 0;
                break;
            }
        }
        
        // Blast Zone Boundaries (Elimination Check)
        if (p.x < -100 || p.x > V_WIDTH + 100 || p.y < -150 || p.y > V_HEIGHT + 100) {
            this.handlePlayerOut(p);
        }
    }
    
    handlePlayerOut(p) {
        createBlastParticles(Math.min(V_WIDTH, Math.max(0, p.x)), Math.min(V_HEIGHT, Math.max(0, p.y)), p.charData.color);
        playSynthSound('death');
        
        if (this.mode === 'training') {
            // Training mode: infinite respawn, no stocks/points
            p.respawning = true;
            p.respawnTimer = 45;
            this.updateHUD();
            return;
        }
        
        const killer = this.players.find(pl => pl.id !== p.id);
        if (killer) killer.score++;
        
        if (this.matchType === 'stocks') {
            p.stocks--;
            this.updateHUD();
            if (p.stocks <= 0) {
                this.endMatch();
                return;
            }
        } else {
            this.updateHUD();
        }
        
        p.respawning = true;
        p.respawnTimer = 60;
    }
    
    getPlayerInputs(pId) {
        const layout = controls[pId] || controls.p1;
        return {
            left: keysPressed[layout.left] || false,
            right: keysPressed[layout.right] || false,
            up: keysPressed[layout.up] || false,
            down: keysPressed[layout.down] || false,
            jump: keysPressed[layout.jump] || false,
            attackA: keysPressed[layout.attackA] || false,
            attackB: keysPressed[layout.attackB] || false,
            shield: keysPressed[layout.shield] || false,
            grab: keysPressed[layout.grab] || false
        };
    }
    
    getCPUInputs(cpu) {
        const target = this.players[0]; // Player 1
        const inputs = { left: false, right: false, up: false, down: false, jump: false, attackA: false, attackB: false, shield: false };
        if (cpu.respawning || target.respawning) return inputs;
        
        const dist = target.x - cpu.x;
        const distY = target.y - cpu.y;
        
        // Recovery logic (if off stage)
        const isOffStage = cpu.x < 300 || cpu.x > 900;
        if (isOffStage && cpu.y > 550) {
            // Use Up-B or double jump back
            if (cpu.jumpsUsed < 2) {
                inputs.jump = Math.random() < 0.2;
            } else if (cpuDifficulty !== 'easy') {
                inputs.up = true;
                inputs.attackB = true;
            }
            if (cpu.x < 600) inputs.right = true;
            else inputs.left = true;
            return inputs;
        }
        
        // CPU difficulty reaction times / thresholds
        const decisionRoll = Math.random();
        let attackChance = 0.05;
        let followChance = 0.6;
        let shieldChance = 0.01;
        
        if (cpuDifficulty === 'easy') {
            followChance = 0.3;
            attackChance = 0.02;
            shieldChance = 0.001;
        } else if (cpuDifficulty === 'hard') {
            followChance = 0.9;
            attackChance = 0.12;
            shieldChance = 0.03;
        }
        
        if (decisionRoll < followChance) {
            if (dist > 30) inputs.right = true;
            else if (dist < -30) inputs.left = true;
            
            if (distY < -80 && Math.abs(dist) < 100) {
                inputs.jump = Math.random() < 0.1;
            }
        }
        
        // Attack decision
        if (Math.abs(dist) < 80 && Math.abs(distY) < 50 && Math.random() < attackChance) {
            // Check if special B or standard A
            if (Math.random() < 0.3) {
                inputs.attackB = true;
            } else {
                inputs.attackA = true;
                if (Math.random() < 0.5) {
                    inputs.up = (distY < -20);
                    inputs.left = (dist < 0);
                    inputs.right = (dist > 0);
                }
            }
        }
        
        // Shield decision
        if (Math.abs(dist) < 90 && target.shieldStun > 0 && Math.random() < shieldChance) {
            inputs.shield = true;
        }
        
        return inputs;
    }
    
    endMatch() {
        this.running = false;
        if (this.updateInterval) {
            clearInterval(this.updateInterval);
            this.updateInterval = null;
        }
        
        const ctrlOverlay = document.getElementById('game-controls-overlay');
        if (ctrlOverlay) ctrlOverlay.classList.add('hidden');

        let winner = "Jugador 1";
        
        if (this.matchType === 'stocks') {
            if (this.players[0].stocks <= 0) {
                winner = this.players[1].name;
            }
        } else {
            if (this.players[1].score > this.players[0].score) {
                winner = this.players[1].name;
            } else if (this.players[1].score === this.players[0].score) {
                winner = "Empate";
            }
        }
        
        this.gameWinner = winner;
        document.getElementById('game-hud').classList.add('hidden');
        
        const pauseWinnerEl = document.getElementById('pause-winner');
        pauseWinnerEl.textContent = winner === "Empate" ? "¡EMPATE!" : `¡GANADOR: ${winner}!`;
        document.getElementById('pause-title').textContent = "FIN DE LA PARTIDA";
        document.getElementById('btn-pause-resume').classList.add('hidden');
        
        document.getElementById('menu-pause').classList.remove('hidden');
    }
    
    render() {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        
        this.ctx.save();
        // Centering and aspect ratio scaling
        const offsetLeft = (this.canvas.width - V_WIDTH * this.scale) / 2;
        const offsetTop = (this.canvas.height - V_HEIGHT * this.scale) / 2;
        this.ctx.translate(offsetLeft, offsetTop);
        this.ctx.scale(this.scale, this.scale);
        
        // Render background grid/gradient highlights
        this.ctx.fillStyle = 'rgba(255, 255, 255, 0.02)';
        for (let i = 0; i < V_WIDTH; i += 100) {
            this.ctx.fillRect(i, 0, 1, V_HEIGHT);
        }
        for (let j = 0; j < V_HEIGHT; j += 100) {
            this.ctx.fillRect(0, j, V_WIDTH, 1);
        }
        
        // Draw Stages Platforms
        this.platforms.forEach(plat => {
            if (plat.semi) {
                this.ctx.fillStyle = '#475569';
                this.ctx.fillRect(plat.x, plat.y, plat.w, plat.h);
                // Glass top
                this.ctx.fillStyle = '#94a3b8';
                this.ctx.fillRect(plat.x, plat.y, plat.w, 3);
            } else {
                // Main platform
                this.ctx.fillStyle = '#1e293b';
                this.ctx.fillRect(plat.x, plat.y, plat.w, plat.h);
                
                this.ctx.fillStyle = '#6366f1'; // Glowing trim
                this.ctx.fillRect(plat.x, plat.y, plat.w, 4);
            }
        });
        
        // Draw Projectiles
        this.projectiles.forEach(pr => {
            this.ctx.fillStyle = pr.type === 'fireball' ? '#f59e0b' : '#38bdf8';
            this.ctx.fillRect(pr.x, pr.y, pr.w, pr.h);
        });
        
        // Draw Players
        this.players.forEach(p => {
            if (p.respawning) return;
            
            this.ctx.save();
            
            // Respawn flashing
            if (p.invulnerable > 0 && Math.floor(Date.now() / 100) % 2 === 0) {
                this.ctx.globalAlpha = 0.4;
            }
            
            // Draw character model
            const bodyColor = p.facing === 1 ? p.charData.color : p.charData.colorAlt;
            this.ctx.fillStyle = bodyColor;
            
            // Draw rounded body
            this.ctx.beginPath();
            this.ctx.roundRect(p.x, p.y, p.w, p.h, [8]);
            this.ctx.fill();
            
            // Check if player has selected a custom head image
            const headImg = headImages[p.name];
            if (headImg && headImg.complete) {
                // Draw custom head image on top of shoulders
                const headSize = 44;
                this.ctx.save();
                // Center of the head placed at the upper portion of the rounded rectangle body
                this.ctx.translate(p.x + p.w / 2, p.y + 12);
                if (p.facing === -1) {
                    this.ctx.scale(-1, 1);
                }
                this.ctx.drawImage(headImg, -headSize / 2, -headSize / 2, headSize, headSize);
                this.ctx.restore();
            } else {
                // Draw face visor (pointing direction)
                this.ctx.fillStyle = '#0f172a';
                const visorW = 10;
                const visorH = 8;
                const visorX = p.facing === 1 ? p.x + p.w - 12 : p.x + 2;
                this.ctx.fillRect(visorX, p.y + 10, visorW, visorH);
            }
            
            // Draw shield bubble
            if (p.shieldActive) {
                this.ctx.strokeStyle = 'rgba(99, 102, 241, 0.6)';
                this.ctx.fillStyle = 'rgba(99, 102, 241, 0.2)';
                this.ctx.lineWidth = 2;
                this.ctx.beginPath();
                const radius = Math.max(p.w, p.h) * 0.7 * (p.shieldStrength / 100);
                this.ctx.arc(p.x + p.w / 2, p.y + p.h / 2, radius, 0, Math.PI * 2);
                this.ctx.fill();
                this.ctx.stroke();
            }
            
            // Stun effect
            if (p.hitStun > 0) {
                this.ctx.strokeStyle = '#ef4444';
                this.ctx.lineWidth = 3;
                this.ctx.strokeRect(p.x - 4, p.y - 4, p.w + 8, p.h + 8);
            } else if (p.shieldStun > 0) {
                this.ctx.strokeStyle = '#fbbf24';
                this.ctx.lineWidth = 2;
                this.ctx.strokeRect(p.x - 2, p.y - 2, p.w + 4, p.h + 4);
            }
            
            this.ctx.restore();
        });
        
        // Draw Particles
        this.particles.forEach(part => {
            this.ctx.fillStyle = part.color;
            this.ctx.globalAlpha = part.alpha;
            this.ctx.beginPath();
            this.ctx.arc(part.x, part.y, part.radius, 0, Math.PI * 2);
            this.ctx.fill();
        });
        this.ctx.globalAlpha = 1.0;
        
        this.ctx.restore();
    }
}

const gameEngine = new SmashGame('game-canvas');
