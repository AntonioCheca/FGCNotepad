1. Perfil de usuario: conocimiento de combos
   Permitir que cada usuario tenga una librería de combos que “ya sabe hacer”.
   Crear una UI para añadir y quitar combos de esa librería de forma cómoda.
   Guardar esa relación usuario-combo como base para recomendaciones personalizadas.
   Añadir un booleano o modo de perfil tipo “asume que me sé todos los combos”.
   Hacer que ese modo avanzado no moleste a jugadores expertos que no quieren gestionar listas manuales.
   Preparar el perfil para que luego influya en búsquedas, recomendaciones y lectura de escenarios según nivel real del
   jugador.
2. Recomendador de siguiente combo a aprender
   Crear una página o módulo que recomiende el próximo combo más rentable para ese usuario.
   Calcular la mejora de expected value que obtiene el usuario si aprende cada combo candidato.
   Hacer la simulación sobre todos los escenarios existentes comparando “con combo” vs “sin combo”.
   Priorizar combos no solo por ganancia teórica, sino por el contexto del jugador y lo que ya sabe hacer.
   Presentar la recomendación de forma clara: qué combo aprender, cuánto mejora y en qué escenarios se nota.
   Diseñar esto pensando especialmente en jugadores de oro, platino y diamante, que son quienes más valor van a sacar.
3. Performance del recomendador con aproximaciones
   Evitar recalcular equilibrio completo de Nash para cada combo y cada escenario si no hace falta.
   Introducir una aproximación en la que se mantengan fijas las probabilidades ya resueltas del escenario.
   Recalcular el expected value usando esas probabilidades fijas cuando el cambio del combo sea pequeño o razonable.
   Validar esta “trampa” con pruebas reales para comprobar si el error es aceptable.
   Diseñar la lógica para que el cálculo pase a ser una agregación rápida de matrices en vez de una resolución completa.
   Dejar abierta la puerta a recalcular exacto solo en casos especiales donde la aproximación falle demasiado.
4. Importación masiva de combos y fixtures
   Diseñar un sistema de fixtures para combos que sobreviva bien a migraciones y cambios de modelo.
   Permitir cargar combos en bloque desde fuentes externas sin tener que meterlos a mano.
   Preparar comandos que transformen formatos distintos al modelo interno de la aplicación.
   Soportar varias fuentes con formatos diferentes, por ejemplo hojas, CSVs o estructuras copiadas de comunidades.
   Aceptar que parte de los datos importados puede venir incompleta, anticuada o imperfecta, y manejarlo con tolerancia.
   Hacer que añadir un personaje nuevo en el futuro sea repetir el proceso de carga, no rehacer el trabajo desde cero.
5. Validación comunitaria / flagging de datos incorrectos
   Permitir que usuarios marquen contenido como potencialmente incorrecto.
   Soportar al menos combos y escenarios como tipos de contenido flagueable.
   Guardar junto al flag un texto libre donde el usuario explique qué cree que está mal.
   Diseñar el flujo pensando en precisión y confianza: la comunidad tiene que poder señalar fallos rápido.
   Hacer una versión básica primero, suficiente para detectar errores de daño, enlaces o datos mal modelados.
   Preparar esto como una capa de calidad antes del alfa, aunque todavía no exista una moderación compleja.
6. Soporte de delays en las secuencias de combo
   Ampliar el modelo de links entre movimientos para soportar delays, no solo link, cancel o chain.
   Permitir que un delay tenga valor numérico asociado en frames.
   Soportar también ventanas de delay con mínimo y máximo, no solo un valor fijo.
   Reflejar ese delay tanto en el creador de combos como en la representación interna del combo.
   Tener en cuenta que estos casos aparecen en combos avanzados y no son una rareza marginal.
   Dejar preparado el modelo para que luego esos delays alimenten el cálculo de dificultad.
7. Medición automática de dificultad de combos
   Construir una métrica de dificultad basada en ventanas objetivas del juego.
   Usar datos como ventanas de cancel, links y buffer para estimar qué partes son fáciles y cuáles exigentes.
   Considerar que la dificultad global del combo depende especialmente de su ventana más estricta.
   Hacer que los delays influyan correctamente, ya que son de las partes más execution-heavy del juego.
   Distinguir entre combos fáciles, medios y muy difíciles para poder filtrar y recomendar mejor.
   Usar esta dificultad como pieza central para adaptar resultados a usuarios con distintas manos/nivel.
8. Delays incompletos y dificultad “todavía no verificada”
   Permitir que un usuario introduzca que un delay conocido funciona, aunque no sepa aún toda la ventana exacta.
   Guardar esos casos como información parcialmente verificada en vez de bloquear la creación del combo.
   Marcar automáticamente que la dificultad del combo no es definitiva si falta el rango real del delay.
   Hacer visible qué combos o tramos todavía necesitan revisión técnica más precisa.
   Favorecer que usuarios muy detallistas puedan completar esa información después.
   Separar claramente “combo usable” de “combo totalmente auditado” para no frenar la contribución.
9. Búsqueda y filtrado por dificultad / habilidad del usuario
   Permitir que un usuario pida combos acordes a su nivel de ejecución real.
   Hacer que búsquedas y recomendaciones entiendan qué significa “fácil, fácil, fácil”.
   Favorecer resultados con menos links duros y más cadenas o cancels cuando el usuario tenga menor nivel.
   Usar la dificultad medida del combo como filtro principal en exploración y aprendizaje.
   Conectar este sistema con el perfil del jugador y con la librería de combos que ya conoce.
   Conseguir que la experiencia funcione tanto para gente novata como para jugadores muy avanzados.
10. Sistema de capas en escenarios
    Añadir a los escenarios el concepto de capas de conocimiento/ejecución del juego.
    Hacer que un escenario pueda representar desde opciones básicas hasta respuestas avanzadas.
    Permitir clasificar movimientos u opciones como pertenecientes a capa 1, 2, 3, etc.
    Reflejar que al subir de capa cambian tanto las opciones disponibles como sus valores prácticos.
    Diseñar esto pensando en cómo lo explican jugadores expertos: capa básica, capa intermedia y capa avanzada.
    Conseguir que el sistema sirva para enseñar mejor a la mayoría sin perder profundidad competitiva.
11. Diseño de edición y visualización de capas
    Decidir si las capas son obligatorias en todos los escenarios o un recurso opcional.
    Evaluar un modelo donde el creador haga una sola matriz grande y etiquete filas/columnas por capa.
    Evitar obligar al creador a construir varias matrices casi repetidas para el mismo escenario.
    Hacer que el visor permita filtrar o mostrar solo hasta cierta capa según el tipo de usuario.
    Optimizar la lectura para que la mayoría vea primero la capa 1 sin ruido innecesario.
    Mantener acceso completo para usuarios expertos que sí quieren estudiar capas altas todo el tiempo.
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