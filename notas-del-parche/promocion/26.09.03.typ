#import "plantilla.typ": afiche-parche, seccion

#show: doc => afiche-parche(
  parche: "26.09.03",
  fecha: "15 de Septiembre, 2026",
  doc,
)

#seccion("NUEVAS CARACTERÍSTICAS Y MEJORAS DE SALA")

- *Selección Rápida de Escenario (26.09.03)*: La opción *Aleatorio* ahora aparece en la primera posición de la cuadrícula de mapas y en la ruleta de selección para agilizar la votación al entrar a jugar.
- *Recuperación Automática de Conexión (26.09.03)*: Si la conexión experimenta micro-cortes o una desconexión momentánea, el sistema reintenta enlazar a los jugadores de forma automática y transparente sin abandonar la sala.
- *Límite de Espera y Notificaciones Visuales (26.09.03)*: Se agregó un tiempo límite de 15 segundos al unirse a una sala, mostrando avisos en pantalla si el anfitrión no responde y permitiendo reintentar de inmediato sin tener que reiniciar el juego.

#seccion("CORRECCIÓN CRÍTICA DE CONECTIVIDAD MULTIJUGADOR ONLINE")

- *Solución Definitiva al Enlace Punto a Punto (P2P) (26.09.03)*:
  - *El Problema Detectado*: Durante las partidas entre diferentes casas, conexiones Wi-Fi o combinaciones de móvil y PC, el juego sufría un fallo interno que bloqueaba el intercambio de rutas de conexión entre los jugadores. Aunque la sala existía, los dispositivos no lograban encontrarse directamente por internet, causando que casi todas las conexiones se cancelaran o quedaran en espera infinita.
  - *La Solución*: Se reestructuró por completo el sistema de comunicación directa para garantizar que las credenciales y rutas de enlace se transmitan de inmediato y sin interrupciones entre cualquier tipo de dispositivo y red, habilitando el juego online fluido entre jugadores remotos.

#seccion("AGRADECIMIENTOS ESPECIALES")

- Un agradecimiento muy especial a *Alex, Victor y Martin* por su invaluable ayuda en las pruebas de conexión en red múltiple, y en particular a *Martín* por proporcionar los registros que hicieron posible identificar la causa exacta del error y resolverlo de forma definitiva.
