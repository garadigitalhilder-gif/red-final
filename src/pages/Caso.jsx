import ImagenRecurso from '../components/ImagenRecurso.jsx'
import { Link, useParams } from 'react-router-dom'
import { useEffect } from 'react'
import datos from '../data/interfaz.json'
import Pregunta from '../components/Pregunta.jsx'
import Pista from '../components/Pista.jsx'
import LecturaCaso from '../components/LecturaCaso.jsx'
import Marcador from '../components/Marcador.jsx'
import styles from './Caso.module.css'

export default function Caso({ juego }) {
  const { id } = useParams()
  const caso = juego.catalogo.find(item => String(item.id) === id)
  const ui = datos.componentes
  const permitido = caso && juego.estaDesbloqueado(caso.id)
  useEffect(() => {
    if (permitido && caso.preguntas.length && juego.casoActual !== caso.id) juego.seleccionarCaso(caso.id)
  }, [caso, permitido, juego])
  if (caso && !permitido) return <section>
    <h1>{datos.juego.bloqueado}</h1><p>{juego.regla}</p>
    <Link to="/briefing">{datos.juego.elegir}</Link>
  </section>
  if (!caso?.preguntas.length) return <section>
    <h1>{caso ? ui.casoPendiente : datos.etapas.noEncontrada.titulo}</h1>
    <Link to="/">{datos.interfaz.inicio}</Link>
  </section>
  const preguntasLectura = caso.preguntas.filter(p => p.tipo !== 'abierta')
  const lecturaCompleta = preguntasLectura.every(p => juego.respuestas[p.id])
  return <div className={styles.caso}>
    <header><p className={styles.etiqueta}>{datos.juego.durante} · {datos.juego.nivel} {caso.nivel} · {caso.dificultad}</p><h1>{caso.titulo}</h1>
      {caso.introduccion && <p className={styles.objetivo}>{caso.introduccion}</p>}
      <p className={styles.objetivo}>{caso.objetivo}</p><ImagenRecurso key={caso.id} imagen={caso.imagen} titulo={caso.titulo} /></header>
    {!juego.almacenamientoDisponible && <p role="status">{datos.juego.sinGuardado}</p>}
    <Marcador puntos={juego.puntos} maximo={juego.maximo} />
    <div className={styles.investigacion}>
    <div className={styles.lectura}><LecturaCaso key={caso.id} caso={caso} /></div>
    <section aria-labelledby="retos"><h2 id="retos">{ui.retos}</h2><p className={styles.reglas}>{juego.reglas}</p>
      {preguntasLectura.map(pregunta => <div key={pregunta.id}>
        <Pregunta key={pregunta.id + '-' + juego.revision} pregunta={pregunta} respuestaGuardada={juego.respuestas[pregunta.id]} onResponder={resultado => juego.responder(pregunta.id, resultado)} />
        <Pista key={pregunta.id + '-pista-' + juego.revision} pista={pregunta.pista} revelada={Object.hasOwn(juego.pistas, pregunta.id)} disabled={Boolean(juego.respuestas[pregunta.id])} onDescontar={() => juego.descontar(pregunta.id)} />
      </div>)}
      {lecturaCompleta && <Link className={styles.continuar} to="/veredicto">{datos.etapas.caso.accion}</Link>}
    </section></div>
  </div>
}
