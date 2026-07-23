let peer = null;
let connections = []; // Array of guest connections (on Host)
let connection = null;  // Connection to Host (on Guest)
let isHost = false;
let myId = null;
let guestIndex = null; // Guest assigned index (1, 2, or 3)
let lobbyPlayersState = []; // Holds current lobby name/chars state
let roomCode = null;
let selectedTeamLocal = 1;
let isReadyLocal = false;
let teamsEnabledLocal = false;

let cachedPlayersConfig = null;
let cachedStocksLimit = 3;
let cachedTimeLimit = 2;
let cachedTeamsEnabled = false;
let cachedGameMode = 'vs_local';
let countdownInterval = null;
let countdownTimeLeft = 6.7;
let isStageSelectActive = false;

const actualChars = ['balanceado', 'veloz', 'pesado', 'zoner', 'volador', 'blitzcrank', 'yone', 'bomberman', 'terranova', 'sett'];
function getRandomChar() {
    return actualChars[Math.floor(Math.random() * actualChars.length)];
}

const originalPlaySoundFile = (typeof playSoundFile === 'function') ? playSoundFile : null;
if (originalPlaySoundFile) {
    playSoundFile = function(filePath, durationMs = null) {
        originalPlaySoundFile(filePath, durationMs);
        if (gameEngine && gameEngine.mode === 'vs_online' && isHost) {
            if (filePath.includes('fernan-embestida')) {
                broadcast({ type: 'play_sound', filePath, durationMs });
            }
        }
    };
}

function cleanupPeer() {
    if (connection) {
        try { connection.close(); } catch(e){}
        connection = null;
    }
    if (connections && connections.length > 0) {
        connections.forEach(conn => {
            if (conn) {
                try { conn.close(); } catch(e){}
            }
        });
        connections = [];
    }
    if (peer) {
        try { peer.destroy(); } catch(e){}
        peer = null;
    }
    isHost = false;
    myId = null;
    guestIndex = null;
    lobbyPlayersState = [];
    roomCode = null;
    selectedTeamLocal = 1;
    isReadyLocal = false;
    teamsEnabledLocal = false;
    cachedPlayersConfig = null;
    cachedStocksLimit = 3;
    cachedTimeLimit = 2;
    cachedTeamsEnabled = false;
    cachedGameMode = 'vs_local';
    if (countdownInterval) clearInterval(countdownInterval);
    countdownInterval = null;
    isStageSelectActive = false;
    const stageSelOver = document.getElementById('menu-stage-select');
    if (stageSelOver) stageSelOver.classList.add('hidden');
}

