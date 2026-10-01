export const CLAVE_JUEGO = 'detectives-del-texto:juego:v1'
export const UMBRAL = 0.7
export const COSTO_PISTA = 5

export function estadoInicial(catalogo) {
  return { version: 1, casoActual: catalogo[0]?.id ?? null, respuestas: {}, pistas: {}, veredictos: {} }
}

export function resumenCaso(caso, estado) {
  const preguntas = caso.preguntas
  const maximo = preguntas.reduce((suma, p) => suma + p.puntos, 0)
  const respondidas = preguntas.filter(p => estado.respuestas[p.id])
  const evaluadas = respondidas.filter(p => estado.respuestas[p.id].correcta !== null)
  const ganados = respondidas.reduce((suma, p) => suma + estado.respuestas[p.id].puntos, 0)
  const descuentos = preguntas.reduce((suma, p) => suma + (estado.pistas[p.id] ?? 0), 0)
  const puntos = Math.max(0, ganados - descuentos)
  const terminado = preguntas.length > 0 && evaluadas.length === preguntas.length
  return { id: caso.id, maximo, puntos, descuentos, respondidas: respondidas.length,
    total: preguntas.length, terminado, porcentaje: maximo ? puntos / maximo * 100 : 0,
    aprobado: terminado && maximo > 0 && puntos / maximo >= UMBRAL }
}

export function estaDesbloqueado(id, catalogo, estado) {
  const indice = catalogo.findIndex(c => c.id === id)
  return indice >= 0 && catalogo.slice(0, indice).every(c => resumenCaso(c, estado).aprobado)
}

export function normalizarRespuesta(pregunta, entrada) {
  if (!entrada || typeof entrada.respuesta !== 'string' || !entrada.respuesta.trim()) return null
  if (pregunta.tipo === 'abierta') {
    const palabras = contarPalabras(entrada.respuesta)
    const enRango = (!pregunta.minPalabras || palabras >= pregunta.minPalabras) && (!pregunta.maxPalabras || palabras <= pregunta.maxPalabras)
    if (enRango && pregunta.rubrica?.length && Array.isArray(entrada.autoevaluacion)
      && entrada.autoevaluacion.length === pregunta.rubrica.length
      && entrada.autoevaluacion.every(valor => typeof valor === 'boolean')) {
      const puntos = Math.min(pregunta.puntos, pregunta.rubrica.reduce((suma, criterio, index) => suma + (entrada.autoevaluacion[index] ? criterio.puntos : 0), 0))
      return { respuesta: entrada.respuesta, autoevaluacion: entrada.autoevaluacion, correcta: puntos >= pregunta.puntos * UMBRAL, puntos }
    }
    // Una respuesta abierta sin rúbrica permanece pendiente de valoración.
    return { respuesta: entrada.respuesta, correcta: null, puntos: 0 }
  }
  if (!pregunta.opciones.some(o => o.id === entrada.respuesta)) return null
  const correcta = entrada.respuesta === pregunta.respuestaCorrecta
  return { respuesta: entrada.respuesta, correcta, puntos: correcta ? pregunta.puntos : 0 }
}

export function restaurarEstado(entrada, catalogo) {
  const estado = estadoInicial(catalogo)
  if (!entrada || entrada.version !== 1) return estado
  // Recalcula puntuación y permisos; descarta datos corruptos o de casos bloqueados.
  for (const caso of catalogo) {
    if (!estaDesbloqueado(caso.id, catalogo, estado)) break
    for (const pregunta of caso.preguntas) {
      const respuesta = normalizarRespuesta(pregunta, entrada.respuestas?.[pregunta.id])
      if (respuesta) estado.respuestas[pregunta.id] = respuesta
      if (entrada.pistas?.[pregunta.id] === COSTO_PISTA) estado.pistas[pregunta.id] = COSTO_PISTA
    }
    if (caso.veredicto && !caso.preguntas.some(p => p.id === caso.veredicto.id)) {
      const veredicto = normalizarRespuesta(caso.veredicto, entrada.veredictos?.[caso.id])
      if (veredicto) estado.veredictos[caso.id] = veredicto
    }
  }
  const actual = catalogo.find(c => c.id === entrada.casoActual && c.preguntas.length)
  if (actual && estaDesbloqueado(actual.id, catalogo, estado)) estado.casoActual = actual.id
  return estado
}

export function nivelInsignia(caso) {
  if (caso.insignia?.id) return caso.insignia.id
  if (caso.dificultad.toLowerCase() === 'básica') return 'aprendiz'
  if (['intermedia', 'media'].includes(caso.dificultad.toLowerCase())) return 'detective'
  return 'inspector'
}

export function contarPalabras(texto) {
  return texto.trim() ? texto.trim().split(/\s+/u).length : 0
}
