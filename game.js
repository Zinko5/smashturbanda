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

// Preload item images
const itemImages = {
    'puma': new Image(),
    'yahu-strike': new Image()
};
itemImages['puma'].src = 'img/activable-puma.png';
itemImages['yahu-strike'].src = 'img/yahu-strike.png';

// Phenotype Configurations
const PHENOTYPES = {
    balanceado: {
        weight: 100,
        speed: 6.0,
        jumpForce: 13.5,
        doubleJumpForce: 12.0,
        baseDamage: 1.0
    },
    ligero: {
        weight: 75,
        speed: 8.0,
        jumpForce: 15.5,
        doubleJumpForce: 14.5,
        baseDamage: 0.85
    },
    pesado: {
        weight: 140,
        speed: 4.2,
        jumpForce: 11.5,
        doubleJumpForce: 10.0,
        baseDamage: 1.2
    }
};

// Character Templates
const CHARACTERS = {
    balanceado: {
        name: "Mago",
        phenotype: "balanceado",
        color: "#60a5fa", // Blue
        colorAlt: "#3b82f6",
        width: 32,
        height: 48,
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
        name: "Sonic",
        phenotype: "ligero",
        color: "#fbbf24", // Yellow
        colorAlt: "#f59e0b",
        width: 28,
        height: 44,
        specials: {
            neutral: (p) => { // Instant Dash Attack
                p.vx = p.facing * 18;
                p.vy = 0;
                p.shieldStun = 10;
                // Create hit box active immediately
                triggerMeleeHitbox(p, 40, 30, 12, 15, p.facing * 8, -5);
            },
            up: (p) => { // Rocket Jump (Reduced launch height to prevent dying off top screen)
                p.vy = -14;
                p.vx = 0;
                p.shieldStun = 15;
                playSynthSound('jump');
            }
        }
    },
    pesado: {
        name: "Gordo",
        phenotype: "pesado",
        color: "#f87171", // Red
        colorAlt: "#ef4444",
        width: 42,
        height: 60,
        specials: {
            neutral: (p, chargeProgress = 0) => { // Ground Slam
                p.vy = 16;
                p.shieldStun = 25;
                // Big hit frame on land
                p.onGroundSlam = true;
                p.gordoSlamStartY = p.y;
                p.gordoSlamCharge = chargeProgress;
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
        phenotype: "balanceado",
        color: "#34d399", // Green
        colorAlt: "#10b981",
        width: 30,
        height: 48,
        specials: {
            neutral: (p) => { // Arrow Shoot
                const keys = p.lastControlState || {};
                let vx = p.facing * 14;
                let vy = 0;
                if (keys.up) {
                    if (keys.left || keys.right) {
                        vx = p.facing * 14 * 0.7;
                        vy = -14 * 0.7;
                    } else {
                        vx = 0;
                        vy = -14;
                    }
                } else if (keys.down) {
                    if (keys.left || keys.right) {
                        vx = p.facing * 14 * 0.7;
                        vy = 14 * 0.7;
                    } else {
                        vx = 0;
                        vy = 14;
                    }
                }
                shootProjectile(p, 'arrow', vx, vy, 10, 8);
            },
            up: (p) => { // Default small jump recovery instead of arrow shoot
                p.vy = -12;
                playSynthSound('jump');
            }
        }
    },
    volador: {
        name: "Palomo",
        phenotype: "ligero",
        color: "#c084fc", // Purple/Violet
        colorAlt: "#a855f7",
        width: 30,
        height: 46,
        specials: {
            neutral: (p) => {
                if (p.isGrounded) {
                    p.vy = -20;
                    p.isGrounded = false;
                    p.voladorFlying = true;
                    playSynthSound('jump');
                } else if (p.voladorFlying) {
                    if (p.voladorBombCooldown <= 0) {
                        shootProjectile(p, 'bomb', 0, 10, 12, 10, 16, 16);
                        p.voladorBombCooldown = 16;
                    }
                }
            },
            up: (p) => {
                p.vy = -15;
                p.voladorFlying = true;
                playSynthSound('jump');
            }
        }
    }
};

// Resolve character attributes based on phenotypes
Object.keys(CHARACTERS).forEach(key => {
    const char = CHARACTERS[key];
    const pheno = PHENOTYPES[char.phenotype];
    if (pheno) {
        char.weight = pheno.weight;
        char.speed = pheno.speed;
        char.jumpForce = pheno.jumpForce;
        char.doubleJumpForce = pheno.doubleJumpForce;
        char.baseDamage = pheno.baseDamage;
    }
});

// Stage Configurations
const STAGES = {
    battlefield: {
        platforms: [
            { x: 100, y: 550, w: 1000, h: 40, semi: false }, // Main platform (widened from 800 to 1000)
            { x: 180, y: 400, w: 250, h: 12, semi: true },  // Left platform (widened from 220 to 250)
            { x: 770, y: 400, w: 250, h: 12, semi: true },  // Right platform (widened from 220 to 250)
            { x: 450, y: 280, w: 300, h: 12, semi: true }   // Top platform
        ],
        spawn: [
            { x: 200, y: 480 },
            { x: 450, y: 480 },
            { x: 750, y: 480 },
            { x: 1000, y: 480 }
        ]
    },
    destination: {
        platforms: [
            { x: 70, y: 550, w: 1060, h: 40, semi: false }  // Main flat platform (widened from 900 to 1060)
        ],
        spawn: [
            { x: 150, y: 480 },
            { x: 450, y: 480 },
            { x: 750, y: 480 },
            { x: 1050, y: 480 }
        ]
    },
    moving: {
        platforms: [
            { x: 125, y: 550, w: 950, h: 40, semi: false }, // Main platform (widened from 750 to 950)
            { x: 425, y: 350, w: 350, h: 12, semi: true, moving: true, rangeY: [200, 420], dirY: 1, speedY: 1.5 } // Moving platform
        ],
        spawn: [
            { x: 220, y: 480 },
            { x: 480, y: 480 },
            { x: 720, y: 480 },
            { x: 980, y: 480 }
        ]
    }
};

// Game Mode configurations
let gameMode = 'stocks'; // 'stocks' or 'time'
let cpuDifficulty = 'medium'; // 'easy', 'medium', 'hard'
let activeStage = 'battlefield';

// Helper functions for hit detection

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
        if (gameEngine.teamsEnabled && opponent.team && attacker.team && opponent.team === attacker.team) return;

        const opponentRect = { x: opponent.x, y: opponent.y, w: opponent.w, h: opponent.h };
        if (checkAABBCollision(hitbox, opponentRect)) {
            applyHit(attacker, opponent, damage);
        }
    });
}

