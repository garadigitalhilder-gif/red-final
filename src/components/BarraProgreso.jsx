import { useId } from 'react'
import datos from '../data/interfaz.json'
import styles from './BarraProgreso.module.css'

function Avance({ etiqueta, completadas, total }) {
  const id = useId()
  const maximo = Math.max(0, total)
  const valor = Math.min(maximo, Math.max(0, completadas))
  const porcentaje = maximo ? Math.round(valor / maximo * 100) : 0
  return <div className={styles.avance}>
    <label htmlFor={id}>{etiqueta}</label>
    <p id={id + '-detalle'}>{valor} / {maximo} · {porcentaje}%</p>
    <progress id={id} value={valor} max={maximo || 1} aria-describedby={id + '-detalle'} />
  </div>
}

export default function BarraProgreso({ casoCompletadas = 0, casoTotal = 0, juegoCompletadas = 0, juegoTotal = 0 }) {
  const ui = datos.componentes
  return <section className={styles.barras} aria-label={ui.progreso}>
    <Avance etiqueta={ui.progresoCaso} completadas={casoCompletadas} total={casoTotal} />
    <Avance etiqueta={ui.progresoJuego} completadas={juegoCompletadas} total={juegoTotal} />
  </section>
}
