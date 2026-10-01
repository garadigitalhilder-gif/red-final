# Detectives del Texto

Base en React y JavaScript, Vite, HashRouter y CSS Modules. Contenido pedagógico en src/data/casos.json y textos de navegación y presentación en src/data/interfaz.json.

casos.json es un arreglo de cuatro casos completos importados del archivo proporcionado: El rastro de las ideas, El sospechoso oculto, ¿Quién miente? y El veredicto final. Cada caso incluye cinco preguntas (100 puntos); el juego suma 400 puntos. Se conservan sus textos, introducciones, créditos, licencias y retroalimentación. La versión previa del caso 1 se conserva en src/data/archivo/caso1-original.json.

Las opciones usan objetos con id y texto; respuestaCorrecta referencia el id de la opción. Cada pregunta incluye una pista específica y el caso incluye pistas generales. Las preguntas abiertas futuras requerirán una rúbrica, sin evaluación por coincidencia literal.

## Creación en una carpeta vacía (PowerShell)

```powershell
Set-Location 'C:\Users\Mega-Ventas\Desktop\RED-FINAL'
npm create vite@latest . -- --template react --no-interactive
npm install react-router-dom scorm-again
New-Item -ItemType Directory -Force -Path src/data, src/components, src/pages, src/scorm, src/hooks, src/styles
```

Los archivos personalizados del repositorio completan la plantilla.

## Proyecto existente

```powershell
npm ci
npm run dev
```

## Verificación

```powershell
npm run lint
npm test
npm run build
npm run preview
```

Salida: dist/ con base relativa. Rutas: #/, #/briefing, #/caso/1, #/veredicto, #/resultados.

La portada, briefing, los cuatro casos, veredicto y resultados están conectados al juego. El servicio SCORM 1.2 está integrado con useJuego, con detección de LMS y persistencia web. index.html incluye Dublin Core y public/imsmanifest.xml incluye metadatos LOM; el build completa automáticamente la lista de archivos del recurso en dist/imsmanifest.xml. El ZIP de distribución y la validación en LMS real quedan pendientes. Consulta docs/scorm.md para probar la integración y docs/metadatos.md para completar la autoría. Se incluyen HTML semántico, foco visible y salto al contenido; la conformidad WCAG requiere verificar el recurso completo.

## Componentes del juego

Cada componente tiene su CSS Module en src/components. Pregunta recibe pregunta, onResponder y respuestaGuardada; evaluarAbierta es un evaluador opcional basado en rúbrica. Pista recibe pista, costo, onDescontar, revelada y disabled. BarraProgreso recibe casoCompletadas, casoTotal, juegoCompletadas y juegoTotal. Insignia recibe nivel (aprendiz, detective o inspector). TextoCaso recibe texto. Marcador recibe puntos y maximo opcional.

El estado compartido vive en useJuego y se guarda automáticamente en localStorage bajo detectives-del-texto:juego:v1. Lectura, escritura y borrado usan try/catch; si el almacenamiento está bloqueado, se juega en memoria y se muestra un aviso. Al recuperar el progreso se validan las respuestas y se recalculan los puntos, los casos completados y las insignias.

La primera respuesta enviada cuenta una sola vez. Cada pista descuenta 5 puntos una sola vez. Los descuentos se registran incluso con saldo cero; cada caso tiene un mínimo de cero puntos. Para desbloquear el siguiente caso hay que terminar todas las preguntas y alcanzar el 70% del puntaje máximo de ese caso, después de las pistas. No se redondea el porcentaje para decidir el desbloqueo y una URL directa respeta la restricción. Los casos vacíos no se pueden jugar ni completar.

Las insignias se entregan al terminar todas las preguntas evaluadas, independientemente del umbral para avanzar. El catálogo incluye la definición de cada insignia: Aprendiz (caso 1), Detective (caso 2), Inspector (caso 3) y Maestro del Veredicto (caso 4). Cada insignia ganada se identifica por caso y nivel.

La pregunta abierta del caso 4 exige de 80 a 120 palabras y una autoevaluación explícita de los cuatro criterios de su rúbrica. Cada criterio cumplido suma 5 puntos, hasta 20. Se identifica como autoevaluación, sin afirmar que el sistema compruebe automáticamente la calidad de los argumentos. La respuesta y los criterios se guardan; los puntos se recalculan al recuperar la sesión. Las preguntas abiertas sin rúbrica siguen pendientes de valoración.

## Recorrido e identidad visual

Inicio presenta la historia de la Agencia Literaria y el botón Comenzar caso. Briefing incluye instrucciones y un diagnóstico de dos preguntas que no modifica el puntaje. Caso organiza la lectura y las preguntas en dos columnas desde 1000 px y las apila en pantallas más pequeñas.

Veredicto presenta una pregunta abierta con autoevaluación y acceso al texto de referencia. Los casos 1–3 guardan esta reflexión en veredictos sin modificar el puntaje ni el desbloqueo; el caso 4 conserva sus 20 puntos y requiere esta respuesta para completar el nivel. Resultados presenta puntos, insignias, balance final, respuestas y reflexiones guardadas. La navegación común ofrece menú de niveles, enlace Volver y progreso del caso y del juego.

La paleta usa azul oscuro, crema y ámbar, con texto de contraste superior a 4.5:1. Las fuentes son locales para funcionar sin servicios externos. El contenido pedagógico añadido (historia, diagnóstico, preguntas abiertas y balance final) permanece en casos.json.

Para revisar el diseño en Microsoft Edge con Playwright y axe-core, deja npm run dev en el puerto 5173 y ejecuta npm run test:ui. El script recorre cinco páginas a 320, 390 y 1280 px; comprueba accesibilidad automática, desbordamiento, distribución responsive y salto al contenido. Guarda capturas y un reporte en artifacts/ui. Consulta docs/accesibilidad.md para los límites de la revisión.

useJuego expone casoActual, caso, respuestas, puntaje (alias puntos), pistasUsadas, casosCompletados, insigniasGanadas, resumenes, estaDesbloqueado, seleccionarCaso, responder, descontar, reintentarCaso y reiniciarJuego. Reintentar limpia el caso y los posteriores, revocando sus insignias y permisos; reiniciar limpia todo y vuelve al primer caso. Ambas acciones están disponibles en las páginas correspondientes y explican el borrado antes del botón.

Los controles nativos admiten Tab, flechas y Espacio para opciones; Enter o Espacio para botones. La retroalimentación y las pistas se anuncian con aria-live. El resultado usa texto y símbolos además del color. Las pruebas verifican interacción en DOM simulado; hace falta revisar visualmente y con lectores de pantalla en navegadores reales para una auditoría WCAG completa.
