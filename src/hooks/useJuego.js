import { useEffect, useState } from 'react'
import casos from '../data/casos.json'
import { CLAVE_JUEGO, COSTO_PISTA, estadoInicial, estaDesbloqueado, nivelInsignia, normalizarRespuesta, restaurarEstado, resumenCaso } from './juegoModelo.js'
import * as scormService from '../scorm/scormService.js'

// App mantiene una única instancia. El catálogo opcional facilita reutilización y pruebas.
export default function useJuego(catalogo = casos, servicio = scormService) {
  const [inicio] = useState(() => servicio.iniciar())
  const [estado, setEstado] = useState(() => restaurarEstado(inicio.progreso, catalogo))
  const [estadoScorm, setEstadoScorm] = useState({ modo: inicio.modo, error: inicio.error, cerrada: inicio.cerrada })
  const [almacenamientoDisponible, setAlmacenamientoDisponible] = useState(true)
  const [revision, setRevision] = useState(0)
  const resumenes = catalogo.map(caso => resumenCaso(caso, estado))
  const casosCompletados = resumenes.filter(r => r.terminado).map(r => r.id)
  const insigniasGanadas = catalogo.filter(c => casosCompletados.includes(c.id))
    .map(c => ({ casoId: c.id, nivel: nivelInsignia(c), ...(c.insignia ? { detalle: c.insignia } : {}) }))
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
      if (!caso || !estaDesbloqueado(caso.id, catalogo, prev) || Object.hasOwn(prev.respuestas, id)) return prev
      const respuesta = normalizarRespuesta(caso.preguntas.find(p => p.id === id), resultado)
      return respuesta ? { ...prev, respuestas: { ...prev.respuestas, [id]: respuesta } } : prev
    })
  }
  function descontar(id) {
    setEstado(prev => {
      const caso = catalogo.find(c => c.preguntas.some(p => p.id === id))
      if (!caso || !estaDesbloqueado(caso.id, catalogo, prev) || prev.respuestas[id] || Object.hasOwn(prev.pistas, id)) return prev
      return { ...prev, pistas: { ...prev.pistas, [id]: COSTO_PISTA } }
    })
  }
  function seleccionarCaso(id) {
    setEstado(prev => {
      const caso = catalogo.find(c => c.id === id)
      return caso?.preguntas.length && estaDesbloqueado(id, catalogo, prev) && prev.casoActual !== id
        ? { ...prev, casoActual: id } : prev
    })
  }
  function guardarVeredicto(id, resultado) {
    setEstado(prev => {
      const caso = catalogo.find(c => c.id === id)
      if (!caso?.veredicto || !estaDesbloqueado(id, catalogo, prev) || prev.veredictos[id]) return prev
      const respuesta = normalizarRespuesta(caso.veredicto, resultado)
      return respuesta ? { ...prev, veredictos: { ...prev.veredictos, [id]: respuesta } } : prev
    })
  }
  function reintentarCaso(id) {
    setRevision(valor => valor + 1)
    setEstado(prev => {
      const indice = catalogo.findIndex(c => c.id === id)
      if (indice < 0 || !estaDesbloqueado(id, catalogo, prev) || !catalogo[indice].preguntas.length) return prev
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
    setEstado(estadoInicial(catalogo))
    setRevision(valor => valor + 1)
  }
  return { ...estado, pistasUsadas: Object.keys(estado.pistas), puntos, puntaje: puntos, maximo,
    caso: catalogo.find(c => c.id === estado.casoActual), catalogo, resumenes, casosCompletados, insigniasGanadas,
    juegoTotal: preguntas.length, juegoCompletadas: Object.keys(estado.respuestas).length,
    estadoScorm, estadoLeccion, finalizarJuego,
    revision, almacenamientoDisponible, responder, descontar, seleccionarCaso, guardarVeredicto, reintentarCaso, reiniciarJuego,
    estaDesbloqueado: id => estaDesbloqueado(id, catalogo, estado) }
}
