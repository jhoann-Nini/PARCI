'use client'

import { useState } from 'react'
import {
  MessageSquare,
  ChevronDown,
  ChevronUp,
  Trash2,
  AlertTriangle,
} from 'lucide-react'

import { ReportarButton } from '@/components/parciales/ReportarButton'
import { Button } from '@/components/ui/Button'
import { Modal } from '@/components/ui/Modal'

import { formatFecha, cn } from '@/lib/utils'
import { getAnonId } from '@/lib/anonId'

import type { Comentario } from '@/types'


interface ComentariosPanelProps {
  documentoId: string
  comentariosCountInicial: number
  loggedIn: boolean
  className?: string
}


export function ComentariosPanel({
  documentoId,
  comentariosCountInicial,
  loggedIn,
  className,
}: ComentariosPanelProps) {

  const [abierto, setAbierto] = useState(false)

  const [cargado, setCargado] = useState(false)
  const [cargando, setCargando] = useState(false)

  const [comentarios, setComentarios] = useState<Comentario[]>([])

  const [count, setCount] = useState(comentariosCountInicial)

  const [texto, setTexto] = useState('')

  const [enviando, setEnviando] = useState(false)

  const [eliminando, setEliminando] = useState<string | null>(null)

  const [comentarioAEliminar, setComentarioAEliminar] =
    useState<string | null>(null)

  const [error, setError] = useState('')
  const [confirmacion, setConfirmacion] = useState('')

  const [editando, setEditando] = useState(false)


  const propio = comentarios.find(
    (comentario) => comentario.es_propio
  )


  async function toggle() {

    const siguiente = !abierto

    setAbierto(siguiente)

    if (siguiente && !cargado) {
      await cargar()
    }
  }


  async function cargar() {

    setCargando(true)

    try {

      const anonId = loggedIn
        ? ''
        : getAnonId()


      const params = new URLSearchParams({
        documento_id: documentoId,
      })


      if (anonId) {
        params.set('anon_id', anonId)
      }


      const respuesta = await fetch(
        `/api/comentarios?${params.toString()}`
      )


      if (!respuesta.ok) {
        return
      }


      const datos = await respuesta.json() as Comentario[]

      console.log('Comentarios recibidos:', datos)


      setComentarios(datos)

      setCount(datos.length)

      setCargado(true)


      const comentarioPropio = datos.find(
        (comentario) => comentario.es_propio
      )


      if (comentarioPropio) {

        setTexto(
          comentarioPropio.contenido
        )

      }


    } finally {

      setCargando(false)

    }

  }



  async function enviar(
    e: React.FormEvent
  ) {

    e.preventDefault()


    if (!texto.trim() || enviando) {
      return
    }


    setEnviando(true)

    setError('')
    setConfirmacion('')


    try {


      const respuesta = await fetch(
        '/api/comentarios',
        {
          method: 'POST',

          headers: {
            'Content-Type': 'application/json',
          },

          body: JSON.stringify({
            documento_id: documentoId,

            contenido: texto.trim(),

            anon_id: loggedIn
              ? undefined
              : getAnonId(),
          }),
        }
      )


      const datos = await respuesta.json()


      if (!respuesta.ok) {

        setError(
          datos.error ?? 'No pudimos publicar el comentario. Inténtalo de nuevo.'
        )

        return

      }



      setComentarios((previos) => [

        ...previos.filter(
          (comentario) => !comentario.es_propio
        ),

        {
          ...datos,
          es_propio: true,
        } as Comentario,

      ])



      if (!propio) {

        setCount(
          (actual) => actual + 1
        )

      }


      setEditando(false)
      setConfirmacion(propio ? 'Comentario actualizado.' : 'Comentario publicado.')

    } catch {

      setError(
        'No pudimos publicar el comentario. Revisa tu conexión e inténtalo de nuevo.'
      )


    } finally {

      setEnviando(false)

    }

  }



  async function eliminar(id: string) {

    setEliminando(id)

    setError('')
    setConfirmacion('')

    try {


      const respuesta = await fetch(
        '/api/comentarios',
        {
          method: 'DELETE',

          headers: {
            'Content-Type': 'application/json',
          },


          body: JSON.stringify({

            comentario_id: id,

            anon_id: loggedIn
              ? undefined
              : getAnonId(),

          }),

        }
      )


      const datos = await respuesta.json()


      if (!respuesta.ok) {

        setError(
          datos.error ?? 'No pudimos eliminar el comentario. Inténtalo de nuevo.'
        )

        return

      }


      setComentarios(
        (previos) =>
          previos.filter(
            (comentario) => comentario.id !== id
          )
      )


      setCount(
        (actual) =>
          Math.max(0, actual - 1)
      )


      setTexto('')

      setEditando(false)

      setComentarioAEliminar(null)
      setCargado(false)
      setConfirmacion('Comentario eliminado.')

    } catch {

      setError(
        'Ocurrió un error inesperado'
      )


    } finally {

      setEliminando(null)

    }

  }



  return ( 
    <div className={cn('flex flex-col', className)}>

  <button
    type="button"
    onClick={toggle}
    aria-expanded={abierto}
    aria-controls={`comentarios-${documentoId}`}
    className="
      flex items-center gap-1.5
      text-xs font-medium
      text-tinta-suave
      hover:text-tinta
      transition-colors
    "
  >

    <MessageSquare aria-hidden="true" className="h-3.5 w-3.5" />

    {count} comentario{count !== 1 ? 's' : ''}

    {
      abierto
        ? <ChevronUp aria-hidden="true" className="h-3 w-3" />
        : <ChevronDown aria-hidden="true" className="h-3 w-3" />
    }

  </button>


  {
    abierto && (

      <div
        id={`comentarios-${documentoId}`}
        className="
          mt-3
          flex flex-col
          gap-3
          border-t
          border-linea
          pt-3
        "
      >

        {
          cargando ? (

            <p className="text-xs text-tinta-suave">
              Cargando comentarios…
            </p>

          ) : (

            <ul className="flex flex-col gap-3">

              {
                comentarios.map((comentario) => (

                  <li
                    key={comentario.id}
                    className="
                      rounded-md
                      bg-papel/60
                      p-3
                    "
                  >

                    <div
                      className="
                        flex
                        justify-between
                        items-center
                        gap-2
                      "
                    >

                      <span
                        className="
                          font-mono
                          text-[11px]
                          text-tinta-suave
                        "
                      >

                        {comentario.nombre_autor ?? 'Anónimo'}

                        {' · '}

                        {formatFecha(comentario.created_at)}

                      </span>


                      <div className="flex items-center gap-2">


                        {
                          !comentario.es_propio && (
                            <ReportarButton
                              comentarioId={comentario.id}
                            />
                          )
                        }



                        {
                          comentario.es_propio && (

                            <button
                              type="button"
                              onClick={() => {
                                setEditando(true)
                                setTexto(comentario.contenido)
                              }}
                              className="
                                text-xs
                                text-tinta-suave
                                hover:text-tinta
                              "
                            >

                              Editar comentario

                            </button>

                          )
                        }



                        {
                          comentario.es_propio && (

                            <button
                              type="button"
                              title="Eliminar comentario"
                              aria-label="Eliminar comentario"
                              onClick={() =>
                                setComentarioAEliminar(
                                  comentario.id
                                )
                              }
                              disabled={
                                eliminando === comentario.id
                              }
                              className="
                                text-tinta-suave
                                hover:text-lapiz-rojo
                                disabled:opacity-50
                              "
                            >

                              <Trash2 aria-hidden="true" className="h-3.5 w-3.5" />

                            </button>

                          )
                        }


                      </div>

                    </div>



                    <p
                      className="
                        mt-2
                        text-sm
                        text-tinta
                      "
                    >

                      {comentario.contenido}

                    </p>


                  </li>

                ))
              }



              {
                comentarios.length === 0 && (

                  <p className="text-xs text-tinta-suave">

                    Todavía no hay comentarios.

                    <br />

                    Sé el primero en contar qué tal estuvo este parcial.

                  </p>

                )
              }


            </ul>

          )
        }




        {
          (!propio || editando) && (

            <form
              onSubmit={enviar}
              className="flex flex-col gap-2"
            >

              <label htmlFor={`comentario-${documentoId}`} className="text-xs font-medium text-tinta">Tu comentario</label>

              <textarea
                id={`comentario-${documentoId}`}
                aria-describedby={`comentario-ayuda-${documentoId}`}
                value={texto}

                onChange={(e) =>
                  setTexto(e.target.value)
                }

                maxLength={500}

                rows={2}

                placeholder={
                  propio
                    ? 'Actualiza tu comentario...'
                    : 'Comparte tu experiencia con este parcial...'
                }

                className="
                  rounded-md
                  border
                  border-linea
                  bg-papel
                  px-3
                  py-2
                  text-sm
                  text-tinta
                  focus:outline-2
                  focus:outline-lapiz-rojo
                "

              />



              {
                error && (

                  <p role="alert" className="text-xs text-lapiz-rojo">

                    {error}

                  </p>

                )
              }



              {confirmacion && <p role="status" className="text-xs text-verde-musgo">{confirmacion}</p>}

              <p id={`comentario-ayuda-${documentoId}`} className="text-xs text-tinta-suave">Máximo 500 caracteres. Escribe algo útil para quienes estudian esta materia.</p>

              <div className="flex justify-end gap-2">


                {
                  editando && (

                    <Button
                      type="button"
                      variant="secondary"
                      size="sm"
                      onClick={() => {

                        setEditando(false)

                        setTexto(
                          propio?.contenido ?? ''
                        )

                      }}
                    >

                      Cancelar

                    </Button>

                  )
                }



                <Button
                  type="submit"
                  variant="secondary"
                  size="sm"
                  disabled={
                    !texto.trim() ||
                    enviando
                  }
                >

                  {
                    enviando
                      ? 'Guardando...'
                      : propio
                        ? 'Guardar cambios'
                        : 'Publicar comentario'
                  }

                </Button>


              </div>


            </form>

          )
        }


      </div>

    )
  }




  <Modal

    open={
      comentarioAEliminar !== null
    }

    onClose={() =>
      !eliminando &&
      setComentarioAEliminar(null)
    }

    title="Eliminar comentario"

  >

    <div className="flex flex-col gap-4">


      <div className="flex items-start gap-3">

        <div
          className="
            flex
            h-9
            w-9
            items-center
            justify-center
            rounded-full
            bg-lapiz-rojo/10
            text-lapiz-rojo
          "
        >

          <AlertTriangle aria-hidden="true" className="h-4 w-4" />

        </div>



        <div>

          <p className="text-sm font-medium text-tinta">

            ¿Eliminar este comentario?

          </p>


          <p className="text-xs text-tinta-suave">

            Esta acción no se puede deshacer.

          </p>


        </div>


      </div>




      <div className="flex justify-end gap-2">


        <Button
          type="button"
          variant="secondary"
          size="sm"
          onClick={() =>
            setComentarioAEliminar(null)
          }
          disabled={
            eliminando !== null
          }
        >

          Cancelar

        </Button>




        <Button
          type="button"
          variant="danger"
          size="sm"
          onClick={() =>
            comentarioAEliminar &&
            eliminar(comentarioAEliminar)
          }
          disabled={
            eliminando !== null
          }
        >

          {
            eliminando
              ? 'Eliminando...'
              : 'Eliminar comentario'
          }

        </Button>


      </div>


    </div>


  </Modal>


</div>
)
}