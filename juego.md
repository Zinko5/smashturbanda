# Documento de Requerimientos: Réplica de Smash (Bajos Recursos)

Este documento detalla el diseño conceptual y funcional para un juego de lucha en plataformas en 2D, optimizado para ejecutarse en computadoras y dispositivos de muy bajos recursos. El objetivo es capturar la esencia de la saga *Super Smash Bros.* (combate por porcentaje, expulsión del escenario, dinamismo) utilizando una estética minimalista y sistemas de juego simplificados.

---

## 1. Concepto General y Estética

El juego es un "Platform Fighter" (luchador de plataformas) en 2D enfocado en partidas rápidas locales. Para garantizar que funcione en cualquier dispositivo, se prioriza el rendimiento sobre los efectos visuales complejos.

*   **Estilo Visual:** Arte de píxeles (*pixel art*) de baja resolución (estilo 8-bits o 16-bits) o figuras geométricas minimalistas con colores planos y contrastantes. 
*   **Animaciones:** Ciclos de animación cortos (entre 2 y 6 fotogramas por acción) para mantener el consumo de memoria al mínimo.
*   **Interfaz de Usuario (UI):** Menús e indicadores limpios, de texto plano o fuentes pixeladas, sin efectos de distorsión, transiciones en 3D ni texturas pesadas.
*   **Audio:** Música en formato *chiptune* (retro de 8-bits) y efectos de sonido cortos sintetizados (explosiones de ruido, tonos de salto simples).

---

## 2. Mecánicas de Juego Básicas (Gameplay)

El sistema de juego replica las reglas fundamentales del género de lucha en plataformas:

### 2.1. Sistema de Daño por Porcentaje
*   Cada personaje comienza con **0%** de daño.
*   Al recibir ataques, el porcentaje aumenta (sin límite máximo, aunque la viabilidad de sobrevivir disminuye drásticamente pasando el 150%).
*   A mayor porcentaje acumulado, más lejos saldrá despedido el personaje al recibir un golpe (efecto de empuje o *knockback* acumulativo).

### 2.2. Condiciones de Victoria y Derrota
*   **El Escenario:** Las batallas ocurren en plataformas flotantes. El límite de la pantalla por los cuatro costados (superior, inferior, izquierdo, derecho) actúa como la "zona de eliminación" (*blast zone*).
*   **Derrota:** Un jugador pierde una vida (*stock*) si es empujado fuera de los límites del escenario.
*   **Modos de Juego:**
    *   **Modo Vidas (Stocks):** Cada jugador inicia con un número de vidas (ej. 3). Gana el último en quedar en pie.
    *   **Modo Tiempo:** Gana quien consiga más noqueos (*kills*) dentro de un límite de tiempo (ej. 2 minutos).

### 2.3. Física y Movimiento
*   **Gravedad y Peso:** Los personajes deben tener respuestas de movimiento rápidas e instantáneas. Se implementará una física básica de saltos, caídas rápidas, inercia al correr y fricción al frenar.
*   **Traspaso de Plataformas:** Capacidad de dejarse caer a través de plataformas semi-sólidas presionando "Abajo".

---

## 3. Sistema de Control y Movimientos de los Personajes

Cada luchador cuenta con un conjunto de movimientos simple pero versátil, utilizando una combinación de una dirección física y un botón de acción.

### 3.1. Movimiento Básico
*   Caminar / Correr (Izquierda / Derecha).
*   Agacharse (Abajo).
*   Salto (Hasta 2 saltos en el aire por personaje).
*   Caída rápida (Presionar abajo mientras se cae).

### 3.2. Movimientos de Ataque
Para evitar sobrecargar los controles, se utilizan únicamente **dos botones de ataque**: **Ataque Básico (A)** y **Ataque Especial (B)**.

*   **Ataques Básicos (Botón A):**
    *   *Neutral:* Ataque rápido en el sitio (para iniciar combos).
    *   *Lateral:* Un golpe fuerte hacia adelante o atrás.
    *   *Arriba:* Ataque hacia arriba (antiaéreo).
    *   *Abajo:* Ataque barrido o hacia el suelo.
    *   *Aéreos (en el aire + dirección):* Ataques rápidos para el combate aéreo.
    *   *Ataque Fuerte / Cargado:* Presionar la dirección y el botón A simultáneamente para un golpe que lanza a los rivales a gran distancia (equivalente al "Smash").

