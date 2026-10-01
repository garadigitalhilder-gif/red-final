// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { act, cleanup, renderHook } from '@testing-library/react'
import { Scorm12API } from 'scorm-again/scorm12'
import { buscarAPI, crearServicioScorm } from './scormService.js'
import { CLAVE_JUEGO, estadoInicial } from '../hooks/juegoModelo.js'
import useJuego from '../hooks/useJuego.js'

function lms() {
  const valores = {}
  return { valores,
    LMSInitialize: vi.fn(() => 'true'), LMSGetValue: vi.fn(clave => valores[clave] ?? ''),
    LMSSetValue: vi.fn((clave, valor) => { valores[clave] = valor; return 'true' }),
    LMSCommit: vi.fn(() => 'true'), LMSFinish: vi.fn(() => 'true'), LMSGetLastError: vi.fn(() => '0')
  }
}
function entorno(API) {
  const ventana = { API, localStorage: window.localStorage, addEventListener: vi.fn() }
  ventana.parent = ventana
  return ventana
}
const catalogo = [{ id: 1, dificultad: 'básica', preguntas: [
  { id: 'p1', tipo: 'opcion-multiple', puntos: 100, opciones: [{ id: 'a', texto: 'Sí' }, { id: 'b', texto: 'No' }], respuestaCorrecta: 'a' }
] }]

beforeEach(() => { window.localStorage.clear() })
afterEach(() => { cleanup(); vi.restoreAllMocks(); window.localStorage.clear() })

