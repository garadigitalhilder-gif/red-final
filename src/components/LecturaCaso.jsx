import { useId, useRef, useState } from 'react'
import datos from '../data/interfaz.json'
import TextoCaso from './TextoCaso.jsx'
import styles from './LecturaCaso.module.css'

// Se reutiliza en el expediente y en el texto de referencia del veredicto.
export default function LecturaCaso({ caso }) {
  const id = useId()
  const texto = useRef(null)
  const [entendida, setEntendida] = useState(false)
  const [abierto, setAbierto] = useState(false)
  const ui = datos.componentes
  return <div className={styles.lectura}>
    {caso.advertencia && <div className={styles.aviso} role="note" aria-labelledby={id + '-aviso'}>
      <h2 id={id + '-aviso'}>{ui.advertencia}</h2><p>{caso.advertencia}</p>
      {!entendida && <button type="button" onClick={() => {
        setEntendida(true)
        const titulo = texto.current?.querySelector('h2')
        if (titulo) { titulo.tabIndex = -1; titulo.focus() }
      }}>{ui.entendido}</button>}
    </div>}
    {caso.contexto && <section className={styles.contexto} aria-labelledby={id + '-contexto'}>
      <h2 id={id + '-contexto'}>{ui.contexto}</h2><p>{caso.contexto}</p>
    </section>}
    <div ref={texto}><TextoCaso texto={caso.texto} /></div>
    {caso.glosario?.length > 0 && <section className={styles.contexto} aria-label={ui.vocabulario}>
      <button type="button" aria-expanded={abierto} aria-controls={id + '-vocabulario'} onClick={() => setAbierto(valor => !valor)}>{ui.vocabulario}</button>
      <dl id={id + '-vocabulario'} hidden={!abierto}>{caso.glosario.map((entrada, index) => <div key={index}>
        <dt>{entrada.palabra}</dt><dd>{entrada.significado}</dd>
      </div>)}</dl>
    </section>}
  </div>
}
