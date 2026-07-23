# Indicaciones de Versionado, Documentación y Git

## Estructura de Versiones

Los parches o versiones siguen el formato `aa.bb.cc.dd`:
* `aa`: Dos últimos dígitos del año.
* `bb`: Número del mes (empezando desde 01 para enero).
* `cc`: Cantidad de parches acumulados en ese mes.
* `dd`: Progresiones y cambios menores de desarrollo.

Se distinguen dos tipos de versiones:
1. **Parches de desarrollo o miniparches (`dd`)**: Versiones internas de avance. Sus notas se documentan en el `.md`, pero no se hacen públicas con afiches.
2. **Parches finales (`cc`)**: Versiones oficiales de lanzamiento. Son las únicas que se publican formalmente al público.

---

## Documentación y Directorios

Cada parche final (`cc`) tendrá **un único archivo `.md`** en `notas-del-parche/finales/` nombrado como `aa.bb.cc.md` (ejemplo: `notas-del-parche/finales/26.07.01.md`).

Dentro de este archivo se irán apilando los miniparches (`dd`) del más antiguo al más reciente. Cada bloque `dd` debe contener:

1. **Nuevas características o funciones** (incluye *buffs* o *nerfs*)
2. **Correcciones de bugs antiguos**
3. **Correcciones de bugs introducidos por características nuevas**

---

## Afiches Promocionales

Para cada **parche final (`cc`)**, se debe generar un afiche promocional usando Typst:
* **Plantilla base:** `plantilla.typ`.
* **Ubicación del afiche:** Directorio `promocion/`.
* **Nombrado y versión:** Solo muestran la versión hasta `aa.bb.cc`.
* **Contenido permitido:** Únicamente deben mostrar las secciones de *Nuevas características o funciones* y *Correcciones de bugs antiguos*. Se excluyen explícitamente las correcciones de bugs de características nuevas.

Los afiches se generan indicando lo más significativo de cada microparche, no solo del último
---

## Flujo de Trabajo en Git

Para mantener la integridad del proyecto y distinguir los avances internos de los lanzamientos públicos, se utilizarán **commits continuos** acompañados de **Git Tags**:

### 1. Desarrollo de miniparches (`dd`)
Cada vez que se complete un miniparche o cambio menor, se debe realizar un commit registrando el avance y actualizando las notas `.md` correspondientes.
```bash
git add .
git commit -m "build(aa.bb.cc.dd)"
```

### 2. Publicación de un parche final (`cc`)

Cuando un parche alcanza su versión final estable y esté listo para publicarse con su afiche:

1. Se realiza el commit del parche final (con las notas `.md` y el afiche Typst generados).
```bash
git add .
git commit -m "release: versión aa.bb.cc"
```

2. Se asigna una **etiqueta (Tag)** al commit para marcar formalmente la versión pública:
```bash
git tag -a vaa.bb.cc -m "Parche público aa.bb.cc"
```

3. Se envían los cambios y la etiqueta al repositorio remoto:
```bash
git push origin <rama-actual> --tags
```