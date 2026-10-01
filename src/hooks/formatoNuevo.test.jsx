// @vitest-environment jsdom
import { act, cleanup, renderHook } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import useJuego from './useJuego.js'
import { estadoInicial, restaurarEstado, normalizarRespuesta } from './juegoModelo.js'
import { adaptarDatos } from '../data/datosJuego.js'
import { crearServicioScorm } from '../scorm/scormService.js'

const fuente = {
  juego: { titulo: 'Catálogo de prueba', umbralAprobacion: 70, puntosPorPregunta: 20,
    insignias: [{ id: 'uno', nombre: 'Primera', descripcion: 'Primera meta', casoRequerido: 'primero' }] },
  creditos: [],
  casos: ['primero', 'segundo'].map(id => ({ id, titulo: id, preguntas: Array.from({ length: 5 }, (_, i) => ({
    id: id + i, tipo: 'opcion-multiple', opciones: [{ id: 'a' }, { id: 'b' }], respuestaCorrecta: 'a'
  })) }))
}
const terminar = (result, cantidad) => act(() => fuente.casos[0].preguntas.forEach((p, i) => result.current.responder(p.id, { respuesta: i < cantidad ? 'a' : 'b' })))
const abierta = { id: 'abierta', tipo: 'abierta', puntos: 20, opciones: [], respuestaCorrecta: null,
  rubrica: [{ criterio: 'Uno', puntos: 15 }, { criterio: 'Dos', puntos: 15 }] }

beforeEach(() => window.localStorage.clear())
afterEach(() => { cleanup(); vi.restoreAllMocks(); window.localStorage.clear() })

describe('Configuración del nuevo JSON', () => {
  it('usa puntos por pregunta del JSON y desbloquea exactamente al 70% neto', () => {
    const { result } = renderHook(() => useJuego(fuente))
    expect(result.current.maximo).toBe(200)
    act(() => { result.current.descontar('primero0'); result.current.descontar('primero1') })
    terminar(result, 4)
    expect(result.current.resumenes[0].puntos).toBe(70)
    expect(result.current.estaDesbloqueado('segundo')).toBe(true)
    expect(result.current.insigniasGanadas[0].detalle.nombre).toBe('Primera')
  })
  it('no concede insignias al terminar con menos del umbral y lee un umbral diferente', () => {
    const prueba = { ...fuente, juego: { ...fuente.juego, umbralAprobacion: 90 } }
    const { result } = renderHook(() => useJuego(prueba))
    terminar(result, 4)
    expect(result.current.resumenes[0].porcentaje).toBe(80)
    expect(result.current.estaDesbloqueado('segundo')).toBe(false)
    expect(result.current.insigniasGanadas).toEqual([])
    expect(result.current.regla).toContain('90%')
  })
  it('reinicia progreso de versión anterior, ids cambiados o firma diferente', () => {
    const { casos } = adaptarDatos(fuente)
    const inicial = estadoInicial(casos)
    const guardado = { ...inicial, respuestas: { primero0: { respuesta: 'a' } } }
    expect(restaurarEstado(guardado, casos).respuestas.primero0.puntos).toBe(20)
    expect(restaurarEstado({ ...guardado, version: 1 }, casos).respuestas).toEqual({})
    expect(restaurarEstado({ ...guardado, firma: 'antigua' }, casos).respuestas).toEqual({})
    expect(restaurarEstado({ ...guardado, respuestas: { desconocida: { respuesta: 'a' } } }, casos).respuestas).toEqual({})
    const distinto = structuredClone(casos); distinto[0].preguntas[0].id = 'nuevo'
    expect(restaurarEstado(guardado, distinto).respuestas).toEqual({})
  })
  it('reemplaza el puntaje de la abierta y revoca avances si se reduce la autoevaluación', () => {
    const datos = { ...fuente, casos: [{ id: 'primero', preguntas: [abierta] }, fuente.casos[1]] }
    const { result } = renderHook(() => useJuego(datos))
    act(() => result.current.responder('abierta', { respuesta: 'Mi postura', autoevaluacion: [true, true] }))
    expect(result.current.puntos).toBe(20)
    expect(result.current.estaDesbloqueado('segundo')).toBe(true)
    act(() => result.current.responder('segundo0', { respuesta: 'a' }))
    expect(result.current.puntos).toBe(40)
    act(() => result.current.responder('abierta', { respuesta: 'Texto revisado', autoevaluacion: [true, false] }))
    expect(result.current.respuestas.abierta.respuesta).toBe('Texto revisado')
    expect(result.current.puntos).toBe(35)
    act(() => result.current.responder('abierta', { respuesta: 'Texto revisado', autoevaluacion: [false, false] }))
    expect(result.current.puntos).toBe(0)
    expect(result.current.estaDesbloqueado('segundo')).toBe(false)
    expect(result.current.respuestas.segundo0).toBeUndefined()
    expect(result.current.insigniasGanadas).toEqual([])
  })
  it('no califica el contenido escrito ni acepta un puntaje externo', () => {
    const respuesta = normalizarRespuesta(abierta, { respuesta: 'Una postura breve', autoevaluacion: [true, true], puntos: 999 })
    expect(respuesta.puntos).toBe(20)
    expect(respuesta.correcta).toBeNull()
    expect(respuesta.evaluada).toBe(true)
  })
  it('conserva firma y estado de autoevaluación al recuperar suspend_data del LMS', () => {
    const valores = {}
    const API = { LMSInitialize: () => 'true', LMSGetValue: key => valores[key] ?? '',
      LMSSetValue: (key, valor) => { valores[key] = valor; return 'true' }, LMSCommit: () => 'true', LMSFinish: () => 'true' }
    const ventana = { API, localStorage: window.localStorage }; ventana.parent = ventana
    const servicio = crearServicioScorm(() => ventana)
    const casos = [{ id: 'primero', preguntas: [abierta] }]
    const estado = { ...estadoInicial(casos), respuestas: {
      abierta: normalizarRespuesta(abierta, { respuesta: 'Texto', autoevaluacion: [false, false], evaluada: false })
    } }
    servicio.guardarProgreso(estado)
    window.localStorage.clear()
    const recuperado = servicio.iniciar().progreso
    expect(recuperado.firma).toBe(estado.firma)
    expect(restaurarEstado(recuperado, casos).respuestas.abierta.evaluada).toBe(false)
    estado.respuestas.abierta = normalizarRespuesta(abierta, { respuesta: 'Texto', autoevaluacion: [true, false], evaluada: true })
    servicio.guardarProgreso(estado)
    expect(restaurarEstado(servicio.iniciar().progreso, casos).respuestas.abierta.puntos).toBe(15)
  })
})
