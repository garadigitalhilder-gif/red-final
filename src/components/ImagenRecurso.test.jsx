// @vitest-environment jsdom
import { render, screen, fireEvent, cleanup } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import ImagenRecurso from './ImagenRecurso.jsx'

afterEach(() => { cleanup(); vi.restoreAllMocks() })
const imagen = { src: 'img/caso1.webp', alt: 'Una canoa en el río', autor: 'Autora', licencia: 'CC BY', fuente: 'Archivo', url: 'https://example.com/imagen' }

describe('Imagen del recurso', () => {
  it('muestra texto alternativo, dimensiones y atribución enlazada', () => {
    render(<ImagenRecurso imagen={imagen} titulo="Caso 1" />)
    const img = screen.getByRole('img')
    expect(img.getAttribute('src')).toBe('img/caso1.webp')
    expect(img.getAttribute('alt')).toBe(imagen.alt)
    expect(img.getAttribute('loading')).toBe('lazy')
    expect(img.getAttribute('width')).toBe('800')
    expect(img.getAttribute('height')).toBe('450')
    expect(screen.getByRole('link', { name: 'Archivo' }).getAttribute('href')).toBe(imagen.url)
    expect(screen.getByRole('link', { name: 'Archivo' }).getAttribute('target')).toBe('_blank')
    expect(screen.getByRole('link', { name: 'Archivo' }).getAttribute('rel')).toBe('noopener noreferrer')
  })
  it('sustituye imágenes fallidas por un marcador accesible y avisa', () => {
    const aviso = vi.spyOn(console, 'warn').mockImplementation(() => {})
    render(<ImagenRecurso imagen={imagen} titulo="Caso 1" />)
    fireEvent.error(screen.getByRole('img'))
    expect(screen.getByRole('img').getAttribute('aria-label')).toContain(imagen.alt)
    expect(screen.getByText('Imagen no disponible')).toBeTruthy()
    expect(screen.getByText(imagen.alt)).toBeTruthy()
    expect(aviso).toHaveBeenCalledOnce()
  })
  it('muestra los datos pendientes sin crear enlaces a marcadores', () => {
    render(<ImagenRecurso imagen={{ ...imagen, autor: '[COMPLETAR]', fuente: '[COMPLETAR]', licencia: '[COMPLETAR]', url: '[COMPLETAR]', descripcion: 'Retrato del caso' }} titulo="Caso 1" miniatura />)
    expect(screen.queryByRole('link')).toBeNull()
    expect(screen.getByText('Retrato del caso')).toBeTruthy()
    expect(screen.getByText(/Autor: Pendiente/)).toBeTruthy()
    expect(screen.queryByText(/\[COMPLETAR\]/)).toBeNull()
  })
  it('oculta imágenes decorativas a tecnologías de asistencia', () => {
    const { container } = render(<ImagenRecurso imagen={{ ...imagen, alt: '' }} titulo="Decoración" />)
    expect(screen.queryByRole('img')).toBeNull()
    expect(container.querySelector('img').getAttribute('aria-hidden')).toBe('true')
  })
  it('identifica IA y sustituye los marcadores pendientes en créditos', () => {
    render(<ImagenRecurso imagen={{ ...imagen, alt: '[REVISAR] Descripción', descripcion: 'Fecha: [COMPLETAR].', url: '', generadaConIA: true }} titulo="Portada" miniatura />)
    expect(screen.getByRole('img').getAttribute('alt')).toBe('Pendiente')
    expect(screen.getByText('Generada con IA')).toBeTruthy()
    expect(screen.getByText('Fecha: Pendiente.')).toBeTruthy()
    expect(screen.queryByRole('link')).toBeNull()
  })
  it('conserva marcadores originales e identifica IA en la introducción', () => {
    render(<ImagenRecurso imagen={{ ...imagen, alt: '[REVISAR] Descripción', descripcion: 'Fecha: [COMPLETAR].', generadaConIA: true }} titulo="Portada" />)
    expect(screen.getByRole('img').getAttribute('alt')).toBe('[REVISAR] Descripción')
    expect(screen.getByText('Imagen generada con IA')).toBeTruthy()
    expect(screen.getByText('Fecha: [COMPLETAR].')).toBeTruthy()
  })
})
