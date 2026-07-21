let peer = null;
let connections = []; // Array of guest connections (on Host)
let connection = null;  // Connection to Host (on Guest)
let isHost = false;
let myId = null;
let guestIndex = null; // Guest assigned index (1, 2, or 3)
let lobbyPlayersState = []; // Holds current lobby name/chars state

// Initialize PeerJS connection
function initMultiplayer(asHost = true) {
    if (peer) return;

    const generateRoomCode = () => Math.floor(1000 + Math.random() * 9000).toString();

    const tryConnect = (code) => {
        if (asHost) {
            const customId = 'smashturbanda-' + code;
            peer = new Peer(customId);
        } else {
            peer = new Peer();
        }

        peer.on('open', (id) => {
            if (asHost) {
                myId = code;
                document.getElementById('my-id').textContent = code;
                showToast("¡Lobby listo! Código: " + code);
            } else {
                myId = id;
            }
        });

        // ESCENARIO A: Alguien se conecta a nosotros (Anfitrión / Host)
        peer.on('connection', (conn) => {
            if (connections.length >= 3) {
                const rejectLobby = () => {
                    conn.send({ type: 'lobby_full' });
                    setTimeout(() => conn.close(), 500);
                };
                if (conn.open) {
                    rejectLobby();
                } else {
                    conn.on('open', rejectLobby);
                }
                return;
            }

            isHost = true;
            connections.push(conn);

            const handleOpenConnection = () => {
                showToast(`¡Jugador ${connections.length + 1} conectado!`);
                document.getElementById('menu-lobby').classList.add('hidden');
                document.getElementById('menu-css').classList.remove('hidden');

                // Assign index to guest
                conn.send({
                    type: 'assign_player',
                    playerIndex: connections.length // 1, 2, or 3
                });

                // Send updated lobby state to all
                sendLobbySync();
            };

            if (conn.open) {
                handleOpenConnection();
            } else {
                conn.on('open', handleOpenConnection);
            }

            conn.on('data', (data) => {
                handleReceivedData(data, conn);
            });

            conn.on('close', () => {
                showToast("Un oponente se ha desconectado");
                const idx = connections.indexOf(conn);
                if (idx !== -1) {
                    connections.splice(idx, 1);
                    // Re-assign indices to remaining guests
                    connections.forEach((c, i) => {
                        c.send({
                            type: 'assign_player',
                            playerIndex: i + 1
                        });
                    });
                }
                if (gameEngine.running) {
                    gameEngine.running = false;
                    setTimeout(() => window.location.reload(), 1500);
                } else {
                    sendLobbySync();
                }
            });
        });

        peer.on('error', (err) => {
            console.error("PeerJS error:", err);
            if (asHost && err.type === 'unavailable-id') {
                console.log("ID taken, retrying with new code...");
                peer.destroy();
                peer = null;
                tryConnect(generateRoomCode());
            } else {
                showToast(`Error de conexión: ${err.type}`);
                const connectBtn = document.getElementById('btn-connect-peer');
                if (connectBtn) {
                    connectBtn.textContent = 'Conectar a Sala';
                    connectBtn.disabled = false;
                }
            }
        });
    };

    tryConnect(asHost ? generateRoomCode() : null);
}

// Permite usar la tecla Enter en el input de conectar a sala
document.getElementById('peer-id-input').addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
        document.getElementById('btn-connect-peer').click();
    }
});

// ESCENARIO B: Nos conectamos a alguien (Invitado / Guest)
document.getElementById('btn-connect-peer').addEventListener('click', () => {
    const code = document.getElementById('peer-id-input').value.trim();
    if (!code || code.length !== 4 || isNaN(code)) {
        showToast("Por favor introduce un código de 4 dígitos válido");
        return;
    }

    const connectBtn = document.getElementById('btn-connect-peer');
    connectBtn.textContent = "Conectando...";
    connectBtn.disabled = true;

    showToast("Conectando...");
    const targetPeerId = 'smashturbanda-' + code;
    connection = peer.connect(targetPeerId);
    isHost = false;

    connection.on('open', () => {
        showToast("Conectado con el servidor. Esperando asignación...");
        document.getElementById('menu-lobby').classList.add('hidden');
        document.getElementById('menu-css').classList.remove('hidden');
        connectBtn.textContent = "Conectar a Sala";
        connectBtn.disabled = false;
    });

    connection.on('data', (data) => {
        handleReceivedData(data);
    });

    connection.on('close', () => {
        showToast("Conexión perdida con el host");
        gameEngine.running = false;
        connectBtn.textContent = "Conectar a Sala";
        connectBtn.disabled = false;
        setTimeout(() => {
            window.location.reload();
        }, 1500);
    });

    connection.on('error', (err) => {
        console.error("Connection error:", err);
        showToast("Error de conexión. Inténtalo de nuevo.");
        connectBtn.textContent = "Conectar a Sala";
        connectBtn.disabled = false;
    });
});

function showToast(msg) {
    const toast = document.getElementById('toast');
    if (toast) {
        toast.textContent = msg;
        toast.classList.remove('hidden');
        setTimeout(() => {
            toast.classList.add('hidden');
        }, 4000);
    }
}

