import interfaz from '../data/interfaz.json'
import { COSTO_PISTA } from './configuracion.js'
export { COSTO_PISTA } from './configuracion.js'
export const CLAVE_JUEGO = 'detectives-del-texto:juego:v1'
export const UMBRAL = interfaz.configuracionLegada.umbralAprobacion / 100

// Cambiar ids, textos, opciones o reglas invalida respuestas de otro catálogo.
export function firmaCatalogo(catalogo, umbral = UMBRAL) {
  const contenido = JSON.stringify({ catalogo, umbral, costo: COSTO_PISTA })
  let hash = 2166136261
  for (let i = 0; i < contenido.length; i++) hash = Math.imul(hash ^ contenido.charCodeAt(i), 16777619)
  return (hash >>> 0).toString(16)
}
export function estadoInicial(catalogo, umbral = UMBRAL) {
  return { version: 2, firma: firmaCatalogo(catalogo, umbral), casoActual: catalogo[0]?.id ?? null,
    respuestas: {}, pistas: {}, veredictos: {} }
}
export function resumenCaso(caso, estado, umbral = UMBRAL) {
  const preguntas = caso.preguntas
  const maximo = preguntas.reduce((suma, p) => suma + p.puntos, 0)
  const respondidas = preguntas.filter(p => estado.respuestas[p.id])
  const evaluadas = respondidas.filter(p => p.tipo === 'abierta' ? estado.respuestas[p.id].evaluada : estado.respuestas[p.id].correcta !== null)
  const ganados = respondidas.reduce((suma, p) => suma + estado.respuestas[p.id].puntos, 0)
  const descuentos = preguntas.reduce((suma, p) => suma + (estado.pistas[p.id] ?? 0), 0)
  const puntos = Math.max(0, ganados - descuentos)
  const terminado = preguntas.length > 0 && evaluadas.length === preguntas.length
  return { id: caso.id, maximo, puntos, descuentos, respondidas: respondidas.length,
    total: preguntas.length, terminado, porcentaje: maximo ? puntos / maximo * 100 : 0,
    aprobado: terminado && maximo > 0 && puntos / maximo >= umbral }
}
export function estaDesbloqueado(id, catalogo, estado, umbral = UMBRAL) {
  const indice = catalogo.findIndex(c => c.id === id)
  return indice >= 0 && catalogo.slice(0, indice).every(c => resumenCaso(c, estado, umbral).aprobado)
}
export function normalizarRespuesta(pregunta, entrada) {
  if (!entrada || typeof entrada.respuesta !== 'string' || !entrada.respuesta.trim()) return null
  if (pregunta.tipo === 'abierta') {
    const valoracion = pregunta.rubrica?.length && Array.isArray(entrada.autoevaluacion)
      && entrada.autoevaluacion.length === pregunta.rubrica.length
      && entrada.autoevaluacion.every(valor => typeof valor === 'boolean')
    const evaluada = Boolean(valoracion && entrada.evaluada !== false)
    const autoevaluacion = valoracion ? entrada.autoevaluacion : pregunta.rubrica?.map(() => false) ?? []
    const puntos = evaluada ? Math.min(pregunta.puntos,
      pregunta.rubrica.reduce((suma, criterio, index) => suma + (autoevaluacion[index] ? criterio.puntos : 0), 0)) : 0
    // El texto escrito nunca se clasifica automáticamente como correcto.
    return { respuesta: entrada.respuesta, autoevaluacion, evaluada, correcta: null, puntos }
  }
  const opcion = pregunta.opciones.find(o => String(o.id) === entrada.respuesta)
  if (!opcion) return null
  const correcta = opcion.id === pregunta.respuestaCorrecta
  return { respuesta: entrada.respuesta, correcta, puntos: correcta ? pregunta.puntos : 0 }
}
export function restaurarEstado(entrada, catalogo, umbral = UMBRAL) {
  const estado = estadoInicial(catalogo, umbral)
  if (!entrada || entrada.version !== estado.version || entrada.firma !== estado.firma) return estado
  const mapa = valor => valor && typeof valor === 'object' && !Array.isArray(valor)
  if (!mapa(entrada.respuestas) || !mapa(entrada.pistas)) return estado
  const ids = new Set(catalogo.flatMap(c => c.preguntas.map(p => String(p.id))))
  if ([...Object.keys(entrada.respuestas), ...Object.keys(entrada.pistas)].some(id => !ids.has(id))) return estado
  for (const caso of catalogo) {
    if (!estaDesbloqueado(caso.id, catalogo, estado, umbral)) break
    for (const pregunta of caso.preguntas) {
      const respuesta = normalizarRespuesta(pregunta, entrada.respuestas[pregunta.id])
      if (respuesta) estado.respuestas[pregunta.id] = respuesta
      if (entrada.pistas[pregunta.id] === COSTO_PISTA) estado.pistas[pregunta.id] = COSTO_PISTA
    }
    if (caso.veredicto && !caso.preguntas.some(p => p.id === caso.veredicto.id)) {
      const veredicto = normalizarRespuesta(caso.veredicto, entrada.veredictos?.[caso.id])
      if (veredicto) estado.veredictos[caso.id] = veredicto
    }
  }
  const actual = catalogo.find(c => c.id === entrada.casoActual && c.preguntas.length)
  if (actual && estaDesbloqueado(actual.id, catalogo, estado, umbral)) estado.casoActual = actual.id
  return estado
}
export function contarPalabras(texto) {
  return texto.trim() ? texto.trim().split(/\s+/u).length : 0
}
