# Sistema de Concurso de Cuartetos de Cuerda 2026

## Subsistemas Implementados
- **S2: Inscripción de Cuartetos (`index.html` / `app.js`)**: Wizard de 4 pasos (Nombre, Integrantes, Profesor Responsable, Repertorio) y Ficha de Inscripción.
- **S4: Cronograma y Asignación de Auditorios (`cronograma.html` / `cronograma.js` / `cronograma.css`)**: Subsistema completo funcional de asignación exclusiva de auditorios, control de conflictos y citaciones oficiales.
- **Portal del Representante (`representante.html` / `representante.js` / `representante.css`)**: Consulta de ficha, cronograma oficial y citación con auditorio único.

---

## Validación de Regla de Negocio
### Pregunta: *¿Se asigna un cuarteto en diferentes auditorios?*
**Respuesta Oficial:** **NO.** Cada cuarteto tiene un auditorio **único y exclusivo** asignado para su fase eliminatoria.

### Mecanismo de Control en el Software:
1. **Unicidad de Auditorio por Cuarteto (1:1):** Un cuarteto no puede asignarse a más de un auditorio en una misma fase.
2. **Guardado y Bloqueo Dinámico (RNF-15):** A medida que se selecciona un auditorio para un cuarteto, dicho auditorio queda guardado con estado `OCUPADO` y se bloquea (disabled) en los selectores para que ningún otro cuarteto pueda escogerlo.
3. **Control de Conflictos de Horario y Auditorio (RF-26 / RNF-15):** Si se intenta forzar la asignación de un auditorio ya ocupado, el sistema bloquea la acción y emite la alerta de conflicto.
4. **Terna de Jurados por Auditorio (RF-33 / RF-34):** Cada auditorio cuenta con una terna de 3 jurados independientes sin conflicto de interés.
5. **Reprogramación con Trazabilidad (HU-12 / RF-29/30 / RNF-17):** Al reprogramar un cuarteto, se libera el auditorio anterior (volviendo a quedar disponible) y se reserva el nuevo auditorio, registrando motivo obligatorio, usuario, fecha y hora.