// Syncing CSS selection state
let selectedCharLocal = 'balanceado';
let selectedCharRemote = 'veloz';
let selectedNameLocal = null;
let selectedNameRemote = null;
let selectedStageLocal = 'battlefield';
let selectedStageRemote = 'battlefield';
let selectedModeLocal = 'stocks';
let cssReadyLocal = false;
let cssReadyRemote = false;

// Initialize CSS Listeners once on script load
function initCSSListeners() {
    // Character selection listeners
    document.querySelectorAll('.char-card').forEach(card => {
        card.addEventListener('contextmenu', (e) => {
            e.preventDefault();
            if (gameEngine.mode !== 'vs_online') {
                const char = card.getAttribute('data-char');
                selectedCharRemote = char;
                playSynthSound('jump');
                updateCSSVisuals();
            }
        });

        card.addEventListener('click', (e) => {
            const char = card.getAttribute('data-char');
            selectedCharLocal = char;
            playSynthSound('jump');

            if (gameEngine.mode === 'vs_online') {
                sendCSSState();
            } else {
                if (e.shiftKey) {
                    selectedCharRemote = char;
                } else {
                    selectedCharLocal = char;
                }
            }
            updateCSSVisuals();
        });
    });

    // Name selection listeners
    document.querySelectorAll('.name-card').forEach(card => {
        card.addEventListener('contextmenu', (e) => {
            e.preventDefault();
            if (gameEngine.mode !== 'vs_online') {
                const name = card.getAttribute('data-name');
                if (selectedNameLocal === name) selectedNameLocal = null;
                selectedNameRemote = (selectedNameRemote === name) ? null : name;
                playSynthSound('jump');
                updateCSSVisuals();
            }
        });

        card.addEventListener('click', (e) => {
            const name = card.getAttribute('data-name');
            playSynthSound('jump');

            if (gameEngine.mode === 'vs_online') {
                // Check if taken by another player
                const takenByOther = lobbyPlayersState.some((player, idx) => {
                    const isMe = isHost ? (idx === 0) : (idx === guestIndex);
                    return player.customName === name && !isMe;
                });
                if (takenByOther) return; // Do not allow selection

                selectedNameLocal = (selectedNameLocal === name) ? null : name;
                sendCSSState();
            } else {
                if (e.shiftKey) {
                    if (selectedNameLocal === name) selectedNameLocal = null;
                    selectedNameRemote = (selectedNameRemote === name) ? null : name;
                } else {
                    if (selectedNameRemote === name) selectedNameRemote = null;
                    selectedNameLocal = (selectedNameLocal === name) ? null : name;
                }
            }
            updateCSSVisuals();
        });
    });

    // Stage selection listeners
    document.querySelectorAll('.stage-card').forEach(card => {
        card.addEventListener('click', () => {
            if (gameEngine.mode === 'vs_online' && !isHost) {
                showToast("Solo el Host elige el escenario");
                return;
            }
            const stage = card.getAttribute('data-stage');
            selectedStageLocal = stage;
            playSynthSound('shield');
            updateCSSVisuals();
            if (gameEngine.mode === 'vs_online') {
                sendCSSState();
            }
        });
    });

    // Mode listener
    document.getElementById('game-mode-select').addEventListener('change', (e) => {
        if (gameEngine.mode === 'vs_online' && !isHost) {
            showToast("Solo el Host configura las reglas");
            // Revert value
            document.getElementById('game-mode-select').value = selectedModeLocal;
            return;
        }
        selectedModeLocal = e.target.value;

        // Toggle limits UI
        if (selectedModeLocal === 'stocks') {
            document.getElementById('stocks-limit-label').style.display = 'flex';
            document.getElementById('time-limit-label').style.display = 'none';
        } else {
            document.getElementById('stocks-limit-label').style.display = 'none';
            document.getElementById('time-limit-label').style.display = 'flex';
        }

        if (gameEngine.mode === 'vs_online') {
            sendCSSState();
        }
    });

    // Stocks limit listener
    document.getElementById('game-stocks-select').addEventListener('change', () => {
        if (gameEngine.mode === 'vs_online' && !isHost) {
            showToast("Solo el Host configura las reglas");
            return;
        }
        if (gameEngine.mode === 'vs_online') {
            sendCSSState();
        }
    });

    // Time limit listener
    document.getElementById('game-time-select').addEventListener('change', () => {
        if (gameEngine.mode === 'vs_online' && !isHost) {
            showToast("Solo el Host configura las reglas");
            return;
        }
        if (gameEngine.mode === 'vs_online') {
            sendCSSState();
        }
    });
}

