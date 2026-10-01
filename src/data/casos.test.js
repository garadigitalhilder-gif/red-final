import { describe, expect, it } from 'vitest'
import fuente from './casos.json'
import { adaptarDatos } from './datosJuego.js'
import { normalizarRespuesta } from '../hooks/juegoModelo.js'
const casos = adaptarDatos(fuente).casos

describe('Catálogo importado', () => {
  it('contiene cuatro casos, veinte preguntas válidas y 400 puntos', () => {
    expect(casos.map(c => c.id)).toEqual([1, 2, 3, 4])
    const preguntas = casos.flatMap(c => c.preguntas)
    expect(new Set(preguntas.map(p => p.id)).size).toBe(20)
    expect(preguntas.reduce((s, p) => s + p.puntos, 0)).toBe(400)
    for (const caso of casos) {
      expect(caso.preguntas).toHaveLength(5)
      for (const key of ['titulo', 'autor', 'fuente', 'licencia', 'contenido']) expect(caso.texto[key]).toBeTruthy()
      for (const p of caso.preguntas) {
        expect(['opcion-multiple', 'verdadero-falso', 'abierta']).toContain(p.tipo)
        if (p.tipo !== 'abierta') expect(p.opciones.some(o => o.id === p.respuestaCorrecta)).toBe(true)
      }
    }
  })

  it('recalcula la autoevaluación desde la rúbrica y descarta puntuaciones externas', () => {
    const p = casos[3].preguntas[4]
    const entrada = { respuesta: 'palabra '.repeat(80), autoevaluacion: [true, false, true, false], puntos: 999 }
    expect(normalizarRespuesta(p, entrada).puntos).toBe(10)
    expect(normalizarRespuesta(p, { ...entrada, respuesta: 'Demasiado breve' }).correcta).toBeNull()
    expect(normalizarRespuesta(p, { ...entrada, autoevaluacion: [true] }).correcta).toBeNull()
  })
})
