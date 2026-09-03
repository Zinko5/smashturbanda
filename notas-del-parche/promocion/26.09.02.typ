#import "plantilla.typ": afiche-parche, seccion

#show: doc => afiche-parche(
  parche: "26.9.2",
  fecha: "2 de Septiembre, 2026",
  doc,
)

#seccion("🔥 NUEVAS CARACTERÍSTICAS Y SISTEMAS DE COMBATE")

- *Centralización de Daño y Balance (26.09.02)*: Creación del archivo de configuración dedicado `damageConfig.js` que aísla todas las variables de combate (daños base, empuje, tipos de daño y cooldowns en segundos) del motor de física.
- *6 Nuevos Escenarios Interactivos (26.09.02)*: Integración de Islas Flotantes (`islands`), Castillo Rompible (`castle`), Pirámide Asimétrica (`pyramid`), Núcleo Volcánico (`volcano`), Nave Aérea (`zeppelin`) y Templo Celestial (`temple`), ampliando el catálogo a 9 mapas jugables.
- *D-Pad Táctil Móvil de 8 Direcciones (26.09.02)*: Nueva cuadrícula táctil de 8 direcciones (52px) con arrastre continuo de pulgar (`touchmove`) para movimiento y apuntado omnidireccional en dispositivos móviles.

#seccion("🛠️ CORRECCIÓN DE ERRORES Y BALANCE DE PERSONAJES")

- *Ajuste Mecánico de Yone (26.09.02)*: Corrección del tiempo de recarga de Yone (5.67s) para iniciar exactamente al retornar a su cuerpo y equilibrado de empuje en detonación de marca (`1.35x`).
- *Corrección de Apuntado Vertical Puro (26.09.02)*: Corrección de vectores de apuntado recto para habilidad vertical (`Arriba` / `Abajo`) en gancho de Blitzcrank, embestida de Sonic y proyectiles direccionales.
