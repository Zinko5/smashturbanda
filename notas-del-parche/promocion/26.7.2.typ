#import "plantilla.typ": afiche-parche, seccion

#show: doc => afiche-parche(
  parche: "26.7.2",
  fecha: "17 de Julio, 2026",
  doc,
)

#seccion("🔥 NUEVAS CARACTERÍSTICAS Y AJUSTES DE BALANCE")

- *Salas Multijugador Simplificadas (4 Dígitos)*: ¡Olvídate de copiar códigos eternos! Ahora las salas online se crean con un identificador de solo *4 números* para dictarlo fácilmente.
- *Sistema de Retorno al Lobby*: Regresa directamente a la selección de personaje y escenario al terminar una partida sin perder la conexión online con tu rival.
- *Visualización del Temporizador*: Se añadió un marcador de tiempo en la parte superior de la pantalla para ver los minutos y segundos restantes en el modo por tiempo.
- *Orden de Selección en Pantalla*: El campo de selección de nombre ahora aparece por encima de la cuadrícula de personajes, haciendo el flujo más intuitivo.
- *Especiales Cargables y Direccionados*:
  - *Balanceado*: Mantén pulsado su proyectil para cargar una bola de fuego gigante que inflige el doble de daño y empuje. Ahora puedes dispararla en *8 direcciones*.
  - *Veloz (Ágil)*: Carga su embestida para recorrer mayor distancia e impactar continuamente a los enemigos que atravieses a lo largo de tu trayectoria. Puede direccionarse en *8 direcciones*.
  - *Zoner*: Dispone de un cargador de 2 disparos rápidos de flecha seguidos por un enfriamiento de 0.67s. Las flechas se pueden apuntar en 8 direcciones (incluyendo diagonal y verticalmente hacia arriba).
- *Físicas Suavizadas y Peso Realista*: El porcentaje de daño sube de forma más progresiva, y el empuje a niveles medios (como 50%) es mucho menos severo. Además, los personajes pesados como *Pesado* ahora oponen mayor resistencia al lanzamiento.
- *Escenarios Ampliados*: Las plataformas de los escenarios *Battlefield*, *Destination* y *Moving* se han ensanchado horizontalmente para ofrecer batallas más espaciadas y dinámicas.

#seccion("🛠️ CORRECCIÓN DE ERRORES")

- *Adiós al Vuelo Infinito*: Se eliminó el error por el cual los personajes podían usar Especial Arriba de forma reiterativa en el aire para volar sin límites.
- *Optimización del Multijugador*: Resueltos los fallos de reordenamiento de mandos y slots cuando un jugador se desconecta en la pantalla del lobby.
- *Carga del Juego*: Implementado un control estricto de caché en el navegador para garantizar que las actualizaciones de estilos y programación se apliquen siempre de forma limpia sin necesidad de forzar refrescos manuales.