function updateCSSVisuals() {
    const stageSelEl = document.getElementById('css-stage-selection');
    if (stageSelEl) {
        if (gameEngine.mode === 'vs_online' && !isHost) {
            stageSelEl.style.display = 'none';
        } else {
            stageSelEl.style.display = 'block';
        }
    }

    // Reset selections
    document.querySelectorAll('.char-card').forEach(card => {
        card.className = 'char-card';
    });
    document.querySelectorAll('.name-card').forEach(card => {
        card.className = 'name-card';
    });

    if (gameEngine.mode === 'vs_online') {
        lobbyPlayersState.forEach((player, idx) => {
            const card = document.querySelector(`.char-card[data-char="${player.char}"]`);
            if (card) {
                card.classList.add(`selected-p${idx + 1}`);
            }

            if (player.customName) {
                const nCard = document.querySelector(`.name-card[data-name="${player.customName}"]`);
                if (nCard) {
                    nCard.classList.add(`selected-p${idx + 1}`);
                }
            }
        });

        // Disable names selected by other players
        document.querySelectorAll('.name-card').forEach(nCard => {
            const name = nCard.getAttribute('data-name');
            const takenByOther = lobbyPlayersState.some((player, idx) => {
                const isMe = isHost ? (idx === 0) : (idx === guestIndex);
                return player.customName === name && !isMe;
            });
            if (takenByOther) {
                nCard.classList.add('disabled');
            }
        });
    } else {
        if (!selectedCharRemote) selectedCharRemote = 'veloz';

        document.querySelectorAll('.char-card').forEach(card => {
            const char = card.getAttribute('data-char');
            if (char === selectedCharLocal) card.classList.add('selected-p1');
            if (char === selectedCharRemote) card.classList.add('selected-p2');
        });

        if (selectedNameLocal) {
            const nCard = document.querySelector(`.name-card[data-name="${selectedNameLocal}"]`);
            if (nCard) nCard.classList.add('selected-p1');
        }
        if (selectedNameRemote) {
            const nCard = document.querySelector(`.name-card[data-name="${selectedNameRemote}"]`);
            if (nCard) nCard.classList.add('selected-p2');
        }
    }

    document.querySelectorAll('.stage-card').forEach(card => {
        card.classList.remove('selected');
        const st = card.getAttribute('data-stage');
        const activeSt = (gameEngine.mode === 'vs_online' && !isHost) ? selectedStageRemote : selectedStageLocal;
        if (st === activeSt) {
            card.classList.add('selected');
        }
    });

    // Hide/show rules container and start button for guests
    const rulesContainer = document.getElementById('game-rules-container');
    const startBtn = document.getElementById('btn-css-start');
    if (gameEngine.mode === 'vs_online' && !isHost) {
        if (rulesContainer) rulesContainer.classList.add('hidden');
        if (startBtn) startBtn.classList.add('hidden');
    } else {
        if (rulesContainer) rulesContainer.classList.remove('hidden');
        if (startBtn) startBtn.classList.remove('hidden');
    }
}

function sendCSSState() {
    if (isHost) {
        sendLobbySync();
    } else {
        if (connection && connection.open) {
            connection.send({
                type: 'css_sync',
                char: selectedCharLocal,
                customName: selectedNameLocal
            });
        }
    }
}

function sendLobbySync() {
    // Exclusivity collision check: Host has priority, then Guest connections in order of registration.
    const namePool = { Alex: null, Martín: null, Víctor: null, Gabriel: null };

    if (selectedNameLocal) namePool[selectedNameLocal] = 'host';

    connections.forEach((conn) => {
        if (conn.selectedCustomName) {
            if (namePool[conn.selectedCustomName]) {
                conn.selectedCustomName = null; // Collision! Reset to default
            } else {
                namePool[conn.selectedCustomName] = conn.peer;
            }
        }
    });

    const players = [
        {
            name: selectedNameLocal || "Host (P1)",
            char: selectedCharLocal,
            customName: selectedNameLocal
        }
    ];
    connections.forEach((conn, idx) => {
        players.push({
            name: conn.selectedCustomName || `Jugador ${idx + 2}`,
            char: conn.selectedChar || 'veloz',
            customName: conn.selectedCustomName || null
        });
    });
    lobbyPlayersState = players;
    updateCSSVisuals();

    const stocksLimitVal = parseInt(document.getElementById('game-stocks-select').value) || 3;
    const timeLimitVal = parseInt(document.getElementById('game-time-select').value) || 2;

    broadcast({
        type: 'lobby_sync',
        players: players,
        stage: selectedStageLocal,
        mode: selectedModeLocal,
        stocksLimit: stocksLimitVal,
        timeLimit: timeLimitVal
    });
}

function broadcast(data) {
    connections.forEach(conn => {
        if (conn && conn.open) {
            conn.send(data);
        }
    });
}

