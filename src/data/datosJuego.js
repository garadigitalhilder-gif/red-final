import fuente from './casos.json'
import interfaz from './interfaz.json'

// Adapta el formato anterior en memoria; nunca escribe sobre el catálogo fuente.
export function adaptarDatos(entrada = fuente) {
  const legado = Array.isArray(entrada)
  const casos = legado ? entrada : entrada.casos
  const configuracion = legado ? {
    ...interfaz.configuracionLegada, titulo: interfaz.interfaz.nombre,
    insignias: casos.map((caso, index) => caso.insignia ?? {
      id: Object.keys(interfaz.componentes.insignias)[index],
      ...Object.values(interfaz.componentes.insignias)[index], casoRequerido: caso.id
    })
  } : entrada.juego
  return { juego: configuracion,
    casos: casos.map(caso => ({ ...caso, glosario: caso.glosario ?? [],
      preguntas: caso.preguntas.map(p => ({ ...p, puntos: p.puntos ?? configuracion.puntosPorPregunta })) })),
    creditos: legado ? casos.map(c => ({ caso: c.id, autor: c.texto?.autor, obra: c.texto?.titulo,
      anio: c.texto?.anio, fuente: c.texto?.fuente, licencia: c.texto?.licencia, url: '' })) : entrada.creditos ?? [] }
}
export default fuente
