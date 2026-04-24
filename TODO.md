7. Medición automática de dificultad de combos
   Construir una métrica de dificultad basada en ventanas objetivas del juego.
   Usar datos como ventanas de cancel, links y buffer para estimar qué partes son fáciles y cuáles exigentes.
   Considerar que la dificultad global del combo depende especialmente de su ventana más estricta.
   Hacer que los delays influyan correctamente, ya que son de las partes más execution-heavy del juego.
   Distinguir entre combos fáciles, medios y muy difíciles para poder filtrar y recomendar mejor.
   Usar esta dificultad como pieza central para adaptar resultados a usuarios con distintas manos/nivel.
9. Búsqueda y filtrado por dificultad / habilidad del usuario
   Permitir que un usuario pida combos acordes a su nivel de ejecución real.
   Hacer que búsquedas y recomendaciones entiendan qué significa “fácil, fácil, fácil”.
   Favorecer resultados con menos links duros y más cadenas o cancels cuando el usuario tenga menor nivel.
   Usar la dificultad medida del combo como filtro principal en exploración y aprendizaje.
   Conectar este sistema con el perfil del jugador y con la librería de combos que ya conoce.
   Conseguir que la experiencia funcione tanto para gente novata como para jugadores muy avanzados.
12. Consistencia lógica del sistema de capas
    Asegurar que las capas altas aporten realmente opciones nuevas o mejores en ciertos contextos.
    Detectar casos donde una capa superior no cambia nada relevante y por tanto sobra o está mal planteada.
    Usar la resolución del escenario para comprobar si las opciones avanzadas tienen impacto real.
    Evitar inflar complejidad artificialmente con movimientos que nunca entran en juego óptimo.
    Hacer que el diseño de capas tenga valor pedagógico, no solo taxonómico.
    Preparar herramientas o señales para revisar escenarios cuyas capas estén mal construidas.
13. Deploy privado para beta testers
    Preparar un deploy real en AWS de una versión estable del proyecto cuando ya estén cerradas las épicas funcionales
    anteriores.
    Montar la infraestructura partiendo de que el proyecto corre en Linux con Docker y aprovechar eso para simplificar
    el despliegue.
    Sustituir el acceso actual por un sistema de login apto para testers reales, con cuentas controladas por ti y flujo
    cómodo de acceso.
    Permitir acceso restringido solo a personas invitadas, ya sea mediante creación manual de cuentas, invitación por
    email o acceso controlado.
    Configurar el entorno de producción con foco en coste, seguridad básica, límites de gasto y alertas útiles.
    Dejar montado un entorno beta que puedas enseñar, probar con usuarios reales y mantener sin volverte loco con
    DevOps.
14. Limpieza fuerte del código antes de hacerlo público
    Hacer una revisión seria de la base de código para detectar estructura débil, duplicaciones, archivos innecesarios y
    piezas montadas de forma frágil.
    Reordenar el proyecto para que la arquitectura de alto nivel quede clara y defendible cuando alguien externo la
    mire.
    Revisar backend y frontend con criterios fuertes de calidad: cohesión, separación de responsabilidades, naming,
    tamaño de clases/componentes y puntos de extensión.
    Validar qué partes tienen tests, cuáles no, y reforzar especialmente las zonas importantes que hoy puedan estar poco
    verificadas.
    Reducir señales evidentes de código generado sin criterio, para que el proyecto se perciba como algo trabajado y
    mantenible.
    Dejar el repositorio en buen estado para open source y contribuciones futuras, de forma que tú mismo puedas orientar
    mejor a quien quiera ayudar.
15. Bugs para Dark Mode
16. Performance de búsqueda en combos y escenarios
    Auditar todos los filtros expuestos en backend y asegurar que cada parámetro buscable tenga índice útil en Postgres.
    Añadir índices faltantes para búsqueda de combos por dificultad, daño, primer golpe y requisitos.
    Mejorar índice de búsqueda textual de escenarios (contains search) y revisar ordenado por updated_at.
    Medir con EXPLAIN ANALYZE sobre queries reales y documentar resultados antes/después.