// Custom handler for game messages
function handleReceivedData(data, senderConn) {
    if (data.type === 'assign_player') {
        guestIndex = data.playerIndex;
        document.getElementById('css-title').textContent = `Elige tu Personaje (P${guestIndex + 1})`;
    } else if (data.type === 'lobby_sync') {
        lobbyPlayersState = data.players;
        selectedStageRemote = data.stage;
        selectedStageLocal = data.stage;
        selectedModeLocal = data.mode;
        document.getElementById('game-mode-select').value = data.mode;

        // Toggle limits UI
        if (data.mode === 'stocks') {
            document.getElementById('stocks-limit-label').style.display = 'flex';
            document.getElementById('time-limit-label').style.display = 'none';
        } else {
            document.getElementById('stocks-limit-label').style.display = 'none';
            document.getElementById('time-limit-label').style.display = 'flex';
        }

        if (data.stocksLimit !== undefined) {
            document.getElementById('game-stocks-select').value = data.stocksLimit;
        }
        if (data.timeLimit !== undefined) {
            document.getElementById('game-time-select').value = data.timeLimit;
        }

        // Sync custom name selection in case Host reset it due to collision
        const mySlot = lobbyPlayersState[guestIndex];
        if (mySlot) {
            selectedNameLocal = mySlot.customName;
        }
        updateCSSVisuals();
    } else if (data.type === 'css_sync') {
        if (isHost && senderConn) {
            senderConn.selectedChar = data.char;
            senderConn.selectedCustomName = data.customName || null;
            sendLobbySync();
        }
    } else if (data.type === 'lobby_full') {
        showToast("Lobby lleno (máximo 4 jugadores)");
    } else if (data.type === 'css_start') {
        gameEngine.setupMatch('vs_online', data.playersConfig, data.stage, data.mode, data.stocksLimit, data.timeLimit);
        overrideGameLoopForP2P();
    } else if (data.type === 'guest_inputs') {
        if (isHost && gameEngine.players[data.playerIndex]) {
            gameEngine.players[data.playerIndex].lastControlState = data.inputs;
        }
    } else if (data.type === 'host_state') {
        if (!isHost && gameEngine.running) {
            applyHostStateToGuest(data.state);
        }
    } else if (data.type === 'match_end') {
        gameEngine.running = false;
        if (gameEngine.updateInterval) {
            clearInterval(gameEngine.updateInterval);
            gameEngine.updateInterval = null;
        }
        document.getElementById('game-hud').classList.add('hidden');

        const pauseWinnerEl = document.getElementById('pause-winner');
        pauseWinnerEl.textContent = data.winner === "Empate" ? "¡EMPATE!" : `¡GANADOR: ${data.winner}!`;
        document.getElementById('pause-title').textContent = "FIN DE LA PARTIDA";
        document.getElementById('btn-pause-resume').classList.add('hidden');

        document.getElementById('menu-pause').classList.remove('hidden');

        if (typeof playMenuMusic === 'function') {
            playMenuMusic();
        }
    } else if (data.type === 'go_to_css') {
        gameEngine.running = false;
        if (gameEngine.updateInterval) {
            clearInterval(gameEngine.updateInterval);
            gameEngine.updateInterval = null;
        }
        document.getElementById('game-hud').classList.add('hidden');
        const timerEl = document.getElementById('game-timer');
        if (timerEl) timerEl.classList.add('hidden');
        document.getElementById('menu-pause').classList.add('hidden');
        document.getElementById('menu-css').classList.remove('hidden');
        updateCSSVisuals();
    }
}

// Hook start button
document.getElementById('btn-css-start').addEventListener('click', () => {
    const stocksLimitVal = parseInt(document.getElementById('game-stocks-select').value) || 3;
    const timeLimitVal = parseInt(document.getElementById('game-time-select').value) || 2;

    if (gameEngine.mode === 'vs_online') {
        if (connections.length === 0) {
            showToast("Esperando rivales en el lobby...");
            return;
        }
        if (!isHost) {
            showToast("Esperando a que el Host inicie la pelea...");
            return;
        }

        // Build players config
        const playersConfig = [
            { id: 'p1', name: selectedNameLocal || "Host (P1)", char: selectedCharLocal }
        ];
        connections.forEach((conn, idx) => {
            playersConfig.push({
                id: `p${idx + 2}`,
                name: conn.selectedCustomName || `Jugador ${idx + 2}`,
                char: conn.selectedChar || 'veloz'
            });
        });

        // Host starts match
        broadcast({
            type: 'css_start',
            playersConfig: playersConfig,
            stage: selectedStageLocal,
            mode: selectedModeLocal,
            stocksLimit: stocksLimitVal,
            timeLimit: timeLimitVal
        });

        gameEngine.setupMatch('vs_online', playersConfig, selectedStageLocal, selectedModeLocal, stocksLimitVal, timeLimitVal);
        overrideGameLoopForP2P();
    } else {
        // Local game startup
        const p1 = selectedCharLocal;
        const p2 = selectedCharRemote || 'veloz';
        const mode = gameEngine.mode; // local vs, cpu, training
        const stage = document.querySelector('.stage-card.selected').getAttribute('data-stage');
        const rule = document.getElementById('game-mode-select').value;
        const diff = document.getElementById('cpu-diff-select').value;

        let playersConfig = [];
        if (mode === 'vs_local') {
            playersConfig = [
                { id: 'p1', name: selectedNameLocal || 'Jugador 1', char: p1 },
                { id: 'p2', name: selectedNameRemote || 'Jugador 2', char: p2 }
            ];
        } else if (mode === 'vs_cpu') {
            playersConfig = [
                { id: 'p1', name: selectedNameLocal || 'Jugador 1', char: p1 },
                { id: 'p2', name: selectedNameRemote || `CPU (${diff.toUpperCase()})`, char: p2 }
            ];
        } else {
            playersConfig = [
                { id: 'p1', name: selectedNameLocal || 'Jugador 1', char: p1 },
                { id: 'p2', name: selectedNameRemote || 'CPU Dummy', char: p2 }
            ];
        }

        gameEngine.setupMatch(mode, playersConfig, stage, rule, stocksLimitVal, timeLimitVal, diff);
    }
});

