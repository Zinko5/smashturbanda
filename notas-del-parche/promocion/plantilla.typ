#let afiche-parche(
  version: "X.Y.Z",
  fecha: "2026-07-17",
  logo: none,
  body
) = {
  set page(
    paper: "a4",
    margin: (x: 2cm, y: 2.5cm),
    fill: rgb("#0b0c10") // Slate black background matching the game
  )
  
  set text(
    font: "Liberation Sans",
    fill: rgb("#c5c6c7"),
    size: 11pt
  )

  // Title Banner
  align(center)[
    #block(
      fill: gradient.linear(rgb("#1f2833"), rgb("#0b0c10")),
      inset: 18pt,
      radius: 12pt,
      width: 100%,
      stroke: 2pt + rgb("#66fcf1") // Neon Cyan glow matching game styling
    )[
      #text(size: 26pt, weight: "bold", fill: rgb("#66fcf1"), tracking: 2pt)[💥 SMASHTURBANDA 💥] \
      #v(6pt)
      #text(size: 15pt, weight: "medium", fill: rgb("#ffffff"))[NUEVA ACTUALIZACIÓN DE COMBATE]
    ]
  ]

  v(10pt)
  
  // Version / Date Grid
  grid(
    columns: (1fr, 1fr),
    align(left)[
      #box(
        fill: rgb("#1f2833"),
        inset: (x: 12pt, y: 6pt),
        radius: 6pt,
        stroke: 1pt + rgb("#45f3ff")
      )[
        #text(weight: "bold", fill: rgb("#ffffff"))[Versión:] #text(fill: rgb("#66fcf1"))[#version]
      ]
    ],
    align(right)[
      #box(
        fill: rgb("#1f2833"),
        inset: (x: 12pt, y: 6pt),
        radius: 6pt,
        stroke: 1pt + rgb("#c5c6c7")
      )[
        #text(weight: "bold", fill: rgb("#ffffff"))[Fecha:] #fecha
      ]
    ]
  )

  v(15pt)
  
  body
}

#let seccion(titulo, color: rgb("#66fcf1")) = {
  v(15pt)
  block(
    width: 100%,
    stroke: (bottom: 2pt + color),
    inset: (bottom: 6pt)
  )[
    #text(size: 15pt, weight: "bold", fill: color)[#titulo]
  ]
  v(8pt)
}
