#import "plantilla.typ": afiche-parche, seccion

#show: doc => afiche-parche(
  parche: "26.9.1",
  fecha: "2 de Septiembre, 2026",
  doc,
)

#seccion("🔥 NUEVAS CARACTERÍSTICAS Y SISTEMAS DE COMBATE")

- *Centralización de Daño y Balance (26.09.01)*: Creación del archivo de configuración dedicado `damageConfig.js` que aísla todas las variables de combate (daños base, multiplicadores por fenotipo, empuje, tipos de daño y tiempos de recarga de habilidades) del motor de física.
- *Clasificación por Tipo de Daño (26.09.01)*: Cada ataque del juego está catalogado formalmente como 'golpe' (físico/melee) o 'explosivo' (detonaciones/proyectiles de área).
- *Bonificaciones de Yone en Forma Espiritual (26.09.01)*: Configuración de +20% de daño y +25% de velocidad de ataque para los golpes básicos de Yone cuando su alma se encuentra fuera de su cuerpo.
- *Cooldowns Expresados en Segundos (26.09.01)*: Todos los tiempos de recarga se configuran directamente en segundos en `damageConfig.js` y son convertidos automáticamente a frames en tiempo real.
- *Controles Táctiles Virtuales y Diseño Móvil (26.08.01)*: Implementación de D-Pad, botón OBJ y botones de acción en pantalla para dispositivos móviles, junto con un layout apaisado adaptativo.
- *Proxy de Credenciales TURN Serverless (26.08.01)*: Integración de Worker en Cloudflare para distribuir de forma dinámica y segura las credenciales TURN de relevo WebRTC en redes restrictivas.

#seccion("🛠️ CORRECCIÓN DE ERRORES Y OPTIMIZACIONES")

- *Robustez en Validación de Versiones (26.08.01)*: Retraso preventivo en desconexiones por mismatch de versión e implementación de recarga forzada limpia de caché.
- *Resiliencia de Red P2P y Parsing ICE (26.08.01)*: Extracción exhaustiva de todos los transportes (UDP/TCP/TLS) en los puertos estándar 80, 443 y 3478.
- *Scroll y Adaptabilidad en Pantallas Pequeñas (26.08.01)*: Corrección de cortes de interfaz en menús de baja altura y aviso reactivo de rotación de pantalla.
