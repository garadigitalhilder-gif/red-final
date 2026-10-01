import { useId } from 'react'
import datos from '../data/interfaz.json'
import styles from './Insignia.module.css'

export default function Insignia({ nivel = 'aprendiz', detalle, nivelEncabezado = 2 }) {
  const id = useId()
  const base = datos.componentes.insignias[nivel] ?? datos.componentes.insignias.aprendiz
  const insignia = { icono: base.icono, ...(detalle ?? base) }
  const Encabezado = nivelEncabezado === 3 ? 'h3' : 'h2'
  return <section className={styles.insignia} aria-labelledby={id}>
    <span className={styles.icono} aria-hidden="true">{insignia.icono}</span>
    <div><Encabezado id={id}>{insignia.nombre}</Encabezado><p>{insignia.descripcion}</p></div>
  </section>
}
