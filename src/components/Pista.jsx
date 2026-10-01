import { useId, useRef, useState } from 'react'
import datos from '../data/interfaz.json'
import styles from './Pista.module.css'
import { COSTO_PISTA } from '../hooks/configuracion.js'

export default function Pista({ pista, costo = COSTO_PISTA, onDescontar, revelada = false, disabled = false }) {
  const id = useId()
  const usada = useRef(revelada)
  const [visible, setVisible] = useState(revelada)
  const ui = datos.componentes
  function revelar() {
    if (usada.current || disabled) return
    usada.current = true
    setVisible(true)
    onDescontar?.(costo)
  }
  return <aside className={styles.pista} aria-label={ui.pista}>
    <button type="button" onClick={revelar} disabled={disabled && !visible} aria-disabled={visible}
      aria-expanded={visible} aria-controls={id} className={styles.button}>
      <span aria-hidden="true">✦ </span>{visible ? ui.pistaRevelada : ui.revelarPista}
      {!visible && <span> (−{costo} {ui.puntos})</span>}
    </button>
    <div id={id} aria-live="polite" aria-atomic="true">
      {visible && <div className={styles.contenido}><p>{pista}</p><p>{ui.descuento}: {costo} {ui.puntos}.</p></div>}
    </div>
  </aside>
}
