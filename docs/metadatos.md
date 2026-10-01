# Metadatos del recurso

index.html incluye los trece campos Dublin Core solicitados: title, creator, subject, description, publisher, date, type, format, identifier, source, language, rights y coverage. El idioma es es; la fecha inicial es 2026-10-01 y el identificador estable es urn:detectives-del-texto:grado-11:v1.

Sustituye los marcadores [COMPLETAR] en ambos archivos:

- index.html: integrantes del grupo (DC.creator), grupo e institución (DC.publisher) y grupo titular de la autoría (DC.rights).
- public/imsmanifest.xml: nombres e institución dentro de las contribuciones del ciclo de vida y nombre del grupo en la descripción de derechos.

Los textos de los casos ya declaran CC BY-NC-SA 4.0. Los metadatos remiten a las licencias de cada contenido y preservan las de las dependencias; no asignan una licencia global nueva al código.

## Manifiesto

El manifiesto usa SCORM 1.2, una organización, un ítem y un recurso SCO con entrada index.html. Las cuatro etapas y sus casos permanecen dentro de una única aplicación con HashRouter. La puntuación de dominio del ítem es 70, coherente con la escala 0–100 enviada al LMS.

El bloque LOM utiliza la [vinculación XML IMS Metadata 1.2.1](https://www.imsglobal.org/metadata/imsmdv1p2p1/imsmd_bindv1p2p1.html), con sus etiquetas en minúsculas y vocabularios correspondientes. Describe título, idioma, descripción, palabras clave, cobertura, autoría, formato y aspectos educativos:

| Aspecto | Valor |
| --- | --- |
| Nivel | Educación media, grado 11, Colombia |
| Contexto | Secondary Education |
| Destinatario | Learner: estudiante |
| Edad típica | 16–18 años |
| Tiempo típico | PT2H: 2 horas |
| Dificultad | medium: media |
| Interactividad | Active: activa |

## Compilación

Edita la plantilla en public/imsmanifest.xml. Al ejecutar npm run build, Vite copia ese archivo a dist/ y scripts/scormManifestPlugin.js agrega la lista de archivos finales, incluidos JavaScript y CSS con los nombres que genera Vite. La plantilla mantiene el marcador ARCHIVOS_GENERADOS; no es necesario editar manualmente los nombres de los bundles.

Se comprobó que los XML pueden analizarse, que la organización referencia el recurso, que la entrada es index.html y que todos los archivos declarados en el manifiesto compilado existen. Esta comprobación no equivale a una validación completa contra XSD ni a una certificación en un LMS real.
