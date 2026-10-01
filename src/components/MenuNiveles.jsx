import { NavLink } from 'react-router-dom'
import datos from '../data/interfaz.json'
import styles from './MenuNiveles.module.css'

export default function MenuNiveles({ juego }) {
  const ui = datos.juego
  return <nav className={styles.menu} aria-label={ui.menuNiveles}>
    <ol>{juego.catalogo.map(caso => {
      const abierto = juego.estaDesbloqueado(caso.id)
      const terminado = juego.casosCompletados.includes(caso.id)
      const contenido = <><span className={styles.numero} aria-hidden="true">{String(caso.id).padStart(2, '0')}</span>
        <span><strong>{caso.titulo}</strong><small>{terminado ? '✓ ' + ui.completado : abierto ? ui.disponible : '○ ' + ui.bloqueado}</small></span></>
      return <li key={caso.id}>{abierto
        ? <NavLink to={'/caso/' + caso.id} aria-label={ui.nivel + ' ' + caso.id + ': ' + caso.titulo + ', ' + (terminado ? ui.completado : ui.disponible)} onClick={() => juego.seleccionarCaso(caso.id)}>{contenido}</NavLink>
        : <span className={styles.bloqueado} aria-disabled="true">{contenido}</span>}</li>
    })}</ol>
  </nav>
}
