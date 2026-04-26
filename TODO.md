7. Medición automática de dificultad de combos
   Construir una métrica de dificultad basada en ventanas objetivas del juego.
   Usar datos como ventanas de cancel, links y buffer para estimar qué partes son fáciles y cuáles exigentes.
   Considerar que la dificultad global del combo depende especialmente de su ventana más estricta.
   Hacer que los delays influyan correctamente, ya que son de las partes más execution-heavy del juego.
   Distinguir entre combos fáciles, medios y muy difíciles para poder filtrar y recomendar mejor.
   Usar esta dificultad como pieza central para adaptar resultados a usuarios con distintas manos/nivel.
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
