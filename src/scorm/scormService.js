import { Scorm12API } from 'scorm-again/scorm12'
import { gzipSync, gunzipSync, strFromU8, strToU8 } from 'fflate'
import { CLAVE_JUEGO, COSTO_PISTA } from '../hooks/juegoModelo.js'

const CLAVE_DATOS = 'detectives-del-texto:scorm:v1'
const LIMITE_SUSPEND = 4096
const metodos = ['LMSInitialize', 'LMSGetValue', 'LMSSetValue', 'LMSCommit', 'LMSFinish']
const exito = valor => valor === true || valor === 'true'

export function buscarAPI(ventana) {
  const visitadas = new Set()
  let actual = ventana
  // Las restricciones entre orígenes y las referencias circulares no rompen el juego.
  while (actual && !visitadas.has(actual) && visitadas.size < 50) {
    visitadas.add(actual)
    try {
      if (actual.API && metodos.every(nombre => typeof actual.API[nombre] === 'function')) return actual.API
    } catch { /* El padre puede pertenecer a otro origen. */ }
    try {
      if (actual.parent === actual) break
      actual = actual.parent
    } catch { break }
  }
  return null
}

function codificar(estado) {
  const registro = entrada => Object.entries(entrada ?? {}).map(([id, dato]) =>
    [id, dato.respuesta, ...(dato.autoevaluacion ? [dato.autoevaluacion] : [])])
  // Guarda las respuestas originales; puntos e insignias se recalculan al recuperar.
  const compacto = { v: estado.version, c: estado.casoActual, r: registro(estado.respuestas),
    p: Object.keys(estado.pistas ?? {}), t: registro(estado.veredictos) }
  const bytes = gzipSync(strToU8(JSON.stringify(compacto)))
  return 'G1:' + btoa(String.fromCharCode(...bytes))
}

function decodificar(texto) {
  if (!texto) return null
  if (!texto.startsWith('G1:')) return JSON.parse(texto)
  const bytes = Uint8Array.from(atob(texto.slice(3)), c => c.charCodeAt(0))
  const compacto = JSON.parse(strFromU8(gunzipSync(bytes)))
  const registro = entradas => Object.fromEntries((entradas ?? []).map(([id, respuesta, autoevaluacion]) =>
    [id, { respuesta, ...(autoevaluacion ? { autoevaluacion } : {}) }]))
  return { version: compacto.v, casoActual: compacto.c, respuestas: registro(compacto.r),
    pistas: Object.fromEntries((compacto.p ?? []).map(id => [id, COSTO_PISTA])), veredictos: registro(compacto.t) }
}