function overrideGameLoopForP2P() {
    const originalUpdate = gameEngine.update.bind(gameEngine);

    gameEngine.update = () => {
        if (isHost) {
            // Host computes physics
            originalUpdate();

            // Send computed coordinates/scores/stocks to all guests (omitting static platforms and visual particles)
            if (connections.length > 0) {
                broadcast({
                    type: 'host_state',
                    state: {
                        players: gameEngine.players.map(p => packPlayerState(p)),
                        projectiles: gameEngine.projectiles.map(pr => ({
                            x: pr.x, y: pr.y, w: pr.w, h: pr.h, type: pr.type
                        })),
                        items: gameEngine.items.map(item => ({
                            x: item.x, y: item.y, w: item.w, h: item.h, type: item.type
                        })),
                        pumas: gameEngine.pumas.map(puma => ({
                            x: puma.x, y: puma.y, w: puma.w, h: puma.h
                        })),
                        bombers: gameEngine.bombers.map(b => ({
                            x: b.x, y: b.y, w: b.w, h: b.h
                        })),
                        // Only broadcast platforms if at least one is moving to save bandwidth
                        platforms: gameEngine.platforms.some(plat => plat.moving)
                            ? gameEngine.platforms.map(plat => ({ x: plat.x, y: plat.y }))
                            : null,
                        time: gameEngine.timeRemaining
                    }
                });
            }
        } else {
            // Guest collects inputs and sends them to Host immediately
            const inputsP1 = gameEngine.getPlayerInputs('p1');
            const inputsP2 = gameEngine.getPlayerInputs('p2');

            const inputs = {
                left: inputsP1.left || inputsP2.left,
                right: inputsP1.right || inputsP2.right,
                up: inputsP1.up || inputsP2.up,
                down: inputsP1.down || inputsP2.down,
                jump: inputsP1.jump || inputsP2.jump,
                attackA: inputsP1.attackA || inputsP2.attackA,
                attackB: inputsP1.attackB || inputsP2.attackB,
                shield: inputsP1.shield || inputsP2.shield,
                grab: inputsP1.grab || inputsP2.grab
            };

            if (connection && connection.open) {
                connection.send({
                    type: 'guest_inputs',
                    playerIndex: guestIndex,
                    inputs: inputs
                });
            }

            // Update particles locally on Guest (decreases network strain by 90%)
            for (let i = gameEngine.particles.length - 1; i >= 0; i--) {
                const pt = gameEngine.particles[i];
                pt.x += pt.vx;
                pt.y += pt.vy;
                pt.vy += 0.2; // gravity effect
                pt.alpha -= 1 / pt.life;
                if (pt.alpha <= 0) {
                    gameEngine.particles.splice(i, 1);
                }
            }
        }
    };
}

function packPlayerState(p) {
    return {
        x: p.x,
        y: p.y,
        vx: p.vx,
        vy: p.vy,
        facing: p.facing,
        damage: p.damage,
        stocks: p.stocks,
        score: p.score,
        respawning: p.respawning,
        shieldActive: p.shieldActive,
        shieldStrength: p.shieldStrength,
        invulnerable: p.invulnerable,
        isGrounded: p.isGrounded,
        hitStun: p.hitStun || 0,
        shieldStun: p.shieldStun || 0,
        velozCharge: p.velozCharge || 0,
        velozDashTimer: p.velozDashTimer || 0,
        upSpecialUsed: p.upSpecialUsed || false,
        velozDashUsed: p.velozDashUsed || false,
        voladorFlying: p.voladorFlying || false,
        voladorBombCooldown: p.voladorBombCooldown || 0,
        heldItem: p.heldItem || null,
        balanceadoCharge: p.balanceadoCharge || 0
    };
}

