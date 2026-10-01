# Accesibilidad de las páginas

Se utiliza HTML semántico, controles nativos por teclado, leyendas para grupos de opciones, foco visible y regiones aria-live para retroalimentación. El menú muestra estados por escrito, además de símbolos y color. El enlace Volver usa destinos explícitos y el foco pasa al contenido al cambiar de ruta. La tabla de resultados tiene una región desplazable accesible por teclado.

## Contraste

Valores calculados con la fórmula de luminancia relativa de WCAG:

| Texto / fondo | Colores | Contraste |
| --- | --- | --- |
| Azul / crema | #172b45 / #f5f1e8 | 12.69:1 |
| Texto secundario / crema | #4d5b6b / #f5f1e8 | 6.16:1 |
| Ámbar oscuro / crema | #82501d / #f5f1e8 | 5.98:1 |
| Ámbar claro / azul | #e7b65e / #172b45 | 7.66:1 |
| Blanco / botón registrado | #ffffff / #526165 | 6.45:1 |

Referencia: [WCAG 2.1, contraste mínimo](https://www.w3.org/WAI/WCAG21/Understanding/contrast-minimum.html). La paleta supera 4.5:1 para el texto en estas combinaciones.

## Verificación

Las pruebas de componentes y navegación incluyen respuestas, rúbricas, diagnóstico sin puntuación, almacenamiento, permisos y reinicio. `npm run test:ui` usa Microsoft Edge y axe-core para inspeccionar ocho vistas a 320, 390 y 1280 px, con texto al 100 % y 200 %: 48 combinaciones. Comprueba desbordamiento horizontal, contraste y otras reglas WCAG automáticas, texto/preguntas apilados o en columnas y salto al contenido con teclado. También revisa un juego nuevo: errores, selección con flechas, envío y revelado de pistas con teclado, espaciado de texto y preferencia de movimiento reducido. El informe se guarda en `artifacts/ui/reporte.json`.

El aumento automático modifica el tamaño de fuente raíz. Se debe complementar con el zoom real del navegador al 200 %: no se utiliza la escala de píxeles del dispositivo como sustituto del zoom.

El diagnóstico no afecta la evaluación del juego. Las rúbricas de respuestas abiertas se identifican como autoevaluación. Los resultados combinan mensajes y símbolos; el color nunca es la única indicación.

La revisión automatizada no constituye una certificación de conformidad. Sigue pendiente probar con lectores de pantalla reales y usuarios, incluyendo la claridad de los anuncios y toda la interacción del recurso.

## Correcciones de esta revisión

- Las insignias del informe usan h3 debajo de su sección h2; cada página conserva un h1.
- El título de la pestaña identifica la vista y el foco pasa al h1 al navegar. Saltar al contenido conserva el foco en main sin interferir con HashRouter.
- Los errores identifican los controles con aria-invalid y aria-describedby; el foco llega a la primera respuesta o criterio pendiente. Los mensajes se limpian al corregir y especifican el rango de palabras.
- Las instrucciones y el contador de palabras se asocian a la respuesta abierta. Tras enviarla, queda de solo lectura, accesible para recorrer y copiar con teclado.
- El nombre accesible de cada nivel incluye su estado. Las respuestas, pistas y el marcador mantienen anuncios y señales textuales además del color.
- El texto largo puede ajustarse en la marca, los niveles y las insignias. El sello escala con rem; los números decorativos no se parten al ampliar.
- Los colores forzados del sistema conservan indicadores de foco, botones y nivel activo; se conserva prefers-reduced-motion.
- El simulador SCORM incluye main, enlace de salto y regiones de registros desplazables por teclado.
- No se renderizan imágenes informativas actualmente: los símbolos decorativos usan aria-hidden. Si se incorporan imágenes, las informativas necesitan alt equivalente y las decorativas alt="".

Los bordes de respuesta y textarea (#84918e sobre #fffdf8) tienen contraste 3.22:1; el contorno de opciones enfocadas (#986020) tiene 5.13:1. Las combinaciones de texto de la tabla anterior superan 4.5:1.

## Lista de verificación manual

Iniciar con `npm run dev`. Probar tanto sin progreso como después de terminar los cuatro casos.

- [ ] Recargar Inicio, pulsar Tab: aparece «Saltar al contenido»; Enter lleva a main. El enlace no cambia la ruta.
- [ ] Recorrer todas las vistas con Tab y Shift+Tab: orden lógico, foco visible, sin bloqueos ni elementos superpuestos. Cada navegación anuncia el nuevo encabezado y cambia el título de la pestaña.
- [ ] En opciones y rúbricas, usar flechas y Espacio; enviar y revelar pistas con Enter. Cada respuesta y descuento se registra una sola vez.
- [ ] Enviar una pregunta vacía: se anuncia el error y el foco pasa al control. Escribir fuera del rango de palabras o dejar un criterio sin marcar: se indica cómo corregirlo.
- [ ] Con NVDA y Firefox/Chrome, o VoiceOver y Safari, revisar landmarks, encabezados, leyendas, etiquetas, progreso y estados de los niveles. Las insignias pertenecen a su sección.
- [ ] Con ese lector, responder y revelar una pista: se anuncian retroalimentación y puntaje sin requerir cambiar el foco. Revisar también diagnóstico, reinicio, guardado bloqueado y finalización en LMS.
- [ ] Después de enviar una respuesta abierta, recorrer y copiar su texto con teclado; no permite editarla ni duplicar puntos.
- [ ] Usar zoom real del navegador al 200 % en todas las vistas: texto y controles visibles, sin pérdida de contenido ni funcionalidad. Revisar también fuente ampliada desde los ajustes del navegador.
- [ ] En ancho de 320 px, comprobar reflujo y lectura sin desplazamiento horizontal general. La tabla puede desplazarse en su propia región con teclado.
- [ ] Aplicar interlineado 1.5, espaciado entre letras .12em, palabras .16em y párrafos 2em: no hay recortes, superposición ni botones inaccesibles.
- [ ] Activar «reducir movimiento» en el sistema y recargar; activar alto contraste/colores forzados y comprobar foco, opciones marcadas y controles.
- [ ] Comprobar mensajes en escala de grises: se distinguen por texto/símbolos. Si se añaden imágenes, verificar sus alternativas con el lector y con imágenes desactivadas.
- [ ] Repetir el recorrido dentro de un LMS SCORM, comprobando título del iframe, acceso al recurso y regreso al entorno del LMS sin trampas de teclado.

Referencias: [ampliación de texto al 200 %](https://www.w3.org/WAI/WCAG21/Understanding/resize-text.html), [reflujo](https://www.w3.org/WAI/WCAG21/Understanding/reflow.html) y [identificación de errores](https://www.w3.org/WAI/WCAG21/Understanding/error-identification.html).