17. Cobertura completa de filtros de Search Combos
    Extender backend y frontend para poder filtrar por propiedades clave del combo: primer ataque, dificultad, daño,
    requisitos contextuales y tipos de movimiento relevantes (drive/super/special).
    Definir criterios de "tiene sentido buscarlo" para evitar filtros que no aportan valor práctico.
    Añadir tests backend para combinaciones de filtros y compatibilidad con resultados existentes.
18. UX de búsquedas multi-condición
    Mejorar ergonomía de Search Combos y Search Scenarios para uso con muchos filtros activos.
    Mantener visibilidad de filtros aplicados, acceso rápido a limpiar/resetear y feedback claro de resultados.
    Evitar cargas innecesarias en búsquedas asistidas (debounce y/o server-side query incremental).
19. nueva UX: You’re right: the missing piece is not only “UI polish,” it’s identity discipline. Your product already
    has a strong visual DNA (the artist palette + logo language), but the app currently applies it inconsistently: old
    pages still use generic MUI defaults (Roboto + purple primary + plain boxes), while newer matrix work has clearer
    hierarchy, state contrast, and contextual layout. That mismatch is what reads as “ugly” or “dated,” even when
    functionality is solid.

For future agents, define a single brand direction explicitly: “FGC tactical editorial.” Use your palette as the source
of truth: deep navy #003049 as foundation, red #d72829 and orange #f78002 as action/emphasis, amber #fcbf49 for
caution/highlight, cream #eae2b7 for warm surfaces, and cool accents #246f89, #4d9eba, #a2ccdb for data/secondary UI. In
light mode, prioritize white/cream surfaces with navy text and restrained accent usage; in dark mode, use navy-heavy
surfaces with high-contrast text and keep red/orange reserved for intent (danger/primary action), not decoration.

Icon and logo direction should be codified too: use your existing SVG identity (favicon-color-pos.svg /
favicon-color-neg.svg) as the canonical mark behavior for light/dark, and ensure UI iconography follows one consistent
stroke family (no mixed icon packs, no emoji-like visual noise). The matrix segmented style should be the interaction
model reference: grouped controls, clear active/selected/editing states, contextual side panels, and no unnecessary
persistent UI. This is the real “modern” quality users are reacting to, more than gradients or color alone.

What to ask future agents next week: “Refactor pages to the FGC tactical editorial design system without changing
behavior; migrate each page to shared tokens (color/spacing/radius/typography), replace generic box forms and blocking
alerts with segmented layout + inline feedback, enforce light/dark parity, and preserve all existing features.” Also ask
them to deliver page-by-page with visual QA gates: no horizontal overflow, consistent CTA hierarchy, consistent icon
set, and mode parity before moving to the next page (start with Create Combo, then Scenario Search/View/Edit, then
remaining flows).
You’re feeling that “Windows 2005” effect mainly because the app has design-system drift: some areas (like the matrix)
now have a coherent visual language, but many pages still use mixed legacy defaults. A concrete example is
frontend/styles/theme.ts: primary is still old purple, typography is plain Roboto/Helvetica, and surface treatment is
generic. That creates a dated baseline before page-level UI even starts.

Second root cause is component composition inconsistency. Pages like frontend/pages/combos/new.tsx +
frontend/src/components/combos/create/ComboForm.tsx mix modern wrapper components with raw browser/UI primitives (alert,
native <input type="checkbox">, plain <label>, ad-hoc boxes). So even if functionality is good, interaction and visual
behavior feels unpolished and fragmented (different spacing rhythms, borders, control states, and feedback patterns in
the same screen).

Third root cause is interaction/feedback quality, not only color/style. The matrix now feels modern because it has
contextual actions, clear hierarchy, stronger selected/edit states, and integrated side panels. Combo/Create still
relies on blocking alerts, debug logs, and linear form blocks with little information hierarchy. That makes flows feel
older and heavier even when they are functionally complete.

What to ask future agents next week: (1) “Create a shared UI refresh spec from the new matrix segmented style (tokens:
spacing, radius, borders, elevation, action states).” (2) “Refactor page-by-page without logic changes: replace native
controls/alerts with wrapped components + non-blocking feedback (toast/inline).” (3) “Apply the same shell pattern used
in matrix: segmented header, grouped action bars, contextual side panels only when needed.” (4) “Run a UX consistency
audit per page (Create Combo first): typography scale, spacing rhythm, control states, overflow/no-horizontal-scroll,
and accessibility contrast.”