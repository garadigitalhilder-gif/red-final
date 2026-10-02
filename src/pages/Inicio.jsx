import ImagenRecurso from '../components/ImagenRecurso.jsx'
import { Link } from 'react-router-dom'
import datos from '../data/interfaz.json'
import styles from './Pages.module.css'

export default function Inicio({ juego }) {
  const inicio = datos.inicio
  const historia = juego.catalogo[0]?.historia ?? { etiqueta: inicio.etiqueta, titulo: juego.configuracion.titulo, contenido: inicio.descripcion, cierre: inicio.nota }
  return <div className={styles.hero}>
    <section><ImagenRecurso imagen={juego.portada} titulo="Portada" /><p className={styles.eyebrow}>{historia.etiqueta}</p><h1 className={styles.title}>{historia.titulo}</h1>
      <p className={styles.description}>{historia.contenido}</p>
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