function shootProjectile(attacker, type, vx, vy, damage, baseKnockback, customW, customH) {
    playSynthSound('shoot');
    let startX = attacker.x + (attacker.facing === 1 ? attacker.w + 10 : -20);
    let startY = attacker.y + attacker.h / 2 - (customH || (type === 'fireball' ? 18 : 6)) / 2;
    if (type === 'bomb') {
        startX = attacker.x + attacker.w / 2 - (customW || 16) / 2;
        startY = attacker.y + attacker.h;
    }
    const proj = {
        x: startX,
        y: startY,
        w: customW || (type === 'fireball' ? 18 : 24),
        h: customH || (type === 'fireball' ? 18 : 6),
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

function applyHit(attacker, victim, damage, explosionSource = null) {
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

    // Apply phenotype baseDamage scaling from the attacker
    let finalDamage = damage;
    if (attacker && attacker.charData && attacker.charData.baseDamage !== undefined) {
        finalDamage = Math.round(damage * attacker.charData.baseDamage);
    }

    playSynthSound(finalDamage > 12 ? 'heavy_hit' : 'hit');
    victim.damage += finalDamage;

    // Fixed proportion relationship: base knockback is 0.8x of final damage
    const baseKnockback = finalDamage * 0.8;
    // Damage percentages only act as multipliers of that damage/knockback
    const multiplier = 1 + (victim.damage / 100);
    const kbForce = (baseKnockback * multiplier) * (100 / victim.charData.weight);

    // Knockback angle: radial direction if explosionSource is provided, otherwise standard direction
    let angle;
    if (explosionSource) {
        const victimCenterX = victim.x + victim.w / 2;
        const victimCenterY = victim.y + victim.h / 2;
        let diffY = victimCenterY - explosionSource.y;
        if (diffY > 0) {
            diffY = -diffY; // Always launch upwards/outwards from explosions
        }
        angle = Math.atan2(diffY, victimCenterX - explosionSource.x);
    } else {
        angle = attacker.x < victim.x ? -Math.PI / 6 : -5 * Math.PI / 6;
    }

    victim.vx = Math.cos(angle) * kbForce * 0.9;
    victim.vy = Math.sin(angle) * kbForce * 0.8;

    // Hitstun duration
    victim.hitStun = Math.max(10, Math.floor(kbForce * 2.0));

    // Reset double jump so victim can try to recover
    victim.jumpsUsed = 1;

    // Track attacker for kill credit
    victim.lastHitBy = attacker.id;
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
        this.items = [];
        this.pumas = [];
        this.bombers = [];

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

    triggerExplosion(x, y, attackerId, radius = 110) {
        playSynthSound('explosion');
        // Spawn explosion particles based on size
        const numParticles = Math.round(15 * (radius / 110));
        for (let i = 0; i < numParticles; i++) {
            this.particles.push({
                x: x,
                y: y,
                vx: (Math.random() - 0.5) * 8,
                vy: (Math.random() - 0.5) * 8,
                radius: (Math.random() * 8 + 4) * (radius / 110),
                color: '#f59e0b',
                alpha: 1.0,
                life: Math.round(Math.random() * 20 + 20) // 20 to 40 frames
            });
        }

        // Explosion hitbox: check a range around (x, y)
        const explosionRect = { x: x - radius, y: y - radius, w: radius * 2, h: radius * 2 };
        const attacker = this.players.find(pl => pl.id === attackerId);

        // Core damage is derived from radius
        const coreDamage = Math.round(1.4 * Math.sqrt(radius));

        this.players.forEach(opponent => {
            if (opponent.id === attackerId || opponent.respawning || opponent.invulnerable > 0) return;
            if (this.teamsEnabled && opponent.team && attacker && attacker.team && opponent.team === attacker.team) return;

            const oppRect = { x: opponent.x, y: opponent.y, w: opponent.w, h: opponent.h };
            if (checkAABBCollision(explosionRect, oppRect)) {
                const oppCenterX = opponent.x + opponent.w / 2;
                const oppCenterY = opponent.y + opponent.h / 2;
                const dx = oppCenterX - x;
                const dy = oppCenterY - y;
                const distance = Math.sqrt(dx * dx + dy * dy);
                if (distance <= radius) {
                    const proximityFactor = 1 - (distance / radius);
                    const finalDamage = Math.round(coreDamage * proximityFactor);
                    if (finalDamage > 0) {
                        applyHit(attacker || { id: attackerId, x: x }, opponent, finalDamage, { x, y });
                    }
                }
            }
        });
    }

    spawnRandomItem() {
        // Spawn randomly horizontally, above screen so it falls down
        const x = Math.random() * (V_WIDTH - 400) + 200;
        const types = ['puma', 'yahu-strike'];
        const chosenType = types[Math.floor(Math.random() * types.length)];
        this.items.push({
            x: x,
            y: -50,
            w: 32,
            h: 32,
            vy: 0,
            type: chosenType,
            isGrounded: false,
            life: 402
        });
    }

    activateHeldItem(p) {
        if (!p.heldItem) return;

        if (p.heldItem === 'puma') {
            this.pumas.push({
                x: -150,
                y: p.y + p.h / 2 - 40, // centered vertically at player height
                w: 120,
                h: 80,
                vx: 12,
                damage: 28,
                knockback: 18,
                attackerId: p.id,
                hits: []
            });
            playSynthSound('heavy_hit');
            playSoundFile('sound/efectos/puma.mp3');
        } else if (p.heldItem === 'yahu-strike') {
            this.bombers.push({
                x: V_WIDTH + 150,
                y: 45,
                w: 200,
                h: 100,
                vx: -8,
                attackerId: p.id,
                bombsDropped: 0,
                bombTargets: [1050, 900, 750, 600, 450, 300, 150]
            });
            playSynthSound('heavy_hit');
            playSoundFile('sound/efectos/strike.mp3', 4000); // Limit strike sound to 5 seconds
        }

        p.heldItem = null; // consume item
    }

    setupMatch(mode, playersConfig, stageKey, matchType, stocksLimit = 3, timeLimitMinutes = 2, difficulty = 'medium', teamsEnabled = false) {
        this.mode = mode;
        this.matchType = matchType;
        this.stocksLimit = stocksLimit;
        activeStage = stageKey;
        cpuDifficulty = difficulty;
        this.gameWinner = null;
        this.teamsEnabled = teamsEnabled;

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
                team: pConfig.team || null,
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
                onGroundSlam: false,
                heldItem: null,
                comboCount: 0,
                comboTimer: 0,
                jumpBuffered: false,
                jumpBufferTimer: 0
            };
        });

        this.projectiles = [];
        this.particles = [];
        this.items = [];
        this.pumas = [];
        this.bombers = [];
        this.itemSpawnTimer = Math.round(Math.random() * 1200 + 600); // 10 to 30 seconds

        // Show/Hide overlays
        document.getElementById('menu-main').classList.add('hidden');
        document.getElementById('menu-css').classList.add('hidden');
        document.getElementById('menu-lobby').classList.add('hidden');
        document.getElementById('menu-options').classList.add('hidden');
        document.getElementById('menu-pause').classList.add('hidden');

        const toast = document.getElementById('toast');
        if (toast) toast.classList.add('hidden');

        if (typeof stopMenuMusic === 'function') {
            stopMenuMusic();
        }

        document.getElementById('game-hud').classList.remove('hidden');

        // Update controls overlay text
        const ctrlOverlay = document.getElementById('game-controls-overlay');
        const ctrlText = document.getElementById('game-controls-text');
        if (ctrlOverlay && ctrlText) {
            ctrlOverlay.classList.remove('hidden');
            const cleanKey = (k) => k.replace('Key', '').replace('Arrow', '←/→/↑/↓ ');
            if (mode === 'vs_local') {
                ctrlText.textContent = `P1: ${cleanKey(controls.p1.left)}/${cleanKey(controls.p1.right)} (Mov) | ${cleanKey(controls.p1.jump)} (Saltar) | ${cleanKey(controls.p1.grab)} (Objeto)  ||  P2: ${cleanKey(controls.p2.left)}/${cleanKey(controls.p2.right)} (Mov) | ${cleanKey(controls.p2.jump)} (Saltar) | ${cleanKey(controls.p2.grab)} (Objeto)`;
            } else if (mode === 'vs_online') {
                ctrlText.textContent = `Tus Controles: ${cleanKey(controls.p1.left)}/${cleanKey(controls.p1.right)} (Mover) | ${cleanKey(controls.p1.jump)} (Saltar) | ${cleanKey(controls.p1.attackA)} (Ataque A) | ${cleanKey(controls.p1.attackB)} (Especial B) | ${cleanKey(controls.p1.shield)} (Escudo) | ${cleanKey(controls.p1.grab)} (Objeto)`;
            } else {
                ctrlText.textContent = `Controles: ${cleanKey(controls.p1.left)}/${cleanKey(controls.p1.right)} (Mover) | ${cleanKey(controls.p1.jump)} (Saltar) | ${cleanKey(controls.p1.attackA)} (Ataque A) | ${cleanKey(controls.p1.attackB)} (Especial B) | ${cleanKey(controls.p1.shield)} (Escudo) | ${cleanKey(controls.p1.grab)} (Objeto)`;
            }
        }

        this.updateHUD();

        const timerEl = document.getElementById('game-timer');
        if (timerEl) {
            if (this.matchType === 'time' && this.mode !== 'training') {
                timerEl.classList.remove('hidden');
            } else {
                timerEl.classList.add('hidden');
            }
        }

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

        const colors = ['#00ccff', '#ff0055', '#ffcc00', '#00ff00'];

        // Reconstruct only if player count changes or differs
        if (hudContainer.children.length !== this.players.length) {
            hudContainer.replaceChildren();
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
                damageSpan.style.color = '#ffffff';
                playerDiv.appendChild(damageSpan);

                const stocksDiv = document.createElement('div');
                stocksDiv.className = 'hud-stocks';
                playerDiv.appendChild(stocksDiv);

                hudContainer.appendChild(playerDiv);
            });
        }

        // Update existing elements in place
        this.players.forEach((p, idx) => {
            const playerDiv = hudContainer.children[idx];
            if (!playerDiv) return;

            const damageSpan = playerDiv.querySelector('.hud-damage');
            if (damageSpan) {
                const targetDamageText = `${Math.floor(p.damage)}%`;
                if (damageSpan.textContent !== targetDamageText) {
                    damageSpan.textContent = targetDamageText;
                    damageSpan.style.color = p.damage > 100 ? '#ff0055' : p.damage > 50 ? '#ffcc00' : '#ffffff';
                }
            }

            const nameSpan = playerDiv.querySelector('.hud-name');
            if (nameSpan && nameSpan.textContent !== p.name) {
                nameSpan.textContent = p.name;
            }

            const stocksDiv = playerDiv.querySelector('.hud-stocks');
            if (stocksDiv) {
                if (this.matchType === 'stocks') {
                    const dots = stocksDiv.children;
                    if (dots.length !== this.stocksLimit) {
                        stocksDiv.replaceChildren();
                        for (let i = 0; i < this.stocksLimit; i++) {
                            const dot = document.createElement('div');
                            dot.className = `stock-dot ${i >= p.stocks ? 'lost' : ''}`;
                            stocksDiv.appendChild(dot);
                        }
                    } else {
                        for (let i = 0; i < this.stocksLimit; i++) {
                            const isLost = i >= p.stocks;
                            if (isLost) {
                                if (!dots[i].classList.contains('lost')) {
                                    dots[i].classList.add('lost');
                                }
                            } else {
                                if (dots[i].classList.contains('lost')) {
                                    dots[i].classList.remove('lost');
                                }
                            }
                        }
                    }
                } else {
                    const targetScoreText = `Score: ${p.score}`;
                    if (stocksDiv.textContent !== targetScoreText) {
                        stocksDiv.textContent = targetScoreText;
                    }
                }
            }
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

            const totalSeconds = Math.max(0, Math.ceil(this.timeRemaining / 60));
            const mins = Math.floor(totalSeconds / 60);
            const secs = totalSeconds % 60;
            const formattedTime = `${mins}:${secs < 10 ? '0' : ''}${secs}`;
            const timerEl = document.getElementById('game-timer');
            if (timerEl && timerEl.textContent !== formattedTime) {
                timerEl.textContent = formattedTime;
            }

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

        // Item Spawning (Host / Local only)
        const checkHost = (this.mode !== 'vs_online' || (typeof isHost !== 'undefined' && isHost));
        if (this.running && checkHost) {
            if (this.itemSpawnTimer === undefined) this.itemSpawnTimer = 600;
            this.itemSpawnTimer--;
            if (this.itemSpawnTimer <= 0) {
                this.spawnRandomItem();
                this.itemSpawnTimer = Math.round(Math.random() * 1200 + 600); // 10 to 30 seconds
            }
        }

        // Update items (gravity, platform collision, and lifetime)
        for (let i = this.items.length - 1; i >= 0; i--) {
            const item = this.items[i];
            if (!item.isGrounded) {
                item.vy = Math.min(8, item.vy + 0.3); // gravity
                item.y += item.vy;

                // Platform collision
                for (let plat of this.platforms) {
                    if (item.y + item.h >= plat.y &&
                        item.y + item.h - item.vy <= plat.y &&
                        item.x + item.w > plat.x &&
                        item.x < plat.x + plat.w) {
                        item.y = plat.y - item.h;
                        item.vy = 0;
                        item.isGrounded = true;
                        item.life = 402; // 6.7 seconds once grounded
                        break;
                    }
                }
            } else {
                item.life--;
                if (item.life <= 0) {
                    this.items.splice(i, 1);
                }
            }
        }

        // Check player item pickups
        this.players.forEach(p => {
            if (p.respawning || p.heldItem) return;

            for (let i = this.items.length - 1; i >= 0; i--) {
                const item = this.items[i];
                const playerRect = { x: p.x, y: p.y, w: p.w, h: p.h };
                const itemRect = { x: item.x, y: item.y, w: item.w, h: item.h };
                if (checkAABBCollision(playerRect, itemRect)) {
                    p.heldItem = item.type;
                    this.items.splice(i, 1);
                    playSynthSound('shield');
                    break;
                }
            }
        });

        // Update Pumas
        for (let i = this.pumas.length - 1; i >= 0; i--) {
            const puma = this.pumas[i];
            puma.x += puma.vx;

            // Check collision with other players
            this.players.forEach(opponent => {
                if (opponent.id === puma.attackerId || opponent.respawning || opponent.invulnerable > 0) return;
                const attackerPlayer = this.players.find(pl => pl.id === puma.attackerId);
                if (this.teamsEnabled && attackerPlayer && opponent.team && attackerPlayer.team && opponent.team === attackerPlayer.team) return;

                const oppRect = { x: opponent.x, y: opponent.y, w: opponent.w, h: opponent.h };
                if (checkAABBCollision(puma, oppRect) && !puma.hits.includes(opponent.id)) {
                    applyHit(attackerPlayer, opponent, puma.damage);
                    puma.hits.push(opponent.id);
                    playSynthSound('heavy_hit');
                }
            });

            // Remove when offscreen to the right
            if (puma.x > V_WIDTH + 150) {
                this.pumas.splice(i, 1);
            }
        }

        // Update Bombers
        for (let i = this.bombers.length - 1; i >= 0; i--) {
            const b = this.bombers[i];
            b.x += b.vx;

            // Check if it drops a bomb (crosses one of the bombTarget coordinates to the left)
            if (b.bombsDropped < b.bombTargets.length) {
                const nextTargetX = b.bombTargets[b.bombsDropped];
                if (b.x <= nextTargetX) {
                    const attacker = this.players.find(pl => pl.id === b.attackerId);
                    if (attacker) {
                        shootProjectile(attacker, 'bomb', 0, 8, 25, 16, 45, 45);
                        const lastProj = this.projectiles[this.projectiles.length - 1];
                        if (lastProj) {
                            lastProj.x = b.x + b.w / 2 - lastProj.w / 2;
                            lastProj.y = b.y + b.h;
                        }
                    }
                    b.bombsDropped++;
                }
            }

            // Remove when offscreen to the left
            if (b.x < -150) {
                this.bombers.splice(i, 1);
            }
        }

        // Update Projectiles
        for (let i = this.projectiles.length - 1; i >= 0; i--) {
            const pr = this.projectiles[i];
            pr.x += pr.vx;
            pr.y += pr.vy;
            pr.life--;

            // Check collision with stage/screen bounds or oponent
            let active = pr.life > 0 && pr.x > 0 && pr.x < V_WIDTH && pr.y > 0 && pr.y < V_HEIGHT;

            if (active && (pr.type === 'bomb' || pr.type === 'fireball')) {
                for (let plat of this.platforms) {
                    const platRect = { x: plat.x, y: plat.y, w: plat.w, h: plat.h };
                    if (checkAABBCollision(pr, platRect)) {
                        const radius = Math.round(pr.w * 4.2);
                        this.triggerExplosion(pr.x + pr.w / 2, pr.y + pr.h / 2, pr.attackerId, radius);
                        active = false;
                        break;
                    }
                }
            }

            if (active) {
                // Collide with any opponent
                for (let pl of this.players) {
                    if (pl.id !== pr.attackerId && !pl.respawning && pl.invulnerable <= 0) {
                        const attackerPlayer = this.players.find(p => p.id === pr.attackerId);
                        if (this.teamsEnabled && attackerPlayer && pl.team && attackerPlayer.team && pl.team === attackerPlayer.team) continue;

                        const victimRect = { x: pl.x, y: pl.y, w: pl.w, h: pl.h };
                        if (checkAABBCollision(pr, victimRect)) {
                            if (pr.type === 'bomb' || pr.type === 'fireball') {
                                const radius = Math.round(pr.w * 4.2);
                                this.triggerExplosion(pr.x + pr.w / 2, pr.y + pr.h / 2, pr.attackerId, radius);
                            } else {
                                applyHit(attackerPlayer, pl, pr.damage);
                            }
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

        // Update HUD in real-time
        this.updateHUD();
    }

    updatePlayer(p) {
        if (this.matchType === 'stocks' && p.stocks <= 0) {
            p.x = -9999;
            p.y = -9999;
            p.vx = 0;
            p.vy = 0;
            p.respawning = false;
            return;
        }

        if (p.respawning) {
            p.respawnTimer--;
            if (p.respawnTimer <= 0) {
                p.respawning = false;
                const stageConfig = STAGES[activeStage];
                const playerIdx = this.players.indexOf(p);
                const spawn = stageConfig.spawn[playerIdx] || stageConfig.spawn[0];
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

        if (p.comboTimer > 0) {
            p.comboTimer--;
            if (p.comboTimer <= 0) {
                p.comboCount = 0;
            }
        }

        if (p.balanceadoCooldown === undefined) p.balanceadoCooldown = 0;
        if (p.balanceadoCharge === undefined) p.balanceadoCharge = 0;
        if (p.gordoCooldown === undefined) p.gordoCooldown = 0;
        if (p.gordoCharge === undefined) p.gordoCharge = 0;
        if (p.voladorCharge === undefined) p.voladorCharge = 0;
        if (p.zonerShots === undefined) p.zonerShots = 2;
        if (p.zonerRechargeTimer === undefined) p.zonerRechargeTimer = 0;

        if (p.velozCharge === undefined) p.velozCharge = 0;
        if (p.velozDashTimer === undefined) p.velozDashTimer = 0;
        if (p.velozDashSpeed === undefined) p.velozDashSpeed = 0;
        if (p.velozDashHits === undefined) p.velozDashHits = [];

        if (p.balanceadoCooldown > 0) p.balanceadoCooldown--;
        if (p.gordoCooldown > 0) p.gordoCooldown--;
        if (p.zonerRechargeTimer > 0) {
            p.zonerRechargeTimer--;
            if (p.zonerRechargeTimer === 0) {
                const ctrlKeys = p.lastControlState || {};
                p.zonerShots = ctrlKeys.up ? 4 : 2;
            }
        }

        if (p.voladorBombCooldown === undefined) p.voladorBombCooldown = 0;
        if (p.voladorBombCooldown > 0) p.voladorBombCooldown--;

        if (p.upSpecialUsed === undefined) p.upSpecialUsed = false;
        if (p.velozDashUsed === undefined) p.velozDashUsed = false;
        if (p.voladorFlying === undefined) p.voladorFlying = false;
        if (p.isGrounded) {
            p.upSpecialUsed = false;
            p.velozDashUsed = false;
            p.voladorFlying = false;
        } else if (p.charData.name === "Palomo") {
            p.voladorFlying = true;
        }

        if (p.velozDashTimer > 0) {
            p.velozDashTimer--;
            p.vx = (p.velozDashDirX !== undefined ? p.velozDashDirX : p.facing) * p.velozDashSpeed;
            let dashVy = (p.velozDashDirY !== undefined ? p.velozDashDirY : 0) * p.velozDashSpeed;
            if (dashVy < 0) {
                dashVy *= 0.55; // Scale down upward vertical dash to prevent dying off top of screen
            }
            p.vy = dashVy;

            // Check collision with other players during dash
            this.players.forEach(opponent => {
                if (opponent.id !== p.id && !opponent.respawning && opponent.invulnerable <= 0) {
                    if (this.teamsEnabled && p.team === opponent.team) return;
                    const playerRect = { x: p.x, y: p.y, w: p.w, h: p.h };
                    const oppRect = { x: opponent.x, y: opponent.y, w: opponent.w, h: opponent.h };
                    if (checkAABBCollision(playerRect, oppRect) && !p.velozDashHits.includes(opponent.id)) {
                        const progress = (p.velozDashSpeed - 12) / 12; // 0 to 1
                        const damage = Math.round(11 + progress * 9); // 11 to 20 damage (small nerf)
                        
                        if (p.velozDashSpeed > 12 && opponent.damage > 50) {
                            playSoundFile('sound/efectos/fernan-embestida.mp3');
                        }
                        
                        applyHit(p, opponent, damage);
                        p.velozDashHits.push(opponent.id);
                    }
                }
            });
        }

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
                // Use Item
                if (keys.grab && !prevKeys.grab && p.heldItem) {
                    this.activateHeldItem(p);
                }

                // Horizontal Move
                let appliedFriction = false;
                if (Math.abs(p.vx) > p.charData.speed) {
                    p.vx *= p.isGrounded ? 0.75 : 0.95;
                    appliedFriction = true;
                }

                if (keys.left) {
                    if (!appliedFriction) {
                        p.vx = Math.max(-p.charData.speed, p.vx - 0.8);
                    } else if (p.vx > 0) {
                        p.vx -= 0.8; // extra braking force
                    }
                    p.facing = -1;
                } else if (keys.right) {
                    if (!appliedFriction) {
                        p.vx = Math.min(p.charData.speed, p.vx + 0.8);
                    } else if (p.vx < 0) {
                        p.vx += 0.8; // extra braking force
                    }
                    p.facing = 1;
                } else {
                    if (!appliedFriction) {
                        p.vx *= p.isGrounded ? 0.75 : 0.95;
                    }
                }

                // Jump / Double Jump (with action button priority input buffering)
                if (keys.jump && !prevKeys.jump) {
                    p.jumpBuffered = true;
                    p.jumpBufferTimer = 5; // 5 frames (~83ms) window
                }

                if (p.jumpBuffered) {
                    // Action button check to suppress jump
                    if (keys.attackA || keys.attackB) {
                        p.jumpBuffered = false;
                        p.jumpBufferTimer = 0;
                    } else {
                        p.jumpBufferTimer--;
                        if (p.jumpBufferTimer <= 0) {
                            p.jumpBuffered = false;
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
                        // Neutral Combo attack (3-step combo)
                        if (p.comboTimer > 0) {
                            p.comboCount = (p.comboCount + 1) % 3;
                        } else {
                            p.comboCount = 0;
                        }
                        p.comboTimer = 40; // 40 frames window to continue the combo

                        if (p.comboCount === 0) {
                            triggerMeleeHitbox(p, 45, 30, 4, 3, 10, -5); // Hit 1: low dmg & low knockback
                        } else if (p.comboCount === 1) {
                            triggerMeleeHitbox(p, 45, 30, 4, 3, 10, -5); // Hit 2: low dmg & low knockback
                        } else {
                            triggerMeleeHitbox(p, 55, 35, 8, 12, 12, -5); // Hit 3: finisher, high dmg & high knockback
                        }
                    }
                } else if (keys.attackB && keys.up && !p.isGrounded && (!prevKeys.attackB || ((p.balanceadoCharge && p.balanceadoCharge > 0) || (p.velozCharge && p.velozCharge > 0)))) {
                    // Up Special (One-shot per airtime)
                    if (p.balanceadoCharge) p.balanceadoCharge = 0;
                    if (p.velozCharge) p.velozCharge = 0;
                    
                    if (!p.isGrounded && p.upSpecialUsed) {
                        // Already used in the air, do nothing
                    } else {
                        p.charData.specials.up(p);
                        if (!p.isGrounded) {
                            p.upSpecialUsed = true;
                        }
                    }
                } else {
                    // Neutral Special (or charging / zoner cooldown handling)
                    if (p.charData.name === "Mago") {
                        if (p.balanceadoCooldown <= 0) {
                            if (keys.attackB && (!keys.up || p.isGrounded)) {
                                p.balanceadoCharge++;
                                p.vx = 0; // Stall horizontal movement
                                if (p.vy > 0) p.vy = 0.5; // Slow fall during charging

                                if (p.balanceadoCharge >= 90) {
                                    // Auto fire at max charge (1.5 seconds)
                                    const progress = 1;
                                    const damage = Math.round(8 + progress * 10);
                                    const knockback = Math.round(6 + progress * 6);
                                    const baseSpeed = 10 + progress * 3;
                                    const size = Math.round(18 + progress * 24);

                                    let vx = p.facing * baseSpeed;
                                    let vy = 0;
                                    if (keys.up) {
                                        if (keys.left || keys.right) {
                                            vx = p.facing * baseSpeed * 0.7;
                                            vy = -baseSpeed * 0.7;
                                        } else {
                                            vx = 0;
                                            vy = -baseSpeed;
                                        }
                                    } else if (keys.down) {
                                        if (keys.left || keys.right) {
                                            vx = p.facing * baseSpeed * 0.7;
                                            vy = baseSpeed * 0.7;
                                        } else {
                                            vx = 0;
                                            vy = baseSpeed;
                                        }
                                    }
                                    shootProjectile(p, 'fireball', vx, vy, damage, knockback, size, size);

                                    p.balanceadoCooldown = 40; // 0.67s cooldown
                                    p.balanceadoCharge = 0;
                                }
                            } else if (p.balanceadoCharge > 0) {
                                // Released attackB
                                const progress = Math.min(1, p.balanceadoCharge / 90);
                                const damage = Math.round(8 + progress * 10);
                                const knockback = Math.round(6 + progress * 6);
                                const baseSpeed = 10 + progress * 3;
                                const size = Math.round(18 + progress * 24);

                                let vx = p.facing * baseSpeed;
                                let vy = 0;
                                if (keys.up) {
                                    if (keys.left || keys.right) {
                                        vx = p.facing * baseSpeed * 0.7;
                                        vy = -baseSpeed * 0.7;
                                    } else {
                                        vx = 0;
                                        vy = -baseSpeed;
                                    }
                                } else if (keys.down) {
                                    if (keys.left || keys.right) {
                                        vx = p.facing * baseSpeed * 0.7;
                                        vy = baseSpeed * 0.7;
                                    } else {
                                        vx = 0;
                                        vy = baseSpeed;
                                    }
                                }
                                shootProjectile(p, 'fireball', vx, vy, damage, knockback, size, size);

                                p.balanceadoCooldown = 40;
                                p.balanceadoCharge = 0;
                            }
                        }
                    } else if (p.charData.name === "Palomo") {
                        if (p.isGrounded) {
                            if (keys.attackB && !prevKeys.attackB && (!keys.up || p.isGrounded)) {
                                p.charData.specials.neutral(p);
                            }
                        } else if (p.voladorFlying) {
                            if (p.voladorBombCooldown <= 0) {
                                if (keys.attackB) {
                                    p.voladorCharge++;

                                    if (p.voladorCharge >= 45) {
                                        const progress = 1.0;
                                        const dmg = Math.round(12 + progress * 10);
                                        const size = Math.round(16 + progress * 24);
                                        shootProjectile(p, 'bomb', 0, 10, dmg, 10, size, size);
                                        p.voladorBombCooldown = 30;
                                        p.voladorCharge = 0;
                                    }
                                } else if (p.voladorCharge > 0) {
                                    const progress = Math.min(1.0, p.voladorCharge / 45);
                                    const dmg = Math.round(12 + progress * 10);
                                    const size = Math.round(16 + progress * 24);
                                    shootProjectile(p, 'bomb', 0, 10, dmg, 10, size, size);
                                    p.voladorBombCooldown = Math.round(16 + progress * 14);
                                    p.voladorCharge = 0;
                                }
                            }
                        }
                    } else if (p.charData.name === "Zoner") {
                        if (keys.attackB && !prevKeys.attackB && (!keys.up || p.isGrounded || p.upSpecialUsed)) {
                            const minShotVal = keys.up ? -2 : 0;
                            if (p.zonerShots > minShotVal) {
                                p.charData.specials.neutral(p);
                                p.zonerShots--;
                                p.zonerRechargeTimer = 40; // Reset recharge timer to 0.67s
                            }
                        }
                    } else if (p.charData.name === "Sonic") {
                        if (p.velozDashTimer === 0 && (!p.isGrounded ? !p.velozDashUsed : true)) {
                            if (keys.attackB && (!keys.up || p.isGrounded)) {
                                p.velozCharge++;
                                p.vx = 0;
                                if (p.vy > 0) p.vy = 0.5; // slow fall during charge

                                if (p.velozCharge >= 45) {
                                    const progress = 1;
                                    p.velozDashSpeed = 12 + progress * 12;
                                    p.velozDashTimer = Math.round(8 + progress * 8);
                                    p.shieldStun = p.velozDashTimer;
                                    p.velozDashHits = [];
                                    p.velozCharge = 0;

                                    // 8-directional aiming
                                    let dirX = 0, dirY = 0;
                                    if (keys.up) dirY = -1;
                                    else if (keys.down) dirY = 1;
                                    if (keys.left || keys.right) dirX = p.facing;
                                    if (dirX === 0 && dirY === 0) dirX = p.facing;
                                    const len = Math.sqrt(dirX * dirX + dirY * dirY);
                                    p.velozDashDirX = dirX / len;
                                    p.velozDashDirY = dirY / len;

                                    if (!p.isGrounded) p.velozDashUsed = true;
                                    playSynthSound('jump');
                                }
                            } else if (p.velozCharge > 0) {
                                const progress = Math.min(1, p.velozCharge / 45);
                                p.velozDashSpeed = 12 + progress * 12;
                                p.velozDashTimer = Math.round(8 + progress * 8);
                                p.shieldStun = p.velozDashTimer;
                                p.velozDashHits = [];
                                p.velozCharge = 0;

                                // 8-directional aiming
                                let dirX = 0, dirY = 0;
                                if (keys.up) dirY = -1;
                                else if (keys.down) dirY = 1;
                                if (keys.left || keys.right) dirX = p.facing;
                                if (dirX === 0 && dirY === 0) dirX = p.facing;
                                const len = Math.sqrt(dirX * dirX + dirY * dirY);
                                p.velozDashDirX = dirX / len;
                                p.velozDashDirY = dirY / len;

                                if (!p.isGrounded) p.velozDashUsed = true;
                                playSynthSound('jump');
                            }
                        }
                    } else if (p.charData.name === "Gordo") {
                        if (p.gordoCooldown <= 0) {
                            if (keys.attackB && (!keys.up || p.isGrounded)) {
                                p.gordoCharge++;
                                p.vx = 0;
                                if (p.vy > 0) p.vy = 0.5; // Slow fall during charging

                                if (p.gordoCharge >= 30) {
                                    p.charData.specials.neutral(p, 1.0);
                                    p.gordoCharge = 0;
                                    p.gordoCooldown = 40;
                                }
                            } else if (p.gordoCharge > 0) {
                                const progress = Math.min(1.0, p.gordoCharge / 30);
                                p.charData.specials.neutral(p, progress);
                                p.gordoCharge = 0;
                                p.gordoCooldown = 40;
                            }
                        }
                    } else {
                        if (keys.attackB && !prevKeys.attackB && (!keys.up || p.isGrounded)) {
                            p.charData.specials.neutral(p);
                        }
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
            if (p.charData.name === "Palomo" && p.voladorFlying) {
                const ctrlKeys = p.lastControlState || {};
                if (p.vy >= 0 && (ctrlKeys.left || ctrlKeys.right)) {
                    // Glide: very slow fall
                    p.vy = Math.min(0.5, p.vy + 0.05);
                } else {
                    p.vy = Math.min(20, p.vy + 0.5);
                }
            } else {
                p.vy = Math.min(20, p.vy + 0.5); // gravity terminal velocity 20
            }
        }

        // Move coordinates
        p.x += p.vx;
        p.y += p.vy;

        // Prevent Volador from dying off the top of the map
        if (p.charData.name === "Palomo") {
            p.y = Math.max(-100, p.y);
        }

        if (p.onGroundSlam) {
            if (p.isGrounded || p.vy === 0) {
                p.onGroundSlam = false;
                const fallDistance = Math.max(0, p.y - (p.gordoSlamStartY || p.y));
                const chargeBonus = (p.gordoSlamCharge || 0) * 5;
                const fallBonus = Math.min(9, (fallDistance / 110) * 2);
                const finalDmg = Math.round(6 + chargeBonus + fallBonus);

                triggerMeleeHitbox(p, 90, 40, finalDmg, finalDmg * 0.8, 0, 10);
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
            // Expand threshold and bottom tolerance when downward moving platform moves faster than gravity to keep player glued
            const verticalThreshold = (plat.moving && plat.speedY * plat.dirY > 0) ? (8 + plat.speedY * 2) : 8;
            const bottomTolerance = (plat.moving && plat.speedY * plat.dirY > 0) ? (plat.speedY * 2) : 0;

            if (p.vy >= 0 &&
                p.x + p.w * 0.2 < plat.x + plat.w &&
                p.x + p.w * 0.8 > plat.x &&
                p.y + p.h - p.vy <= plat.y + verticalThreshold &&
                p.y + p.h >= plat.y - bottomTolerance) {

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
        p.damage = 0; // Reset damage immediately upon death

        if (this.mode === 'training') {
            // Training mode: infinite respawn, no stocks/points
            p.respawning = true;
            p.respawnTimer = 45;
            this.updateHUD();
            return;
        }

        let killer = null;
        if (p.lastHitBy) {
            killer = this.players.find(pl => pl.id === p.lastHitBy);
        }
        if (!killer) {
            // Fallback to finding another player so score increments on self-destruction (or default behaviour)
            killer = this.players.find(pl => pl.id !== p.id);
        }
        if (killer) {
            killer.score++;
        }
        p.lastHitBy = null; // Clear attacker

        if (this.matchType === 'stocks') {
            p.stocks--;
            this.updateHUD();
            if (p.stocks <= 0) {
                p.x = -9999;
                p.y = -9999;
                p.vx = 0;
                p.vy = 0;
                p.respawning = false;
                const alivePlayers = this.players.filter(pl => pl.stocks > 0);
                let teamsAliveCount = 0;
                if (this.teamsEnabled) {
                    const aliveTeams = new Set(alivePlayers.map(pl => pl.team));
                    teamsAliveCount = aliveTeams.size;
                }
                if (this.teamsEnabled ? (teamsAliveCount <= 1) : (alivePlayers.length <= 1)) {
                    this.endMatch();
                }
                return; // Early return to prevent respawning
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

        let winner = this.players[0] ? this.players[0].name : "Jugador 1";

        if (this.teamsEnabled) {
            let winningTeamId = null;
            const alivePlayers = this.players.filter(p => p.stocks > 0);
            if (this.matchType === 'stocks' && alivePlayers.length > 0) {
                winningTeamId = alivePlayers[0].team;
            } else {
                const teamStats = {};
                this.players.forEach(p => {
                    if (!teamStats[p.team]) teamStats[p.team] = { stocks: 0, score: 0 };
                    teamStats[p.team].stocks += (p.stocks || 0);
                    teamStats[p.team].score += (p.score || 0);
                });
                const sortedTeams = Object.keys(teamStats).sort((a, b) => {
                    return teamStats[b].stocks - teamStats[a].stocks || teamStats[b].score - teamStats[a].score;
                });
                winningTeamId = parseInt(sortedTeams[0]);
            }
            const winningPlayers = this.players.filter(p => p.team === winningTeamId);
            winner = winningPlayers.map(p => p.name).join(" y ");
        } else {
            if (this.matchType === 'stocks') {
                const alivePlayers = this.players.filter(p => p.stocks > 0);
                if (alivePlayers.length === 1) {
                    winner = alivePlayers[0].name;
                } else if (alivePlayers.length > 1) {
                    const sorted = [...alivePlayers].sort((a, b) => b.stocks - a.stocks || b.score - a.score);
                    winner = sorted[0].name;
                } else {
                    winner = "Empate";
                }
            } else {
                const sorted = [...this.players].sort((a, b) => b.score - a.score);
                if (sorted.length > 1 && sorted[0].score === sorted[1].score) {
                    winner = "Empate";
                } else if (sorted.length > 0) {
                    winner = sorted[0].name;
                }
            }
        }

        this.gameWinner = winner;
        document.getElementById('game-hud').classList.add('hidden');
        const timerEl = document.getElementById('game-timer');
        if (timerEl) timerEl.classList.add('hidden');

        const pauseWinnerEl = document.getElementById('pause-winner');
        pauseWinnerEl.textContent = winner === "Empate" ? "¡EMPATE!" : `¡GANADOR: ${winner}!`;
        document.getElementById('pause-title').textContent = "FIN DE LA PARTIDA";
        document.getElementById('btn-pause-resume').classList.add('hidden');

        const pauseLobbyBtn = document.getElementById('btn-pause-lobby');
        if (pauseLobbyBtn) {
            pauseLobbyBtn.classList.remove('hidden');
        }

        document.getElementById('menu-pause').classList.remove('hidden');

        if (this.mode === 'vs_online' && typeof broadcast === 'function') {
            broadcast({
                type: 'match_end',
                winner: winner
            });
        }

        if (typeof playMenuMusic === 'function') {
            playMenuMusic();
        }
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

        // Draw Items
        this.items.forEach(item => {
            if (itemImages[item.type] && itemImages[item.type].complete) {
                this.ctx.drawImage(itemImages[item.type], item.x, item.y, item.w, item.h);
            } else {
                this.ctx.fillStyle = '#fbbf24';
                this.ctx.fillRect(item.x, item.y, item.w, item.h);
            }
        });

        // Draw Pumas
        this.pumas.forEach(puma => {
            if (itemImages['puma'] && itemImages['puma'].complete) {
                this.ctx.drawImage(itemImages['puma'], puma.x, puma.y, puma.w, puma.h);
            } else {
                this.ctx.fillStyle = '#b45309';
                this.ctx.fillRect(puma.x, puma.y, puma.w, puma.h);
            }
        });

        // Draw Bombers
        this.bombers.forEach(b => {
            if (itemImages['yahu-strike'] && itemImages['yahu-strike'].complete) {
                this.ctx.drawImage(itemImages['yahu-strike'], b.x, b.y, b.w, b.h);
            } else {
                this.ctx.fillStyle = '#64748b';
                this.ctx.fillRect(b.x, b.y, b.w, b.h);
            }
        });

        // Draw Projectiles
        this.projectiles.forEach(pr => {
            if (pr.type === 'bomb') {
                this.ctx.fillStyle = '#ec4899';
                this.ctx.beginPath();
                this.ctx.arc(pr.x + pr.w / 2, pr.y + pr.h / 2, pr.w / 2, 0, Math.PI * 2);
                this.ctx.fill();
            } else {
                this.ctx.fillStyle = pr.type === 'fireball' ? '#f59e0b' : '#38bdf8';
                this.ctx.fillRect(pr.x, pr.y, pr.w, pr.h);
            }
        });

        // Draw Players
        this.players.forEach(p => {
            if (p.respawning) return;

            this.ctx.save();

            // Respawn flashing
            if (p.invulnerable > 0 && Math.floor(Date.now() / 100) % 2 === 0) {
                this.ctx.globalAlpha = 0.4;
            }

            const isFlyingHorizontal = (p.charData.name === "Palomo" && p.voladorFlying && !p.isGrounded);
            if (isFlyingHorizontal) {
                const cx = p.x + p.w / 2;
                const cy = p.y + p.h / 2;
                this.ctx.translate(cx, cy);
                this.ctx.rotate(p.facing * Math.PI / 2);
                this.ctx.translate(-cx, -cy);
            }

            // --- ANIMATION PROCEDURAL ---
            const now = Date.now();
            const walkTime = now * 0.012;
            const idleTime = now * 0.004;
            const flapTime = now * 0.025;

            // Squash & Stretch
            let scaleX = 1;
            let scaleY = 1;

            if (!p.isGrounded) {
                // Stretch in direction of vertical velocity
                scaleY = 1 + Math.min(0.2, Math.abs(p.vy) / 40);
                scaleX = 1 - Math.min(0.1, Math.abs(p.vy) / 80);
            } else if (Math.abs(p.vx) > 0.1) {
                // Walk squash & tilt
                scaleY = 1 - Math.abs(Math.sin(walkTime * 1.5)) * 0.05;
                scaleX = 1 + Math.abs(Math.sin(walkTime * 1.5)) * 0.02;
            } else {
                // Idle breathing
                scaleY = 1 + Math.sin(idleTime) * 0.02;
                scaleX = 1 - Math.sin(idleTime) * 0.01;
            }

            // Translate to feet center for scaling
            this.ctx.translate(p.x + p.w / 2, p.y + p.h);
            this.ctx.scale(scaleX, scaleY);

            // Draw shadow on ground if close
            if (p.isGrounded) {
                this.ctx.fillStyle = 'rgba(0, 0, 0, 0.2)';
                this.ctx.beginPath();
                this.ctx.ellipse(0, 0, p.w * 0.5, 4, 0, 0, Math.PI * 2);
                this.ctx.fill();
            }

            // Draw Legs
            this.ctx.strokeStyle = p.facing === 1 ? p.charData.colorAlt : p.charData.color;
            this.ctx.lineWidth = 6;
            this.ctx.lineCap = 'round';

            let leftLegAngle = 0.2;
            let rightLegAngle = -0.2;

            if (p.isGrounded && Math.abs(p.vx) > 0.1) {
                const swing = Math.sin(walkTime * Math.abs(p.vx) * 0.2);
                leftLegAngle = swing * 0.6;
                rightLegAngle = -swing * 0.6;
            } else if (!p.isGrounded) {
                leftLegAngle = 0.4 + Math.sin(flapTime) * 0.1;
                rightLegAngle = -0.4 - Math.sin(flapTime) * 0.1;
            }

            // Left leg
            this.ctx.save();
            this.ctx.translate(-p.w / 4, -4);
            this.ctx.rotate(leftLegAngle);
            this.ctx.beginPath();
            this.ctx.moveTo(0, 0);
            this.ctx.lineTo(0, 10);
            this.ctx.stroke();
            this.ctx.restore();

            // Right leg
            this.ctx.save();
            this.ctx.translate(p.w / 4, -4);
            this.ctx.rotate(rightLegAngle);
            this.ctx.beginPath();
            this.ctx.moveTo(0, 0);
            this.ctx.lineTo(0, 10);
            this.ctx.stroke();
            this.ctx.restore();

            // Wings for Volador class
            if (p.charData.name === "Palomo") {
                this.ctx.fillStyle = '#f472b6'; // Pastel pink wings
                const wingSwing = Math.sin(flapTime) * 0.4;

                // Left Wing
                this.ctx.save();
                this.ctx.translate(-p.w / 2, -p.h * 0.6);
                this.ctx.rotate(-0.5 + wingSwing);
                this.ctx.beginPath();
                this.ctx.ellipse(0, 0, 20, 8, -Math.PI / 6, 0, Math.PI * 2);
                this.ctx.fill();
                this.ctx.restore();

                // Right Wing
                this.ctx.save();
                this.ctx.translate(p.w / 2, -p.h * 0.6);
                this.ctx.rotate(0.5 - wingSwing);
                this.ctx.beginPath();
                this.ctx.ellipse(0, 0, 20, 8, Math.PI / 6, 0, Math.PI * 2);
                this.ctx.fill();
                this.ctx.restore();
            }

            // Draw Body
            const bodyColor = p.facing === 1 ? p.charData.color : p.charData.colorAlt;
            this.ctx.fillStyle = bodyColor;
            this.ctx.beginPath();
            this.ctx.roundRect(-p.w / 2, -p.h, p.w, p.h, [8]);
            this.ctx.fill();

            // Visor / Custom Head
            const headImg = headImages[p.name];
            if (headImg && headImg.complete) {
                const headSize = 44;
                this.ctx.save();
                this.ctx.translate(0, -p.h + 12);
                if (p.facing === -1) {
                    this.ctx.scale(-1, 1);
                }
                this.ctx.drawImage(headImg, -headSize / 2, -headSize / 2, headSize, headSize);
                this.ctx.restore();
            } else {
                this.ctx.fillStyle = '#0f172a';
                const visorW = 12;
                const visorH = 8;
                const visorX = p.facing === 1 ? p.w / 2 - 14 : -p.w / 2 + 2;
                this.ctx.beginPath();
                this.ctx.roundRect(visorX, -p.h + 10, visorW, visorH, [2]);
                this.ctx.fill();
            }

            // Weapon / Accessory rendering
            this.ctx.save();
            this.ctx.translate(p.facing * (p.w / 3), -p.h * 0.5);
            this.ctx.scale(p.facing, 1);

            // Weapon swing animation on attack/shieldStun (swing in scaled local coords)
            let attackAngle = 0;
            if (p.shieldStun > 0) {
                attackAngle = Math.sin((p.shieldStun / 15) * Math.PI) * 1.5;
            }
            this.ctx.rotate(attackAngle);

            if (p.charData.name === "Mago") {
                // Draw Sword
                this.ctx.strokeStyle = '#eab308'; // Golden blade
                this.ctx.lineWidth = 4;
                this.ctx.lineCap = 'square';
                this.ctx.beginPath();
                this.ctx.moveTo(0, 0);
                this.ctx.lineTo(24, -12);
                this.ctx.stroke();

                // Sword Hilt
                this.ctx.strokeStyle = '#a1a1aa';
                this.ctx.lineWidth = 6;
                this.ctx.beginPath();
                this.ctx.moveTo(4, 0);
                this.ctx.lineTo(4, -6);
                this.ctx.stroke();
            } else if (p.charData.name === "Sonic") {
                // Neon energy daggers
                this.ctx.strokeStyle = '#22c55e'; // Neon Green
                this.ctx.lineWidth = 3;
                this.ctx.shadowBlur = 10;
                this.ctx.shadowColor = '#22c55e';
                this.ctx.beginPath();
                this.ctx.moveTo(0, 0);
                this.ctx.lineTo(16, 4);
                this.ctx.stroke();
                this.ctx.shadowBlur = 0; // Reset
            } else if (p.charData.name === "Gordo") {
                // Giant combat mallet/hammer
                this.ctx.strokeStyle = '#78716c'; // Stone shaft
                this.ctx.lineWidth = 5;
                this.ctx.beginPath();
                this.ctx.moveTo(0, 8);
                this.ctx.lineTo(16, -16);
                this.ctx.stroke();

                // Hammer Head
                this.ctx.fillStyle = '#3f3f46';
                this.ctx.fillRect(12 - 6, -26, 12, 20);
            } else if (p.charData.name === "Zoner" || p.charData.name === "Cazador") {
                // Laser bow
                this.ctx.strokeStyle = '#3b82f6';
                this.ctx.lineWidth = 3;
                this.ctx.beginPath();
                this.ctx.arc(8, -4, 12, -Math.PI / 2, Math.PI / 2);
                this.ctx.stroke();
            }
            this.ctx.restore();

            // Draw active items in hand
            if (p.heldItem) {
                const itemImg = itemImages[p.heldItem];
                if (itemImg && itemImg.complete) {
                    this.ctx.drawImage(itemImg, -12, -p.h - 28, 24, 24);
                }
            }

            // Restore scale/translation per player
            this.ctx.restore();
            this.ctx.save();

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
            }

            // Draw charging effect for Balanceado
            if (p.charData.name === "Mago" && p.balanceadoCharge > 0) {
                const chargeProgress = Math.min(1, p.balanceadoCharge / 90);
                const radius = 6 + chargeProgress * 14;
                this.ctx.fillStyle = `rgba(245, 158, 11, ${0.4 + chargeProgress * 0.6})`;
                this.ctx.strokeStyle = '#ffffff';
                this.ctx.lineWidth = 1 + chargeProgress * 2;

                this.ctx.beginPath();
                this.ctx.arc(p.x + p.w / 2 + p.facing * 12, p.y + p.h / 3, radius, 0, Math.PI * 2);
                this.ctx.fill();
                this.ctx.stroke();
            }

            // Draw charging effect for Gordo
            if (p.charData.name === "Gordo" && p.gordoCharge > 0) {
                const chargeProgress = Math.min(1, p.gordoCharge / 30);
                const radius = 8 + chargeProgress * 10;
                this.ctx.fillStyle = `rgba(239, 68, 68, ${0.3 + chargeProgress * 0.5})`;
                this.ctx.strokeStyle = '#ffffff';
                this.ctx.lineWidth = 1;
                this.ctx.beginPath();
                this.ctx.arc(p.x + p.w / 2, p.y + p.h / 2, radius, 0, Math.PI * 2);
                this.ctx.fill();
                this.ctx.stroke();
            }

            // Draw charging effect for Palomo
            if (p.charData.name === "Palomo" && p.voladorCharge > 0) {
                const chargeProgress = Math.min(1, p.voladorCharge / 45);
                const radius = 6 + chargeProgress * 12;
                this.ctx.fillStyle = `rgba(192, 132, 252, ${0.4 + chargeProgress * 0.5})`;
                this.ctx.strokeStyle = '#ffffff';
                this.ctx.lineWidth = 1;
                this.ctx.beginPath();
                this.ctx.arc(p.x + p.w / 2, p.y + p.h / 2, radius, 0, Math.PI * 2);
                this.ctx.fill();
                this.ctx.stroke();
            }

            // Draw charging/sparkles effect for Veloz
            if (p.charData.name === "Sonic" && p.velozCharge > 0) {
                const chargeProgress = Math.min(1, p.velozCharge / 45);
                this.ctx.fillStyle = 'rgba(251, 191, 36, 0.5)';
                this.ctx.strokeStyle = '#ffffff';
                this.ctx.lineWidth = 1;
                for (let i = 0; i < 3; i++) {
                    const offsetAngle = (Date.now() / 100 + i * 2) % (Math.PI * 2);
                    const rx = p.x + p.w / 2 + Math.cos(offsetAngle) * (15 + chargeProgress * 10);
                    const ry = p.y + p.h / 2 + Math.sin(offsetAngle) * (15 + chargeProgress * 10);
                    this.ctx.beginPath();
                    this.ctx.arc(rx, ry, 2 + chargeProgress * 2, 0, Math.PI * 2);
                    this.ctx.fill();
                    this.ctx.stroke();
                }
            }

            // Draw motion trail for Veloz
            if (p.charData.name === "Sonic" && p.velozDashTimer > 0) {
                this.ctx.fillStyle = 'rgba(251, 191, 36, 0.3)';
                this.ctx.fillRect(p.x - p.facing * 15, p.y, p.w, p.h);
                this.ctx.fillStyle = 'rgba(251, 191, 36, 0.15)';
                this.ctx.fillRect(p.x - p.facing * 30, p.y, p.w, p.h);
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
