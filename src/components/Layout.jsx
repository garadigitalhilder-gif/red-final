import { Link, Outlet, useLocation } from 'react-router-dom'
import { useEffect, useRef } from 'react'
import datos from '../data/interfaz.json'
import styles from './Layout.module.css'
import MenuNiveles from './MenuNiveles.jsx'
import BarraProgreso from './BarraProgreso.jsx'

export default function Layout({ juego }) {
  const { pathname } = useLocation()
  const contenido = useRef(null)
  const anterior = useRef(pathname)
  const resumen = juego.resumenes.find(r => r.id === juego.casoActual)
  const volver = pathname.startsWith('/caso/') ? '/briefing' : pathname === '/veredicto' ? '/caso/' + juego.casoActual : pathname === '/briefing' ? '/' : '/briefing'
  // El foco sigue el contenido cuando cambia la ruta.
  useEffect(() => {
    const encabezado = contenido.current?.querySelector('h1')
    document.title = `${encabezado?.textContent ?? datos.interfaz.nombre} · Detectives del Texto`
    if (anterior.current !== pathname && encabezado) {
      encabezado.tabIndex = -1
      encabezado.focus()
    }
    anterior.current = pathname
  }, [pathname])
  return <div className={styles.app}>
    <a className={styles.skip} href="#contenido" onClick={(event) => {
      // Evita modificar el hash reservado para la navegación.
      event.preventDefault()
      contenido.current?.focus()
      contenido.current?.scrollIntoView()
    }}>{datos.interfaz.saltar}</a>
    <header className={styles.header}>
      <Link className={styles.brand} to="/"><span className={styles.mark} aria-hidden="true">DT</span><span>{datos.interfaz.nombre}<small>{datos.interfaz.nivel}</small></span></Link>
      <nav aria-label="Principal"><Link to="/">{datos.interfaz.inicio}</Link><Link to="/briefing">{datos.juego.agencia}</Link><Link to="/resultados">{datos.juego.informe}</Link></nav>
    </header>
    <MenuNiveles juego={juego} />
    <main id="contenido" ref={contenido} tabIndex={-1} className={styles.main}>
      {pathname !== '/' && <div className={styles.herramientas}>
        <Link className={styles.volver} to={volver}>{datos.juego.volver}</Link>
        <BarraProgreso casoCompletadas={resumen?.respondidas ?? 0} casoTotal={resumen?.total ?? 0} juegoCompletadas={juego.juegoCompletadas} juegoTotal={juego.juegoTotal} />
      </div>}
      {juego.estadoScorm?.error && juego.estadoScorm.modo === 'lms' && <p role="status">{datos.juego.falloLms}</p>}
      <Outlet />
    </main>
    <footer className={styles.footer}>{datos.interfaz.pie}</footer>
  </div>
}