*   **Ataques Especiales (Botón B):**
    *   *Neutral:* Ataque insignia del personaje (usualmente un proyectil o golpe directo).
    *   *Lateral:* Ataque con desplazamiento o carga horizontal.
    *   *Arriba (Recuperación):* Un movimiento que impulsa al personaje hacia arriba para intentar regresar al escenario si ha sido expulsado.
    *   *Abajo:* Movimiento defensivo, contraataque o trampa en el suelo.

### 3.3. Mecánicas Defensivas
*   **Escudo:** Un botón dedicado activa una burbuja protectora que absorbe el daño. El escudo se reduce de tamaño si se mantiene activo o recibe golpes. Si se rompe por completo, el personaje queda aturdido temporalmente.
*   **Esquive:** Presionar una dirección mientras se tiene el escudo activo permite rodar hacia los lados o esquivar en el sitio de forma temporalmente invulnerable.
*   **Agarre:** Un botón o combinación (Escudo + Ataque) para sujetar al rival ignorando su escudo, permitiendo lanzarlo en cuatro direcciones.

---

## 4. Contenido del Juego

Para mantener un peso de archivo mínimo y garantizar que el juego funcione en cualquier procesador, el contenido inicial será acotado pero balanceado.

### 4.1. Elenco de Personajes (Mínimo de 4 arquetipos)
1.  **El Balanceado:** Atributos estándar de velocidad y peso. Proyectil básico en su especial neutral y una recuperación vertical confiable.
2.  **El Veloz / Ágil:** Muy rápido en tierra y con saltos altos, pero muy ligero (fácil de lanzar). Sus ataques hacen poco daño individual pero se encadenan rápido.
3.  **El Pesado:** Lento y grande (blanco fácil), pero muy difícil de lanzar. Sus ataques son lentos pero infligen gran porcentaje de daño y empuje.
4.  **El de Rango / Zoner:** Enfocado en mantener la distancia utilizando proyectiles lentos, trampas y ataques básicos con armas de largo alcance (ej. una espada o látigo).

### 4.2. Escenarios (Mínimo de 3 opciones)
*   **Escenario Base:** Una plataforma grande central flotante con dos o tres plataformas flotantes más pequeñas encima (equivalente al clásico *Campo de Batalla* / *Battlefield*). Sin peligros ambientales.
*   **Escenario Plano:** Una única plataforma plana gigante flotante sin plataformas adicionales (equivalente a *Destino Final* / *Final Destination*).
*   **Escenario Dinámico Simple:** Un escenario con una plataforma central y una plataforma móvil que sube y baja de manera constante para añadir variedad espacial.

---

## 5. Modos de Juego y Flujo de Usuario

*   **Pantalla de Título:** Opciones sencillas: Jugar, Controles, Opciones, Salir.
*   **Menú de Selección de Personaje (CSS):** Una pantalla limpia donde los jugadores eligen su personaje, su color (máximo 4 paletas de color por personaje para distinguir duplicados) y configuran las reglas de la partida (Vidas o Tiempo).
*   **Modo Versus Local:** Soporte para combates de 2 a 4 jugadores en la misma pantalla (usando teclado compartido y/o mandos genéricos).
*   **Modo Entrenamiento:** Un escenario sin límites de tiempo ni vidas donde el rival (un dummy inmóvil o con IA básica estática) permite probar movimientos y porcentajes.
*   **Opciones:** Ajustes de volumen (música y efectos por separado) y configuración/reasignación de teclas para los jugadores.

---

## 6. Inteligencia Artificial (IA)

Para partidas en solitario, el juego debe contar con oponentes controlados por la computadora con tres niveles de dificultad básicos:
*   **Fácil:** Movimiento errático, ataca de manera pausada, rara vez usa el botón de recuperación al caer del escenario.
*   **Medio:** Reacciona a la posición del jugador, intenta regresar al escenario de forma activa y usa escudos de manera ocasional.
*   **Difícil:** Agresivo, encadena ataques básicos, utiliza esquives y busca castigar activamente al jugador cuando este se encuentra fuera del escenario.