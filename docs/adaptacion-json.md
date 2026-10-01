# Adaptación al JSON nuevo

No se modificó `src/data/casos.json`: al comenzar seguía siendo el arreglo anterior. El archivo adjunto `casos-2.json` sí tenía juego, creditos y casos. La aplicación admite ambos formatos y usa el objeto nuevo cuando el responsable lo coloca en src/data/casos.json; el adaptador transforma datos solo en memoria.

El formato nuevo obtiene título, umbral e insignias de juego. Cada pregunta usa sus puntos o juego.puntosPorPregunta si faltan. Las insignias requieren aprobar su casoRequerido. El descuento único se configura en src/hooks/configuracion.js.

La abierta permite enviar el texto y después marcar criterios. El objetivo 80–120 palabras es orientativo; no califica el contenido ni bloquea el envío. La autoevaluación reemplaza el puntaje anterior, con tope en puntos. Se puede editar el texto y guardar los cambios. La primera selección de un criterio registra la autoevaluación, aunque se termine desmarcando todos y su resultado sea cero.

El progreso tiene versión 2 y firma del catálogo, que incluye ids, textos, opciones, reglas y costo de pistas. Una versión antigua, firma diferente o ids desconocidos reinician la partida. SCORM conserva firma, texto, criterios y si se registró la autoevaluación. Los puntos se recalculan al recuperar. Siguen los try/catch de localStorage y el límite de suspend_data.

## Archivos modificados o añadidos

| Archivo | Cambio |
| --- | --- |
| src/data/datosJuego.js | Objeto nuevo y compatibilidad en memoria con el arreglo anterior. |
| src/data/interfaz.json | Etiquetas, mensajes, instrucciones de respaldo y plantillas de umbral/costo. |
| src/hooks/configuracion.js | Única constante COSTO_PISTA. |
| src/hooks/juegoModelo.js | Firma/versionado, restauración defensiva, umbral y puntuación de rúbrica. |
| src/hooks/useJuego.js | Configuración del JSON, insignias al aprobar y abierta actualizable. |
| src/scorm/scormService.js | Firma y estado de autoevaluación en suspend_data; elimina máximo 400 predeterminado. |
| src/App.jsx | Ruta /creditos, datos en Inicio y catálogo opcional para pruebas. |
| src/components/Layout.jsx | Título del JSON y enlace a créditos en el pie. |
| src/components/TextoCaso.jsx | Año junto a los metadatos existentes. |
| src/components/TextoCaso.module.css | Conserva saltos de línea internos de los párrafos. |
| src/components/LecturaCaso.jsx | Aviso role=note, botón con foco, contexto y vocabulario con aria-expanded. |
| src/components/LecturaCaso.module.css | Estilos de aviso, contexto y vocabulario. |
| src/components/Pregunta.jsx | Tres tipos, contador y casillas editables con anuncios; validación por id. |
| src/components/Pregunta.module.css | Presentación de casillas. |
| src/components/Pista.jsx | Descuento compartido. |
| src/components/Insignia.jsx | Nombre y descripción de la insignia recibida. |
| src/pages/Inicio.jsx | Historia opcional y presentación de respaldo. |
| src/pages/Briefing.jsx | Instrucciones de respaldo, diagnóstico opcional y umbral dinámico. |
| src/pages/Caso.jsx | Catálogo compartido y lectura con los campos nuevos. |
| src/pages/Veredicto.jsx | Abierta en preguntas; admite casos sin veredicto adicional y usa metas dinámicas. |
| src/pages/Resultados.jsx | Balance de respaldo, estados configurables y enlace a créditos. |
| src/pages/Creditos.jsx | Autor, obra, año, publicación, fuente enlazada y licencia. |
| src/components/componentes.test.jsx | Tests de edición y ambos formatos. |
| src/data/casos.test.js | Catálogo leído mediante el adaptador. |
| src/hooks/useJuego.test.jsx | Insignias y progreso versionado. |
| src/hooks/formatoNuevo.test.jsx | Umbral exacto/variable, puntos, ids antiguos, rúbrica y recuperación LMS. |
| src/pages/juego.test.jsx | Casillas y campos antiguos opcionales. |
| scripts/verificar-ui.mjs | Nueve vistas y catálogo externo opcional sin sobrescribir archivos. |
| scripts/verificar-scorm.mjs | Ambos formatos y catálogo externo opcional. |
| scripts/verificar-catalogo.mjs | Recorrido completo del JSON nuevo sin modificar casos.json. |
| package.json | Comando test:catalogo; sin dependencias nuevas. |
| docs/adaptacion-json.md | Cambios y verificación manual. |
| docs/accesibilidad.md | Actualiza pruebas y edición de respuestas abiertas. |

## Comprobaciones

```powershell
npm test
npm run lint
npm run build
# Con npm run dev activo en otra terminal:
npm run test:catalogo -- "C:\ruta\casos-2.json"
npm run test:ui -- "C:\ruta\casos-2.json"
npm run test:scorm -- "C:\ruta\casos-2.json"
```

El catálogo externo sustituye únicamente el módulo JSON en el navegador de prueba. La aplicación publicada usa el archivo real src/data/casos.json.

## Lista manual

- [ ] Con el JSON nuevo en su ubicación, Inicio, Briefing, Resultados y /creditos abren sin errores por campos antiguos ausentes.
- [ ] Caso 1: advertencia antes del cuento; Tab y Enter activan «Entendido, continuar» y el foco llega al título.
- [ ] Cuatro casos: título, autor, año, fuente y licencia coinciden con el JSON. Párrafos, saltos de línea y […] se conservan.
- [ ] Vocabulario abre/cierra con teclado y aria-expanded coincide. El caso sin glosario no presenta un panel vacío.
- [ ] Caso 4: contexto sobre el texto, también en la referencia del veredicto.
- [ ] Opción múltiple y verdadero/falso: valida por id y anuncia feedback; no duplica puntos.
- [ ] Cada pista corresponde a su pregunta y se descuenta una sola vez.
- [ ] Un caso terminado con 60 puntos bloquea el siguiente y no entrega insignia. Cuatro aciertos y dos pistas antes de responder dejan exactamente 70 puntos netos: desbloquea y entrega insignia.
- [ ] Abierta: contador 80–120; antes de enviar no hay casillas, después aparecen los criterios con sus puntos.
- [ ] Marcar/desmarcar criterios sube/baja el puntaje, sin duplicarlo ni superar puntos. Editar y guardar sigue funcionando.
- [ ] Recargar recupera texto y casillas. Resultados identifica la autoevaluación y no clasifica el escrito como correcto/incorrecto.
- [ ] Cada insignia usa el nombre/descripcion del JSON y se otorga al aprobar su casoRequerido.
- [ ] Créditos abre desde pie y Resultados: obras, autores, años, publicaciones, fuentes y licencias coinciden. URL vacía no crea enlace vacío.
- [ ] Progreso de versión anterior o catálogo con ids diferentes reinicia sin errores.
- [ ] Con localStorage bloqueado se juega en memoria y aparece aviso. Probar también reanudación desde suspend_data en un LMS.
- [ ] Repetir en celular, con teclado y texto al 200 %; escuchar mensajes con NVDA o VoiceOver.
