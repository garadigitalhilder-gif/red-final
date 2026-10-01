import datos from '../data/interfaz.json'
import styles from './Marcador.module.css'

export default function Marcador({ puntos = 0, maximo }) {
  const ui = datos.componentes
  return <div className={styles.marcador} role="status" aria-live="polite" aria-atomic="true" aria-label={ui.puntajeTotal}>
    <span aria-hidden="true">◆</span>
    <span>{ui.puntajeTotal}: <strong>{Math.max(0, puntos)}</strong>{maximo !== undefined && <> / {maximo}</>} {ui.puntos}</span>
  </div>
}
