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

# Backlog Prioritizado — Pre-Alpha / Alpha Readiness

## Contexto

Se ha cerrado el bloque grande de refactor visual e identidad de producto. La aplicación ya transmite una imagen mucho
más profesional y coherente. El foco cambia ahora de “verse bien” a “ser publicable, usable, segura y matemáticamente
defendible”.

Este documento ordena las épicas pendientes por prioridad real de cara a una **alpha privada con testers**.

---

# PRIORIDAD P0 — Bloqueantes antes de Alpha

Estas tareas impactan directamente en credibilidad del producto, seguridad, legalidad o posibilidad real de testear.

---

# 2. Deploy privado para beta testers

## Objetivo

Publicar una versión real accesible por testers concretos sin abrir el producto al público general.

## Qué se busca validar

- Infraestructura real
- Costes reales
- Registro/login real
- Estabilidad
- Performance básica
- Feedback externo

## Requisitos

### Acceso restringido

Opciones válidas:

- Invitaciones por token con expiración
- Lista blanca de emails
- Cuentas creadas manualmente
- Registro cerrado con códigos

### Costes controlados

Infraestructura pensada para tráfico muy bajo.

Validar:

- Base de datos no sobredimensionada
- Recursos apagables o baratos
- Logs y monitoreo básico
- No sorpresas económicas

### Stack preferente

Explorar primero:

- AWS Lightsail
- AWS simplificado
- O alternativa equivalente simple

## Definition of Done

- Entorno online operativo
- Dominio o URL usable
- Acceso restringido funcionando
- Registro/login probado por terceros
- Métricas básicas visibles
- Coste mensual entendido y aceptable

---

# 4. Recursos en solver: valor de Drive y Super

## Objetivo

Que el sistema deje de valorar combos solo por daño bruto y empiece a considerar coste de recursos.

## Problema actual

2500 daño no siempre es mejor que 2000 daño si el primero consume recursos valiosos.

## Solución inicial

Modelo heurístico simple:

- 1 barra Drive = X valor
- 1 barra Super = Y valor

Y ajustar valores de celdas en base a coste/ganancia.

## Alcance Alpha

No hace falta perfección competitiva. Hace falta dejar de mentir.

## Definition of Done

- Fórmula inicial definida
- Solver usa coste de recursos
- Comparativas mejoran
- Configurable para iterar futuro

---

# 5. Combo + Oki encadenado en una misma celda

## Objetivo

Permitir que una celda sume:

- daño inmediato del combo
- expected value del knockdown posterior

## Problema actual

La celda soporta una cosa u otra, no ambas.

## Ejemplo

`c.MP confirm -> combo -> knockdown -> nuevo mix`

Debe valorarse como sistema completo.

## Definition of Done

- Modelo soporta valor estático + EV linkado
- UI permite configurarlo
- Solver lo interpreta correctamente

---

# 6. Validación del sistema de capas

## Objetivo

Detectar capas mal diseñadas que no aportan nada.

## Regla conceptual

Una capa nueva debe introducir opciones relevantes que cambien el equilibrio o mejoren decisiones anteriores.

No tiene sentido añadir movimientos que jamás se usan.

## Qué validar

- Opciones dominadas
- Capas vacías
- Capas redundantes
- Capas que no alteran solución

## Output esperado

Warnings claros al creador.

## Definition of Done

- Análisis automático disponible
- Mensajes entendibles
- Casos obvios detectados

---

# PRIORIDAD P2 — Alto valor de producto / post-alpha cercano

---

# 7. Recursividad de escenarios (throw loops, loops, estados cíclicos)

## Objetivo

Resolver escenarios que referencian otros escenarios, incluyendo autorreferencia.

## Solución prevista

Recursión truncada con profundidad configurable + justificación matemática del error.

## Valor

Esto diferencia mucho el producto de herramientas simples.

## Definition of Done

- Links recursivos estables
- Sin loops infinitos
- Profundidad configurable
- Resultados razonables
- Benchmarks aceptables

---

# 8. Modelado explícito de hit confirms

## Objetivo

Representar correctamente decisiones donde una acción cubre hit / block con followups distintos.

## Valor

Muy importante para enseñar a nuevos jugadores y modelar situaciones reales.

## Qué añadir

- Tipo de acción “hit confirm”
- UX clara
- Backend explícito
- Render entendible

## Definition of Done

- Feature usable
- Casos comunes modelables
- Menos error manual

---

# 9. Mejoras del modelo de combos (links con ventana, metadata técnica)

## Objetivo

Enriquecer el sistema para futuras features.

## Faltan datos como

- Ventana de link
- Confirm window
- Cancel timing
- Inputs especiales
- Longitud / memoria

Esto conecta directamente con dificultad automática.

## Definition of Done

- Modelo ampliado
- Compatible con datos actuales
- Preparado para scoring futuro

---

# PRIORIDAD P3 — Investigación / Iteración posterior

---

# 10. Sistema automático de dificultad de combos

## Objetivo

Medir dificultad real con criterios técnicos en vez de tags subjetivos.

## Por qué importa

Ayuda muchísimo a jugadores nuevos y evita etiquetas engañosas.

## Variables posibles

- Ventana mínima
- Hit confirm requerido
- Input motion requerido
- Velocidad de ejecución
- Número de pasos
- Cambios de ritmo
- Longitud
- Memoria
- Delay precision

## Nota estratégica

Es valioso, pero complejo. Mejor hacerlo cuando el modelo de datos ya soporte toda la información necesaria.

## Definition of Done futuro

- Fórmula defendible
- Explicable al usuario
- Etiquetas consistentes
- Mejor onboarding para novatos

---

# PRIORIDAD P4 — Comunicación pública / reputación

---

# 11. Estrategia pública sobre uso de IA

## Objetivo

Publicar con transparencia y minimizar mala interpretación.

## Enfoque recomendado

No convertirlo en tema principal, pero tampoco esconderlo.

## Recomendaciones

- Página “About”
- Explicar uso real: asistencia de desarrollo
- Aclarar que assets respetan licencias
- Resaltar valor del producto
- Hablar de metodología, no de drama cultural

## Muy importante

El producto debe hablar primero. La polémica no debe marcar el framing inicial.

## Definition of Done

- Mensaje breve preparado
- FAQ básica preparada
- Repo/documentación coherente

---

# Orden recomendado de ejecución semanal

## Sprint siguiente

1. Roles + moderación
2. Deploy privado beta
3. Limpieza fuerte código

## Sprint siguiente

4. Recursos en solver
5. Combo + Oki combinado
6. Validador de capas

## Sprint siguiente

7. Recursividad escenarios
8. Hit confirms
9. Mejoras modelo combos

## Después

10. Dificultad automática
11. Comunicación pública IA

---

# Resumen ejecutivo

Si mañana hubiera que enseñar algo a testers, lo imprescindible no es la feature más brillante. Es:

- Que sea seguro
- Que sea privado
- Que no haga el ridículo técnicamente
- Que los números importantes no engañen
- Que el contenido pueda moderarse

Eso es lo que convierte un prototipo en producto testeable.
