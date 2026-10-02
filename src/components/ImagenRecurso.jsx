import { useState } from 'react'
import styles from './ImagenRecurso.module.css'

export default function ImagenRecurso({ imagen, titulo, miniatura = false }) {
  const [fallida, setFallida] = useState(null)
  if (!imagen) return null
  const decorativa = imagen.alt === ''
  const altOriginal = imagen.alt ?? `Imagen representativa de ${titulo}; descripción pendiente`
  const alt = miniatura && /\[(COMPLETAR|REVISAR)\]/u.test(altOriginal) ? 'Pendiente' : altOriginal
  const disponible = imagen.src && fallida !== imagen.src
  const mostrarDato = valor => !valor ? 'Pendiente'
    : miniatura ? valor.replace(/\[(COMPLETAR|REVISAR)\]/gu, 'Pendiente') : valor
  function avisar() {
    console.warn(`Imagen del recurso no disponible: ${imagen.src}`, titulo)
    setFallida(imagen.src)
  }
  return <figure className={`${styles.figura} ${miniatura ? styles.miniatura : ''}`}>
    {disponible
      ? <img src={imagen.src} alt={alt} aria-hidden={decorativa ? true : undefined}
        loading="lazy" width="800" height="450" onError={avisar} />
      : <div className={styles.marcador} role={decorativa ? undefined : 'img'}
        aria-hidden={decorativa ? true : undefined} aria-label={decorativa ? undefined : `Imagen no disponible: ${alt}`}>
        <span aria-hidden="true">▧</span><div>Imagen no disponible{!decorativa && <p>{alt}</p>}</div>
      </div>}
    <figcaption>
      <strong>{titulo}</strong>
      <p>{mostrarDato(imagen.descripcion)}</p>
      {imagen.generadaConIA === true && <p>{miniatura ? 'Generada con IA' : 'Imagen generada con IA'}</p>}
      <div>Autor: {mostrarDato(imagen.autor)} · Licencia: {mostrarDato(imagen.licencia)} · Fuente: {' '}
        {/^https?:\/\//u.test(imagen.url ?? '')
          ? <a href={imagen.url} target="_blank" rel="noopener noreferrer">{mostrarDato(imagen.fuente)}</a> : mostrarDato(imagen.fuente)}
      </div>
    </figcaption>
  </figure>
}
