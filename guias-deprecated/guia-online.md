# Plan de Acción: Juego Multijugador Web Gratuito (GitHub Pages + PeerJS)

Este plan detalla cómo crear y desplegar un juego multijugador web en tiempo real 100% gratuito utilizando **GitHub Pages** para el alojamiento estático y **PeerJS (WebRTC)** para la conexión Peer-to-Peer sin necesidad de configurar servidores de backend.

---

## 🛠️ Arquitectura del Proyecto
*   **Hosting Frontend:** GitHub Pages (Servidor de archivos estáticos HTML/JS).
*   **Motor de Renderizado:** HTML5 Canvas / JavaScript plano.
*   **Conexión Multijugador:** PeerJS (Intercambio de datos P2P con latencia casi nula mediante WebRTC).

---

## 📋 Guía de Implementación Paso a Paso

### Paso 1: Inicializar el Repositorio
1. Crea un repositorio público en GitHub (por ejemplo: `mi-juego-online`).
2. Clónalo en tu computadora o crea los archivos directamente desde la web de GitHub.
3. El archivo principal debe llamarse estrictamente `index.html`.

### Paso 2: Estructura del Código Base (`index.html`)
Copia este código básico que conecta a dos jugadores y sincroniza datos en tiempo real mediante un sistema de "Anfitrión" (Host) y "Invitado" (Guest):

```html
<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Mi Juego Multijugador P2P</title>
    <!-- Importamos PeerJS desde un CDN público -->
    <script src="[https://unpkg.com/peerjs@1.5.4/dist/peerjs.min.js](https://unpkg.com/peerjs@1.5.4/dist/peerjs.min.js)"></script>
    <style>
        body { font-family: sans-serif; text-align: center; background: #222; color: #fff; }
        #canvas { background: #111; border: 2px solid #555; display: block; margin: 20px auto; }
    </style>
</head>
<body>
    <h1>Juego Web P2P en Tiempo Real</h1>
    
    <div>
        <p>Tu ID de conexión: <strong id="my-id">Generando...</strong></p>
        <input type="text" id="peer-id-input" placeholder="Introduce el ID de tu amigo">
        <button id="connect-btn">Conectarse a amigo</button>
    </div>

    <canvas id="canvas" width="600" height="400"></canvas>

    <script>
        const canvas = document.getElementById('canvas');
        const ctx = canvas.getContext('2d');
        
        // Estado del juego local
        let jugadorLocal = { x: 50, y: 150, color: 'blue' };
        let jugadorRemoto = { x: 500, y: 150, color: 'red' };

        // Inicializamos PeerJS (usa servidores de señalización gratuitos por defecto)
        const peer = new Peer();
        let connection = null;

        // Mostrar nuestro ID en pantalla para compartirlo
        peer.on('open', (id) => {
            document.getElementById('my-id').innerText = id;
        });

        // ESCENARIO A: Alguien se conecta a nosotros (Somos el Host)
        peer.on('connection', (conn) => {
            connection = conn;
            setupConnection();
        });

        // ESCENARIO B: Nosotros nos conectamos a alguien (Somos el Invitado)
        document.getElementById('connect-btn').addEventListener('click', () => {
            const peerId = document.getElementById('peer-id-input').value;
            connection = peer.connect(peerId);
            setupConnection();
        });

        // Configuración de la lógica de transmisión de datos
        function setupConnection() {
            connection.on('open', () => {
                console.log("¡Conectado exitosamente con el rival!");
                buclePrincipal(); // Iniciamos el juego
            });

            // Recibir las coordenadas del otro jugador en tiempo real
            connection.on('data', (data) => {
                jugadorRemoto.x = data.x;
                jugadorRemoto.y = data.y;
            });
        }

        // Bucle de renderizado y control
        function buclePrincipal() {
            // Limpiar pantalla
            ctx.clearRect(0, 0, canvas.width, canvas.height);

            // Dibujar jugadores
            ctx.fillStyle = jugadorLocal.color;
            ctx.fillRect(jugadorLocal.x, jugadorLocal.y, 40, 40);

            ctx.fillStyle = jugadorRemoto.color;
            ctx.fillRect(jugadorRemoto.x, jugadorRemoto.y, 40, 40);

            requestAnimationFrame(buclePrincipal);
        }

        // Captura de movimiento (Teclas Flecha Arriba/Abajo/Izquierda/Derecha)
        window.addEventListener('keydown', (e) => {
            if (!connection) return; // Esperar a que haya conexión activa

            if (e.key === 'ArrowUp') jugadorLocal.y -= 10;
            if (e.key === 'ArrowDown') jugadorLocal.y += 10;
            if (e.key === 'ArrowLeft') jugadorLocal.x -= 10;
            if (e.key === 'ArrowRight') jugadorLocal.x += 10;

            // Enviar nuestra nueva posición inmediatamente al otro jugador
            connection.send({ x: jugadorLocal.x, y: jugadorLocal.y });
        });
    </script>
</body>
</html>