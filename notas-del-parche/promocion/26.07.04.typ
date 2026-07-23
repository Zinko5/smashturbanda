#import "plantilla.typ": afiche-parche, seccion

#show: doc => afiche-parche(
  parche: "26.7.4",
  fecha: "21 de Julio, 2026",
  doc
)

#seccion("🔥 NUEVAS CARACTERÍSTICAS Y SISTEMAS DE COMBATE")

- *Música Principal del Menú*: Integración de `sound/main-theme.mp3` reproduciéndose en bucle en los menús con volumen ajustado automáticamente según los controles del juego.
- *Sistema de Combos de 3 Golpes (Neutral A)*: Permite encadenar ataques neutrales. Golpes 1 y 2 con bajo empuje para enlazar, y Golpe 3 (Finisher) con empuje fuerte para lanzar al rival.
- *Animaciones Procedurales Matemáticas*: Animación de personajes en Canvas 2D sin sprites rígidos: oscilación de patas al caminar/saltar, Squash & Stretch dinámico por velocidad vertical y movimiento de respiración inactiva.
- *Orientación Simétrica de Armas*: Armas y accesorios de todos los personajes (como el arco del Zoner) se ajustan simétricamente al cambiar de dirección.
- *Conexión Rápida P2P (Tecla Enter)*: Posibilidad de presionar Enter en el cuadro de código de sala para conectarse instantáneamente.
- *Actualización Gráfica de Menús e Interfaz*: Rediseño completo de la UI con estética anime de alto contraste, tipografía moderna, cortes oblicuos y tarjetas estilizadas.
- *Corrección de Sprite (`martin-jugador.png`)*: Corrección de silueta y limpieza de restos de fondo verde (chroma key).

#seccion("🛠️ CORRECCIÓN DE ERRORES ANTIGUOS")

- *Asignación de Puntos de Kills Online (P3 y P4)*: Registro preciso mediante `lastHitBy` para otorgar el punto al jugador que infligió el último golpe en partidas multijugador por tiempo.
- *Resaltado CSS para P3 y P4*: Adición de estilos visuales `.selected-p3` (amarillo) y `.selected-p4` (verde) en el lobby de selección de personajes y nombres.
- *Lógica de Eliminación por Vidas*: En peleas de 3 o 4 jugadores, la partida ya no termina cuando muere el primer luchador, sino cuando solo queda un jugador con vidas en pie.
- *Sincronización de Plataformas Móviles*: Eliminada la desincronización de movimiento de las plataformas flotantes para clientes conectados vía P2P.
