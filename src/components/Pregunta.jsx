import { useId, useRef, useState } from 'react'
import datos from '../data/interfaz.json'
import styles from './Pregunta.module.css'
import { contarPalabras, normalizarRespuesta } from '../hooks/juegoModelo.js'

const ui = datos.componentes

// La primera respuesta enviada queda cerrada para evitar sumar puntos dos veces.
export default function Pregunta({ pregunta, onResponder, respuestaGuardada, evaluarAbierta, mostrarPuntos = true }) {
  const id = useId()
  const formulario = useRef(null)
  const bloqueo = useRef(Boolean(respuestaGuardada))
  const [respuesta, setRespuesta] = useState(respuestaGuardada?.respuesta ?? '')
  const [resultado, setResultado] = useState(respuestaGuardada ?? null)
  const [error, setError] = useState('')
  const [autoevaluacion, setAutoevaluacion] = useState(respuestaGuardada?.autoevaluacion ?? pregunta.rubrica?.map(() => null) ?? [])
  const abierta = pregunta.tipo === 'abierta'
  const conRubrica = abierta && pregunta.rubrica?.length > 0
  const pendiente = resultado?.correcta === null

  // El mensaje se asocia al control y el foco permite corregir sin buscarlo.
  function invalidar(mensaje, selector) {
    setError(mensaje)
    formulario.current?.querySelector(selector)?.focus()
  }
  function cambiarRespuesta(valor) {
    setRespuesta(valor)
    setError('')
  }

  function enviar(event) {
    event.preventDefault()
    if (bloqueo.current) return
    if (!respuesta.trim()) {
      invalidar(abierta ? ui.escribeRespuesta : ui.seleccionaRespuesta, abierta ? 'textarea' : 'input[type="radio"]')
      return
    }
    if (conRubrica) {
      const palabras = contarPalabras(respuesta)
      if ((pregunta.minPalabras && palabras < pregunta.minPalabras) || (pregunta.maxPalabras && palabras > pregunta.maxPalabras)) {
        invalidar(`${ui.rangoPalabras} ${pregunta.minPalabras}–${pregunta.maxPalabras} ${ui.palabras}.`, 'textarea')
        return
      }
      if (autoevaluacion.some(valor => valor === null)) {
        invalidar(ui.faltaRubrica, `[name="${id}-criterio-${autoevaluacion.findIndex(valor => valor === null)}"]`)
        return
      }
    }
    // Una respuesta abierta requiere rúbrica; nunca se compara literalmente.
    const evaluacion = conRubrica
      ? normalizarRespuesta(pregunta, { respuesta, autoevaluacion })
      : abierta
      ? evaluarAbierta?.(respuesta, pregunta) ?? { correcta: null, puntos: 0 }
      : { correcta: respuesta === pregunta.respuestaCorrecta, puntos: respuesta === pregunta.respuestaCorrecta ? pregunta.puntos : 0 }
    const nuevo = { ...evaluacion, respuesta }
    bloqueo.current = true
    setError('')
    setResultado(nuevo)
    onResponder?.(nuevo)
  }

  return <form ref={formulario} className={styles.card} onSubmit={enviar} aria-label={pregunta.enunciado}>
    <fieldset className={styles.fieldset} disabled={!abierta && Boolean(resultado)} aria-describedby={error ? id + '-error' : undefined}>
      <legend className={styles.legend}>{pregunta.enunciado}</legend>
      {abierta
        ? <><label htmlFor={id + '-abierta'}>{ui.tuRespuesta}</label><textarea id={id + '-abierta'} rows={5} value={respuesta} readOnly={Boolean(resultado)} aria-invalid={Boolean(error) && error !== ui.faltaRubrica} aria-describedby={[conRubrica ? id + '-instrucciones' : '', pregunta.minPalabras ? id + '-palabras' : '', error ? id + '-error' : ''].filter(Boolean).join(' ') || undefined} onChange={e => cambiarRespuesta(e.target.value)} /></>
        : <div className={styles.options}>{pregunta.opciones.map(opcion =>
          <label className={styles.option} key={opcion.id}>
            <input type="radio" name={id} value={opcion.id} checked={respuesta === opcion.id} aria-invalid={Boolean(error)} aria-describedby={error ? id + '-error' : undefined} onChange={e => cambiarRespuesta(e.target.value)} />
            <span>{opcion.texto}</span>
          </label>
        )}</div>}
      {conRubrica && <section className={styles.rubrica} aria-label={ui.rubrica}>
        <h3>{ui.rubrica}</h3><p id={id + '-instrucciones'}>{ui.reglaRubrica}</p>
        {pregunta.minPalabras && <p id={id + '-palabras'}>{contarPalabras(respuesta)} / {pregunta.minPalabras}–{pregunta.maxPalabras} {ui.palabras}</p>}
        {pregunta.rubrica.map((criterio, index) => <fieldset className={styles.criterio} key={criterio.criterio} disabled={Boolean(resultado)}>
          <legend>{criterio.criterio} · {criterio.puntos} {ui.puntos}</legend>
          <p>{criterio.descripcion}</p>
          {[true, false].map(valor => <label className={styles.option} key={String(valor)}>
            <input type="radio" name={id + '-criterio-' + index} checked={autoevaluacion[index] === valor} aria-invalid={error === ui.faltaRubrica && autoevaluacion[index] === null} aria-describedby={error === ui.faltaRubrica ? id + '-error' : undefined} onChange={() => { setError(''); setAutoevaluacion(prev => prev.map((actual, i) => i === index ? valor : actual)) }} />
            <span>{valor ? ui.cumple : ui.noCumple}</span>
          </label>)}
        </fieldset>)}
      </section>}
    </fieldset>
    <p id={id + '-error'} className={styles.error} role="alert">{error}</p>
    <button className={styles.submit} type="submit" aria-disabled={Boolean(resultado)}>{resultado ? ui.respuestaRegistrada : ui.comprobar}</button>
    <div className={styles.feedback} aria-live="polite" aria-atomic="true">
      {resultado && <><strong>{resultado.autoevaluacion ? ui.autoevaluacionRegistrada : pendiente ? ui.pendiente : resultado.correcta ? ui.correcta : ui.incorrecta}</strong>
        <p>{pendiente ? ui.revisionAbierta : resultado.retroalimentacion ?? (resultado.correcta ? pregunta.retroalimentacionCorrecta : pregunta.retroalimentacionIncorrecta)}</p>
        {!pendiente && mostrarPuntos && <p>{ui.puntosObtenidos}: {resultado.puntos}</p>}
      </>}
    </div>
  </form>
}
