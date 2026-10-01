import { Link, useParams } from 'react-router-dom'
import datos from '../data/interfaz.json'
import styles from './Pages.module.css'

// Pantalla base reutilizable para las etapas pendientes de desarrollar.
export default function Etapa({ etapa }) {
  const { id } = useParams()
  const contenido = datos.etapas[etapa]
  return <section className={styles.stage}>
    <p className={styles.eyebrow}>{datos.interfaz.nombre}</p>
    <h1>{contenido.titulo}{etapa === 'caso' ? ' #' + id : ''}</h1>
    <p className={styles.description}>{contenido.descripcion}</p>
    <p className={styles.notice}>{datos.estadoBase}</p>
    <Link className={styles.button} to={contenido.destino}>{contenido.accion}</Link>
  </section>
}
