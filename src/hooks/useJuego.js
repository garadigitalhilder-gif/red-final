import { useEffect, useMemo, useState } from 'react'
import datos, { adaptarDatos } from '../data/datosJuego.js'
import interfaz from '../data/interfaz.json'
import { CLAVE_JUEGO, COSTO_PISTA, estadoInicial, estaDesbloqueado, normalizarRespuesta, restaurarEstado, resumenCaso } from './juegoModelo.js'
import * as scormService from '../scorm/scormService.js'

// App mantiene una única instancia. El catálogo opcional facilita reutilización y pruebas.
export default function useJuego(entrada = datos, servicio = scormService) {
  const contenido = useMemo(() => adaptarDatos(entrada), [entrada])
  const catalogo = contenido.casos
  const configuracion = contenido.juego
  const umbral = configuracion.umbralAprobacion / 100
  const [inicio] = useState(() => servicio.iniciar())
  const [estado, setEstado] = useState(() => restaurarEstado(inicio.progreso, catalogo, umbral))
  const [estadoScorm, setEstadoScorm] = useState({ modo: inicio.modo, error: inicio.error, cerrada: inicio.cerrada })
  const [almacenamientoDisponible, setAlmacenamientoDisponible] = useState(true)
  const [revision, setRevision] = useState(0)
  const resumenes = catalogo.map(caso => resumenCaso(caso, estado, umbral))
  const casosCompletados = resumenes.filter(r => r.terminado).map(r => r.id)
  const insigniasGanadas = configuracion.insignias.filter(i => resumenes.some(r => r.id === i.casoRequerido && r.aprobado))
    .map(i => ({ casoId: i.casoRequerido, nivel: i.id, detalle: i }))
  const preguntas = catalogo.flatMap(c => c.preguntas)
  const maximo = resumenes.reduce((total, r) => total + r.maximo, 0)
  const puntos = resumenes.reduce((total, r) => total + r.puntos, 0)
  const todosTerminados = resumenes.length > 0 && resumenes.every(r => r.terminado)
  const estadoLeccion = todosTerminados ? resumenes.every(r => r.aprobado) ? 'passed' : 'completed' : 'incomplete'
  useEffect(() => {
    const progreso = servicio.guardarProgreso(estado, { estado: estadoLeccion })
    const puntaje = servicio.guardarPuntaje(puntos, 0, maximo || 1)
    // eslint-disable-next-line react/set-state-in-effect -- Refleja el resultado de la escritura en sistemas externos.
    setAlmacenamientoDisponible(progreso.almacenamientoDisponible && puntaje.almacenamientoDisponible)
    // eslint-disable-next-line react/set-state-in-effect -- Comunica el estado real del LMS, sin cambiar el progreso.
    setEstadoScorm(prev => {
      const nuevo = { modo: progreso.modo, error: progreso.error || puntaje.error, cerrada: progreso.cerrada }
      return prev.modo === nuevo.modo && prev.error === nuevo.error && prev.cerrada === nuevo.cerrada ? prev : nuevo
    })
  }, [estado, estadoLeccion, puntos, maximo, servicio])
  function finalizarJuego() {
    const progreso = servicio.guardarProgreso(estado, { estado: estadoLeccion })
    const puntaje = servicio.guardarPuntaje(puntos, 0, maximo || 1)
    const fin = servicio.finalizar()
    setEstadoScorm({ modo: fin.modo, error: progreso.error || puntaje.error || fin.error, cerrada: fin.cerrada })
    return fin
  }

  function responder(id, resultado) {
    setEstado(prev => {
      const caso = catalogo.find(c => c.preguntas.some(p => p.id === id))
      const pregunta = caso?.preguntas.find(p => p.id === id)
      if (!caso || !estaDesbloqueado(caso.id, catalogo, prev, umbral) || (pregunta.tipo !== 'abierta' && Object.hasOwn(prev.respuestas, id))) return prev
      const respuesta = normalizarRespuesta(pregunta, resultado)
      if (!respuesta) return prev
      const nuevo = { ...prev, respuestas: { ...prev.respuestas, [id]: respuesta } }
      // Al reducir la autoevaluación, revoca avances dependientes de este caso.
      if (pregunta.tipo === 'abierta' && !resumenCaso(caso, nuevo, umbral).aprobado) {
        const posteriores = catalogo.slice(catalogo.indexOf(caso) + 1)
        const borrar = new Set(posteriores.flatMap(c => c.preguntas.map(p => p.id)))
        nuevo.respuestas = Object.fromEntries(Object.entries(nuevo.respuestas).filter(([key]) => !borrar.has(key)))
        nuevo.pistas = Object.fromEntries(Object.entries(nuevo.pistas).filter(([key]) => !borrar.has(key)))
        nuevo.veredictos = Object.fromEntries(Object.entries(nuevo.veredictos).filter(([key]) => !posteriores.some(c => String(c.id) === key)))
      }
      return nuevo
    })
  }
  function descontar(id) {
    setEstado(prev => {
      const caso = catalogo.find(c => c.preguntas.some(p => p.id === id))
      if (!caso || !estaDesbloqueado(caso.id, catalogo, prev, umbral) || (prev.respuestas[id] && caso.preguntas.find(p => p.id === id).tipo !== 'abierta') || Object.hasOwn(prev.pistas, id)) return prev
      return { ...prev, pistas: { ...prev.pistas, [id]: COSTO_PISTA } }
    })
  }
  function seleccionarCaso(id) {
    setEstado(prev => {
      const caso = catalogo.find(c => c.id === id)
      return caso?.preguntas.length && estaDesbloqueado(id, catalogo, prev, umbral) && prev.casoActual !== id
        ? { ...prev, casoActual: id } : prev
    })
  }
  function guardarVeredicto(id, resultado) {
    setEstado(prev => {
      const caso = catalogo.find(c => c.id === id)
      if (!caso?.veredicto || !estaDesbloqueado(id, catalogo, prev, umbral)) return prev
      const respuesta = normalizarRespuesta(caso.veredicto, resultado)
      return respuesta ? { ...prev, veredictos: { ...prev.veredictos, [id]: respuesta } } : prev
    })
  }
  function reintentarCaso(id) {
    setRevision(valor => valor + 1)
    setEstado(prev => {
      const indice = catalogo.findIndex(c => c.id === id)
      if (indice < 0 || !estaDesbloqueado(id, catalogo, prev, umbral) || !catalogo[indice].preguntas.length) return prev
      // Reintentar revoca el avance posterior que dependía de este resultado.
      const borrar = new Set(catalogo.slice(indice).flatMap(c => c.preguntas.map(p => p.id)))
      return { ...prev, casoActual: id,
        veredictos: Object.fromEntries(Object.entries(prev.veredictos).filter(([key]) => !catalogo.slice(indice).some(c => String(c.id) === key))),
        respuestas: Object.fromEntries(Object.entries(prev.respuestas).filter(([key]) => !borrar.has(key))),
        pistas: Object.fromEntries(Object.entries(prev.pistas).filter(([key]) => !borrar.has(key))) }
    })
  }
  function reiniciarJuego() {
    try { window.localStorage.removeItem(CLAVE_JUEGO) } catch { /* Reinicia también sin almacenamiento. */ }
    setEstado(estadoInicial(catalogo, umbral))
    setRevision(valor => valor + 1)
  }
  return { ...estado, pistasUsadas: Object.keys(estado.pistas), puntos, puntaje: puntos, maximo,
    caso: catalogo.find(c => c.id === estado.casoActual), catalogo, resumenes, casosCompletados, insigniasGanadas,
    juegoTotal: preguntas.length, juegoCompletadas: Object.keys(estado.respuestas).length,
    configuracion, portada: contenido.portada, creditos: contenido.creditos, costoPista: COSTO_PISTA,
    regla: interfaz.juego.regla.replace('{umbral}', configuracion.umbralAprobacion),
    meta: interfaz.juego.aprobado.replace('{umbral}', configuracion.umbralAprobacion),
    metaPendiente: interfaz.juego.noAprobado.replace('{umbral}', configuracion.umbralAprobacion),
    reglas: interfaz.componentes.reglas.replace('{costo}', COSTO_PISTA),
    estadoScorm, estadoLeccion, finalizarJuego,
    revision, almacenamientoDisponible, responder, descontar, seleccionarCaso, guardarVeredicto, reintentarCaso, reiniciarJuego,
    estaDesbloqueado: id => estaDesbloqueado(id, catalogo, estado, umbral) }
}
