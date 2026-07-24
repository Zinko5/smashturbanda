#import "plantilla.typ": afiche-parche, seccion

#show: doc => afiche-parche(
  parche: "26.7.6",
  fecha: "24 de Julio, 2026",
  doc,
)

#seccion("🔥 NUEVAS CARACTERÍSTICAS Y SISTEMAS DE COMBATE")

- *Partida Local para hasta 4 Jugadores (26.07.06.13)*: La partida local soporta ahora de 2 a 4 jugadores simultáneos en la misma máquina. La pantalla de selección de personajes incluye una sidebar dedicada con slots individuales por jugador y botones para agregar o quitar jugadores.
- *Soporte Completo de Mandos (Gamepad API) (26.07.06.13)*: Integración de mandos DualShock y estándar. Los mandos se detectan y vinculan automáticamente a los jugadores. El mapeo cubre movimiento (stick analógico y D-Pad), `×`=Saltar, `□`=Ataque A, `△`=Especial B, `L2/L1`=Escudo y `R1`=Agarrar.
- *Inputs Mixtos Mando + Teclado (26.07.06.13)*: Cada jugador puede usar mando o teclado de forma independiente. Se puede mezclar libremente: 2 jugadores con mando y 2 con teclado en la misma partida local.
- *Selección Activa por Jugador en CSS Local (26.07.06.13)*: La sidebar de selección muestra quién está eligiendo actualmente. Los mandos vinculados auto-detectan qué jugador presionó un botón y activan su turno de selección automáticamente.
- *Controles Mapeables para P3 y P4 (26.07.06.13)*: El menú de Opciones ahora permite remapear teclas y vincular mandos para los 4 jugadores, con persistencia en `localStorage`.
- *Servidor TURN Personalizado (26.07.06.7)*: Los usuarios pueden configurar sus propias credenciales TURN (Metered.ca / Xirsys) en el panel de Opciones para mejorar la conectividad P2P en redes restrictivas.
- *Optimización de Red P2P — Compresión de Estado ~75% (26.07.06.3)*: El estado del jugador viaja ahora como tuplas indexadas en lugar de objetos JSON, reduciendo el tamaño de los paquetes de red en aproximadamente el 75%.
- *Envío Inteligente de Inputs del Invitado (26.07.06.3)*: El cliente invitado solo transmite controles cuando hay un cambio real de estado (tecla presionada o soltada), reduciendo el tráfico de subida hasta en un 90% en momentos de inactividad.

#seccion("🛠️ CORRECCIÓN DE ERRORES ANTIGUOS")

- *Estabilidad de Conectividad WebRTC (26.07.06.1)*: Corrección de asimetría en conexiones online entre invitados y hosts específicos con NAT restrictiva.
- *Conectividad en la Misma Red / NAT Loopback (26.07.06.4)*: Resuelto el fallo de conexión de dispositivos en el mismo Wi-Fi por bloqueos de NAT Hairpinning y mDNS locales.
- *Prevención de Conexiones Prematuras (26.07.06.09)*: Se corrigió un fallo silencioso al unirse a sala antes de que el cliente P2P terminara su registro en el servidor de señales.
- *Eliminación de Servidores TURN Públicos Obsoletos (26.07.06.12)*: Los servidores TURN de Open Relay caídos generaban errores críticos de ICE que impedían incluso las conexiones directas STUN. Ahora el juego opera por defecto exclusivamente con los servidores STUN estables de Google.