function applyHostStateToGuest(state) {
    try {
        if (!state || !state.players || gameEngine.players.length !== state.players.length) return;

        state.players.forEach((pState, idx) => {
            const localPlayer = gameEngine.players[idx];
            if (localPlayer && pState) {
                // Trigger local visual feedback and sounds on hit (damage increase)
                if (pState.damage > localPlayer.damage) {
                    const diff = pState.damage - localPlayer.damage;
                    // Spawn local hit particles
                    for (let i = 0; i < Math.min(10, Math.floor(diff * 0.8) + 3); i++) {
                        gameEngine.particles.push({
                            x: pState.x + localPlayer.width / 2,
                            y: pState.y + localPlayer.height / 2,
                            vx: (Math.random() - 0.5) * 8,
                            vy: (Math.random() - 0.5) * 8 - 2,
                            radius: Math.random() * 4 + 2,
                            color: localPlayer.colorAlt || '#ffffff',
                            alpha: 1,
                            life: 30
                        });
                    }
                    playSynthSound(diff > 15 ? 'heavy_hit' : 'hit');
                }

                // Trigger local blast particles on death (stocks decrease)
                if (pState.stocks < localPlayer.stocks) {
                    // Use the previous position of the player (before unpack overwrites it with -9999)
                    const deathX = Math.min(V_WIDTH, Math.max(0, localPlayer.x + (localPlayer.w || 40) / 2));
                    const deathY = Math.min(V_HEIGHT, Math.max(0, localPlayer.y + (localPlayer.h || 50) / 2));
                    const deathColor = (localPlayer.charData && localPlayer.charData.color) ? localPlayer.charData.color : '#ffffff';
                    if (typeof createBlastParticles === 'function') {
                        createBlastParticles(deathX, deathY, deathColor);
                    }
                    playSynthSound('death');
                }

                unpackPlayerState(localPlayer, pState);
            }
        });

        // Play item activation sound on Guest if new ones are spawned
        if (state.pumas && state.pumas.length > gameEngine.pumas.length) {
            if (typeof playSoundFile === 'function') {
                playSoundFile('sound/puma.mp3');
            }
        }
        if (state.bombers && state.bombers.length > gameEngine.bombers.length) {
            if (typeof playSoundFile === 'function') {
                playSoundFile('sound/strike.mp3', 4000);
            }
        }

        gameEngine.projectiles = state.projectiles || [];
        gameEngine.items = state.items || [];
        gameEngine.pumas = state.pumas || [];
        gameEngine.bombers = state.bombers || [];

        // Synchronize platform coordinates on Guest if provided by Host
        if (state.platforms) {
            state.platforms.forEach((platState, idx) => {
                if (gameEngine.platforms[idx]) {
                    gameEngine.platforms[idx].x = platState.x;
                    gameEngine.platforms[idx].y = platState.y;
                }
            });
        }

        gameEngine.timeRemaining = state.time !== undefined ? state.time : 0;
        gameEngine.updateHUD();

        // Update countdown timer on Guest
        const timerEl = document.getElementById('game-timer');
        if (timerEl) {
            if (gameEngine.matchType === 'time' && gameEngine.mode !== 'training' && gameEngine.running) {
                timerEl.classList.remove('hidden');
                const totalSeconds = Math.max(0, Math.ceil(gameEngine.timeRemaining / 60));
                const mins = Math.floor(totalSeconds / 60);
                const secs = totalSeconds % 60;
                const formattedTime = `${mins}:${secs < 10 ? '0' : ''}${secs}`;
                if (timerEl.textContent !== formattedTime) {
                    timerEl.textContent = formattedTime;
                }
            } else {
                timerEl.classList.add('hidden');
            }
        }
    } catch (e) {
        console.error("Error in applyHostStateToGuest:", e);
    }
}

function unpackPlayerState(p, state) {
    p.x = state.x;
    p.y = state.y;
    p.vx = state.vx;
    p.vy = state.vy;
    p.facing = state.facing;
    p.damage = state.damage;
    p.stocks = state.stocks;
    p.score = state.score;
    p.respawning = state.respawning;
    p.shieldActive = state.shieldActive;
    p.shieldStrength = state.shieldStrength;
    p.invulnerable = state.invulnerable;
    p.isGrounded = state.isGrounded || false;
    p.hitStun = state.hitStun;
    p.shieldStun = state.shieldStun;
    p.balanceadoCharge = state.balanceadoCharge || 0;
    p.velozCharge = state.velozCharge || 0;
    p.velozDashTimer = state.velozDashTimer || 0;
    p.upSpecialUsed = state.upSpecialUsed || false;
    p.velozDashUsed = state.velozDashUsed || false;
    p.voladorFlying = state.voladorFlying || false;
    p.voladorBombCooldown = state.voladorBombCooldown || 0;
    p.heldItem = state.heldItem || null;
}

// Menu Navigations
document.getElementById('btn-vs-local').addEventListener('click', () => {
    gameEngine.mode = 'vs_local';
    document.getElementById('css-title').textContent = "Selección de Personaje (Local VS)";
    document.getElementById('cpu-diff-label').style.display = 'none';
    document.getElementById('p2-ref-container').style.display = 'block';
    document.getElementById('menu-main').classList.add('hidden');
    document.getElementById('menu-css').classList.remove('hidden');
    if (typeof playMenuMusic === 'function') playMenuMusic();
    updateCSSVisuals();
});

document.getElementById('btn-vs-cpu').addEventListener('click', () => {
    gameEngine.mode = 'vs_cpu';
    document.getElementById('css-title').textContent = "Selección de Personaje (vs CPU)";
    document.getElementById('cpu-diff-label').style.display = 'flex';
    document.getElementById('p2-ref-container').style.display = 'none';
    document.getElementById('menu-main').classList.add('hidden');
    document.getElementById('menu-css').classList.remove('hidden');
    if (typeof playMenuMusic === 'function') playMenuMusic();
    updateCSSVisuals();
});

document.getElementById('btn-training').addEventListener('click', () => {
    gameEngine.mode = 'training';
    document.getElementById('css-title').textContent = "Selección de Personaje (Entrenamiento)";
    document.getElementById('cpu-diff-label').style.display = 'none';
    document.getElementById('p2-ref-container').style.display = 'none';
    document.getElementById('menu-main').classList.add('hidden');
    document.getElementById('menu-css').classList.remove('hidden');
    if (typeof playMenuMusic === 'function') playMenuMusic();
    updateCSSVisuals();
});

document.getElementById('btn-vs-online').addEventListener('click', () => {
    gameEngine.mode = 'vs_online';
    document.getElementById('css-title').textContent = "Selección de Personaje (Online P2P)";
    document.getElementById('cpu-diff-label').style.display = 'none';
    document.getElementById('p2-ref-container').style.display = 'none';
    document.getElementById('menu-main').classList.add('hidden');

    // Switch to role selection and reset views
    document.getElementById('lobby-role-select').classList.remove('hidden');
    document.getElementById('lobby-host-view').classList.add('hidden');
    document.getElementById('lobby-guest-view').classList.add('hidden');

    document.getElementById('menu-lobby').classList.remove('hidden');
});