// Initialize PeerJS connection
function initMultiplayer(asHost = true) {
    cleanupPeer();

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
                roomCode = code;
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
        roomCode = code;
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
let selectedStageLocal = null;
let selectedStageRemote = null;
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
                if (isReadyLocal) {
                    isReadyLocal = false;
                    const btn = document.getElementById('btn-css-ready');
                    if (btn) {
                        btn.textContent = "¡Listo!";
                        btn.classList.remove('danger');
                        btn.classList.add('primary');
                    }
                }
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

    // Stage voting listeners
    document.querySelectorAll('.stage-vote-card').forEach(card => {
        card.addEventListener('click', () => {
            if (!isStageSelectActive) return;
            selectedStageLocal = card.getAttribute('data-stage');
            playSynthSound('shield');

            document.querySelectorAll('.stage-vote-card').forEach(c => c.classList.remove('selected'));
            card.classList.add('selected');

            if (gameEngine.mode === 'vs_online') {
                if (isHost) {
                    updateStageVotes();
                } else {
                    if (connection && connection.open) {
                        connection.send({
                            type: 'stage_vote',
                            stage: selectedStageLocal
                        });
                    }
                }
            } else {
                updateStageVotes();
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

    // Teams mode select listener
    document.getElementById('game-teams-select').addEventListener('change', (e) => {
        if (gameEngine.mode === 'vs_online' && !isHost) {
            showToast("Solo el Host configura las reglas");
            document.getElementById('game-teams-select').value = teamsEnabledLocal ? "on" : "off";
            return;
        }
        teamsEnabledLocal = (e.target.value === 'on');
        const teamSelCont = document.getElementById('css-teams-control-container');
        if (teamSelCont) {
            teamSelCont.style.display = teamsEnabledLocal ? 'flex' : 'none';
        }
        if (gameEngine.mode === 'vs_online') {
            sendCSSState();
        } else {
            updateCSSVisuals();
        }
    });

    // Local team selection listener
    document.getElementById('css-team-select').addEventListener('change', (e) => {
        selectedTeamLocal = parseInt(e.target.value);
        if (gameEngine.mode === 'vs_online') {
            sendCSSState();
        } else {
            updateCSSVisuals();
        }
    });

    // Ready toggle button listener
    document.getElementById('btn-css-ready').addEventListener('click', () => {
        isReadyLocal = !isReadyLocal;
        const btn = document.getElementById('btn-css-ready');
        if (isReadyLocal) {
            btn.textContent = "No Listo";
            btn.classList.remove('primary');
            btn.classList.add('danger');
        } else {
            btn.textContent = "¡Listo!";
            btn.classList.remove('danger');
            btn.classList.add('primary');
        }
        sendCSSState();
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
    const isOnline = (gameEngine.mode === 'vs_online');
    
    const onlineHeader = document.getElementById('css-online-header');
    const teamsCtrl = document.getElementById('css-teams-control-container');
    const playersListCont = document.getElementById('css-players-list-container');
    const roomCodeVal = document.getElementById('css-room-code-val');
    const readyBtn = document.getElementById('btn-css-ready');
    const startBtn = document.getElementById('btn-css-start');

    if (isOnline) {
        if (onlineHeader) onlineHeader.style.display = 'flex';
        if (teamsCtrl) teamsCtrl.style.display = teamsEnabledLocal ? 'flex' : 'none';
        if (playersListCont) playersListCont.style.display = 'flex';
        if (roomCodeVal) roomCodeVal.textContent = roomCode || '----';
        
        // Render players list dynamically
        const playersList = document.getElementById('css-players-list');
        if (playersList) {
            playersList.replaceChildren();
            lobbyPlayersState.forEach((player, idx) => {
                const row = document.createElement('div');
                row.className = 'player-slot-row';
                
                const left = document.createElement('div');
                left.style.display = 'flex';
                left.style.gap = '10px';
                left.style.alignItems = 'center';
                
                const nameSpan = document.createElement('span');
                nameSpan.className = 'player-slot-name';
                nameSpan.textContent = player.name;
                left.appendChild(nameSpan);
                
                const charSpan = document.createElement('span');
                charSpan.className = 'player-slot-char';
                const charName = player.char === 'random' ? 'Aleatorio' : CHARACTERS[player.char].name;
                charSpan.textContent = `(${charName})`;
                left.appendChild(charSpan);

                if (teamsEnabledLocal) {
                    const teamSpan = document.createElement('span');
                    teamSpan.className = `player-slot-team team-${player.team}-badge`;
                    teamSpan.textContent = player.team;
                    left.appendChild(teamSpan);
                }
                
                row.appendChild(left);
                
                const statusSpan = document.createElement('span');
                statusSpan.className = `status-badge ${player.ready ? 'status-ready' : 'status-not-ready'}`;
                statusSpan.textContent = player.ready ? 'Listo' : 'No Listo';
                row.appendChild(statusSpan);
                
                playersList.appendChild(row);
            });
        }
        
        // Disable pelear button if someone is not ready (excluding host)
        const allGuestsReady = lobbyPlayersState.slice(1).every(p => p.ready);
        if (isHost) {
            if (readyBtn) readyBtn.style.display = 'none';
            if (startBtn) {
                startBtn.style.display = 'block';
                startBtn.disabled = !allGuestsReady;
                startBtn.textContent = allGuestsReady ? "¡Pelear!" : "Esperando jugadores...";
            }
        } else {
            if (readyBtn) readyBtn.style.display = 'block';
            if (startBtn) startBtn.style.display = 'none';
        }
    } else {
        if (onlineHeader) onlineHeader.style.display = 'none';
        if (teamsCtrl) teamsCtrl.style.display = 'none';
        if (playersListCont) playersListCont.style.display = 'none';
        if (readyBtn) readyBtn.style.display = 'none';
        if (startBtn) {
            startBtn.style.display = 'block';
            startBtn.disabled = false;
            startBtn.textContent = "¡Pelear!";
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

    // Hide/show rules container and start button for guests
    const rulesContainer = document.getElementById('game-rules-container');
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
                customName: selectedNameLocal,
                team: selectedTeamLocal,
                ready: isReadyLocal,
                stageVote: selectedStageLocal
            });
        }
    }
}

function sendLobbySync() {
    // Exclusivity collision check: Host has priority, then Guest connections in order of registration.
    const namePool = { Alex: null, Martín: null, Víctor: null, Gabriel: null, Omar: null };

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
            customName: selectedNameLocal,
            team: selectedTeamLocal,
            ready: isReadyLocal
        }
    ];
    connections.forEach((conn, idx) => {
        players.push({
            name: conn.selectedCustomName || `Jugador ${idx + 2}`,
            char: conn.selectedChar || 'veloz',
            customName: conn.selectedCustomName || null,
            team: conn.selectedTeam || (idx + 2),
            ready: conn.isReady || false
        });
    });
    lobbyPlayersState = players;

    const stageVotes = { battlefield: 0, destination: 0, moving: 0, random: 0 };
    if (selectedStageLocal) stageVotes[selectedStageLocal]++;
    connections.forEach(conn => {
        if (conn.selectedStage) {
            stageVotes[conn.selectedStage]++;
        }
    });

    updateCSSVisuals();

    const stocksLimitVal = parseInt(document.getElementById('game-stocks-select').value) || 3;
    const timeLimitVal = parseInt(document.getElementById('game-time-select').value) || 2;

    broadcast({
        type: 'lobby_sync',
        players: players,
        stage: selectedStageLocal,
        stageVotes: stageVotes,
        mode: selectedModeLocal,
        stocksLimit: stocksLimitVal,
        timeLimit: timeLimitVal,
        teamsEnabled: teamsEnabledLocal
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

        // Sync rules
        teamsEnabledLocal = data.teamsEnabled || false;
        document.getElementById('game-teams-select').value = teamsEnabledLocal ? "on" : "off";
        const teamSelCont = document.getElementById('css-teams-control-container');
        if (teamSelCont) {
            teamSelCont.style.display = teamsEnabledLocal ? 'flex' : 'none';
        }

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
            senderConn.selectedTeam = data.team || 1;
            senderConn.isReady = data.ready || false;
            senderConn.selectedStage = data.stageVote || null;
            sendLobbySync();
        }
    } else if (data.type === 'lobby_full') {
        showToast("Lobby lleno (máximo 4 jugadores)");
    } else if (data.type === 'go_to_stage_select') {
        cachedPlayersConfig = data.playersConfig;
        cachedStocksLimit = data.stocksLimit;
        cachedTimeLimit = data.timeLimit;
        cachedTeamsEnabled = data.teamsEnabled;
        cachedGameMode = 'vs_online';
        selectedModeLocal = data.mode;
        
        document.getElementById('menu-css').classList.add('hidden');
        document.getElementById('menu-stage-select').classList.remove('hidden');
        startStageSelectionCountdown();
    } else if (data.type === 'stage_vote') {
        if (isHost && senderConn) {
            senderConn.selectedStage = data.stage;
            updateStageVotes();
        }
    } else if (data.type === 'stage_votes_sync') {
        if (data.stageVotes) {
            Object.keys(data.stageVotes).forEach(stg => {
                const badge = document.getElementById(`vote-count-${stg}`);
                if (badge) {
                    badge.textContent = `${data.stageVotes[stg]} ${data.stageVotes[stg] === 1 ? 'voto' : 'votos'}`;
                }
            });
        }
    } else if (data.type === 'spin_roulette') {
        if (countdownInterval) clearInterval(countdownInterval);
        countdownInterval = null;
        isStageSelectActive = false;
        triggerRouletteAndStartMatch(data.winningStage);
    } else if (data.type === 'css_start') {
        gameEngine.setupMatch('vs_online', data.playersConfig, data.stage, data.mode, data.stocksLimit, data.timeLimit, 'medium', data.teamsEnabled);
        overrideGameLoopForP2P();
    } else if (data.type === 'guest_inputs') {
        if (isHost && gameEngine.players[data.playerIndex]) {
            gameEngine.players[data.playerIndex].lastControlState = data.inputs;
        }
    } else if (data.type === 'host_state') {
        if (!isHost && gameEngine.running) {
            applyHostStateToGuest(data.state);
        }
    } else if (data.type === 'play_sound') {
        if (typeof originalPlaySoundFile === 'function') {
            originalPlaySoundFile(data.filePath, data.durationMs);
        } else if (typeof playSoundFile === 'function') {
            playSoundFile(data.filePath, data.durationMs);
        }
    } else if (data.type === 'stage_timer_sync') {
        countdownTimeLeft = data.timeLeft;
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

        if (typeof stopBattleMusic === 'function') {
            stopBattleMusic();
        }

        let terranovaWon = false;
        if (data.winner !== "Empate") {
            terranovaWon = gameEngine.players.some(p => data.winner.includes(p.name) && p.charData && p.charData.name === "Terranova");
        }

        if (terranovaWon && typeof playTerranovaVictoryMusic === 'function') {
            playTerranovaVictoryMusic();
        } else if (typeof playMenuMusic === 'function') {
            playMenuMusic();
        }
    } else if (data.type === 'go_to_css') {
        gameEngine.running = false;
        if (gameEngine.updateInterval) {
            clearInterval(gameEngine.updateInterval);
            gameEngine.updateInterval = null;
        }
        isReadyLocal = false;
        selectedStageLocal = null;

        const btn = document.getElementById('btn-css-ready');
        if (btn) {
            btn.textContent = "¡Listo!";
            btn.classList.remove('danger');
            btn.classList.add('primary');
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
        const resolvedHostChar = selectedCharLocal === 'random' ? getRandomChar() : selectedCharLocal;
        const playersConfig = [
            { id: 'p1', name: selectedNameLocal || "Host (P1)", char: resolvedHostChar, team: selectedTeamLocal }
        ];
        connections.forEach((conn, idx) => {
            const remoteChar = conn.selectedChar || 'veloz';
            const resolvedRemoteChar = remoteChar === 'random' ? getRandomChar() : remoteChar;
            playersConfig.push({
                id: `p${idx + 2}`,
                name: conn.selectedCustomName || `Jugador ${idx + 2}`,
                char: resolvedRemoteChar,
                team: conn.selectedTeam || (idx + 2)
            });
        });

        cachedPlayersConfig = playersConfig;
        cachedStocksLimit = stocksLimitVal;
        cachedTimeLimit = timeLimitVal;
        cachedTeamsEnabled = teamsEnabledLocal;
        cachedGameMode = 'vs_online';

        // Move everyone to stage select screen
        broadcast({
            type: 'go_to_stage_select',
            playersConfig: playersConfig,
            mode: selectedModeLocal,
            stocksLimit: stocksLimitVal,
            timeLimit: timeLimitVal,
            teamsEnabled: teamsEnabledLocal
        });
    } else {
        // Local game startup configuration
        let p1 = selectedCharLocal;
        if (p1 === 'random') p1 = getRandomChar();
        let p2 = selectedCharRemote || 'veloz';
        if (p2 === 'random') p2 = getRandomChar();
        const mode = gameEngine.mode; // local vs, cpu, training
        const rule = document.getElementById('game-mode-select').value;
        const diff = document.getElementById('cpu-diff-select').value;

        let playersConfig = [];
        if (mode === 'vs_local') {
            playersConfig = [
                { id: 'p1', name: selectedNameLocal || 'Jugador 1', char: p1, team: 1 },
                { id: 'p2', name: selectedNameRemote || 'Jugador 2', char: p2, team: teamsEnabledLocal ? 2 : null }
            ];
        } else if (mode === 'vs_cpu') {
            playersConfig = [
                { id: 'p1', name: selectedNameLocal || 'Jugador 1', char: p1, team: 1 },
                { id: 'p2', name: selectedNameRemote || `CPU (${diff.toUpperCase()})`, char: p2, team: teamsEnabledLocal ? 2 : null }
            ];
        } else {
            playersConfig = [
                { id: 'p1', name: selectedNameLocal || 'Jugador 1', char: p1, team: 1 },
                { id: 'p2', name: selectedNameRemote || 'CPU Dummy', char: p2, team: teamsEnabledLocal ? 2 : null }
            ];
        }

        cachedPlayersConfig = playersConfig;
        cachedStocksLimit = stocksLimitVal;
        cachedTimeLimit = timeLimitVal;
        cachedTeamsEnabled = teamsEnabledLocal;
        cachedGameMode = mode;
    }

    // Transition to Stage Select screen
    document.getElementById('menu-css').classList.add('hidden');
    document.getElementById('menu-stage-select').classList.remove('hidden');
    startStageSelectionCountdown();
});

function startStageSelectionCountdown() {
    isStageSelectActive = true;
    selectedStageLocal = null; // Default to no vote cast
    countdownTimeLeft = 16.7;

    // Reset selected class on all stage vote cards
    document.querySelectorAll('.stage-vote-card').forEach(c => c.classList.remove('selected'));

    updateStageVotes();

    const timerBadge = document.getElementById('stage-select-timer');
    if (timerBadge) timerBadge.textContent = countdownTimeLeft.toFixed(1);

    if (countdownInterval) clearInterval(countdownInterval);
    countdownInterval = setInterval(() => {
        countdownTimeLeft -= 0.1;
        if (countdownTimeLeft <= 0) {
            countdownTimeLeft = 0;
            if (timerBadge) timerBadge.textContent = "0.0";
            clearInterval(countdownInterval);
            countdownInterval = null;
            isStageSelectActive = false;

            // Host or Local calculates weighted winner
            if (gameEngine.mode !== 'vs_online' || isHost) {
                const votes = { battlefield: 0, destination: 0, moving: 0, random: 0 };
                if (selectedStageLocal) votes[selectedStageLocal]++;
                if (gameEngine.mode === 'vs_online') {
                    connections.forEach(conn => {
                        if (conn.selectedStage) {
                            votes[conn.selectedStage]++;
                        }
                    });
                }

                const pool = [];
                Object.keys(votes).forEach(stg => {
                    for (let i = 0; i < votes[stg]; i++) {
                        pool.push(stg);
                    }
                });

                let chosenStage = pool.length > 0 ? pool[Math.floor(Math.random() * pool.length)] : ['battlefield', 'destination', 'moving'][Math.floor(Math.random() * 3)];
                if (chosenStage === 'random') {
                    chosenStage = ['battlefield', 'destination', 'moving'][Math.floor(Math.random() * 3)];
                }

                if (gameEngine.mode === 'vs_online') {
                    broadcast({
                        type: 'spin_roulette',
                        winningStage: chosenStage,
                        stageVotes: votes
                    });
                }

                triggerRouletteAndStartMatch(chosenStage);
            }
        } else {
            if (timerBadge) timerBadge.textContent = countdownTimeLeft.toFixed(1);
        }
    }, 100);
}

function updateStageVotes() {
    const votes = { battlefield: 0, destination: 0, moving: 0, random: 0 };
    if (selectedStageLocal) votes[selectedStageLocal]++;

    if (gameEngine.mode === 'vs_online') {
        if (isHost) {
            connections.forEach(conn => {
                if (conn.selectedStage) {
                    votes[conn.selectedStage]++;
                }
            });
            broadcast({
                type: 'stage_votes_sync',
                stageVotes: votes
            });
        }
    }

    Object.keys(votes).forEach(stg => {
        const badge = document.getElementById(`vote-count-${stg}`);
        if (badge) {
            badge.textContent = `${votes[stg]} ${votes[stg] === 1 ? 'voto' : 'votos'}`;
        }
    });

    // Accelerate timer if everyone has voted
    if (gameEngine.mode !== 'vs_online' || isHost) {
        let everyoneVoted = false;
        if (gameEngine.mode === 'vs_online') {
            everyoneVoted = (selectedStageLocal !== null) && connections.every(conn => conn.selectedStage !== null);
        } else {
            everyoneVoted = (selectedStageLocal !== null);
        }

        if (everyoneVoted && countdownTimeLeft > 4.67) {
            countdownTimeLeft = 4.67;
            if (gameEngine.mode === 'vs_online' && isHost) {
                broadcast({
                    type: 'stage_timer_sync',
                    timeLeft: countdownTimeLeft
                });
            }
        }
    }
}

function runRouletteAnimation(winningStage, callback) {
    const stages = ['battlefield', 'destination', 'moving', 'random'];
    let currentIndex = 0;
    let delay = 80;
    let iterations = 0;
    const maxIterations = 20;

    function step() {
        document.querySelectorAll('.stage-vote-card').forEach(card => card.classList.remove('roulette-flash'));

        const currentStage = stages[currentIndex];
        const card = document.querySelector(`.stage-vote-card[data-stage="${currentStage}"]`);
        if (card) card.classList.add('roulette-flash');

        currentIndex = (currentIndex + 1) % stages.length;
        iterations++;

        if (iterations < maxIterations) {
            delay += 12;
            setTimeout(step, delay);
        } else {
            document.querySelectorAll('.stage-vote-card').forEach(card => {
                card.classList.remove('roulette-flash');
                card.classList.remove('selected');
                if (card.getAttribute('data-stage') === winningStage) {
                    card.classList.add('selected');
                }
            });
            playSynthSound('heavy_hit');
            setTimeout(callback, 1200);
        }
    }
    playSynthSound('shoot');
    step();
}

function triggerRouletteAndStartMatch(winningStage) {
    runRouletteAnimation(winningStage, () => {
        document.getElementById('menu-stage-select').classList.add('hidden');
        if (cachedGameMode === 'vs_online') {
            gameEngine.setupMatch('vs_online', cachedPlayersConfig, winningStage, selectedModeLocal, cachedStocksLimit, cachedTimeLimit, 'medium', cachedTeamsEnabled);
            overrideGameLoopForP2P();
        } else {
            const diff = document.getElementById('cpu-diff-select').value;
            gameEngine.setupMatch(cachedGameMode, cachedPlayersConfig, winningStage, document.getElementById('game-mode-select').value, cachedStocksLimit, cachedTimeLimit, diff, cachedTeamsEnabled);
        }
    });
}

function overrideGameLoopForP2P() {
    const originalUpdate = gameEngine.update.bind(gameEngine);
    let networkTickCount = 0;

    gameEngine.update = () => {
        if (isHost) {
            // Host computes physics
            originalUpdate();

            networkTickCount++;
            // Send computed coordinates/scores/stocks to all guests (30Hz tickrate instead of 60Hz to reduce network lag)
            if (connections.length > 0 && networkTickCount % 2 === 0) {
                broadcast({
                    type: 'host_state',
                    state: {
                        players: gameEngine.players.map(p => packPlayerState(p)),
                        ...packSchemaEntities(),
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
            const inputs = gameEngine.getPlayerInputs('p1');

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

// Schema for synchronizing dynamic entities in multiplayer mode
const DYNAMIC_ENTITIES_SCHEMA = {
    projectiles: {
        arrayName: 'projectiles',
        properties: ['x', 'y', 'w', 'h', 'type']
    },
    items: {
        arrayName: 'items',
        properties: ['x', 'y', 'w', 'h', 'type']
    },
    pumas: {
        arrayName: 'pumas',
        properties: ['x', 'y', 'w', 'h']
    },
    bombers: {
        arrayName: 'bombers',
        properties: ['x', 'y', 'w', 'h']
    },
    walls: {
        getSourceArray: () => gameEngine.platforms.filter(plat => plat.isWall),
        properties: ['x', 'y', 'w', 'h', 'ownerId', 'life'],
        onDeserialize: (stateArray) => {
            const nonWalls = gameEngine.platforms.filter(plat => !plat.isWall);
            const existingWalls = gameEngine.platforms.filter(plat => plat.isWall);
            const len = stateArray ? stateArray.length : 0;
            const activeWalls = [];

            for (let i = 0; i < len; i++) {
                const values = stateArray[i];
                let wObj = existingWalls[i];
                if (!wObj) {
                    wObj = { isWall: true, semi: false };
                }
                wObj.x = values[0];
                wObj.y = values[1];
                wObj.w = values[2];
                wObj.h = values[3];
                wObj.ownerId = values[4];
                wObj.life = values[5];
                activeWalls.push(wObj);
            }
            gameEngine.platforms = nonWalls.concat(activeWalls);
        }
    }
};

function packSchemaEntities() {
    const packed = {};
    for (const [key, config] of Object.entries(DYNAMIC_ENTITIES_SCHEMA)) {
        const source = config.getSourceArray ? config.getSourceArray() : gameEngine[config.arrayName];
        if (source) {
            packed[key] = source.map(item => {
                // Pack values in order of properties (Tuples instead of objects to save bandwidth)
                return config.properties.map(prop => {
                    const val = item[prop];
                    // Quantization: round floating numbers to 1 decimal place to save characters in JSON payload
                    return typeof val === 'number' ? Math.round(val * 10) / 10 : val;
                });
            });
        }
    }
    return packed;
}

function unpackSchemaEntities(state) {
    for (const [key, config] of Object.entries(DYNAMIC_ENTITIES_SCHEMA)) {
        const stateArray = state[key];
        if (config.onDeserialize) {
            config.onDeserialize(stateArray);
        } else if (config.arrayName) {
            const targetArray = gameEngine[config.arrayName];
            if (stateArray) {
                const len = stateArray.length;
                // Keep target array at same size as received state
                while (targetArray.length > len) {
                    targetArray.pop();
                }
                // Reuse existing objects inside the array to prevent Garbage Collection overhead
                for (let i = 0; i < len; i++) {
                    const values = stateArray[i];
                    let obj = targetArray[i];
                    if (!obj) {
                        obj = {};
                        targetArray.push(obj);
                    }
                    config.properties.forEach((prop, idx) => {
                        obj[prop] = values[idx];
                    });
                }
            } else {
                targetArray.length = 0;
            }
        }
    }
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
        balanceadoCharge: p.balanceadoCharge || 0,
        gordoCharge: p.gordoCharge || 0,
        voladorCharge: p.voladorCharge || 0,
        blitzcrankCharge: p.blitzcrankCharge || 0,
        yoneSoulActive: p.yoneSoulActive || false,
        yoneReturning: p.yoneReturning || false,
        yoneBodyX: p.yoneBodyX || 0,
        yoneBodyY: p.yoneBodyY || 0,
        yoneSoulTimer: p.yoneSoulTimer || 0,
        yoneMarkedBy: p.yoneMarkedBy || null,
        yoneDamageAccumulated: p.yoneDamageAccumulated || 0,
        bombermanCharge: p.bombermanCharge || 0,
        terranovaCharge: p.terranovaCharge || 0,
        settCharge: p.settCharge || 0,
        settIsJumping: p.settIsJumping || false,
        balanceadoCooldown: p.balanceadoCooldown || 0,
        voladorBombCooldown: p.voladorBombCooldown || 0,
        gordoCooldown: p.gordoCooldown || 0,
        blitzcrankCooldown: p.blitzcrankCooldown || 0,
        yoneCooldown: p.yoneCooldown || 0,
        bombermanCooldown: p.bombermanCooldown || 0,
        terranovaCooldown: p.terranovaCooldown || 0,
        settCooldown: p.settCooldown || 0,
        zonerCharge: p.zonerCharge || 0,
        zonerRechargeTimer: p.zonerRechargeTimer || 0
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
                playSoundFile('sound/efectos/puma.mp3');
            }
        }
        if (state.bombers && state.bombers.length > gameEngine.bombers.length) {
            if (typeof playSoundFile === 'function') {
                playSoundFile('sound/efectos/strike.mp3', 4000);
            }
        }

        unpackSchemaEntities(state);

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
    p.gordoCharge = state.gordoCharge || 0;
    p.voladorCharge = state.voladorCharge || 0;
    p.blitzcrankCharge = state.blitzcrankCharge || 0;
    p.yoneSoulActive = state.yoneSoulActive || false;
    p.yoneReturning = state.yoneReturning || false;
    p.yoneBodyX = state.yoneBodyX || 0;
    p.yoneBodyY = state.yoneBodyY || 0;
    p.yoneSoulTimer = state.yoneSoulTimer || 0;
    p.yoneMarkedBy = state.yoneMarkedBy || null;
    p.yoneDamageAccumulated = state.yoneDamageAccumulated || 0;
    p.bombermanCharge = state.bombermanCharge || 0;
    p.terranovaCharge = state.terranovaCharge || 0;
    p.settCharge = state.settCharge || 0;
    p.settIsJumping = state.settIsJumping || false;
    p.balanceadoCooldown = state.balanceadoCooldown || 0;
    p.voladorBombCooldown = state.voladorBombCooldown || 0;
    p.gordoCooldown = state.gordoCooldown || 0;
    p.blitzcrankCooldown = state.blitzcrankCooldown || 0;
    p.yoneCooldown = state.yoneCooldown || 0;
    p.bombermanCooldown = state.bombermanCooldown || 0;
    p.terranovaCooldown = state.terranovaCooldown || 0;
    p.settCooldown = state.settCooldown || 0;
    p.zonerCharge = state.zonerCharge || 0;
    p.zonerRechargeTimer = state.zonerRechargeTimer || 0;
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
    if (gameEngine.mode === 'vs_online') {
        cleanupPeer();
    }
});

document.getElementById('btn-lobby-back').addEventListener('click', () => {
    document.getElementById('menu-lobby').classList.add('hidden');
    document.getElementById('menu-main').classList.remove('hidden');
    cleanupPeer();
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
});

document.getElementById('slider-music').addEventListener('input', (e) => {
    musicVolume = parseFloat(e.target.value);
    if (typeof updateMenuMusicVolume === 'function') {
        updateMenuMusicVolume();
    }
});

document.getElementById('btn-options-save').addEventListener('click', () => {
    // Save settings to LocalStorage
    try {
        localStorage.setItem('smashturbanda_settings', JSON.stringify({
            controls: controls,
            masterVolume: masterVolume,
            musicVolume: musicVolume,
            sfxVolume: sfxVolume
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
            isReadyLocal = false;
            selectedStageLocal = null;
            connections.forEach(conn => {
                conn.isReady = false;
                conn.selectedStage = null;
            });

            const btn = document.getElementById('btn-css-ready');
            if (btn) {
                btn.textContent = "¡Listo!";
                btn.classList.remove('danger');
                btn.classList.add('primary');
            }

            sendLobbySync();
            broadcast({ type: 'go_to_css' });
        } else {
            showToast("Esperando a que el Host inicie el retorno...");
            return;
        }
    } else {
        isReadyLocal = false;
        selectedStageLocal = null;
        
        const btn = document.getElementById('btn-css-ready');
        if (btn) {
            btn.textContent = "¡Listo!";
            btn.classList.remove('danger');
            btn.classList.add('primary');
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
let lastActiveVolume = masterVolume || 0.15;

function updateVolumeUI() {
    const slider = document.getElementById('volume-range-floating');
    const button = document.getElementById('btn-volume-toggle');
    if (slider) slider.value = masterVolume;

    if (button) {
        if (masterVolume === 0) {
            button.textContent = '🔇';
        } else if (masterVolume < 0.3) {
            button.textContent = '🔈';
        } else if (masterVolume < 0.7) {
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
        slider.value = masterVolume;
        updateVolumeUI();
        slider.addEventListener('input', (e) => {
            masterVolume = parseFloat(e.target.value);
            if (masterVolume > 0) {
                lastActiveVolume = masterVolume;
            }
            updateVolumeUI();
            if (typeof updateMenuMusicVolume === 'function') {
                updateMenuMusicVolume();
            }

            // Save immediately
            try {
                localStorage.setItem('smashturbanda_settings', JSON.stringify({
                    controls: controls,
                    masterVolume: masterVolume,
                    musicVolume: musicVolume,
                    sfxVolume: sfxVolume
                }));
            } catch (err) {}
        });
    }

    if (button) {
        button.addEventListener('click', () => {
            initAudio();
            if (masterVolume > 0) {
                lastActiveVolume = masterVolume;
                masterVolume = 0;
            } else {
                masterVolume = lastActiveVolume;
            }
            updateVolumeUI();
            playSynthSound('shield');
            if (typeof updateMenuMusicVolume === 'function') {
                updateMenuMusicVolume();
            }

            // Save immediately
            try {
                localStorage.setItem('smashturbanda_settings', JSON.stringify({
                    controls: controls,
                    masterVolume: masterVolume,
                    musicVolume: musicVolume,
                    sfxVolume: sfxVolume
                }));
            } catch (err) {}
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
        cleanupPeer();
    });

    // Guest back to selection
    document.getElementById('btn-guest-back').addEventListener('click', () => {
        document.getElementById('lobby-guest-view').classList.add('hidden');
        document.getElementById('lobby-role-select').classList.remove('hidden');
        cleanupPeer();
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

