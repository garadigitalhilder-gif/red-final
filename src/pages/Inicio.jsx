import { Link } from 'react-router-dom'
import datos from '../data/interfaz.json'
import styles from './Pages.module.css'
import casos from '../data/casos.json'

export default function Inicio() {
  const inicio = datos.inicio
  const historia = casos[0].historia
  return <div className={styles.hero}>
    <section><p className={styles.eyebrow}>{historia.etiqueta}</p><h1 className={styles.title}>{historia.titulo}</h1>
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