describe('Servicio SCORM 1.2', () => {
  it('encuentra la API en un padre y tolera padres bloqueados y ciclos', () => {
    const API = lms()
    const padre = entorno(API)
    expect(buscarAPI({ parent: { parent: padre } })).toBe(API)
    const inaccesible = {}
    Object.defineProperty(inaccesible, 'parent', { get() { throw new Error('Otro origen') } })
    expect(buscarAPI(inaccesible)).toBeNull()
    const circular = { parent: null }; circular.parent = circular
    expect(buscarAPI(circular)).toBeNull()
  })

  it('inicializa una sola vez y respeta un estado passed anterior', () => {
    const API = lms(); API.valores['cmi.core.lesson_status'] = 'passed'
    const servicio = crearServicioScorm(() => entorno(API))
    expect(servicio.iniciar().modo).toBe('lms')
    servicio.iniciar()
    expect(API.LMSInitialize).toHaveBeenCalledExactlyOnceWith('')
    expect(API.valores['cmi.core.lesson_status']).toBe('passed')
  })

  it('guarda status, ubicación, suspend_data, score y commit; finish es idempotente', () => {
    const API = lms()
    const servicio = crearServicioScorm(() => entorno(API))
    servicio.iniciar()
    expect(servicio.guardarProgreso(estadoInicial(catalogo), { estado: 'completed', ubicacion: '/resultados' }).ok).toBe(true)
    expect(servicio.guardarPuntaje(280, 0, 400).ok).toBe(true)
    expect(API.valores).toMatchObject({
      'cmi.core.lesson_status': 'completed', 'cmi.core.lesson_location': '/resultados',
      'cmi.core.score.raw': '70', 'cmi.core.score.min': '0', 'cmi.core.score.max': '100'
    })
    expect(API.valores['cmi.suspend_data'].length).toBeLessThanOrEqual(4096)
    expect(servicio.finalizar().ok).toBe(true)
    servicio.finalizar()
    expect(API.LMSFinish).toHaveBeenCalledExactlyOnceWith('')
    const commit = API.LMSCommit.mock.invocationCallOrder.at(-1)
    expect(commit).toBeLessThan(API.LMSFinish.mock.invocationCallOrder[0])
  })

  it('recupera respuestas abiertas, rúbrica, pistas y veredictos del LMS', () => {
    const API = lms()
    const servicio = crearServicioScorm(() => entorno(API))
    const progreso = { ...estadoInicial(catalogo), respuestas: { p1: { respuesta: 'Mi postura con tildes: comunicación', autoevaluacion: [true, false] } },
      pistas: { p1: 5 }, veredictos: { 1: { respuesta: 'Otra reflexión', autoevaluacion: [false, true] } } }
    servicio.guardarProgreso(progreso)
    window.localStorage.clear()
    const recuperado = servicio.iniciar().progreso
    expect(recuperado.respuestas.p1.respuesta).toBe(progreso.respuestas.p1.respuesta)
    expect(recuperado.respuestas.p1.autoevaluacion).toEqual([true, false])
    expect(recuperado.veredictos[1].respuesta).toBe('Otra reflexión')
    expect(recuperado.pistas).toEqual({ p1: 5 })
  })

  it('un LMS sin progreso no adopta el progreso local de otra sesión web', () => {
    window.localStorage.setItem(CLAVE_JUEGO, JSON.stringify({ casoActual: 4 }))
    expect(crearServicioScorm(() => entorno(lms())).iniciar().progreso).toBeNull()
  })

  it('no trunca un suspend_data demasiado grande y mantiene la copia completa local', () => {
    const API = lms()
    const servicio = crearServicioScorm(() => entorno(API))
    const inicial = estadoInicial(catalogo)
    servicio.guardarProgreso(inicial)
    const previo = API.valores['cmi.suspend_data']
    const bytes = crypto.getRandomValues(new Uint8Array(20000))
    const texto = btoa(String.fromCharCode(...bytes))
    const grande = { ...inicial, respuestas: { p1: { respuesta: texto } } }
    expect(servicio.guardarProgreso(grande).ok).toBe(false)
    expect(API.valores['cmi.suspend_data']).toBe(previo)
    expect(JSON.parse(window.localStorage.getItem(CLAVE_JUEGO)).respuestas.p1.respuesta).toBe(texto)
  })

  it('sin LMS utiliza scorm-again y localStorage; con almacenamiento bloqueado no lanza errores', () => {
    const servicio = crearServicioScorm(() => entorno(null))
    expect(servicio.iniciar().modo).toBe('web')
    expect(servicio.guardarProgreso(estadoInicial(catalogo)).ok).toBe(true)
    servicio.guardarPuntaje(50, 0, 100)
    expect(JSON.parse(window.localStorage.getItem(CLAVE_JUEGO)).casoActual).toBe(1)
    expect(servicio.iniciar().progreso.casoActual).toBe(1)
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => { throw new Error('Bloqueado') })
    const resultado = servicio.guardarProgreso(estadoInicial(catalogo))
    expect(resultado.almacenamientoDisponible).toBe(false)
    expect(servicio.finalizar().ok).toBe(true)
  })

  it('inicialización rechazada cae a web y commit rechazado queda informado', () => {
    const API = lms()
    API.LMSInitialize.mockReturnValue('false')
    expect(crearServicioScorm(() => entorno(API)).iniciar().modo).toBe('web')
    const otra = lms()
    const servicio = crearServicioScorm(() => entorno(otra))
    servicio.iniciar()
    otra.LMSCommit.mockReturnValue('false')
    expect(servicio.guardarProgreso(estadoInicial(catalogo)).ok).toBe(false)
    expect(servicio.guardarProgreso(estadoInicial(catalogo)).error).toContain('LMSCommit')
  })

  it('un finish rechazado se puede reintentar y una API que lanza excepciones no rompe la aplicación', () => {
    const API = lms()
    const servicio = crearServicioScorm(() => entorno(API))
    servicio.iniciar()
    API.LMSFinish.mockReturnValueOnce('false')
    expect(servicio.finalizar().cerrada).toBe(false)
    expect(servicio.finalizar().cerrada).toBe(true)
    const otra = lms()
    otra.LMSSetValue.mockImplementation(() => { throw new Error('Desconectado') })
    expect(() => crearServicioScorm(() => entorno(otra)).guardarProgreso(estadoInicial(catalogo))).not.toThrow()
  })

  it('suspende al salir incompleto y respeta pagehide con caché del navegador', () => {
    const API = lms()
    const ventana = entorno(API)
    const servicio = crearServicioScorm(() => ventana)
    servicio.iniciar()
    const callback = ventana.addEventListener.mock.calls[0][1]
    callback({ persisted: true })
    expect(API.LMSFinish).not.toHaveBeenCalled()
    callback({ persisted: false })
    expect(API.valores['cmi.core.exit']).toBe('suspend')
    expect(API.LMSFinish).toHaveBeenCalledTimes(1)
  })

  it('usa una API real de scorm-again como LMS padre y recupera su snapshot', () => {
    const API = new Scorm12API({ autocommit: false, lmsCommitUrl: false, logLevel: 5 })
    const servicio = crearServicioScorm(() => entorno(API))
    expect(servicio.iniciar().modo).toBe('lms')
    expect(servicio.guardarProgreso(estadoInicial(catalogo), { estado: 'passed' }).ok).toBe(true)
    expect(servicio.guardarPuntaje(400, 0, 400).ok).toBe(true)
    const snapshot = API.renderCMIToJSONObject()
    expect(snapshot.cmi.core.score.raw).toBe('100')
    expect(servicio.finalizar().ok).toBe(true)
    const nuevaAPI = new Scorm12API({ autocommit: false, lmsCommitUrl: false, logLevel: 5 })
    nuevaAPI.loadFromJSON(snapshot)
    expect(crearServicioScorm(() => entorno(nuevaAPI)).iniciar().progreso.casoActual).toBe(1)
  })

  it('el hook comunica incomplete, passed y completed y cierra mediante finalizarJuego', () => {
    const API = lms()
    const servicio = crearServicioScorm(() => entorno(API))
    const { result } = renderHook(() => useJuego(catalogo, servicio))
    expect(API.valores['cmi.core.lesson_status']).toBe('incomplete')
    act(() => result.current.responder('p1', { respuesta: 'a' }))
    expect(API.valores['cmi.core.lesson_status']).toBe('passed')
    expect(API.valores['cmi.core.score.raw']).toBe('100')
    act(() => result.current.reintentarCaso(1))
    expect(API.valores['cmi.core.lesson_status']).toBe('incomplete')
    act(() => result.current.responder('p1', { respuesta: 'b' }))
    expect(API.valores['cmi.core.lesson_status']).toBe('completed')
    act(() => result.current.finalizarJuego())
    expect(API.LMSFinish).toHaveBeenCalledTimes(1)
  })
})