document.getElementById('btn-css-back').addEventListener('click', () => {
    document.getElementById('menu-css').classList.add('hidden');
    document.getElementById('menu-main').classList.remove('hidden');
});

document.getElementById('btn-lobby-back').addEventListener('click', () => {
    document.getElementById('menu-lobby').classList.add('hidden');
    document.getElementById('menu-main').classList.remove('hidden');
});

// Options panel hooks
document.getElementById('btn-options-menu').addEventListener('click', () => {
    document.getElementById('menu-main').classList.add('hidden');
    document.getElementById('menu-options').classList.remove('hidden');
    if (typeof playMenuMusic === 'function') playMenuMusic();
    renderOptionsKeys();
});

document.getElementById('slider-sfx').addEventListener('input', (e) => {
    sfxVolume = parseFloat(e.target.value);
    updateVolumeUI();
    if (typeof updateMenuMusicVolume === 'function') {
        updateMenuMusicVolume();
    }
});

document.getElementById('btn-options-save').addEventListener('click', () => {
    // Save settings to LocalStorage
    try {
        localStorage.setItem('smashturbanda_settings', JSON.stringify({
            controls: controls,
            volume: sfxVolume
        }));
    } catch (e) {
        console.warn("Could not save settings locally", e);
    }
    document.getElementById('menu-options').classList.add('hidden');
    document.getElementById('menu-main').classList.remove('hidden');
});

// Pause / End Game buttons
document.getElementById('btn-pause-resume').addEventListener('click', () => {
    document.getElementById('menu-pause').classList.add('hidden');
    gameEngine.running = true;
    const ctrlOverlay = document.getElementById('game-controls-overlay');
    if (ctrlOverlay) ctrlOverlay.classList.remove('hidden');
    gameEngine.loop();
});

document.getElementById('btn-pause-exit').addEventListener('click', () => {
    document.getElementById('menu-pause').classList.add('hidden');
    document.getElementById('menu-main').classList.remove('hidden');
    const ctrlOverlay = document.getElementById('game-controls-overlay');
    if (ctrlOverlay) ctrlOverlay.classList.add('hidden');
    if (connection) {
        connection.close();
    }
    if (isHost) {
        connections.forEach(conn => {
            if (conn) conn.close();
        });
        connections = [];
    }
    if (typeof playMenuMusic === 'function') {
        playMenuMusic();
    }
});

document.getElementById('btn-pause-lobby').addEventListener('click', () => {
    if (gameEngine.mode === 'vs_online') {
        if (isHost) {
            broadcast({ type: 'go_to_css' });
        } else {
            showToast("Esperando a que el Host inicie el retorno...");
            return;
        }
    }

    gameEngine.running = false;
    if (typeof playMenuMusic === 'function') {
        playMenuMusic();
    }
    if (gameEngine.updateInterval) {
        clearInterval(gameEngine.updateInterval);
        gameEngine.updateInterval = null;
    }
    document.getElementById('game-hud').classList.add('hidden');
    const timerEl = document.getElementById('game-timer');
    if (timerEl) timerEl.classList.add('hidden');
    document.getElementById('menu-pause').classList.add('hidden');
    document.getElementById('menu-css').classList.remove('hidden');
    updateCSSVisuals();
});

// Esc Key for pausing (Local vs only)
window.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && gameEngine.running && gameEngine.mode !== 'vs_online') {
        gameEngine.running = false;
        const ctrlOverlay = document.getElementById('game-controls-overlay');
        if (ctrlOverlay) ctrlOverlay.classList.add('hidden');
        document.getElementById('pause-winner').textContent = "";
        document.getElementById('pause-title').textContent = "PAUSA";
        document.getElementById('btn-pause-resume').classList.remove('hidden');
        document.getElementById('menu-pause').classList.remove('hidden');
    }
});

// Render custom keyboard settings grid
function renderOptionsKeys() {
    const p1Container = document.getElementById('p1-controls-list');
    p1Container.replaceChildren();

    Object.keys(controls.p1).forEach(key => {
        const row = document.createElement('div');
        row.className = 'key-row';

        const label = document.createElement('span');
        label.textContent = key.toUpperCase();

        const valueBox = document.createElement('span');
        valueBox.className = 'key-value';
        valueBox.textContent = controls.p1[key];

        valueBox.addEventListener('click', () => {
            valueBox.textContent = 'Presiona una tecla...';
            const listenKey = (ev) => {
                controls.p1[key] = ev.code;
                valueBox.textContent = ev.code;
                updateControlsQuickRef();
                window.removeEventListener('keydown', listenKey);
            };
            window.addEventListener('keydown', listenKey);
        });

        row.appendChild(label);
        row.appendChild(valueBox);
        p1Container.appendChild(row);
    });

    const p2Container = document.getElementById('p2-controls-list');
    p2Container.replaceChildren();

    Object.keys(controls.p2).forEach(key => {
        const row = document.createElement('div');
        row.className = 'key-row';

        const label = document.createElement('span');
        label.textContent = key.toUpperCase();

        const valueBox = document.createElement('span');
        valueBox.className = 'key-value';
        valueBox.textContent = controls.p2[key];

        valueBox.addEventListener('click', () => {
            valueBox.textContent = 'Presiona una tecla...';
            const listenKey = (ev) => {
                controls.p2[key] = ev.code;
                valueBox.textContent = ev.code;
                updateControlsQuickRef();
                window.removeEventListener('keydown', listenKey);
            };
            window.addEventListener('keydown', listenKey);
        });

        row.appendChild(label);
        row.appendChild(valueBox);
        p2Container.appendChild(row);
    });
}

