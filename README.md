# Sistema de Concurso de Cuartetos de Cuerda 2026

## Subsistemas y Módulos Implementados
- **S2: Inscripción de Cuartetos (`index.html` / `app.js`)**: Wizard de 4 pasos (Nombre, Integrantes, Profesor Responsable con catálogo de 10 docentes, Repertorio) y Ficha de Inscripción.
- **S4: Cronograma y Asignación de Auditorios (`cronograma.html` / `cronograma.js` / `cronograma.css`)**: Subsistema completo funcional de asignación de salas con nómina de 12 jurados evaluadores, selección en cascada (Auditorio → Fecha → Horarios disponibles), bloqueo dinámico de turnos ocupados (RNF-15) y reprogramación con trazabilidad (RNF-17).
- **Portal del Representante (`representante.html` / `representante.js` / `representante.css`)**: Consulta en tiempo real de Ficha, Cronograma y Citación Oficial (con estado pendiente hasta que se programe en S4), más el nuevo **Buzón de Observaciones del Sistema** interactivo.

---

## Flujo de Asignación y Programación de Turno
1. **Inscripción y Ficha Inicial:** Al registrar un cuarteto en el wizard de S2, el cuarteto queda en estado validado sin auditorio asignado. En su ficha y en "Mi Cronograma", aparece el estado *⏳ Pendiente de selección de auditorio*.
2. **Selección en S4:** El representante o administrador ingresa a **Cronograma y Asignación de Auditorios**, escoge la sala (*Auditorio Principal, Auditorio B, Auditorio C, Sala de Cámara*), la fecha y un horario libre.
3. **Sincronización Inmediata:** Al confirmar el turno, el horario queda bloqueado para otros cuartetos. Al volver al Portal del Representante, la ficha, el cronograma y la citación oficial reflejan automáticamente el auditorio, fecha, hora y orden registrados.

---

## Catálogos y Datos Ampliados
- **10 Docentes Responsables (Paso 3 del Wizard):** Catálogo amplio de profesores de conservatorio en Violín, Viola, Violonchelo y Música de Cámara, con 3 docentes que ejercen como jurados para probar la regla de bloqueo por conflicto de interés (**RNF-09**).
- **12 Jurados Evaluadores Oficiales (S5):** Nómina de 12 jurados especialistas distribuidos en ternas exclusivas de 3 jurados por auditorio (**RF-33** / **RF-34**), con modal de consulta interactivo.
- **Buzón de Observaciones sobre el Sistema:** Banner y modal emergente en el Portal del Representante para registrar incidencias, dudas o sugerencias con número de ticket (#OBS-2026-XXXX) y almacenamiento persistente.
