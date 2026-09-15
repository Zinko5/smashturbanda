---
trigger: always_on
---

# Regla para Documentación de Parches y Versionado

Esta regla define el procedimiento obligatorio para registrar cambios, correcciones y nuevas funcionalidades en los archivos de notas del parche del proyecto.

---

## Directiva Principal

Cada vez que se realicen modificaciones en el código del proyecto (nuevas características, ajustes de balance, buffs/nerfs o correcciones de errores), **es obligatorio actualizar las notas de parche** además de mantener actualizado el Memory Bank (`activeContext.md`, `progress.md`).

---

## Procedimiento de Registro de Parches

### 1. Determinación de la Versión (`aa.bb.cc.dd`)
- **`aa`**: Año en dos dígitos (ej. `26`).
- **`bb`**: Mes en dos dígitos (ej. `09`).
- **`cc`**: Número del parche principal en el mes (ej. `03`).
- **`dd`**: Subversión o miniparche de desarrollo (ej. `01`, `02`).

### 2. Edición del Archivo de Notas (`notas-del-parche/finales/aa.bb.cc.md`)
- Ubicar o crear el archivo correspondiente al parche final actual en `notas-del-parche/finales/aa.bb.cc.md`.
- Apilar el nuevo bloque de miniparche (`dd`) siguiendo el siguiente formato estricto:

```markdown
## [aa.bb.cc.dd] - Miniparche de Desarrollo

### 1. Nuevas características o funciones
* **Nombre de la característica o cambio**: Descripción clara de lo que se implementó o modificó ([archivo.js](file:///ruta/absoluta/al/archivo.js)).

### 2. Correcciones de bugs antiguos
* Descripción de la corrección o "Ninguno detectado." si no aplica.

### 3. Correcciones de bugs que vinieron con las nuevas características
* Descripción del ajuste o "Ninguno detectado." si no aplica.
```

### 3. Actualización de la Versión en el Juego (`index.html`)
- Al incrementar o crear una subversión `aa.bb.cc.dd`, actualizar la versión mostrada en el footer de `index.html`:
  ```html
  <div style="position: absolute; bottom: 15px; right: 20px; font-size: 0.85rem; color: #64748b; font-family: 'Outfit', sans-serif; pointer-events: none;">
      vaa.bb.cc.dd
  </div>
  ```

---

## Restricciones Obligatorias

1. **Sin comandos de Git**: No ejecutar comandos de `git`. Si es necesario registrar commits o tags de versión, sugerir al usuario el texto exacto a ejecutar en su consola.
2. **Sin emojis**: Evitar el uso de emojis en las notas del parche, comentarios de código y documentos markdown.
3. **Enlaces a Archivos**: Incluir enlaces markdown válidos con el esquema `file://` apuntando a los archivos involucrados en cada cambio registrado.
