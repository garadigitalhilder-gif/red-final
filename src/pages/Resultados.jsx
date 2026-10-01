import { Link, useNavigate } from 'react-router-dom'
import datos from '../data/interfaz.json'
import Marcador from '../components/Marcador.jsx'
import Insignia from '../components/Insignia.jsx'
import styles from './Juego.module.css'

export default function Resultados({ juego }) {
  const navigate = useNavigate()
  const ui = datos.juego
  const resumen = juego.resumenes.find(r => r.id === juego.casoActual)
  const final = juego.caso?.retroalimentacionFinal ?? ui.balance
  const comentario = !resumen?.respondidas ? final.sinIniciar : !resumen.terminado ? final.pendiente : resumen.aprobado ? final.logrado : final.reforzar
  return <section className={styles.pagina}>
    <header className={styles.encabezado}><p className={styles.etiqueta}>{ui.informe}</p><h1>{datos.etapas.resultados.titulo}</h1></header>
    {!juego.almacenamientoDisponible && <p role="status">{ui.sinGuardado}</p>}
    <Marcador puntos={juego.puntos} maximo={juego.maximo} />
    <section className={styles.panel} aria-labelledby="balance"><h2 id="balance">{ui.feedbackFinal}</h2><p>{comentario}</p><p><strong>{ui.casosCerrados}: {juego.casosCompletados.length} / {juego.catalogo.length}</strong></p></section>
    <div className={styles.tabla} role="region" aria-label={ui.expedientes} tabIndex={0}><table><caption>{ui.expedientes}</caption>
      <thead><tr><th scope="col">{ui.caso}</th><th scope="col">{ui.estado}</th><th scope="col">{ui.puntaje}</th></tr></thead>
      <tbody>{juego.catalogo.map((caso, index) => {
        const resumen = juego.resumenes[index]
        return <tr key={caso.id}><th scope="row">{caso.titulo || ui.caso + ' ' + caso.id}</th>
          <td>{!juego.estaDesbloqueado(caso.id) ? ui.bloqueado : !caso.preguntas.length ? ui.pendiente : resumen.terminado ? (resumen.aprobado ? juego.meta : juego.metaPendiente) : ui.disponible}</td>
          <td>{caso.preguntas.length ? resumen.puntos + ' / ' + resumen.maximo : ui.sinContenido}</td></tr>
      })}</tbody>
    </table></div>
    <h2>{ui.insignias}</h2>
    {juego.insigniasGanadas.length
      ? juego.insigniasGanadas.map(i => <div key={i.detalle.id}><p>{ui.caso} {i.casoId}</p><Insignia nivel={i.nivel} detalle={i.detalle} nivelEncabezado={3} /></div>)
      : <p>{ui.sinInsignias}</p>}
    <h2>{ui.respuestas}</h2>
    {Object.entries(juego.veredictos).map(([id, respuesta]) => <section className={styles.panel} key={id}><h3>{datos.etapas.veredicto.titulo} · {ui.caso} {id}</h3><p>{respuesta.respuesta}</p><p>{datos.componentes.autoevaluacionRegistrada}</p></section>)}
    <ol className={styles.lista}>{juego.catalogo.flatMap(caso => caso.preguntas).map(pregunta => {
      const respuesta = juego.respuestas[pregunta.id]
      return <li key={pregunta.id}><h3>{pregunta.enunciado}</h3>
        <p>{respuesta ? pregunta.opciones.find(o => o.id === respuesta.respuesta)?.texto ?? respuesta.respuesta : ui.sinRespuesta}</p>
        {respuesta && <><strong>{pregunta.tipo === 'abierta' ? respuesta.evaluada ? datos.componentes.autoevaluacionRegistrada : datos.componentes.pendiente : respuesta.correcta ? datos.componentes.correcta : datos.componentes.incorrecta}</strong>
          <p>{pregunta.tipo === 'abierta' ? pregunta.retroalimentacionCorrecta : respuesta.correcta ? pregunta.retroalimentacionCorrecta : pregunta.retroalimentacionIncorrecta}</p></>}
      </li>
    })}</ol>
    <Link to="/briefing">{ui.elegir}</Link>
    <Link to="/creditos">{ui.creditos}</Link>
    {juego.estadoScorm.modo === 'lms' && <>
      <button className={styles.boton} disabled={juego.estadoScorm.cerrada} onClick={juego.finalizarJuego}>{ui.finalizarSesion}</button>
      {juego.estadoScorm.cerrada && <p role="status">{ui.sesionCerrada} {ui.avisoSesion}</p>}
    </>}
    <p id="aviso-reinicio">{ui.avisoReinicio}</p>
    <button className={styles.boton} aria-describedby="aviso-reinicio" onClick={() => { juego.reiniciarJuego(); navigate('/briefing') }}>{ui.reiniciar}</button>
  </section>
}
