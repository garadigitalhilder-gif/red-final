import ImagenRecurso from '../components/ImagenRecurso.jsx'
import datos from '../data/interfaz.json'
import styles from './Juego.module.css'

export default function Creditos({ juego }) {
  const ui = datos.juego
  return <section className={styles.pagina}>
    <h1>{ui.creditos}</h1>
    <p>Salvo donde se indique, este recurso se publica bajo CC BY-NC-SA 4.0. Las imágenes y los textos conservan la licencia de su fuente original.</p>
    <section className={styles.panel}>
      <h2>Imágenes</h2>
      <ImagenRecurso imagen={juego.portada} titulo="Portada" miniatura />
      {juego.catalogo.map(caso => <ImagenRecurso key={caso.id} imagen={caso.imagen} titulo={'Caso ' + caso.id + ': ' + caso.titulo} miniatura />)}
    </section>
    {!juego.creditos.length && <p>{ui.sinCreditos}</p>}
    {juego.creditos.map((credito, index) => <section key={index} className={styles.panel}>
      <h2>{credito.obra}</h2><p>{ui.caso} {credito.caso}</p>
      <dl><dt>{datos.componentes.autor}</dt><dd>{credito.autor}</dd>
        <dt>{datos.componentes.anio}</dt><dd>{credito.anio ?? ui.sinAnio}</dd>
        {credito.publicadoEn && <><dt>{ui.publicadoEn}</dt><dd>{credito.publicadoEn}</dd></>}
        <dt>{datos.componentes.fuente}</dt><dd>{/^https?:\/\//u.test(credito.url ?? '')
          ? <a href={credito.url}>{credito.fuente}</a> : credito.fuente}</dd>
        <dt>{datos.componentes.licencia}</dt><dd>{credito.licencia}</dd>
      </dl>
    </section>)}
  </section>
}
