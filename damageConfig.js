// Global Damage & Balance Configuration
// Modify values here to execute character buffs, nerfs, or overall combat rebalancing.
// Damage types available: 'golpe' (strike/melee) | 'explosivo' (explosive)
// All cooldowns and durations are defined in SECONDS for maximum readability.

// Helper functions for time conversion (60 FPS engine)
function secondsToFrames(seconds) {
    return Math.round(seconds * 60);
}

function framesToSeconds(frames) {
    return Number((frames / 60).toFixed(2));
}

const DAMAGE_CONFIG = {
    // Phenotype base damage & receiving multipliers
    phenotypes: {
        balanceado: { baseDamage: 1.0, damageReceivedMultiplier: 1.0 },
        ligero: { baseDamage: 0.85, damageReceivedMultiplier: 1.0 },
        pesado: { baseDamage: 1.2, damageReceivedMultiplier: 1.067 }
    },

    // Shield interaction mechanics
    shield: {
        damageMultiplier: 1.5 // Shield health reduction = attackDamage * damageMultiplier
    },

    // Knockback (Empuje) Physics & Scaling Formula
    knockback: {
        baseRatio: 0.8,         // Multiplicador base: baseKnockback = finalDamage * baseRatio
        percentDivisor: 100,    // Escala por % de daño acumulado: (1 + victim.damage / percentDivisor)
        weightFactor: 100,      // Factor inversamente proporcional al peso: (weightFactor / victim.weight)
        horizontalScale: 0.9,   // Impulso horizontal final: Math.cos(angle) * kbForce * horizontalScale
        verticalScale: 0.8,     // Impulso vertical final: Math.sin(angle) * kbForce * verticalScale
        hitstunFactor: 2.0,     // Factor para duración de parálisis: Math.floor(kbForce * hitstunFactor)
        minHitstun: 10          // Duración mínima de hitstun en frames
    },

    // Standard Melee Attacks (Attack A)
    melee: {
        up: { ligero: 9, balanceado: 8, pesado: 7.5, type: 'golpe' },
        down: { ligero: 8, balanceado: 7, pesado: 6.5, type: 'golpe' },
        smashForward: { ligero: 11, balanceado: 9, pesado: 8.5, type: 'golpe' },
        comboJab1: { damage: 6, type: 'golpe' },
        comboJab2: { damage: 6, type: 'golpe' },
        comboFinisher: { damage: 10, type: 'golpe' }
    },

    // Character Specials & Ability Cooldowns (Attack B) - Defined in SECONDS
    specials: {
        mago: {
            fireballMin: 8,
            fireballMax: 18,
            cooldown: 0.67,     // 0.67 segundos (~40 frames)
            type: 'explosivo'
        },
        sonic: {
            dashMin: 11,
            dashMax: 20,
            cooldown: 0.75,     // 0.75 segundos (~45 frames)
            type: 'golpe'
        },
        gordo: {
            slamBase: 6,
            slamChargeBonusMax: 5,
            slamFallBonusMax: 9,
            slamType: 'explosivo',
            spinningSlashHit: 4,
            spinningSlashType: 'golpe',
            cooldown: 0.67      // 0.67 segundos (~40 frames)
        },
        zoner: {
            arrow: 10,
            arrowType: 'golpe',
            burstArrow: 5.5,
            burstArrowType: 'golpe',
            cooldown: 1.76      // 1.76 segundos (~106 frames)
        },
        palomo: {
            bombMin: 16,
            bombMax: 26,
            cooldown: 0.50,     // 0.50 segundos (~30 frames)
            type: 'explosivo'
        },
        blitzcrank: {
            hookMin: 6,
            hookMax: 10,
            cooldown: 2.67,     // 2.67 segundos (~160 frames)
            type: 'golpe'
        },
        yone: {
            markDamagePercent: 0.30,             // 30% del daño acumulado infligido al retornar al cuerpo
            markKnockbackMultiplier: 1.35,      // Multiplicador de empuje para la detonación de la marca
            soulDamageBonusPercent: 0.20,       // +20% (0.20) de daño extra en ataques básicos durante Forma Espiritual
            soulAttackSpeedBonusPercent: 0.25, // +25% (0.25) de velocidad de ataque (reduce el bloqueo de acción)
            cooldown: 5.67,                     // Cooldown tras regresar al cuerpo (5.67 segundos ~340 frames)
            soulDuration: 4.67,                 // Duración máxima del alma fuera (4.67 segundos ~280 frames)
            type: 'explosivo'
        },
        bomberman: {
            bombMinRadius: 80,
            bombMaxRadius: 180,
            bombType: 'explosivo',
            upSpecialRadius: 40,
            upSpecialType: 'explosivo',
            cooldown: 0.55
        },
        terranova: {
            wallMin: 10,
            wallMax: 22,
            cooldown: 1.87,     // 1.87 segundos (~112 frames)
            type: 'golpe'
        },
        sett: {
            slamBase: 8,
            slamDistMultiplier: 0.0500,
            explosionRadius: 45,
            cooldown: 3.00,     // 3.00 segundos (~180 frames)
            type: 'explosivo'
        }
    },

    // Area Explosions & Proximity Falloff Formula
    explosions: {
        radiusFactor: 1.4,      // Daño base en el núcleo: Math.round(radiusFactor * Math.sqrt(radius))
        falloffType: 'linear',  // Algoritmo de caída por distancia: 'linear' | 'quadratic' | 'none'
        minDamageRatio: 0.0,    // Daño relativo mínimo en el borde de la explosión (0.0 = 0%, 0.2 = 20%)
        type: 'explosivo'
    },

    // Activable Items
    items: {
        puma: { damage: 28, type: 'golpe' },
        yahuStrikeBomb: { damage: 25, type: 'explosivo' }
    },

    // Environment & Map Hazards
    environment: {
        platformTrap: { damage: 12, type: 'golpe' },
        breakablePlatformMaxHp: 30
    }
};

// Helper function to calculate proximity falloff for explosions
function calculateExplosionProximityFactor(distance, radius) {
    if (distance > radius) return 0;
    const normDist = Math.min(1.0, Math.max(0.0, distance / radius));
    let rawFactor = 1.0 - normDist;

    const falloff = DAMAGE_CONFIG.explosions.falloffType || 'linear';
    if (falloff === 'quadratic') {
        rawFactor = Math.pow(rawFactor, 2);
    } else if (falloff === 'none') {
        rawFactor = 1.0;
    }

    const minRatio = DAMAGE_CONFIG.explosions.minDamageRatio || 0.0;
    return minRatio + (1.0 - minRatio) * rawFactor;
}
