import ImagenRecurso from '../components/ImagenRecurso.jsx'
import { Link } from 'react-router-dom'
import datos from '../data/interfaz.json'
import styles from './Pages.module.css'

export default function Inicio({ juego }) {
  const inicio = datos.inicio
  const metadato = nombre => document.querySelector(`meta[name="DC.${nombre}"]`)?.content ?? ''
  const autor = metadato('creator').replace(/\s+— nombres de los integrantes del grupo$/u, '') || inicio.presentacion.autor
  const grupo = metadato('publisher').replace(/\s+— nombre del grupo y de la institución educativa$/u, '') || inicio.presentacion.grupo
  const detalles = [
    ['Recurso', metadato('title')],
    ['Descripción', metadato('description')],
    ['Área y temas', metadato('subject')],
    ['Destinatarios', metadato('coverage')],
    ['Fecha', metadato('date')],
    ['Licencia', metadato('rights')]
  ].filter(([, valor]) => valor)
  const historia = juego.catalogo[0]?.historia ?? { etiqueta: inicio.etiqueta, titulo: juego.configuracion.titulo, contenido: inicio.descripcion, cierre: inicio.nota }
  return <div className={styles.hero}>
    <section><ImagenRecurso imagen={juego.portada} titulo="Portada" /><p className={styles.eyebrow}>{historia.etiqueta}</p><h1 className={styles.title}>{historia.titulo}</h1>
      <p className={styles.description}>{historia.contenido}</p>
      <section className={styles.presentacion} aria-labelledby="presentacion-grupo">
        <h2 id="presentacion-grupo">{inicio.presentacion.titulo}</h2>
        <dl>
          <div><dt>Grupo</dt><dd>{grupo}</dd></div>
          <div><dt>Autor</dt><dd>{autor}</dd></div>
          {detalles.map(([etiqueta, valor]) => <div key={etiqueta}><dt>{etiqueta}</dt><dd>{valor}</dd></div>)}
        </dl>
      </section>
      <Link className={styles.button} to="/briefing">{inicio.accion}<span aria-hidden="true"> →</span></Link>
      <p className={styles.note}>{historia.cierre}</p>
    </section>
    <section className={styles.dossier} aria-labelledby="mision">
      <p className={styles.eyebrow}>{inicio.expediente}</p><h2 id="mision">{inicio.mision}</h2>
      <div className={styles.sello} aria-hidden="true"><span>DT</span><small>ARCHIVO<br />011</small></div>
      <ol className={styles.steps}>{inicio.pasos.map((paso, index) => <li key={paso.titulo}>
        <span className={styles.number} aria-hidden="true">0{index + 1}</span><div><h3>{paso.titulo}</h3><p>{paso.descripcion}</p></div>
      </li>)}</ol>
    </section>
  </div>
}
