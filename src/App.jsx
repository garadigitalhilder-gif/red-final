import { HashRouter, Routes, Route } from 'react-router-dom'
import Layout from './components/Layout.jsx'
import Inicio from './pages/Inicio.jsx'
import Etapa from './pages/Etapa.jsx'
import Caso from './pages/Caso.jsx'
import useJuego from './hooks/useJuego.js'
import Briefing from './pages/Briefing.jsx'
import Veredicto from './pages/Veredicto.jsx'
import Resultados from './pages/Resultados.jsx'

export default function App() {
  const juego = useJuego()
  return <HashRouter><Routes><Route element={<Layout juego={juego} />}>
    <Route index element={<Inicio />} />
    <Route path="/briefing" element={<Briefing juego={juego} />} />
    <Route path="/caso/:id" element={<Caso juego={juego} />} />
    <Route path="/veredicto" element={<Veredicto juego={juego} />} />
    <Route path="/resultados" element={<Resultados juego={juego} />} />
    <Route path="*" element={<Etapa etapa="noEncontrada" />} />
  </Route></Routes></HashRouter>
}
