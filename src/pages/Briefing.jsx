import { Link } from 'react-router-dom'
import datos from '../data/interfaz.json'
import Marcador from '../components/Marcador.jsx'
import styles from './Juego.module.css'
import Pregunta from '../components/Pregunta.jsx'
import { useState } from 'react'

export default function Briefing({ juego }) {
  const ui = datos.juego
  const [diagnostico, setDiagnostico] = useState({})
  const preparacion = juego.catalogo[0]
  const diagnosticos = preparacion?.diagnostico ?? []
  return <section className={styles.pagina}>
    <header className={styles.encabezado}><p className={styles.etiqueta}>{ui.antes}</p><h1>{datos.etapas.briefing.titulo}</h1><p>{juego.regla}</p></header>
    {!juego.almacenamientoDisponible && <p role="status">{ui.sinGuardado}</p>}
    <Marcador puntos={juego.puntos} maximo={juego.maximo} />
    <section className={styles.panel}><h2>{ui.instrucciones}</h2>
      <ol className={styles.instrucciones}>{ui.instruccionesBase.map(paso => <li key={paso.titulo}><h3>{paso.titulo}</h3><p>{paso.contenido}</p></li>)}</ol>
    </section>
    {diagnosticos.length > 0 && <section className={styles.panel} aria-labelledby="diagnostico"><h2 id="diagnostico">{ui.diagnostico}</h2><p>{ui.diagnosticoNota}</p>
      <div className={styles.diagnostico}>{diagnosticos.map(pregunta => <Pregunta key={pregunta.id} pregunta={pregunta} mostrarPuntos={false} onResponder={respuesta => setDiagnostico(prev => ({ ...prev, [pregunta.id]: respuesta }))} />)}</div>
      <p role="status">{Object.keys(diagnostico).length === diagnosticos.length ? ui.diagnosticoFin : ''}</p>
    </section>}
    <h2>{ui.expedientes}</h2>
    <ol className={styles.lista}>{juego.catalogo.map(caso => {
      const desbloqueado = juego.estaDesbloqueado(caso.id)
      const disponible = caso.preguntas.length > 0
      return <li key={caso.id}>
        <h3>{caso.titulo || ui.caso + ' ' + caso.id}</h3>
        <p>{!desbloqueado ? ui.bloqueado : juego.casosCompletados.includes(caso.id) ? ui.completado : ui.disponible}{!disponible && ' · ' + ui.pendiente}</p>
        {disponible && desbloqueado && <><p>{caso.objetivo}</p>
          <Link className={styles.accion} to={'/caso/' + caso.id} onClick={() => juego.seleccionarCaso(caso.id)}>
            {caso.preguntas.some(p => juego.respuestas[p.id]) ? ui.continuar : datos.etapas.briefing.accion}
          </Link></>}
      </li>
    })}</ol>
    <Link to="/resultados">{ui.verResultados}</Link>
  </section>
}
