# Servicio SCORM 1.2

scormService.js exporta iniciar(), guardarProgreso(progreso, opciones), guardarPuntaje(puntos, minimo, maximo) y finalizar(). Todas las funciones devuelven un objeto con ok, modo (lms o web), cerrada, error y almacenamientoDisponible. iniciar también devuelve progreso y ubicacion.

## Funcionamiento

El servicio busca window.API en la ventana actual y hasta 50 padres, detectando ciclos y capturando restricciones entre orígenes. No sobrescribe la API del LMS. LMSInitialize se ejecuta una sola vez por sesión y no se cierra la sesión durante el desmontaje de prueba de React StrictMode.

Con LMS, el servicio llama sus métodos SCORM. Sin LMS, usa Scorm12API de scorm-again como runtime local y conserva el estado en localStorage; no crea servidores ni envía datos a endpoints externos. La biblioteca proporciona un runtime, no un conector que automáticamente envíe datos a un LMS existente. Referencia: [scorm-again](https://github.com/jcputney/scorm-again).

El hook useJuego recupera primero el suspend_data del LMS y valida el estado. Si el LMS no tiene progreso, comienza un intento nuevo; no adopta automáticamente la partida web de otra persona. En modo web recupera localStorage. Cada cambio guarda y hace commit del progreso y del puntaje.

| Campo | Valor |
| --- | --- |
| cmi.core.lesson_status | incomplete mientras quedan preguntas; completed si se termina sin alcanzar todas las metas; passed si todos los casos terminan y alcanzan el 70% neto |
| cmi.core.score.raw | Porcentaje del puntaje total; 280/400 se envía como 70 |
| cmi.core.score.min / max | 0 / 100 |
| cmi.core.lesson_location | /caso/ seguido del identificador del caso actual |
| cmi.suspend_data | Estado compacto, comprimido con gzip y codificado como G1: seguido de Base64 |
| cmi.core.exit | suspend al cerrar incompleto; cadena vacía al cerrar terminado |

El estado comprimido conserva respuestas, rúbricas, pistas, caso actual y reflexiones. Los puntos y las insignias se recalculan. Se respetan los 4096 caracteres de suspend_data; si se supera ese límite, no se trunca ni se reemplaza el último dato válido del LMS, se informa el fallo y se conserva la copia local completa cuando está disponible.

El botón Guardar y finalizar sesión de Resultados hace el último guardado, LMSCommit y LMSFinish. pagehide también intenta cerrar; cuando la página entra en la caché de navegación, solo hace commit. Salir no marca como completada una partida pendiente. El cierre es idempotente. Después de LMSFinish hay que volver a abrir el recurso desde el LMS para iniciar otra sesión SCORM; los cambios posteriores de esa misma página no se envían a una sesión terminada.

## Probar en modo web

1. Ejecuta npm run dev y abre http://127.0.0.1:5173/.
2. Responde una pregunta, consulta una pista y recarga.
3. Comprueba que los datos se recuperan. En las herramientas del navegador, revisa detectives-del-texto:juego:v1 (estado completo) y detectives-del-texto:scorm:v1 (resumen SCORM).
4. Si bloqueas localStorage, el juego sigue funcionando en memoria y muestra el aviso de que no puede conservarse entre visitas.

## Probar con LMS simulado

1. Con el servidor Vite activo, abre http://127.0.0.1:5173/scorm-demo.html.
2. La ventana padre expone una API real de scorm-again y abre el juego en un iframe del mismo origen. El panel muestra las llamadas a la API y los valores guardados.
3. Responde correctamente una pregunta: raw debe ser 5 (20 de 400), status incomplete y suspend_data no vacío.
4. Recarga: en Briefing aparece Continuar investigación y la respuesta queda registrada. El simulador guarda sus datos con detectives:demo-lms.
5. Abre Resultados y pulsa Guardar y finalizar sesión. Comprueba LMSCommit antes de LMSFinish.
6. Para una prueba nueva, usa Borrar sesión de prueba y recargar en el simulador.

La página de simulación solo se sirve en desarrollo: no se importa en la aplicación ni entra en el build normal.

## Pruebas automáticas

```powershell
npm test
npm run build
npm run lint
# En otra terminal, con npm run dev activo:
npm run test:scorm
```

Las pruebas cubren detección en padres, restricciones de origen, inicialización idempotente, estados, score, compresión, recuperación, almacenamiento bloqueado, respuestas false y excepciones, límite de suspend_data, commit y finish. La prueba de navegador utiliza Microsoft Edge y el iframe del simulador.

## Probar en un LMS real

El servicio de ejecución, los metadatos Dublin Core y el manifiesto con LOM están implementados. Completa los nombres del grupo en index.html y public/imsmanifest.xml y ejecuta `npm run build:scorm`. Vite copia el manifest desde public/ a dist/ y el plugin declara los archivos finales. El empaquetador genera `paquetes/detectives-del-texto-scorm12.zip`, con index.html e imsmanifest.xml en la raíz, y comprueba su contenido al descomprimirlo en memoria. No sobrescribas el manifest generado con la plantilla: perderías la lista de archivos finales.

Consulta [publicación y lista final](publicacion.md) para SCORM Cloud, Vercel y Netlify. Comprueba guardado, reanudación y cierre en el LMS elegido. El contenido y la API deben ser accesibles entre ventanas; si son de distintos orígenes, esta búsqueda no puede saltarse las restricciones del navegador y será necesario un puente autorizado por el LMS.

No se ha validado aún en un LMS real ni se afirma conformidad del paquete completo.
