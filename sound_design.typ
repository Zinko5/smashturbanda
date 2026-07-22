= Diseño de Sonidos - Smashturbanda

Este documento detalla la propuesta de diseño de efectos de sonido (SFX) para *Smashturbanda*, especificando qué elementos disparan sonidos, el estilo de audio propuesto (frecuencia, timbre) y su duración sugerida.

== 1. Interfaz de Usuario y Menús

#table(
  columns: (auto, auto, auto, auto),
  [*Evento*], [*Descripción del Sonido*], [*Tipo / Timbre*], [*Duración*],
  [*Hover en Botón / Tarjeta*], [Pitido sutil y sumamente corto.], [Agudo, suave (onda senoidal)], [0.05s],
  [*Click / Confirmación*], [Golpe seco con tono afirmativo.], [Agudo, metálico (onda cuadrada/triángulo)], [0.12s],
  [*Selección de Personaje / Escenario*], [Impacto rápido con energía.], [Grave/Medio, golpe con eco], [0.25s],
  [*Atrás / Cancelar*], [Dos tonos rápidos descendentes.], [Medio, seco (onda de sierra)], [0.15s],
  [*Copiar Código*], [Sonido brillante cibernético.], [Agudo, resonante (barrido ascendente)], [0.3s],
)

== 2. Movimiento y Físicas del Combate

#table(
  columns: (auto, auto, auto, auto),
  [*Evento*], [*Descripción del Sonido*], [*Tipo / Timbre*], [*Duración*],
  [*Salto Básico*], [Barrido de frecuencia ascendente.], [Medio a Agudo, elástico (onda triángulo)], [0.15s],
  [*Doble Salto*], [Tono de salto más agudo y rápido.], [Agudo, silbido rápido (onda senoidal)], [0.10s],
  [*Aterrizaje en Plataforma*], [Golpe seco al tocar suelo.], [Grave, sordo (ruido blanco de baja frecuencia)], [0.08s],
)

== 3. Combate y Habilidades

#table(
  columns: (auto, auto, auto, auto),
  [*Evento*], [*Descripción del Sonido*], [*Tipo / Timbre*], [*Duración*],
  [*Ataque Básico (A)*], [Latigazo rápido en el aire.], [Medio, seco y cortante], [0.1s],
  [*Ataque Especial (B)*], [Carga o disparo de proyectil.], [Agudo, barrido exponencial ascendente], [0.2s],
  [*Escudo Activado*], [Resonancia defensiva metálica.], [Agudo, constante y limpio (onda senoidal)], [Al presionar],
  [*Escudo Roto*], [Ruptura o crujido de cristal/metal.], [Seco, distorsionado y metálico (onda cuadrada)], [0.35s],
)

== 4. Daño Recibido (Escalado por Porcentaje)

Para dar mayor retroalimentación sobre la gravedad del combate, el sonido al recibir golpes cambia según el porcentaje de daño acumulado del personaje:

#table(
  columns: (auto, auto, auto, auto, auto),
  [*Estado de Daño*], [*Rango %*], [*Descripción del Sonido*], [*Tipo / Timbre*], [*Duración*],
  [*Impacto Ligero*], [`0% - 50%`], [Un chasquido o cachetada rápida.], [Medio, seco (onda de sierra rápida)], [0.08s],
  [*Impacto Medio*], [`51% - 100%`], [Un golpe sordo que resuena.], [Grave, seco (onda cuadrada con caída de tono)], [0.18s],
  [*Impacto Pesado*], [`> 100%`], [Explosión profunda y distorsionada.], [Muy Grave, retumbante (ruido blanco + sierra descendente)], [0.4s],
)

== 5. Gestión de Objetos (Items)

#table(
  columns: (auto, auto, auto, auto),
  [*Evento*], [*Descripción del Sonido*], [*Tipo / Timbre*], [*Duración*],
  [*Aparición de Objeto*], [Brillo mágico indicando spawn.], [Agudo, timbre metálico dulce], [0.4s],
  [*Agarrar Objeto (Pickup)*], [Sonido mecánico de equipamiento.], [Medio, clic doble rápido], [0.15s],
  [*Activar Puma*], [Rugido salvaje del puma corriendo.], [Grave, agresivo y prolongado (archivo MP3)], [~2.0s],
  [*Activar Yahu-strike*], [Vuelo de avión bombardero con sirena.], [Grave/Medio, barrido de sirena (archivo MP3)], [4.0s (acortado)],
)

== 6. Eventos de la Partida

#table(
  columns: (auto, auto, auto, auto),
  [*Evento*], [*Descripción del Sonido*], [*Tipo / Timbre*], [*Duración*],
  [*Muerte (Out of Bounds)*], [Explosión masiva con caída de tono.], [Muy Grave, descendente dramático], [0.6s],
  [*Fin del Temporizador (Go!)*], [Campana digital o alarma.], [Agudo, estridente], [0.5s],
  [*Fin de Partida (Game Over)*], [Fanfarria o desaceleración dramática.], [Mezcla de graves y agudos], [1.5s],
)