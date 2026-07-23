#import "plantilla.typ": afiche-parche, seccion

#show: doc => afiche-parche(
  parche: "26.7.5",
  fecha: "23 de Julio, 2026",
  doc
)

#seccion("🔥 NUEVAS CARACTERÍSTICAS Y SISTEMAS DE COMBATE")

- *Cinco Nuevos Luchadores (26.07.05.4)*: Integración de Blitzcrank, Yone, Bomberman, Terranova y Sett, con mecánicas personalizadas, animaciones de armas y visualización de barras de cooldown sobre sus cabezas.
- *Carga de Especial y Ráfaga de Zoner (26.07.05.5)*: Zoner ahora puede cargar su especial para disparar una ráfaga continua de 2 a 10 flechas rápidas (5.5 de daño y 4.5 de empuje cada una). Permite moverse y saltar libremente manteniendo la dirección de los proyectiles bloqueada.
- *Cámara Lenta y Zoom Dinámico (26.07.05.3)*: Al recibir el impacto de eliminación decisivo en la última vida, el juego activa cámara lenta y realiza un zoom dinámico de hasta 2.2x centrado en la acción.
- *Bucle de Host en Segundo Plano (26.07.05.4)*: Integración de Web Worker en el bucle principal para evitar caídas de FPS y desincronizaciones online cuando la pestaña del navegador Host está minimizada o en segundo plano.
- *Rediseño de Lobby y Votación de Escenarios (26.07.05.1)*: Selección de personajes en 2 columnas responsivas y nueva pantalla independiente para votar mapas con animación de ruleta ponderada.
- *Precarga de Audio de Baja Latencia (26.07.05.2)*: Los efectos de sonido se decodifican en memoria RAM (Web Audio API) reduciendo la latencia de reproducción a cero, mientras que la música de batalla se transmite eficientemente por streaming.
- *Optimización Multiplayer y Reutilización de Memoria (26.07.05.5)*: Nuevo sistema de sincronización P2P por esquema declarativo. Los datos viajan en arrays planos (tuplas) con coordenadas redondeadas, reduciendo el tamaño del paquete un 50-60%. Los invitados reutilizan los objetos en memoria (Object Pooling) para evitar micro-tirones por recolección de basura en PCs de bajos recursos.

#seccion("🛠️ CORRECCIÓN DE ERRORES ANTIGUOS")

- *Consolidación Física de Empuje (26.07.05.5)*: Eliminados los parámetros redundantes de empuje independiente. Ahora la fuerza y hitstun de los golpes se calculan dinámicamente de forma consistente en base al daño final (`finalDamage * 0.8`).
- *Detección de Fin de Partida en Equipos (26.07.05.1)*: Se corrigió la lógica en combates por equipos y vidas para que la partida termine de forma correcta en cuanto un equipo completo es eliminado, en lugar de continuar indefinidamente.
- *Sustitución de shadowBlur (26.07.05.3)*: Reemplazado el uso costoso de `shadowBlur` en las estelas de Sonic por trazados de doble línea, reduciendo sustancialmente el consumo de CPU.
- *Limpieza Visual en Gancho de Blitzcrank (26.07.05.5)*: Reducción del ruido visual en pantalla al limitar la densidad de partículas doradas de impacto de 20 a 8 con escala a la mitad.
