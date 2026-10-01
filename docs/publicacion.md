# Empaquetado y publicación

## Generar el paquete SCORM 1.2

Desde la carpeta del proyecto, con Node.js 24 y el package-lock.json existente:

```powershell
npm ci
npm run build:scorm
```

El script de package.json es:

```json
"build:scorm": "npm run build && node scripts/empaquetar-scorm.mjs"
```

Durante el build, Vite copia `public/imsmanifest.xml` a `dist/`; el plugin `scormManifestPlugin.js` completa la copia con los archivos finales de Vite. El empaquetador usa fflate, ya instalado, y comprueba que los archivos declarados existen, que no faltan declaraciones y que el ZIP conserva exactamente los bytes de dist/. Esto comprueba integridad y estructura, no certifica la conformidad de todos los metadatos XML.

Salida: `paquetes/detectives-del-texto-scorm12.zip`. La carpeta paquetes queda excluida de Git y del sitio público. Cada ejecución reemplaza el ZIP anterior. Su estructura comienza así, sin carpeta dist/ contenedora:

```text
imsmanifest.xml
index.html
assets/...
```

Antes de entregar, sustituye `[COMPLETAR]` en `index.html` y `public/imsmanifest.xml` por los integrantes y la institución, y vuelve a ejecutar el comando. El manifest fuente se conserva editable.

Para revisar el build con servidor HTTP:

```powershell
npm run preview -- --host 0.0.0.0
```

Abre la dirección que muestra Vite. Para probar desde el celular en la misma red, usa la IP local del computador y el puerto mostrado (normalmente 4173). Puede ser necesario permitir el acceso de red en el firewall. La versión desplegada también sirve para esta prueba.

## SCORM Cloud

1. Entra en tu cuenta administrativa de SCORM Cloud.
2. Pulsa **Add Content**, elige **Import a SCORM, AICC, xAPI or cmi5 package**, selecciona el ZIP generado y pulsa **Import Course**.
3. Revisa el resultado de importación: se debe reconocer SCORM 1.2, con un SCO y lanzamiento de index.html. Investiga los errores o advertencias antes de distribuir.
4. Desde el curso, ábrelo en **Sandbox**; no reinicies los datos del intento entre las pruebas de reanudación. Permite la ventana de lanzamiento si el navegador la bloquea.
5. Responde la primera pregunta correctamente, sin pista: el registro SCORM debe mostrar score.raw 5, score.min 0, score.max 100, lesson_status incomplete, lesson_location /caso/1 y suspend_data no vacío. Son 20 puntos sobre 400, enviados como porcentaje.
6. Consulta una pista pendiente: su costo es 5 puntos de juego, equivalentes a 1.25 puntos porcentuales. Cierra con «Guardar y finalizar sesión» en Resultados y revisa **Debug Logs**: debe haber commit antes de finish, sin errores de API.
7. Reabre el mismo intento: recupera respuestas, pistas y caso actual. No uses un intento nuevo para comprobar reanudación.
8. Completa los cuatro casos con al menos 70 % neto en cada uno; comprueba passed y el porcentaje acumulado correcto. El caso 4 incluye autoevaluación; el puntaje no representa una corrección automática del escrito.
9. Repite la importación y estas pruebas en el LMS definitivo.

El acceso administrativo a SCORM Cloud necesita cuenta; el juego publicado en la web no requiere cuenta de estudiante. Referencia: [importación, Sandbox y registros de SCORM Cloud](https://cloud.scorm.com/docs/user-guide/getting-started/).

## Sitio web público

La persona que despliega necesita una cuenta de la plataforma; quienes abren el enlace del juego no necesitan iniciar sesión. El progreso web se conserva en el navegador cuando localStorage está disponible; el seguimiento SCORM sucede al lanzar el ZIP desde un LMS.

### Vercel

1. Sube el proyecto a un repositorio Git y, en Vercel, crea un proyecto importándolo.
2. Selecciona **Vite**, con raíz en la carpeta que contiene package.json. Usa build `npm run build`, salida `dist` y Node.js 24.x. El archivo `vercel.json` ya declara framework, comando y salida.
3. Despliega y copia el dominio de producción que asigna Vercel, con forma `https://<nombre>.vercel.app`; el dominio exacto depende de la disponibilidad.
4. En **Deployment Protection** del proyecto, comprueba que el dominio de producción no exige Vercel Authentication ni contraseña; para hacer todos los despliegues públicos, selecciona **None**. Si una política del equipo impide cambiarlo, el administrador debe ajustarla.
5. Abre el dominio de producción en incógnito y una ruta como `/#/caso/1`. HashRouter conserva sus rutas en el fragmento y no necesita reglas de reescritura SPA.

Referencias: [Vite en Vercel](https://vercel.com/docs/frameworks/frontend/vite), [protección de despliegues](https://vercel.com/docs/deployment-protection).

### Netlify

1. Importa el repositorio Git como un proyecto de Netlify.
2. Usa build `npm run build`, directorio publicado `dist` y Node.js 24. `netlify.toml` ya contiene esa configuración.
3. Despliega y copia el dominio asignado, con forma `https://<nombre>.netlify.app`.
4. Comprueba que el acceso del sitio de producción no tenga contraseña ni restricciones de autenticación. Valídalo abriendo el dominio en incógnito.
5. Como alternativa sin repositorio: ejecuta `npm run build` y carga la carpeta `dist` mediante el despliegue manual de Netlify; para actualizar, genera y carga nuevamente la carpeta. No cargues el ZIP SCORM como sitio web.

Referencias: [Vite en Netlify](https://docs.netlify.com/build/frameworks/framework-setup-guides/vite/), [despliegues manuales](https://docs.netlify.com/deploy/create-deploys/).

## Lista de verificación final

- [ ] Los nombres del grupo y la institución sustituyen todos los `[COMPLETAR]` antes de la entrega.
- [ ] `npm ci`, `npm test`, `npm run lint` y `npm run build:scorm` terminan correctamente.
- [ ] Al inspeccionar el ZIP, index.html e imsmanifest.xml aparecen directamente en la raíz; no hay carpeta dist/ exterior.
- [ ] El enlace de producción abre en incógnito sin login, contraseña ni solicitud de acceso.
- [ ] Desde una ruta `/#/caso/1`, recargar conserva la navegación y carga los recursos sin errores.
- [ ] En celular se puede leer, responder, revelar pistas, redactar el veredicto y consultar resultados, sin desbordamiento general.
- [ ] Con teclado funcionan salto al contenido, navegación, respuestas y rúbricas; al 200 % el recurso sigue usable. Completar también la lista de accesibilidad.
- [ ] En modo web normal, responder y recargar conserva el progreso cuando el almacenamiento está habilitado; se puede reiniciar. No se espera compartir progreso entre dispositivos.
- [ ] SCORM Cloud importa el ZIP y permite lanzarlo sin errores; los registros muestran score, estado, ubicación y suspend_data coherentes.
- [ ] Cerrar y reabrir el mismo intento LMS recupera el progreso; completar los cuatro casos registra passed y el puntaje correcto.
- [ ] El ZIP también se importa, abre y reanuda correctamente en el LMS de destino.
- [ ] Se entrega el enlace público de producción junto al ZIP, indicando plataforma, fecha y resultado de la prueba LMS.

El ZIP ha sido comprobado localmente. La importación real en SCORM Cloud y la publicación requieren realizarlas en las cuentas del responsable; no se han ejecutado desde este proyecto.