// Floating Volume Control logic
let lastActiveVolume = sfxVolume || 0.15;

function updateVolumeUI() {
    const slider = document.getElementById('volume-range-floating');
    const button = document.getElementById('btn-volume-toggle');
    if (slider) slider.value = sfxVolume;

    if (button) {
        if (sfxVolume === 0) {
            button.textContent = '🔇';
        } else if (sfxVolume < 0.3) {
            button.textContent = '🔈';
        } else if (sfxVolume < 0.7) {
            button.textContent = '🔉';
        } else {
            button.textContent = '🔊';
        }
    }
}

function initVolumeControl() {
    const slider = document.getElementById('volume-range-floating');
    const button = document.getElementById('btn-volume-toggle');

    if (slider) {
        slider.value = sfxVolume;
        slider.addEventListener('input', (e) => {
            sfxVolume = parseFloat(e.target.value);
            if (sfxVolume > 0) {
                lastActiveVolume = sfxVolume;
            }
            updateVolumeUI();

            // Sync with Options slider if it exists
            const optionsSlider = document.getElementById('slider-sfx');
            if (optionsSlider) optionsSlider.value = sfxVolume;
        });
    }

    if (button) {
        button.addEventListener('click', () => {
            initAudio();
            if (sfxVolume > 0) {
                lastActiveVolume = sfxVolume;
                sfxVolume = 0;
            } else {
                sfxVolume = lastActiveVolume;
            }
            updateVolumeUI();
            playSynthSound('shield');

            // Sync with Options slider if it exists
            const optionsSlider = document.getElementById('slider-sfx');
            if (optionsSlider) optionsSlider.value = sfxVolume;
        });
    }
    updateVolumeUI();
}

function updateControlsQuickRef() {
    // Format keys for display
    const cleanKey = (k) => k.replace('Key', '').replace('Arrow', '←/→/↑/↓ ');

    const p1KeysText = `${cleanKey(controls.p1.left)}/${cleanKey(controls.p1.right)} (Mover) | ${cleanKey(controls.p1.jump)} (Saltar) | ${cleanKey(controls.p1.attackA)} (Ataque A) | ${cleanKey(controls.p1.attackB)} (Especial B) | ${cleanKey(controls.p1.shield)} (Escudo)`;
    const p2KeysText = `${cleanKey(controls.p2.left)}/${cleanKey(controls.p2.right)} (Mover) | ${cleanKey(controls.p2.jump)} (Saltar) | ${cleanKey(controls.p2.attackA)} (Ataque A) | ${cleanKey(controls.p2.attackB)} (Especial B) | ${cleanKey(controls.p2.shield)} (Escudo)`;

    document.getElementById('p1-ref-keys').textContent = p1KeysText;
    document.getElementById('p2-ref-keys').textContent = p2KeysText;
}

function initLobbyUI() {
    // Choose Host (Create Room)
    document.getElementById('btn-lobby-choose-host').addEventListener('click', () => {
        document.getElementById('lobby-role-select').classList.add('hidden');
        document.getElementById('lobby-host-view').classList.remove('hidden');
        initMultiplayer();
    });

    // Choose Guest (Join Room)
    document.getElementById('btn-lobby-choose-guest').addEventListener('click', () => {
        document.getElementById('lobby-role-select').classList.add('hidden');
        document.getElementById('lobby-guest-view').classList.remove('hidden');
        initMultiplayer(false);
    });

    // Host back to selection
    document.getElementById('btn-host-back').addEventListener('click', () => {
        document.getElementById('lobby-host-view').classList.add('hidden');
        document.getElementById('lobby-role-select').classList.remove('hidden');
    });

    // Guest back to selection
    document.getElementById('btn-guest-back').addEventListener('click', () => {
        document.getElementById('lobby-guest-view').classList.add('hidden');
        document.getElementById('lobby-role-select').classList.remove('hidden');
    });

    // Copy to clipboard
    document.getElementById('btn-copy-id').addEventListener('click', () => {
        if (!myId) return;
        navigator.clipboard.writeText(myId).then(() => {
            showToast("¡Código de sala copiado!");
        }).catch(err => {
            console.error("Could not copy text: ", err);
        });
    });
}

// Initialise everything once script runs
if (document.readyState === 'loading') {
    window.addEventListener('DOMContentLoaded', () => {
        initCSSListeners();
        initVolumeControl();
        updateControlsQuickRef();
        initLobbyUI();
    });
} else {
    initCSSListeners();
    initVolumeControl();
    updateControlsQuickRef();
    initLobbyUI();
}

