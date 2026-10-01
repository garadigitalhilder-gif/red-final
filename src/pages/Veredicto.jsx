import { Link, useNavigate } from 'react-router-dom'
import datos from '../data/interfaz.json'
import Insignia from '../components/Insignia.jsx'
import styles from './Juego.module.css'
import Pregunta from '../components/Pregunta.jsx'
import Pista from '../components/Pista.jsx'
import LecturaCaso from '../components/LecturaCaso.jsx'

export default function Veredicto({ juego }) {
  const navigate = useNavigate()
  const ui = datos.juego
  const caso = juego.caso
  const resumen = juego.resumenes.find(r => r.id === caso?.id)
  const insignia = juego.insigniasGanadas.find(i => i.casoId === caso?.id)
  const siguiente = juego.catalogo[juego.catalogo.findIndex(c => c.id === caso?.id) + 1]
  const lecturaTerminada = caso?.preguntas.filter(p => p.tipo !== 'abierta').every(p => juego.respuestas[p.id])
  const pregunta = caso?.preguntas.find(p => p.tipo === 'abierta') ?? caso?.veredicto
  const puntuable = caso?.preguntas.some(p => p.id === pregunta?.id)
  const respuesta = puntuable ? juego.respuestas[pregunta.id] : juego.veredictos[caso?.id]
  if (!resumen || !lecturaTerminada) return <section className={styles.pagina}>
    <h1>{datos.etapas.veredicto.titulo}</h1><p>{ui.sinTerminar}</p>
    <Link to={caso ? '/caso/' + caso.id : '/briefing'}>{ui.volverCaso}</Link>
  </section>
  return <section className={styles.pagina}>
    <header className={styles.encabezado}><p className={styles.etiqueta}>{ui.despues}</p><h1>{datos.etapas.veredicto.titulo}: {caso.titulo}</h1><p>{ui.veredictoNota}</p></header>
    <div className={styles.veredicto}>
      <details className={styles.referencia}><summary>{ui.evidencias}</summary><LecturaCaso key={caso.id} caso={caso} /></details>
      {pregunta && <div>
        <h2>{ui.redactar}</h2>
        <Pregunta key={pregunta.id + '-' + juego.revision} pregunta={pregunta} mostrarPuntos={puntuable} respuestaGuardada={respuesta}
          onResponder={resultado => puntuable ? juego.responder(pregunta.id, resultado) : juego.guardarVeredicto(caso.id, resultado)} />
        {puntuable && <Pista pista={pregunta.pista} revelada={Object.hasOwn(juego.pistas, pregunta.id)} onDescontar={() => juego.descontar(pregunta.id)} />}
      </div>}
    </div>
    <p className={styles.estado} role="status">{!resumen.terminado ? ui.pendienteVeredicto : resumen.aprobado ? juego.meta : juego.metaPendiente}</p>
    <dl><dt>{ui.puntosCaso}</dt><dd>{resumen.puntos} / {resumen.maximo}</dd>
      <dt>{ui.porcentaje}</dt><dd>{resumen.porcentaje.toLocaleString('es-CO', { maximumFractionDigits: 2 })}%</dd>
      <dt>{ui.descuentos}</dt><dd>{resumen.descuentos}</dd></dl>
    {insignia && <Insignia nivel={insignia.nivel} detalle={insignia.detalle} />}
    <p>{juego.regla}</p>
    {resumen.aprobado && (siguiente
      ? siguiente.preguntas.length
        ? <Link className={styles.accion} to={'/caso/' + siguiente.id} onClick={() => juego.seleccionarCaso(siguiente.id)}>{ui.siguiente}</Link>
        : <p role="status">{ui.siguientePendiente}</p>
      : <p>{ui.sinSiguiente}</p>)}
    <p id="aviso-reintento">{ui.avisoReintento}</p>
    <button className={styles.boton} aria-describedby="aviso-reintento" onClick={() => { juego.reintentarCaso(caso.id); navigate('/caso/' + caso.id) }}>{ui.reintentar}</button>
    <Link to="/resultados">{ui.verResultados}</Link>
  </section>
}
