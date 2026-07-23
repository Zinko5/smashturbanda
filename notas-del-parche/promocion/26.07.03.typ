#import "plantilla.typ": afiche-parche, seccion

#show: doc => afiche-parche(
  parche: "26.7.3",
  fecha: "17 de Julio, 2026",
  doc
)

#seccion("🔥 NUEVAS CARACTERÍSTICAS Y AJUSTES DE BALANCE")

- *Nuevo Personaje "Volador"*: Se incorpora un luchador especializado en planeación y combate aéreo. Puede planear horizontalmente (A/D) flotando suavemente y soltar bombas verticales que detonan al impactar.
- *Sistema de Objetos Activables*: Los ítems caen del cielo cada 10-30 segundos y desaparecen tras 6.7s si no son recogidos. Se activan presionando la tecla de Agarre (U / V / Numpad0).
  - *Puma*: Corre velozmente de izquierda a derecha causando 28% de daño y 18 de empuje.
  - *Yahu-Strike*: Bombardero gigante que cruza el mapa de derecha a izquierda arrojando 7 bombas masivas (tamaño 75x75) con 25% de daño y 16 de empuje cada una.
- *Guía de Controles en Pantalla*: El HUD del juego ahora muestra visualmente el botón de Agarre (U) para recordar el uso de los objetos activables.
- *Volumen del Sistema Atenuado*: El volumen predeterminado de los efectos de sonido se redujo al 15% (0.15) para evitar audios ensordecedores al abrir el juego. El slider ahora se ajusta en pasos de 0.05.
- *Restricción de Escenarios en Red*: Oculta la selección de mapas para los clientes invitados en el modo online, permitiendo únicamente al Host elegir el escenario.

#seccion("🛠️ CORRECCIÓN DE ERRORES")

- *Sincronización de Plataforma Móvil*: Se solucionó el bug multijugador P2P por el cual los invitados veían la plataforma flotante estática en el centro. Ahora se sincroniza correctamente en cada frame.
- *Audio de Explosión Corregido*: Se atenuó el volumen del sintetizador de las explosiones para que esté en perfecta armonía con los demás efectos sonoros del juego.
