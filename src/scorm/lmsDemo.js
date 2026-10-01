import { Scorm12API } from 'scorm-again/scorm12'
import styles from './lmsDemo.module.css'
import '../styles/global.css'

// Herramienta de desarrollo: no se importa ni se empaqueta en la aplicación.
const CLAVE_DEMO = 'detectives:demo-lms'
document.body.className = styles.demo
const API = new Scorm12API({ autocommit: false, lmsCommitUrl: false, logLevel: 5 })
try {
  const snapshot = JSON.parse(localStorage.getItem(CLAVE_DEMO))
  if (snapshot) API.loadFromJSON(snapshot)
} catch { /* Permite probar también con almacenamiento bloqueado. */ }
const llamadas = []
let borrandoSesion = false
function mostrar() {
  const cmi = API.renderCMIToJSONObject().cmi
  document.querySelector('#valores').textContent = JSON.stringify({
    estado: cmi.core.lesson_status, puntaje: cmi.core.score, ubicacion: cmi.core.lesson_location,
    caracteresSuspend: cmi.suspend_data?.length ?? 0, salida: cmi.core.exit
  }, null, 2)
  document.querySelector('#llamadas').textContent = llamadas.slice(-20).join('\n')
}
for (const nombre of ['LMSInitialize', 'LMSSetValue', 'LMSCommit', 'LMSFinish']) {
  const original = API[nombre].bind(API)
  API[nombre] = (...args) => {
    const respuesta = original(...args)
    llamadas.push(nombre + '(' + args.map(a => String(a).slice(0, 80)).join(', ') + ') → ' + respuesta)
    if (!borrandoSesion && ['LMSCommit', 'LMSFinish'].includes(nombre) && respuesta === 'true') {
      try { localStorage.setItem(CLAVE_DEMO, JSON.stringify(API.renderCMIToJSONObject())) } catch { /* Simulación sin persistencia. */ }
    }
    mostrar()
    return respuesta
  }
}
window.API = API
document.querySelector('#reiniciar').addEventListener('click', () => {
  borrandoSesion = true
  try { localStorage.removeItem(CLAVE_DEMO) } catch { /* No impide recargar. */ }
  window.location.reload()
})
const iframe = document.createElement('iframe')
iframe.title = 'Detectives del Texto en un LMS de prueba'
iframe.src = './index.html#/'
document.querySelector('#recurso').append(iframe)
mostrar()