// La fábrica permite probar ventanas y LMS aislados. La aplicación usa la instancia final.
export function crearServicioScorm(ventana = () => typeof window === 'undefined' ? null : window) {
  let api = null
  let modo = 'web'
  let iniciada = false
  let cerrada = false
  let estadoLeccion = 'incomplete'
  let error = null
  let almacenamientoDisponible = true
  let salidaRegistrada = false
  const datosWeb = {}

  function guardarLocal(clave, valor) {
    try {
      const storage = ventana()?.localStorage
      if (!storage) throw new Error('Almacenamiento no disponible')
      storage.setItem(clave, JSON.stringify(valor))
      almacenamientoDisponible = true
      return true
    } catch {
      almacenamientoDisponible = false
      return false
    }
  }
  function leerLocal() {
    try { return JSON.parse(ventana()?.localStorage?.getItem(CLAVE_JUEGO) ?? 'null') } catch { return null }
  }
  function llamar(nombre, ...args) {
    try {
      const resultado = api[nombre](...args)
      if (!exito(resultado)) {
        error = nombre + ': ' + (api.LMSGetLastError?.() ?? 'respuesta false')
        return false
      }
      return true
    } catch {
      error = nombre + ': API no disponible'
      return false
    }
  }
  function leer(nombre) {
    try { return api.LMSGetValue(nombre) || '' } catch { error = 'LMSGetValue: API no disponible'; return '' }
  }
  function resultado(ok, extra = {}) {
    return { ok, modo, cerrada, error, almacenamientoDisponible, ...extra }
  }
  function commit() {
    return llamar('LMSCommit', '')
  }
  function iniciar() {
    if (!iniciada) {
      error = null
      api = buscarAPI(ventana())
      modo = api ? 'lms' : 'web'
      if (api && !llamar('LMSInitialize', '')) {
        // Un LMS que rechaza la inicialización no impide jugar; se informa el fallo.
        api = null
        modo = 'web'
      }
      if (!api) {
        api = new Scorm12API({ autocommit: false, lmsCommitUrl: false, logLevel: 5 })
        llamar('LMSInitialize', '')
      }
      iniciada = true
      const previo = leer('cmi.core.lesson_status')
      estadoLeccion = ['incomplete', 'completed', 'passed'].includes(previo) ? previo : 'incomplete'
      if (!['incomplete', 'completed', 'passed'].includes(previo)) {
        llamar('LMSSetValue', 'cmi.core.lesson_status', estadoLeccion)
        commit()
      }
      if (!salidaRegistrada && ventana()?.addEventListener) {
        ventana().addEventListener('pagehide', event => {
          // Si la página entra en la caché del navegador, conserva la sesión activa.
          if (event.persisted) { if (!cerrada) commit() } else finalizar()
        })
        salidaRegistrada = true
      }
    }
    let progreso = null
    if (modo === 'web') progreso = leerLocal()
    else if (!cerrada) {
      try { progreso = decodificar(leer('cmi.suspend_data')) } catch { error = 'suspend_data inválido' }
      // No reutiliza datos web de otra persona cuando existe un LMS.
    }
    return resultado(!cerrada, { progreso, ubicacion: modo === 'lms' && !cerrada ? leer('cmi.core.lesson_location') : '' })
  }
  function guardarProgreso(progreso, { estado = 'incomplete', ubicacion = '/caso/' + progreso.casoActual } = {}) {
    if (!iniciada) iniciar()
    error = null
    guardarLocal(CLAVE_JUEGO, progreso)
    if (cerrada) return resultado(modo === 'web')
    if (!['incomplete', 'completed', 'passed'].includes(estado)) return resultado(false, { error: 'Estado de lección inválido' })
    estadoLeccion = estado
    let ok = llamar('LMSSetValue', 'cmi.core.lesson_status', estado)
    ok = llamar('LMSSetValue', 'cmi.core.lesson_location', String(ubicacion).slice(0, 255)) && ok
    try {
      const suspend = codificar(progreso)
      if (suspend.length > LIMITE_SUSPEND) {
        error = 'El progreso supera los 4096 caracteres de suspend_data; se conservó la copia local.'
        ok = false
      } else {
        ok = llamar('LMSSetValue', 'cmi.suspend_data', suspend) && ok
      }
    } catch { error = 'No se pudo codificar el progreso'; ok = false }
    if (modo === 'web') {
      datosWeb.estado = estado
      datosWeb.ubicacion = ubicacion
      guardarLocal(CLAVE_DATOS, datosWeb)
    }
    return resultado(commit() && ok)
  }
  function guardarPuntaje(puntos, minimo = 0, maximo = 400) {
    if (!iniciada) iniciar()
    if (![puntos, minimo, maximo].every(Number.isFinite) || maximo <= minimo) return resultado(false, { error: 'Puntaje inválido' })
    const porcentaje = Math.min(100, Math.max(0, (puntos - minimo) / (maximo - minimo) * 100))
    if (cerrada) return resultado(modo === 'web')
    let ok = true
    for (const [clave, valor] of [['min', '0'], ['max', '100'], ['raw', String(Math.round(porcentaje * 100) / 100)]]) {
      ok = llamar('LMSSetValue', 'cmi.core.score.' + clave, valor) && ok
    }
    if (modo === 'web') {
      datosWeb.puntaje = { raw: porcentaje, min: 0, max: 100 }
      guardarLocal(CLAVE_DATOS, datosWeb)
    }
    return resultado(commit() && ok)
  }
  function finalizar() {
    if (!iniciada) iniciar()
    if (cerrada) return resultado(true)
    const salida = llamar('LMSSetValue', 'cmi.core.exit', estadoLeccion === 'incomplete' ? 'suspend' : '')
    const guardado = commit()
    const terminado = llamar('LMSFinish', '')
    // Un Finish rechazado permite reintentar; nunca oculta el error del LMS.
    cerrada = terminado
    return resultado(salida && guardado && terminado)
  }
  return { iniciar, guardarProgreso, guardarPuntaje, finalizar }
}

const servicio = crearServicioScorm()
export const iniciar = (...args) => servicio.iniciar(...args)
export const guardarProgreso = (...args) => servicio.guardarProgreso(...args)
export const guardarPuntaje = (...args) => servicio.guardarPuntaje(...args)
export const finalizar = (...args) => servicio.finalizar(...args)
