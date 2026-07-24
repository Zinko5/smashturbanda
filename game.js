// Virtual coordinates resolution (for physics calculations and scaling)
const V_WIDTH = 1200;
const V_HEIGHT = 800;

// Preload player custom head images
const headImages = {
    'Alex': new Image(),
    'Martín': new Image(),
    'Víctor': new Image(),
    'Gabriel': new Image(),
    'Omar': new Image()
};
headImages['Alex'].src = 'img/personas/alex-cara.png';
headImages['Martín'].src = 'img/personas/martin-cara.png';
headImages['Víctor'].src = 'img/personas/victor-cara.png';
headImages['Gabriel'].src = 'img/personas/gabriel-cara.png';
headImages['Omar'].src = 'img/personas/omar-cara.png';

// Preload item images
const itemImages = {
    'puma': new Image(),
    'yahu-strike': new Image()
};
itemImages['puma'].src = 'img/objetos/activable-puma.png';
itemImages['yahu-strike'].src = 'img/objetos/yahu-strike.png';

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
        baseDamage: 1.2,
        damageReceivedMultiplier: 1.067
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
                shootProjectile(p, 'fireball', p.facing * 10, 0, 15);
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
                triggerMeleeHitbox(p, 40, 30, 12, p.facing * 8, -5);
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
                            triggerMeleeHitbox(p, 60, 60, 4, 0, 0);
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
                shootProjectile(p, 'arrow', vx, vy, 10);
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
                        shootProjectile(p, 'bomb', 0, 10, 12, 16, 16);
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
    },
    blitzcrank: {
        name: "Blitzcrank",
        phenotype: "pesado",
        color: "#fbbf24", // Yellow
        colorAlt: "#d97706",
        width: 34,
        height: 52,
        specials: {
            neutral: (p) => { },
            up: (p) => {
                p.vy = -13;
                p.vx = p.facing * 2;
                p.shieldStun = 20;
                playSynthSound('jump');
            }
        }
    },
    yone: {
        name: "Yone",
        phenotype: "balanceado",
        color: "#ef4444", // Red
        colorAlt: "#7f1d1d",
        width: 30,
        height: 48,
        specials: {
            neutral: (p) => { },
            up: (p) => {
                p.vy = -14;
                p.vx = p.facing * 4;
                p.shieldStun = 18;
                playSynthSound('jump');
            }
        }
    },
    bomberman: {
        name: "Bomberman",
        phenotype: "ligero",
        color: "#f8fafc", // White
        colorAlt: "#94a3b8",
        width: 28,
        height: 44,
        specials: {
            neutral: (p) => { },
            up: (p) => {
                p.vy = -15;
                p.shieldStun = 15;
                playSynthSound('jump');
                gameEngine.triggerExplosion(p.x + p.w / 2, p.y + p.h + 10, p.id, 40);
            }
        }
    },
    terranova: {
        name: "Terranova",
        phenotype: "balanceado",
        color: "#78350f", // Brown
        colorAlt: "#451a03",
        width: 32,
        height: 50,
        specials: {
            neutral: (p) => { },
            up: (p) => {
                p.vy = -13;
                p.shieldStun = 20;
                playSynthSound('jump');
            }
        }
    },
    sett: {
        name: "Sett",
        phenotype: "pesado",
        color: "#dc2626", // Dark Red
        colorAlt: "#991b1b",
        width: 32,
        height: 50,
        specials: {
            neutral: (p) => { },
            up: (p) => {
                p.vy = -14;
                p.vx = p.facing * 3;
                p.shieldStun = 22;
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
        char.damageReceivedMultiplier = pheno.damageReceivedMultiplier || 1.0;
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

function triggerMeleeHitbox(attacker, w, h, damage, offsetX, offsetY) {
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

    // Also damage breakable platforms in range
    gameEngine.platforms.forEach(plat => {
        if (plat.terrainType === 'rompible' && !plat.broken) {
            if (checkAABBCollision(hitbox, plat)) {
                plat.hp -= damage;
                if (plat.hp <= 0) {
                    plat.broken = true;
                    plat.respawnTimer = 640; // 10.67s * 60fps = 640 ticks
                    playSynthSound('heavy_hit');
                    createBlastParticles(plat.x + plat.w/2, plat.y + plat.h/2, '#78716c'); // stone grey
                } else {
                    playSynthSound('hit');
                }
            }
        }
    });
}

function shootProjectile(attacker, type, vx, vy, damage, customW, customH) {
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
        life: 120 // 2 seconds
    };
    gameEngine.projectiles.push(proj);
}

function applyHit(attacker, victim, damage, explosionSource = null, kbMultiplier = 1.0) {
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
    // Apply phenotype damageReceivedMultiplier scaling for the victim
    if (victim.charData && victim.charData.damageReceivedMultiplier !== undefined) {
        finalDamage = Math.round(finalDamage * victim.charData.damageReceivedMultiplier);
    }

    playSynthSound(finalDamage > 12 ? 'heavy_hit' : 'hit');
    victim.damage += finalDamage;
    victim.consecutiveBounces = 0;

    // Yone Soul Damage Accumulation
    if (attacker && attacker.charData && attacker.charData.name === "Yone" && attacker.yoneSoulActive) {
        victim.yoneMarkedBy = attacker.id;
        victim.yoneDamageAccumulated = (victim.yoneDamageAccumulated || 0) + finalDamage;
    }

    // Fixed proportion relationship: base knockback is 0.8x of final damage
    const baseKnockback = finalDamage * 0.8 * kbMultiplier;
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

function returnYoneToBody(p) {
    if (!p.yoneSoulActive || p.yoneReturning) return;
    p.yoneReturning = true;
    p.invulnerable = 15;
    playSynthSound('jump');
}

function completeYoneReturn(p) {
    p.yoneSoulActive = false;

    p.vx = 0;
    p.vy = 0;
    p.invulnerable = 15; // brief invulnerability on return

    playSynthSound('explosion');

    // Handle marked enemies
    gameEngine.players.forEach(opp => {
        if (opp.yoneMarkedBy === p.id) {
            const accumulated = opp.yoneDamageAccumulated || 0;
            const extraDamage = Math.round(accumulated * 0.1567);
            if (extraDamage > 0) {
                applyHit(p, opp, extraDamage);

                // Push/knockback marked enemies
                const kbForce = (extraDamage * 0.8 * (1 + opp.damage / 100)) * (100 / opp.charData.weight);
                const pushAngle = p.facing === 1 ? -Math.PI / 6 : -5 * Math.PI / 6;
                opp.vx = Math.cos(pushAngle) * kbForce * 1.2;
                opp.vy = Math.sin(pushAngle) * kbForce * 0.9;
                opp.hitStun = Math.max(15, Math.floor(kbForce * 2.5));
            }
            opp.yoneMarkedBy = null;
            opp.yoneDamageAccumulated = 0;
        }
    });

    p.yoneCooldown = 340; // 5.67s cooldown
}



function fireBlitzcrankHook(p, progress, keys) {
    const dmg = Math.round(3 + progress * 4);
    const speed = 12 + progress * 8;
    const maxRange = 150 + progress * 400;

    let dirX = p.facing;
    let dirY = 0;
    if (keys.up) {
        dirY = -1;
    } else if (keys.down) {
        dirY = 1;
    }
    if (keys.left) {
        dirX = -1;
    } else if (keys.right) {
        dirX = 1;
    }

    const len = Math.sqrt(dirX * dirX + dirY * dirY);
    const vx = (dirX / len) * speed;
    const vy = (dirY / len) * speed;

    shootProjectile(p, 'hook', vx, vy, dmg, 18, 18);

    const lastProj = gameEngine.projectiles[gameEngine.projectiles.length - 1];
    if (lastProj && lastProj.type === 'hook') {
        lastProj.startX = lastProj.x;
        lastProj.startY = lastProj.y;
        lastProj.maxRange = maxRange;
        lastProj.returning = false;
        lastProj.grabbedPlayerId = null;
        lastProj.life = 180;
    }

    p.blitzcrankCooldown = 160;
    p.blitzcrankCharge = 0;
}

function getPlayerCooldownProgress(p) {
    let current = 0;
    let max = 1;
    
    if (p.charData.name === "Mago") {
        current = p.balanceadoCooldown || 0;
        max = 40;
    } else if (p.charData.name === "Palomo") {
        current = p.voladorBombCooldown || 0;
        max = 30;
    } else if (p.charData.name === "Gordo") {
        current = p.gordoCooldown || 0;
        max = 40;
    } else if (p.charData.name === "Blitzcrank") {
        current = p.blitzcrankCooldown || 0;
        max = 160;
    } else if (p.charData.name === "Yone") {
        current = p.yoneCooldown || 0;
        max = 340;
    } else if (p.charData.name === "Bomberman") {
        current = p.bombermanCooldown || 0;
        max = 94;
    } else if (p.charData.name === "Terranova") {
        current = p.terranovaCooldown || 0;
        max = 112;
    } else if (p.charData.name === "Sett") {
        current = p.settCooldown || 0;
        max = 136;
    } else if (p.charData.name === "Zoner") {
        current = p.zonerRechargeTimer || 0;
        max = 106;
    }
    
    return { current, max };
}

function triggerZonerSpecial(p, keys) {
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

    if (p.zonerCharge < 15) {
        // Normal arrow
        shootProjectile(p, 'arrow', vx, vy, 10);
        p.zonerRechargeTimer = 64;
    } else {
        // Burst of arrows
        const numArrows = Math.floor(2 + (p.zonerCharge / 100) * 8); // 2 to 10 arrows
        p.zonerBurstCount = numArrows;
        p.zonerBurstTimer = 0;
        p.zonerBurstVx = vx;
        p.zonerBurstVy = vy;
        p.zonerRechargeTimer = 106;
    }
    p.zonerCharge = 0;
}

// Particle effect on death / launch
function createBlastParticles(x, y, color, customCount = 20, customScale = 1.0) {
    for (let i = 0; i < customCount; i++) {
        gameEngine.particles.push({
            x: x,
            y: y,
            vx: (Math.random() - 0.5) * 15 * customScale,
            vy: (Math.random() - 0.5) * 15 * customScale,
            radius: (Math.random() * 5 + 3) * customScale,
            color: color,
            alpha: 1,
            life: Math.round(60 * customScale)
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

        this.slowMoActive = false;
        this.slowMoTarget = null;
        this.slowMoTimer = 0;

        this.resize();
        window.addEventListener('resize', () => this.resize());

        // Background Web Worker to prevent tab freezing
        const workerCode = `
            let timer = null;
            self.onmessage = function(e) {
                if (e.data === 'start') {
                    if (timer) clearInterval(timer);
                    timer = setInterval(() => {
                        self.postMessage('tick');
                    }, 16.67);
                } else if (e.data === 'stop') {
                    if (timer) {
                        clearInterval(timer);
                        timer = null;
                    }
                }
            };
        `;
        const blob = new Blob([workerCode], { type: 'application/javascript' });
        this.worker = new Worker(URL.createObjectURL(blob));
        this.worker.onmessage = (e) => {
            if (e.data === 'tick' && document.hidden && this.running) {
                this.loop(performance.now());
            }
        };

        document.addEventListener('visibilitychange', () => {
            if (this.running) {
                if (document.hidden) {
                    this.worker.postMessage('start');
                } else {
                    this.worker.postMessage('stop');
                    requestAnimationFrame((t) => this.loop(t));
                }
            }
        });
    }

    resize() {
        this.canvas.width = window.innerWidth;
        this.canvas.height = window.innerHeight;

        const scaleX = this.canvas.width / V_WIDTH;
        const scaleY = this.canvas.height / V_HEIGHT;
        this.scale = Math.min(scaleX, scaleY);
    }

    triggerExplosion(x, y, attackerId, radius = 110, excludePlayerId = null) {
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
            if (opponent.id === attackerId || opponent.id === excludePlayerId || opponent.respawning || opponent.invulnerable > 0) return;
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

        // Explosion damages breakable platforms in range
        this.platforms.forEach(plat => {
            if (plat.terrainType === 'rompible' && !plat.broken) {
                const platCenterX = plat.x + plat.w / 2;
                const platCenterY = plat.y + plat.h / 2;
                const dx = platCenterX - x;
                const dy = platCenterY - y;
                const distance = Math.sqrt(dx * dx + dy * dy);
                if (distance <= radius) {
                    const proximityFactor = 1 - (distance / radius);
                    const finalDamage = Math.round(coreDamage * proximityFactor);
                    if (finalDamage > 0) {
                        plat.hp -= finalDamage;
                        if (plat.hp <= 0) {
                            plat.broken = true;
                            plat.respawnTimer = 640; // 10.67s * 60fps = 640 ticks
                            createBlastParticles(plat.x + plat.w/2, plat.y + plat.h/2, '#78716c'); // stone grey
                        }
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

        this.slowMoActive = false;
        this.slowMoTarget = null;
        this.slowMoTimer = 0;

        this.timeRemaining = timeLimitMinutes * 60 * 60; // time in frames (60fps * 60secs * minutes)

        // Load Stage Platforms
        const stageConfig = STAGES[stageKey];
        this.platforms = JSON.parse(JSON.stringify(stageConfig.platforms));
        this.platforms.forEach(plat => {
            if (plat.terrainType === undefined) {
                if (plat.semi) plat.terrainType = 'traspasable';
                else plat.terrainType = 'duro';
            }
            if (plat.terrainType === 'rompible') {
                if (plat.maxHp === undefined) plat.maxHp = 30;
                plat.hp = plat.maxHp;
                plat.broken = false;
                plat.respawnTimer = 0;
            }
        });

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
        if (typeof playBattleMusic === 'function') {
            playBattleMusic();
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
        this.accumulator = 0;
        this.lastTime = performance.now();
        requestAnimationFrame((t) => this.loop(t));
    }

    updateHUD() {
        const hudContainer = document.getElementById('game-hud');
        if (!hudContainer) return;

        const colors = ['#00ccff', '#ff0055', '#ffcc00', '#00ff00'];

        // Reconstruct only if player count changes or differs
        if (hudContainer.children.length !== this.players.length || !this.hudCachedElements) {
            hudContainer.replaceChildren();
            this.hudCachedElements = [];
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

                this.hudCachedElements.push({
                    playerDiv,
                    damageSpan,
                    nameSpan,
                    stocksDiv
                });
            });
        }

        // Update existing elements in place using cached elements
        this.players.forEach((p, idx) => {
            const cached = this.hudCachedElements[idx];
            if (!cached) return;

            const damageSpan = cached.damageSpan;
            if (damageSpan) {
                const targetDamageText = `${Math.floor(p.damage)}%`;
                if (damageSpan.textContent !== targetDamageText) {
                    damageSpan.textContent = targetDamageText;
                    damageSpan.style.color = p.damage > 100 ? '#ff0055' : p.damage > 50 ? '#ffcc00' : '#ffffff';
                }
            }

            const nameSpan = cached.nameSpan;
            if (nameSpan && nameSpan.textContent !== p.name) {
                nameSpan.textContent = p.name;
            }

            const stocksDiv = cached.stocksDiv;
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

    loop(timestamp) {
        if (!this.running) return;

        if (!timestamp) timestamp = performance.now();
        let elapsed = timestamp - this.lastTime;
        this.lastTime = timestamp;

        // Cap elapsed time to prevent spiral of death if tab was inactive
        if (elapsed > 1000) {
            elapsed = 1000;
        }

        // Count down slow motion in real-time
        if (this.slowMoActive) {
            this.slowMoTimer--;
            if (this.slowMoTimer <= 0) {
                this.slowMoActive = false;
                this.slowMoTarget = null;
            }
        }

        this.accumulator += elapsed;
        const dt = 1000 / 60; // 60 FPS physics updates
        const effectiveDt = this.slowMoActive ? dt * 4 : dt; // 4x slower physics update in slow-mo

        while (this.accumulator >= effectiveDt) {
            this.update();
            this.accumulator -= effectiveDt;
        }

        this.render();

        if (!document.hidden) {
            requestAnimationFrame((t) => this.loop(t));
        }
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
        for (let i = this.platforms.length - 1; i >= 0; i--) {
            const plat = this.platforms[i];
            
            // Handle breakable platform respawn ticking
            if (plat.terrainType === 'rompible' && plat.broken) {
                plat.respawnTimer--;
                if (plat.respawnTimer <= 0) {
                    plat.broken = false;
                    plat.hp = plat.maxHp || 30;
                    playSynthSound('shield'); // shield sound for respawning/solidifying
                    createBlastParticles(plat.x + plat.w/2, plat.y + plat.h/2, '#94a3b8');
                }
            }

            if (plat.isWall) {
                // Emerging animation and delay handling
                if (plat.spawnDelay > 0) {
                    plat.spawnDelay--;
                    plat.h = 1;
                    plat.y = plat.originY + plat.targetHeight - 1;
                } else if (plat.h < plat.targetHeight) {
                    const growSpeed = 15;
                    plat.h = Math.min(plat.targetHeight, plat.h + growSpeed);
                    plat.y = plat.originY + plat.targetHeight - plat.h;

                    if (plat.h >= plat.targetHeight) {
                        plat.fullyEmerged = true;
                    }

                    // Apply hit to overlapping players as it rises
                    this.players.forEach(opp => {
                        if (opp.id !== plat.ownerId && !opp.respawning && opp.invulnerable <= 0) {
                            const oppRect = { x: opp.x, y: opp.y, w: opp.w, h: opp.h };
                            if (checkAABBCollision(plat, oppRect)) {
                                const damage = plat.damage || 12;
                                applyHit(this.players.find(p => p.id === plat.ownerId) || opp, opp, damage);
                                opp.vy = -14;
                                opp.vx = (opp.x + opp.w/2 < plat.x + plat.w/2) ? -6 : 6;
                            }
                        }
                    });
                }

                // Decrement life only after emerging fully
                if (plat.spawnDelay <= 0 && plat.h >= plat.targetHeight) {
                    plat.life--;
                }

                if (plat.life <= 0) {
                    this.players.forEach(pl => {
                        if (pl.terranovaWall === plat) {
                            pl.terranovaWall = null;
                        }
                    });
                    this.platforms.splice(i, 1);
                }
            } else if (plat.moving) {
                plat.y += plat.speedY * plat.dirY;
                if (plat.y >= plat.rangeY[1]) {
                    plat.dirY = -1;
                } else if (plat.y <= plat.rangeY[0]) {
                    plat.dirY = 1;
                }
            }
        }

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
                        shootProjectile(attacker, 'bomb', 0, 8, 25, 45, 45);
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
            const attackerPlayer = this.players.find(p => p.id === pr.attackerId);

            if (pr.type === 'bomberman_bomb') {
                pr.vy = Math.min(10, pr.vy + 0.35);
            }

            if (pr.type === 'hook' && pr.returning) {
                if (attackerPlayer) {
                    const targetX = attackerPlayer.x + attackerPlayer.w / 2;
                    const targetY = attackerPlayer.y + attackerPlayer.h / 2;
                    const returnDx = targetX - (pr.x + pr.w / 2);
                    const returnDy = targetY - (pr.y + pr.h / 2);
                    const returnDist = Math.sqrt(returnDx * returnDx + returnDy * returnDy);
                    if (returnDist < 25) {
                        if (pr.grabbedPlayerId) {
                            const victim = this.players.find(pl => pl.id === pr.grabbedPlayerId);
                            if (victim) {
                                victim.x = attackerPlayer.x + attackerPlayer.facing * 35;
                                victim.y = attackerPlayer.y;
                                victim.vx = 0;
                                victim.vy = 0;
                                victim.hitStun = 10;
                            }
                        }
                        pr.life = 0; // mark inactive
                    } else {
                        const returnSpeed = 18;
                        pr.vx = (returnDx / returnDist) * returnSpeed;
                        pr.vy = (returnDy / returnDist) * returnSpeed;
                    }
                } else {
                    pr.life = 0;
                }
            }

            pr.x += pr.vx;
            pr.y += pr.vy;
            pr.life--;

            if (pr.type === 'hook' && !pr.returning) {
                const dx = pr.x - pr.startX;
                const dy = pr.y - pr.startY;
                const distance = Math.sqrt(dx*dx + dy*dy);
                if (distance >= pr.maxRange) {
                    pr.returning = true;
                    pr.vx = 0;
                    pr.vy = 0;
                }
            }

            // Drag grabbed player along
            if (pr.type === 'hook' && pr.returning && pr.grabbedPlayerId) {
                const victim = this.players.find(pl => pl.id === pr.grabbedPlayerId);
                if (victim) {
                    if (victim.respawning || victim.stocks <= 0) {
                        pr.grabbedPlayerId = null;
                    } else {
                        victim.x = pr.x + pr.w / 2 - victim.w / 2;
                        victim.y = pr.y + pr.h / 2 - victim.h / 2;
                        victim.vx = 0;
                        victim.vy = 0;
                        victim.hitStun = 5;
                    }
                }
            }

            // Check collision with stage/screen bounds or oponent
            let active = pr.life > 0 && pr.x > -200 && pr.x < V_WIDTH + 200 && pr.y > -200 && pr.y < V_HEIGHT + 200;

            if (active && pr.type === 'bomberman_bomb') {
                for (let plat of this.platforms) {
                    const platRect = { x: plat.x, y: plat.y, w: plat.w, h: plat.h };
                    if (checkAABBCollision(pr, platRect)) {
                        pr.y = plat.y - pr.h;
                        pr.vy = 0;
                        pr.vx = 0;
                        break;
                    }
                }
            }

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
                        if (this.teamsEnabled && attackerPlayer && pl.team && attackerPlayer.team && pl.team === attackerPlayer.team) continue;

                        const victimRect = { x: pl.x, y: pl.y, w: pl.w, h: pl.h };
                        if (checkAABBCollision(pr, victimRect)) {
                            if (pr.type === 'bomb' || pr.type === 'fireball') {
                                const radius = Math.round(pr.w * 4.2);
                                this.triggerExplosion(pr.x + pr.w / 2, pr.y + pr.h / 2, pr.attackerId, radius);
                            } else if (pr.type === 'hook') {
                                if (!pr.returning) {
                                    applyHit(attackerPlayer, pl, pr.damage);
                                    pr.returning = true;
                                    pr.grabbedPlayerId = pl.id;
                                    pr.vx = 0;
                                    pr.vy = 0;
                                    createBlastParticles(pl.x, pl.y, '#eab308', 8, 0.5);
                                }
                            } else if (pr.type === 'bomberman_bomb') {
                                continue;
                            } else {
                                applyHit(attackerPlayer, pl, pr.damage);
                            }
                            if (pr.type !== 'hook') {
                                active = false;
                            }
                            break;
                        }
                    }
                }
            }

            if (pr.type === 'bomberman_bomb' && pr.life <= 0) {
                this.triggerExplosion(pr.x + pr.w / 2, pr.y + pr.h / 2, pr.attackerId, pr.explosionRadius || 80);
                active = false;
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

        // Check for dramatic slow-mo/zoom on final stock death
        if (this.matchType === 'stocks' && !this.slowMoActive && this.mode !== 'training') {
            this.players.forEach(p => {
                if (p.stocks === 1 && !p.respawning) {
                    // Check if this player's death would end the match (i.e. only 1 team or player left alive)
                    let wouldEndGame = false;
                    if (this.teamsEnabled) {
                        const activeTeams = new Set(this.players.filter(pl => pl.stocks > 0 && !pl.respawning).map(pl => pl.team));
                        if (activeTeams.size <= 2) {
                            // If this player is the last one alive on their team
                            const teamMatesAlive = this.players.filter(pl => pl.team === p.team && pl.stocks > 0 && !pl.respawning && pl.id !== p.id);
                            if (teamMatesAlive.length === 0) {
                                wouldEndGame = true;
                            }
                        }
                    } else {
                        const aliveCount = this.players.filter(pl => pl.stocks > 0 && !pl.respawning).length;
                        if (aliveCount <= 2) {
                            wouldEndGame = true;
                        }
                    }

                    if (wouldEndGame) {
                        // Check if they are flying off-stage with no hope of saving themselves
                        const stageLeft = 100;
                        const stageRight = V_WIDTH - 100;
                        const isFlyingOut = (p.x < stageLeft && p.vx < -6) ||
                            (p.x > stageRight && p.vx > 6) ||
                            (p.y > V_HEIGHT - 100 && p.vy > 6) ||
                            (p.y < 50 && p.vy < -6);

                        if (isFlyingOut) {
                            this.slowMoActive = true;
                            this.slowMoTarget = p;
                            this.slowMoTimer = 90; // 90 frames of slow-mo (1.5 seconds real-time)
                        }
                    }
                }
            });
        }
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

        // Yone Returning Rapid Displacement Loop
        if (p.charData.name === "Yone" && p.yoneReturning) {
            p.invulnerable = Math.max(p.invulnerable, 2);
            const dx = p.yoneBodyX - p.x;
            const dy = p.yoneBodyY - p.y;
            const dist = Math.sqrt(dx * dx + dy * dy);
            
            const speed = 45; // 45px/frame displacement speed
            if (dist <= speed) {
                p.x = p.yoneBodyX;
                p.y = p.yoneBodyY;
                p.vx = 0;
                p.vy = 0;
                p.yoneReturning = false;
                completeYoneReturn(p);
            } else {
                p.vx = (dx / dist) * speed;
                p.vy = (dy / dist) * speed;
                p.x += p.vx;
                p.y += p.vy;
            }
            return; // skip standard inputs/gravity/physics
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
        if (p.ignoreSemiPlatformsTimer === undefined) p.ignoreSemiPlatformsTimer = 0;
        if (p.ignoreSemiPlatformsTimer > 0) p.ignoreSemiPlatformsTimer--;
        if (p.balanceadoCooldown === undefined) p.balanceadoCooldown = 0;
        if (p.balanceadoCharge === undefined) p.balanceadoCharge = 0;
        if (p.gordoCooldown === undefined) p.gordoCooldown = 0;
        if (p.gordoCharge === undefined) p.gordoCharge = 0;
        if (p.voladorCharge === undefined) p.voladorCharge = 0;
        if (p.zonerShots === undefined) p.zonerShots = 2;
        if (p.zonerRechargeTimer === undefined) p.zonerRechargeTimer = 0;
        if (p.zonerCharge === undefined) p.zonerCharge = 0;
        if (p.zonerBurstCount === undefined) p.zonerBurstCount = 0;
        if (p.zonerBurstTimer === undefined) p.zonerBurstTimer = 0;
        if (p.zonerBurstVx === undefined) p.zonerBurstVx = 0;
        if (p.zonerBurstVy === undefined) p.zonerBurstVy = 0;

        if (p.velozCharge === undefined) p.velozCharge = 0;
        if (p.velozDashTimer === undefined) p.velozDashTimer = 0;
        if (p.velozDashSpeed === undefined) p.velozDashSpeed = 0;
        if (p.velozDashHits === undefined) p.velozDashHits = [];

        // Blitzcrank Initializations
        if (p.blitzcrankCooldown === undefined) p.blitzcrankCooldown = 0;
        if (p.blitzcrankCharge === undefined) p.blitzcrankCharge = 0;

        // Yone Initializations
        if (p.yoneCooldown === undefined) p.yoneCooldown = 0;
        if (p.yoneSoulActive === undefined) p.yoneSoulActive = false;
        if (p.yoneReturning === undefined) p.yoneReturning = false;
        if (p.yoneSoulTimer === undefined) p.yoneSoulTimer = 0;

        // Bomberman Initializations
        if (p.bombermanCooldown === undefined) p.bombermanCooldown = 0;
        if (p.bombermanCharge === undefined) p.bombermanCharge = 0;

        // Terranova Initializations
        if (p.terranovaCooldown === undefined) p.terranovaCooldown = 0;
        if (p.terranovaCharge === undefined) p.terranovaCharge = 0;
        if (p.terranovaWall === undefined) p.terranovaWall = null;

        // Sett Initializations
        if (p.settCooldown === undefined) p.settCooldown = 0;
        if (p.settCharge === undefined) p.settCharge = 0;
        if (p.settGrabbedEnemy === undefined) p.settGrabbedEnemy = null;
        if (p.settIsJumping === undefined) p.settIsJumping = false;

        // Cooldown Decrements
        if (p.balanceadoCooldown > 0) p.balanceadoCooldown--;
        if (p.gordoCooldown > 0) p.gordoCooldown--;
        if (p.blitzcrankCooldown > 0) p.blitzcrankCooldown--;
        if (p.yoneCooldown > 0) p.yoneCooldown--;
        if (p.bombermanCooldown > 0) p.bombermanCooldown--;
        if (p.terranovaCooldown > 0) p.terranovaCooldown--;
        if (p.settCooldown > 0) p.settCooldown--;
        if (p.zonerRechargeTimer > 0) p.zonerRechargeTimer--;

        if (p.zonerBurstCount > 0) {
            p.zonerBurstTimer--;
            if (p.zonerBurstTimer <= 0) {
                shootProjectile(p, 'arrow', p.zonerBurstVx, p.zonerBurstVy, 5.5);
                p.zonerBurstCount--;
                p.zonerBurstTimer = 6;
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
            p.consecutiveBounces = 0;
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

        // Yone Soul Timer Tick
        if (p.charData.name === "Yone" && p.yoneSoulActive) {
            p.yoneSoulTimer--;
            if (p.yoneSoulTimer <= 0) {
                returnYoneToBody(p);
            }
        }

        // Sett Grab Jump Update
        if (p.charData.name === "Sett" && p.settIsJumping && p.settGrabbedEnemy) {
            const target = p.settGrabbedEnemy;
            if (target.respawning || target.stocks <= 0) {
                p.settGrabbedEnemy = null;
                p.settIsJumping = false;
            } else {
                target.x = p.x + p.facing * 20;
                target.y = p.y;
                target.vx = 0;
                target.vy = 0;
                target.hitStun = 5;

                if (p.isGrounded && Math.abs(p.vy) < 0.1) {
                    // Slam!
                    const distX = Math.abs(p.x - p.settGrabStartX);
                    const distY = Math.max(0, p.y - p.settGrabStartY);
                    const totalDist = distX + distY;
                    const slamDamage = Math.round(9 + totalDist * 0.0375);

                    applyHit(p, target, slamDamage, null, 0.45);

                    // Let applyHit handle target.vx and target.vy dynamically, but ensure solid hitstun:
                    target.hitStun = Math.max(35, target.hitStun || 0);

                    gameEngine.triggerExplosion(p.x + p.w / 2, p.y + p.h, p.id, 50, target.id);

                    p.settGrabbedEnemy = null;
                    p.settIsJumping = false;
                }
            }
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

        // Detect double tap down
        const prevDown = prevKeys.down || false;
        if (keys.down && !prevDown) {
            const now = Date.now();
            if (p.lastDownPressTime && (now - p.lastDownPressTime < 250)) {
                p.doubleTapDown = true;
            }
            p.lastDownPressTime = now;
        } else {
            p.doubleTapDown = false;
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
                let currentSpeed = p.charData.speed;
                if (p.charData.name === "Yone" && p.yoneSoulActive) {
                    currentSpeed = p.charData.speed * 1.5;
                }

                let appliedFriction = false;
                if (Math.abs(p.vx) > currentSpeed) {
                    p.vx *= p.isGrounded ? 0.75 : 0.95;
                    appliedFriction = true;
                }

                if (keys.left) {
                    if (!appliedFriction) {
                        p.vx = Math.max(-currentSpeed, p.vx - 0.8);
                    } else if (p.vx > 0) {
                        p.vx -= 0.8; // extra braking force
                    }
                    p.facing = -1;
                } else if (keys.right) {
                    if (!appliedFriction) {
                        p.vx = Math.min(currentSpeed, p.vx + 0.8);
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
                        let dmg = 9;
                        if (p.charData.phenotype === 'pesado') dmg = 7.5;
                        else if (p.charData.phenotype === 'balanceado') dmg = 8;
                        triggerMeleeHitbox(p, 45, 60, dmg, 0, -45); // Up Air/Tilt
                    } else if (keys.down) {
                        let dmg = 8;
                        if (p.charData.phenotype === 'pesado') dmg = 6.5;
                        else if (p.charData.phenotype === 'balanceado') dmg = 7;
                        triggerMeleeHitbox(p, 65, 30, dmg, 5, 20);  // Down sweep
                    } else if (keys.left || keys.right) {
                        let dmg = 11;
                        if (p.charData.phenotype === 'pesado') dmg = 8.5;
                        else if (p.charData.phenotype === 'balanceado') dmg = 9;
                        triggerMeleeHitbox(p, 60, 40, dmg, 10, -5); // Smash Forward
                    } else {
                        // Neutral Combo attack (3-step combo)
                        if (p.comboTimer > 0) {
                            p.comboCount = (p.comboCount + 1) % 3;
                        } else {
                            p.comboCount = 0;
                        }
                        p.comboTimer = 40; // 40 frames window to continue the combo

                        if (p.comboCount === 0) {
                            triggerMeleeHitbox(p, 45, 30, 4, 10, -5); // Hit 1: low dmg & low knockback
                        } else if (p.comboCount === 1) {
                            triggerMeleeHitbox(p, 45, 30, 4, 10, -5); // Hit 2: low dmg & low knockback
                        } else {
                            triggerMeleeHitbox(p, 55, 35, 8, 12, -5); // Hit 3: finisher, high dmg & high knockback
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
                                    shootProjectile(p, 'fireball', vx, vy, damage, size, size);

                                    p.balanceadoCooldown = 40; // 0.67s cooldown
                                    p.balanceadoCharge = 0;
                                }
                            } else if (p.balanceadoCharge > 0) {
                                // Released attackB
                                const progress = Math.min(1, p.balanceadoCharge / 90);
                                const damage = Math.round(8 + progress * 10);
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
                                shootProjectile(p, 'fireball', vx, vy, damage, size, size);

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
                                        shootProjectile(p, 'bomb', 0, 10, dmg, size, size);
                                        p.voladorBombCooldown = 30;
                                        p.voladorCharge = 0;
                                    }
                                } else if (p.voladorCharge > 0) {
                                    const progress = Math.min(1.0, p.voladorCharge / 45);
                                    const dmg = Math.round(12 + progress * 10);
                                    const size = Math.round(16 + progress * 24);
                                    shootProjectile(p, 'bomb', 0, 10, dmg, size, size);
                                    p.voladorBombCooldown = Math.round(16 + progress * 14);
                                    p.voladorCharge = 0;
                                }
                            }
                        }
                    } else if (p.charData.name === "Zoner") {
                        if (p.zonerRechargeTimer <= 0 && p.zonerBurstCount <= 0 && (!keys.up || p.isGrounded || p.upSpecialUsed)) {
                            if (keys.attackB) {
                                p.zonerCharge++;
                                p.vx = 0;
                                if (p.vy > 0) p.vy = 0.5; // Slow fall during charging

                                if (p.zonerCharge >= 100) {
                                    triggerZonerSpecial(p, keys);
                                }
                            } else if (p.zonerCharge > 0) {
                                triggerZonerSpecial(p, keys);
                            }
                        } else {
                            p.zonerCharge = 0;
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
                    } else if (p.charData.name === "Blitzcrank") {
                        if (p.blitzcrankCooldown <= 0) {
                            if (keys.attackB) { // removed p.isGrounded restriction for diagonal aiming flex
                                p.blitzcrankCharge++;
                                p.vx = 0;
                                if (p.vy > 0) p.vy = 0.5;
                                if (p.blitzcrankCharge >= 45) {
                                    fireBlitzcrankHook(p, 1.0, keys);
                                }
                            } else if (p.blitzcrankCharge > 0) {
                                fireBlitzcrankHook(p, Math.min(1.0, p.blitzcrankCharge / 45), keys);
                            }
                        }
                    } else if (p.charData.name === "Yone") {
                        if (keys.attackB && !prevKeys.attackB && (!keys.up || p.isGrounded)) {
                            if (p.yoneSoulActive) {
                                returnYoneToBody(p);
                            } else if (p.yoneCooldown <= 0) {
                                p.yoneSoulActive = true;
                                p.yoneBodyX = p.x;
                                p.yoneBodyY = p.y;
                                p.yoneSoulTimer = 280; // 4.67 seconds
                                p.invulnerable = 10;
                                playSynthSound('jump');
                            }
                        }
                    } else if (p.charData.name === "Bomberman") {
                        if (p.bombermanCooldown <= 0) {
                            if (keys.attackB && (!keys.up || p.isGrounded)) {
                                p.bombermanCharge++;
                                p.vx = 0;
                                if (p.vy > 0) p.vy = 0.5;
                                if (p.bombermanCharge >= 45) {
                                    const progress = 1.0;
                                    const size = Math.round(20 + progress * 20);
                                    shootProjectile(p, 'bomberman_bomb', p.facing * 1.5, -2, 0, size, size);
                                    const lastP = gameEngine.projectiles[gameEngine.projectiles.length - 1];
                                    if (lastP && lastP.type === 'bomberman_bomb') {
                                        lastP.explosionRadius = Math.round(80 + progress * 100);
                                        lastP.life = 130;
                                    }
                                    p.bombermanCooldown = 45;
                                    p.bombermanCharge = 0;
                                }
                            } else if (p.bombermanCharge > 0) {
                                const progress = Math.min(1.0, p.bombermanCharge / 45);
                                const size = Math.round(20 + progress * 20);
                                shootProjectile(p, 'bomberman_bomb', p.facing * 1.5, -2, 0, size, size);
                                const lastP = gameEngine.projectiles[gameEngine.projectiles.length - 1];
                                if (lastP && lastP.type === 'bomberman_bomb') {
                                    lastP.explosionRadius = Math.round(80 + progress * 100);
                                    lastP.life = 130;
                                }
                                p.bombermanCooldown = 45;
                                p.bombermanCharge = 0;
                            }
                        }
                    } else if (p.charData.name === "Terranova") {
                        if (p.terranovaCooldown <= 0) {
                            if (keys.attackB && (!keys.up || p.isGrounded)) {
                                p.terranovaCharge++;
                                p.vx = 0;
                                if (p.vy > 0) p.vy = 0.5;
                                if (p.terranovaCharge >= 45) {
                                    const progress = 1.0;
                                    const hMain = Math.round(60 + progress * 200);
                                    const hMini2 = Math.round(hMain * 0.5);
                                    const hMini1 = Math.round(hMini2 * 0.5);
                                    const w = 32;
                                    const xMain = p.x + (p.facing === 1 ? p.w + 90 : -122);
                                    const xMini1 = p.x + (p.facing === 1 ? p.w + 25 : -57);
                                    const xMini2 = p.x + (p.facing === 1 ? p.w + 58 : -90);

                                    const damage = Math.round(10 + progress * 12);

                                    const wallMain = {
                                        x: xMain, y: p.y + p.h - 1, w: w, h: 1,
                                        targetHeight: hMain, originY: p.y + p.h - hMain,
                                        isWall: true, ownerId: p.id, life: 280, spawnDelay: 12, damage: damage, semi: false
                                    };
                                    const wallMini2 = {
                                        x: xMini2, y: p.y + p.h - 1, w: w, h: 1,
                                        targetHeight: hMini2, originY: p.y + p.h - hMini2,
                                        isWall: true, ownerId: p.id, life: 280, spawnDelay: 6, damage: damage, semi: false
                                    };
                                    const wallMini1 = {
                                        x: xMini1, y: p.y + p.h - 1, w: w, h: 1,
                                        targetHeight: hMini1, originY: p.y + p.h - hMini1,
                                        isWall: true, ownerId: p.id, life: 280, spawnDelay: 0, damage: damage, semi: false
                                    };

                                    gameEngine.platforms.push(wallMini1, wallMini2, wallMain);

                                    playSynthSound('heavy_hit');
                                    p.terranovaCooldown = 112;
                                    p.terranovaCharge = 0;
                                }
                            } else if (p.terranovaCharge > 0) {
                                const progress = Math.min(1.0, p.terranovaCharge / 45);
                                const hMain = Math.round(60 + progress * 200);
                                const hMini2 = Math.round(hMain * 0.5);
                                const hMini1 = Math.round(hMini2 * 0.5);
                                const w = 32;
                                const xMain = p.x + (p.facing === 1 ? p.w + 90 : -122);
                                const xMini1 = p.x + (p.facing === 1 ? p.w + 25 : -57);
                                const xMini2 = p.x + (p.facing === 1 ? p.w + 58 : -90);

                                const damage = Math.round(10 + progress * 12);

                                const wallMain = {
                                    x: xMain, y: p.y + p.h - 1, w: w, h: 1,
                                    targetHeight: hMain, originY: p.y + p.h - hMain,
                                    isWall: true, ownerId: p.id, life: 280, spawnDelay: 12, damage: damage, semi: false
                                };
                                const wallMini2 = {
                                    x: xMini2, y: p.y + p.h - 1, w: w, h: 1,
                                    targetHeight: hMini2, originY: p.y + p.h - hMini2,
                                    isWall: true, ownerId: p.id, life: 280, spawnDelay: 6, damage: damage, semi: false
                                };
                                const wallMini1 = {
                                    x: xMini1, y: p.y + p.h - 1, w: w, h: 1,
                                    targetHeight: hMini1, originY: p.y + p.h - hMini1,
                                    isWall: true, ownerId: p.id, life: 280, spawnDelay: 0, damage: damage, semi: false
                                };

                                gameEngine.platforms.push(wallMini1, wallMini2, wallMain);

                                playSynthSound('heavy_hit');
                                p.terranovaCooldown = 112;
                                p.terranovaCharge = 0;
                            }
                        }
                    } else if (p.charData.name === "Sett") {
                        if (p.settCooldown <= 0 && !p.settIsJumping) {
                            const targetRange = 50;
                            let target = null;
                            for (let opponent of gameEngine.players) {
                                if (opponent.id !== p.id && !opponent.respawning && opponent.invulnerable <= 0) {
                                    const dist = Math.abs((p.x + p.w / 2) - (opponent.x + opponent.w / 2));
                                    const verticalDist = Math.abs(p.y - opponent.y);
                                    if (dist <= (p.w / 2 + opponent.w / 2 + targetRange) && verticalDist < p.h) {
                                        target = opponent;
                                        break;
                                    }
                                }
                            }

                            if (target) {
                                if (keys.attackB && (!keys.up || p.isGrounded)) {
                                    p.settCharge++;
                                    if (p.settCharge === 1) {
                                        p.settGrabSide = (target.x + target.w / 2 < p.x + p.w / 2) ? -1 : 1;
                                        p.facing = p.settGrabSide;
                                    }
                                    // Allow changing facing direction during charge
                                    if (keys.left) p.facing = -1;
                                    else if (keys.right) p.facing = 1;

                                    p.vx = 0;
                                    p.vy = 0;
                                    target.x = p.x + p.settGrabSide * 20;
                                    target.y = p.y;
                                    target.vx = 0;
                                    target.vy = 0;
                                    target.hitStun = 5;

                                    if (p.settCharge >= 45) {
                                        const progress = 1.0;
                                        p.settGrabbedEnemy = target;
                                        p.settIsJumping = true;
                                        p.settGrabStartX = p.x;
                                        p.settGrabStartY = p.y;
                                        p.vy = -9;
                                        p.vx = p.facing * (8 + progress * 10);
                                        p.settCharge = 0;
                                        p.settCooldown = 180;
                                        playSynthSound('jump');
                                    }
                                } else if (p.settCharge > 0) {
                                    const progress = Math.min(1.0, p.settCharge / 45);
                                    p.settGrabbedEnemy = target;
                                    p.settIsJumping = true;
                                    p.settGrabStartX = p.x;
                                    p.settGrabStartY = p.y;
                                    p.vy = -9;
                                    p.vx = p.facing * (8 + progress * 10);
                                    p.settCharge = 0;
                                    p.settCooldown = 180;
                                    playSynthSound('jump');
                                }
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

                triggerMeleeHitbox(p, 90, 40, finalDmg, 0, 10);
                playSynthSound('heavy_hit');
            }
        }

        // Platforms Collisions
        p.isGrounded = false;

        // Wall horizontal collisions
        for (let plat of this.platforms) {
            if (plat.terrainType === 'rompible' && plat.broken) {
                continue;
            }
            if (plat.isWall) {
                if (p.y + p.h > plat.y + 6) {
                    const playerRect = { x: p.x, y: p.y, w: p.w, h: p.h };
                    const platRect = { x: plat.x, y: plat.y, w: plat.w, h: plat.h };
                    if (checkAABBCollision(playerRect, platRect)) {
                        const overlapLeft = (p.x + p.w) - plat.x;
                        const overlapRight = (plat.x + plat.w) - p.x;
                        if (overlapLeft < overlapRight) {
                            p.x -= overlapLeft;
                            if (p.hitStun > 0 && p.vx > 0) {
                                p.consecutiveBounces = (p.consecutiveBounces || 0) + 1;
                                const bounceCoeff = 0.55 * Math.pow(0.5, p.consecutiveBounces - 1);
                                p.vx = -p.vx * bounceCoeff;
                                playSynthSound('hit');
                                createBlastParticles(p.x, p.y, '#e2e8f0', Math.max(2, Math.round(8 * bounceCoeff)), 0.45 * bounceCoeff);
                            } else if (p.vx > 0) {
                                p.vx = 0;
                            }
                        } else {
                            p.x += overlapRight;
                            if (p.hitStun > 0 && p.vx < 0) {
                                p.consecutiveBounces = (p.consecutiveBounces || 0) + 1;
                                const bounceCoeff = 0.55 * Math.pow(0.5, p.consecutiveBounces - 1);
                                p.vx = -p.vx * bounceCoeff;
                                playSynthSound('hit');
                                createBlastParticles(p.x, p.y, '#e2e8f0', Math.max(2, Math.round(8 * bounceCoeff)), 0.45 * bounceCoeff);
                            } else if (p.vx < 0) {
                                p.vx = 0;
                            }
                        }
                    }
                }
            }
        }

        for (let plat of this.platforms) {
            if (plat.terrainType === 'rompible' && plat.broken) {
                continue;
            }

            // Fall through traspasable platform
            if (plat.terrainType === 'traspasable') {
                if (p.ignoreSemiPlatformsTimer > 0) {
                    continue;
                }
                if (p.doubleTapDown) {
                    p.ignoreSemiPlatformsTimer = 12;
                    p.y += 6;
                    p.isGrounded = false;
                    p.vy = 2.5;
                    continue;
                }
                if (keys.down && p.vy >= 0 && (p.y + p.h - p.vy <= plat.y + 2)) {
                    continue;
                }
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

                // If in hitstun, apply floor bounce/rebound!
                if (p.hitStun > 0 && p.vy > 1.5) {
                    p.y = plat.y - p.h;
                    p.consecutiveBounces = (p.consecutiveBounces || 0) + 1;
                    const bounceCoeff = 0.55 * Math.pow(0.5, p.consecutiveBounces - 1);
                    p.vy = -p.vy * bounceCoeff;
                    playSynthSound('hit');
                    createBlastParticles(p.x + p.w/2, p.y + p.h, '#e2e8f0', Math.max(2, Math.round(8 * bounceCoeff)), 0.45 * bounceCoeff);
                    break;
                }

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
        if (this.slowMoActive && this.slowMoTarget === p) {
            this.slowMoActive = false;
            this.slowMoTarget = null;
        }
        if (p.charData.name === "Yone") {
            p.yoneSoulActive = false;
            p.yoneReturning = false;
            this.players.forEach(opp => {
                if (opp.yoneMarkedBy === p.id) {
                    opp.yoneMarkedBy = null;
                    opp.yoneDamageAccumulated = 0;
                }
            });
        }

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
        this.slowMoActive = false;
        this.slowMoTarget = null;
        this.slowMoTimer = 0;
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

        if (typeof stopBattleMusic === 'function') {
            stopBattleMusic();
        }
        let terranovaWon = false;
        if (winner !== "Empate") {
            terranovaWon = this.players.some(p => winner.includes(p.name) && p.charData && p.charData.name === "Terranova");
        }

        if (terranovaWon) {
            if (typeof playTerranovaVictoryMusic === 'function') {
                playTerranovaVictoryMusic();
            } else if (typeof playMenuMusic === 'function') {
                playMenuMusic();
            }
        } else {
            if (typeof playMenuMusic === 'function') {
                playMenuMusic();
            }
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

        if (this.slowMoActive && this.slowMoTarget) {
            // Focus camera zoom (up to 2x zoom over 15 frames)
            const progress = (90 - this.slowMoTimer) / 15;
            const zoomFactor = 1.0 + Math.min(1.0, progress) * 1.2; // Zoom to 2.2x

            let targetX = this.slowMoTarget.x + this.slowMoTarget.w / 2;
            let targetY = this.slowMoTarget.y + this.slowMoTarget.h / 2;

            // Keep camera center bounded so we don't look completely outside the virtual canvas
            targetX = Math.max(150, Math.min(V_WIDTH - 150, targetX));
            targetY = Math.max(150, Math.min(V_HEIGHT - 150, targetY));

            this.ctx.translate(V_WIDTH / 2, V_HEIGHT / 2);
            this.ctx.scale(zoomFactor, zoomFactor);
            this.ctx.translate(-targetX, -targetY);
        }

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
            if (plat.terrainType === 'rompible' && plat.broken) return;

            if (plat.terrainType === 'traspasable') {
                this.ctx.fillStyle = '#475569';
                this.ctx.fillRect(plat.x, plat.y, plat.w, plat.h);
                // Glass top
                this.ctx.fillStyle = '#94a3b8';
                this.ctx.fillRect(plat.x, plat.y, plat.w, 3);
            } else if (plat.terrainType === 'rompible') {
                // Brown brick color for breakable
                this.ctx.fillStyle = '#78350f';
                this.ctx.fillRect(plat.x, plat.y, plat.w, plat.h);
                this.ctx.fillStyle = '#d97706'; // orange trim
                this.ctx.fillRect(plat.x, plat.y, plat.w, 3);
            } else {
                // Main platform / Duro
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
            } else if (pr.type === 'bomberman_bomb') {
                // Dark grey bomb with red pulsing outline
                const pulse = 0.5 + Math.sin(Date.now() / 100) * 0.5;
                this.ctx.fillStyle = '#334155';
                this.ctx.strokeStyle = `rgba(239, 68, 68, ${0.4 + pulse * 0.6})`;
                this.ctx.lineWidth = 3;
                this.ctx.beginPath();
                this.ctx.arc(pr.x + pr.w / 2, pr.y + pr.h / 2, pr.w / 2, 0, Math.PI * 2);
                this.ctx.fill();
                this.ctx.stroke();

                // Bomb fuse
                this.ctx.strokeStyle = '#fbbf24';
                this.ctx.lineWidth = 2;
                this.ctx.beginPath();
                this.ctx.moveTo(pr.x + pr.w / 2, pr.y);
                this.ctx.quadraticCurveTo(pr.x + pr.w / 2 + 5, pr.y - 5, pr.x + pr.w / 2 + 8, pr.y - 8);
                this.ctx.stroke();
            } else if (pr.type === 'hook') {
                const owner = this.players.find(pl => pl.id === pr.attackerId);
                if (owner) {
                    // Draw rope / chain
                    this.ctx.save();
                    // Outer outline
                    this.ctx.strokeStyle = '#475569';
                    this.ctx.lineWidth = 6;
                    this.ctx.beginPath();
                    this.ctx.moveTo(owner.x + owner.w / 2, owner.y + owner.h / 2);
                    this.ctx.lineTo(pr.x + pr.w / 2, pr.y + pr.h / 2);
                    this.ctx.stroke();

                    // Inner shiny rope
                    this.ctx.strokeStyle = '#e2e8f0';
                    this.ctx.lineWidth = 3;
                    this.ctx.beginPath();
                    this.ctx.moveTo(owner.x + owner.w / 2, owner.y + owner.h / 2);
                    this.ctx.lineTo(pr.x + pr.w / 2, pr.y + pr.h / 2);
                    this.ctx.stroke();
                    this.ctx.restore();
                }
                // Draw hook head (claw/anchor)
                this.ctx.fillStyle = '#f59e0b';
                this.ctx.strokeStyle = '#d97706';
                this.ctx.lineWidth = 2;
                this.ctx.beginPath();
                this.ctx.arc(pr.x + pr.w / 2, pr.y + pr.h / 2, pr.w / 2, 0, Math.PI * 2);
                this.ctx.fill();
                this.ctx.stroke();
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
                // Neon energy daggers (Optimized: dual stroke instead of shadowBlur)
                this.ctx.strokeStyle = 'rgba(34, 197, 94, 0.35)'; // Glow base
                this.ctx.lineWidth = 8;
                this.ctx.beginPath();
                this.ctx.moveTo(0, 0);
                this.ctx.lineTo(16, 4);
                this.ctx.stroke();

                this.ctx.strokeStyle = '#22c55e'; // Neon Green core
                this.ctx.lineWidth = 3;
                this.ctx.beginPath();
                this.ctx.moveTo(0, 0);
                this.ctx.lineTo(16, 4);
                this.ctx.stroke();
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
            } else if (p.charData.name === "Yone") {
                // Katana: red hilt, steel blade
                this.ctx.strokeStyle = '#ef4444'; // Red guard/hilt
                this.ctx.lineWidth = 4;
                this.ctx.beginPath();
                this.ctx.moveTo(0, 0);
                this.ctx.lineTo(4, -2);
                this.ctx.stroke();

                this.ctx.strokeStyle = '#cbd5e1'; // Steel blade
                this.ctx.lineWidth = 2;
                this.ctx.beginPath();
                this.ctx.moveTo(4, -2);
                this.ctx.lineTo(22, -11);
                this.ctx.stroke();
            } else if (p.charData.name === "Blitzcrank") {
                // Metallic hook
                this.ctx.strokeStyle = '#94a3b8'; // Grey hook body
                this.ctx.lineWidth = 3;
                this.ctx.beginPath();
                this.ctx.moveTo(0, 0);
                this.ctx.lineTo(12, -4);
                this.ctx.stroke();

                this.ctx.strokeStyle = '#94a3b8';
                this.ctx.beginPath();
                this.ctx.arc(12, -4, 6, -Math.PI / 2, Math.PI / 2);
                this.ctx.stroke();
            } else if (p.charData.name === "Bomberman") {
                // Small bomb
                this.ctx.fillStyle = '#1e293b'; // Dark blue/grey bomb body
                this.ctx.beginPath();
                this.ctx.arc(8, -2, 6, 0, Math.PI * 2);
                this.ctx.fill();

                // Fuse
                this.ctx.strokeStyle = '#fbbf24'; // Yellow fuse
                this.ctx.lineWidth = 1.5;
                this.ctx.beginPath();
                this.ctx.moveTo(8, -8);
                this.ctx.lineTo(12, -12);
                this.ctx.stroke();
            } else if (p.charData.name === "Sett") {
                // Boxing fists / gloves
                this.ctx.fillStyle = '#ea580c'; // Orange combat glove
                this.ctx.beginPath();
                this.ctx.arc(8, -2, 7, 0, Math.PI * 2);
                this.ctx.fill();
            } else if (p.charData.name === "Terranova") {
                // Piece of earth/rock
                this.ctx.fillStyle = '#78350f'; // Brown earth
                this.ctx.fillRect(4, -8, 12, 10);
                this.ctx.fillStyle = '#a16207'; // Top trim/highlights
                this.ctx.fillRect(4, -8, 12, 3);
            }
            this.ctx.restore();

            // Draw active items in hand
            if (p.heldItem) {
                const itemImg = itemImages[p.heldItem];
                if (itemImg && itemImg.complete) {
                    this.ctx.drawImage(itemImg, -12, -p.h - 38, 24, 24);
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

            // Draw charging effect for Blitzcrank
            if (p.charData.name === "Blitzcrank" && p.blitzcrankCharge > 0) {
                const chargeProgress = Math.min(1, p.blitzcrankCharge / 45);
                this.ctx.fillStyle = 'rgba(251, 191, 36, 0.6)';
                this.ctx.strokeStyle = '#ffffff';
                this.ctx.lineWidth = 1;
                // Draw electrical spark dots
                for (let i = 0; i < 4; i++) {
                    const offsetAngle = (Date.now() / 80 + i * 1.5) % (Math.PI * 2);
                    const rx = p.x + p.w / 2 + Math.cos(offsetAngle) * (18 + chargeProgress * 8);
                    const ry = p.y + p.h / 2 + Math.sin(offsetAngle) * (18 + chargeProgress * 8);
                    this.ctx.beginPath();
                    this.ctx.arc(rx, ry, 2, 0, Math.PI * 2);
                    this.ctx.fill();
                    this.ctx.stroke();
                }
            }

            // Draw Yone body and connection thread
            if (p.charData.name === "Yone" && p.yoneSoulActive) {
                this.ctx.save();
                this.ctx.globalAlpha = 0.5;
                this.ctx.fillStyle = '#64748b'; // slate gray empty body
                this.ctx.beginPath();
                this.ctx.roundRect(p.yoneBodyX, p.yoneBodyY, p.w, p.h, [8]);
                this.ctx.fill();

                // Closed visor/eyes
                this.ctx.fillStyle = '#1e293b';
                this.ctx.fillRect(p.yoneBodyX + (p.facing === 1 ? p.w - 14 : 2), p.yoneBodyY + 10, 12, 8);
                this.ctx.restore();

                // Connection line
                this.ctx.save();
                this.ctx.beginPath();
                this.ctx.moveTo(p.yoneBodyX + p.w / 2, p.yoneBodyY + p.h / 2);
                this.ctx.lineTo(p.x + p.w / 2, p.y + p.h / 2);
                this.ctx.strokeStyle = '#c084fc';
                this.ctx.lineWidth = 2.5;
                this.ctx.setLineDash([4, 4]);
                this.ctx.stroke();
                this.ctx.restore();

                // Soul glowing border
                this.ctx.save();
                this.ctx.strokeStyle = '#a855f7';
                this.ctx.lineWidth = 3;
                this.ctx.strokeRect(p.x - 2, p.y - 2, p.w + 4, p.h + 4);
                this.ctx.restore();
            }

            // Draw charging effect for Bomberman
            if (p.charData.name === "Bomberman" && p.bombermanCharge > 0) {
                const chargeProgress = Math.min(1, p.bombermanCharge / 45);
                const radius = 6 + chargeProgress * 15;
                this.ctx.fillStyle = `rgba(239, 68, 68, ${0.4 + chargeProgress * 0.5})`;
                this.ctx.strokeStyle = '#ffffff';
                this.ctx.lineWidth = 1.5;
                this.ctx.beginPath();
                this.ctx.arc(p.x + p.w / 2, p.y - 12, radius, 0, Math.PI * 2);
                this.ctx.fill();
                this.ctx.stroke();
            }

            // Draw charging effect for Zoner
            if (p.charData.name === "Zoner" && p.zonerCharge > 0) {
                const chargeProgress = Math.min(1, p.zonerCharge / 100);
                this.ctx.save();
                this.ctx.fillStyle = `rgba(52, 211, 153, ${0.4 + chargeProgress * 0.5})`;
                this.ctx.strokeStyle = '#ffffff';
                this.ctx.lineWidth = 1;
                for (let i = 0; i < 3; i++) {
                    const py = p.y + p.h - ((Date.now() / 15 + i * 20) % 40);
                    const px = p.x + p.w / 2 + (Math.sin(py * 0.1) * 12);
                    this.ctx.beginPath();
                    this.ctx.arc(px, py, 1.0 + chargeProgress * 2, 0, Math.PI * 2);
                    this.ctx.fill();
                    this.ctx.stroke();
                }
                this.ctx.restore();
            }

            // Draw charging effect for Terranova
            if (p.charData.name === "Terranova" && p.terranovaCharge > 0) {
                const chargeProgress = Math.min(1, p.terranovaCharge / 45);
                this.ctx.fillStyle = 'rgba(120, 53, 15, 0.6)';
                this.ctx.strokeStyle = '#ffffff';
                this.ctx.lineWidth = 1;
                // Earth dust particles rising
                for (let i = 0; i < 3; i++) {
                    const py = p.y + p.h - ((Date.now() / 15 + i * 20) % 40);
                    const px = p.x + p.w / 2 + (Math.sin(py * 0.1) * 15);
                    this.ctx.beginPath();
                    this.ctx.arc(px, py, 1.5 + chargeProgress * 2, 0, Math.PI * 2);
                    this.ctx.fill();
                    this.ctx.stroke();
                }
            }

            // Draw charging effect for Sett
            if (p.charData.name === "Sett" && p.settCharge > 0) {
                const chargeProgress = Math.min(1, p.settCharge / 45);
                this.ctx.save();
                this.ctx.strokeStyle = `rgba(220, 38, 38, ${0.5 + chargeProgress * 0.5})`;
                this.ctx.lineWidth = 2 + chargeProgress * 3;
                this.ctx.strokeRect(p.x - 4, p.y - 4, p.w + 8, p.h + 8);
                this.ctx.restore();
            }

            // Draw Sett slam/jump trail
            if (p.charData.name === "Sett" && p.settIsJumping) {
                this.ctx.fillStyle = 'rgba(220, 38, 38, 0.25)';
                this.ctx.fillRect(p.x - p.facing * 12, p.y, p.w, p.h);
            }

            // Draw Yone's mark above the player's head if marked
            if (p.yoneMarkedBy) {
                const markerYone = this.players.find(pl => pl.id === p.yoneMarkedBy);
                const isYoneReturning = markerYone ? markerYone.yoneReturning : false;

                this.ctx.save();
                this.ctx.translate(p.x + p.w / 2, p.y - 18);

                if (isYoneReturning) {
                    // Flash red/rose slash mark
                    const pulse = 0.5 + Math.sin(Date.now() / 50) * 0.5;
                    this.ctx.strokeStyle = '#ef4444';
                    this.ctx.fillStyle = `rgba(239, 68, 68, ${0.4 + pulse * 0.6})`;
                    this.ctx.lineWidth = 3;

                    // Draw an elegant "X" or cross slash mark
                    this.ctx.beginPath();
                    this.ctx.moveTo(-6, -6);
                    this.ctx.lineTo(6, 6);
                    this.ctx.moveTo(6, -6);
                    this.ctx.lineTo(-6, 6);
                    this.ctx.stroke();
                } else {
                    // Soft purple diamond mark
                    this.ctx.fillStyle = '#c084fc';
                    this.ctx.strokeStyle = '#a855f7';
                    this.ctx.lineWidth = 1.5;

                    this.ctx.beginPath();
                    this.ctx.moveTo(0, -6);
                    this.ctx.lineTo(4, 0);
                    this.ctx.lineTo(0, 6);
                    this.ctx.lineTo(-4, 0);
                    this.ctx.closePath();
                    this.ctx.fill();
                    this.ctx.stroke();
                }
                this.ctx.restore();
            }

            // Draw special ability cooldown bar
            const cd = getPlayerCooldownProgress(p);
            const fillRatio = cd.max > 0 ? (cd.max - cd.current) / cd.max : 1.0;
            const isReady = cd.current <= 0;

            const barW = 24;
            const barH = 3.5;
            const barX = p.x + p.w / 2 - barW / 2;
            const barY = p.y - 12; // draw it just above the player's head, below the name tag

            this.ctx.save();
            // Draw background (grey and slightly opaque)
            this.ctx.fillStyle = 'rgba(71, 85, 105, 0.6)'; // slate-600
            this.ctx.fillRect(barX, barY, barW, barH);

            // Draw white fill representing ready progress
            this.ctx.fillStyle = isReady ? '#ffffff' : 'rgba(241, 245, 249, 0.7)'; // solid white if ready, slightly opaque if charging
            this.ctx.fillRect(barX, barY, barW * fillRatio, barH);

            if (isReady) {
                // Add glowing outline/effect when ready
                this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.8)';
                this.ctx.lineWidth = 1;
                this.ctx.strokeRect(barX - 0.5, barY - 0.5, barW + 1, barH + 1);

                // Add a small shining white spark/glow at 100% readiness
                this.ctx.shadowColor = '#ffffff';
                this.ctx.shadowBlur = 4;
                this.ctx.fillStyle = '#ffffff';
                this.ctx.fillRect(barX, barY, barW, barH);
            }
            this.ctx.restore();

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
