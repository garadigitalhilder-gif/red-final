import { useId, useRef, useState } from 'react'
import datos from '../data/interfaz.json'
import styles from './Pregunta.module.css'
import { contarPalabras, normalizarRespuesta } from '../hooks/juegoModelo.js'

const ui = datos.componentes

export default function Pregunta({ pregunta, onResponder, respuestaGuardada, mostrarPuntos = true }) {
  const id = useId()
  const formulario = useRef(null)
  const bloqueo = useRef(Boolean(respuestaGuardada))
  const [respuesta, setRespuesta] = useState(respuestaGuardada?.respuesta ?? '')
  const [resultado, setResultado] = useState(respuestaGuardada ?? null)
  const [error, setError] = useState('')
  const [autoevaluacion, setAutoevaluacion] = useState(respuestaGuardada?.autoevaluacion ?? pregunta.rubrica?.map(() => false) ?? [])
  const abierta = pregunta.tipo === 'abierta'
  const conRubrica = abierta && pregunta.rubrica?.length > 0
  const pendiente = abierta && !resultado?.evaluada
  const modificada = abierta && resultado && respuesta !== resultado.respuesta
  const minimo = pregunta.minPalabras ?? ui.objetivoPalabras.min
  const maximo = pregunta.maxPalabras ?? ui.objetivoPalabras.max

  function invalidar(mensaje) {
    setError(mensaje)
    formulario.current?.querySelector(abierta ? 'textarea' : 'input[type="radio"]')?.focus()
  }
  function guardar(entrada) {
    const nuevo = normalizarRespuesta(pregunta, entrada)
    setResultado(nuevo)
    onResponder?.(nuevo)
  }
  function enviar(event) {
    event.preventDefault()
    if (!abierta && bloqueo.current) return
    if (!respuesta.trim()) { invalidar(abierta ? ui.escribeRespuesta : ui.seleccionaRespuesta); return }
    setError('')
    if (abierta) {
      // El rango es un objetivo orientativo; no se evalúa el contenido del escrito.
      guardar({ respuesta, autoevaluacion, evaluada: Boolean(resultado?.evaluada) })
    } else {
      bloqueo.current = true
      guardar({ respuesta })
    }
  }
  function valorar(index, marcada) {
    const valores = autoevaluacion.map((actual, i) => i === index ? marcada : actual)
    setAutoevaluacion(valores)
    // Valora el texto enviado, evitando guardar silenciosamente un borrador diferente.
    guardar({ respuesta: resultado.respuesta, autoevaluacion: valores, evaluada: true })
  }

  return <form ref={formulario} className={styles.card} onSubmit={enviar} aria-label={pregunta.enunciado}>
    <fieldset className={styles.fieldset} disabled={!abierta && Boolean(resultado)}>
      <legend className={styles.legend}>{pregunta.enunciado}</legend>
      {abierta ? <>
        <label htmlFor={id + '-abierta'}>{ui.tuRespuesta}</label>
        <textarea id={id + '-abierta'} rows={5} value={respuesta} aria-invalid={Boolean(error)}
          aria-describedby={[id + '-palabras', error ? id + '-error' : ''].filter(Boolean).join(' ')}
          onChange={e => { setRespuesta(e.target.value); setError('') }} />
        <p id={id + '-palabras'}>{contarPalabras(respuesta)} / {minimo}–{maximo} {ui.palabras}</p>
      </> : <div className={styles.options}>{pregunta.opciones.map(opcion =>
        <label className={styles.option} key={opcion.id}>
          <input type="radio" name={id} value={opcion.id} checked={respuesta === String(opcion.id)}
            aria-invalid={Boolean(error)} aria-describedby={error ? id + '-error' : undefined}
            onChange={e => { setRespuesta(e.target.value); setError('') }} />
          <span>{opcion.texto}</span>
        </label>
      )}</div>}
    </fieldset>
    <p id={id + '-error'} className={styles.error} role="alert">{error}</p>
    <button className={styles.submit} type="submit" aria-disabled={!abierta && Boolean(resultado)}>
      {abierta ? resultado ? ui.actualizarAbierta : ui.enviarAbierta : resultado ? ui.respuestaRegistrada : ui.comprobar}
    </button>
    {abierta && <p role="status">{modificada ? ui.borrador : ''}</p>}
    {conRubrica && resultado && <section className={styles.rubrica} aria-labelledby={id + '-rubrica'}>
      <h3 id={id + '-rubrica'}>{ui.rubrica}</h3><p>{ui.reglaRubrica}</p>
      <ul className={styles.listaRubrica}>{pregunta.rubrica.map((criterio, index) => <li key={index}>
        <label className={styles.option}>
          <input type="checkbox" checked={autoevaluacion[index]} onChange={e => valorar(index, e.target.checked)} aria-describedby={id + '-criterio-' + index} />
          <span>{criterio.criterio} · {criterio.puntos} {ui.puntos}</span>
        </label><p id={id + '-criterio-' + index}>{criterio.descripcion}</p>
      </li>)}</ul>
    </section>}
    <div className={styles.feedback} aria-live="polite" aria-atomic="true">
      {resultado && <>
        <strong>{abierta ? pendiente ? ui.pendiente : ui.autoevaluacionRegistrada : resultado.correcta ? ui.correcta : ui.incorrecta}</strong>
        <p>{abierta ? pregunta.retroalimentacionCorrecta : resultado.correcta ? pregunta.retroalimentacionCorrecta : pregunta.retroalimentacionIncorrecta}</p>
        {mostrarPuntos && <p>{ui.puntosObtenidos}: {resultado.puntos}</p>}
      </>}
    </div>
  </form>
}
