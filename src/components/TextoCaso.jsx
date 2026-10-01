import { useId } from 'react'
import datos from '../data/interfaz.json'
import styles from './TextoCaso.module.css'

export default function TextoCaso({ texto }) {
  const id = useId()
  const ui = datos.componentes
  return <article className={styles.texto} aria-labelledby={id}>
    <header><h2 id={id}>{texto.titulo}</h2>
      <dl className={styles.creditos}><dt>{ui.autor}</dt><dd>{texto.autor}</dd>
        {texto.anio !== undefined && <><dt>{ui.anio}</dt><dd>{texto.anio}</dd></>}
        <dt>{ui.fuente}</dt><dd>{texto.fuente}</dd></dl>
    </header>
    <div className={styles.contenido}>{texto.contenido.split(/\n\s*\n/).filter(Boolean).map((parrafo, index) => <p key={index}>{parrafo}</p>)}</div>
    {texto.licencia && <footer className={styles.licencia}>{ui.licencia}: {texto.licencia}</footer>}
  </article>
}
