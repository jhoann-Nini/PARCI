import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Política de privacidad — Parci',
  description:
    'Conoce qué información recopila Parci, cómo la usamos, el uso de cookies y publicidad, y tus derechos sobre tus datos.',
}

const secciones = [
  {
    titulo: '1. Qué información recopilamos',
    contenido: (
      <>
        <p>Esta política aplica a cualquier persona que use Parci, con o sin una cuenta registrada.</p>

        <h2 className="mt-6 font-mono text-lg font-bold text-tinta">Si te registrás con una cuenta</h2>
        <ul className="list-disc space-y-2 pl-5">
          <li>Correo institucional.</li>
          <li>Nombre.</li>
          <li>Carrera.</li>
          <li>Semestre, cuando lo proporciones durante el registro o actualización de tu perfil.</li>
          <li>Rol dentro de la plataforma (usuario, moderador o administrador).</li>
        </ul>

        <h2 className="mt-6 font-mono text-lg font-bold text-tinta">Si usás Parci sin registrarte</h2>
        <ul className="list-disc space-y-2 pl-5">
          <li>
            Un identificador anónimo generado por tu navegador, que no contiene directamente tu
            nombre ni correo. Se usa para evitar votos, comentarios o descargas duplicadas desde
            el mismo dispositivo cuando esa función lo requiere.
          </li>
        </ul>

        <h2 className="mt-6 font-mono text-lg font-bold text-tinta">Contenido que subís o publicás</h2>
        <ul className="list-disc space-y-2 pl-5">
          <li>Los documentos (parciales) que subís, junto con la materia, profesor, semestre y corte asociados.</li>
          <li>Los comentarios y votos que dejás en los documentos.</li>
          <li>Los reportes que hacés sobre contenido de otros usuarios.</li>
        </ul>

        <h2 className="mt-6 font-mono text-lg font-bold text-tinta">Datos técnicos y de uso</h2>
        <p>
          Nuestros proveedores de infraestructura pueden procesar información técnica básica,
          como páginas visitadas, tipo de dispositivo, navegador, dirección IP u otros datos
          necesarios para operar, proteger y mantener el servicio.
        </p>

        <h2 className="mt-6 font-mono text-lg font-bold text-tinta">Cookies y publicidad</h2>
        <p>
          Si Parci muestra anuncios mediante Google AdSense, Google y otros proveedores de
          tecnología publicitaria pueden usar cookies u otras tecnologías para servir anuncios,
          medir su rendimiento y, cuando corresponda y exista la autorización requerida, mostrar
          anuncios basados en visitas anteriores a Parci o a otros sitios.
        </p>
        <p className="mt-3">
          Las cookies publicitarias de Google pueden permitir que Google y sus socios muestren
          anuncios basados en la visita de una persona a Parci y/o a otros sitios de Internet.
          Podés gestionar tus preferencias sobre anuncios personalizados desde{' '}
          <a
            href="https://adssettings.google.com/"
            target="_blank"
            rel="noreferrer"
            className="font-medium text-lapiz-rojo underline underline-offset-2"
          >
            Configuración de anuncios de Google
          </a>
          .
        </p>
        <p className="mt-3">
          También pueden intervenir otros proveedores o redes publicitarias de terceros cuando
          estén habilitados en nuestra configuración de anuncios. En ese caso, los proveedores
          correspondientes deberán identificarse en la información de consentimiento o privacidad
          aplicable.
        </p>
      </>
    ),
  },
  {
    titulo: '2. Para qué usamos esta información',
    contenido: (
      <ul className="list-disc space-y-2 pl-5">
        <li>Verificar que quien se registra sea un estudiante o egresado real mediante su correo institucional.</li>
        <li>Organizar y mostrar los parciales de forma útil para buscar y filtrar.</li>
        <li>Personalizar la experiencia básica de la plataforma según carrera y semestre.</li>
        <li>Prevenir spam, abuso y acciones duplicadas.</li>
        <li>Moderar contenido reportado por la comunidad.</li>
        <li>Operar, mantener, proteger y mejorar Parci.</li>
        <li>Mostrar anuncios mediante Google AdSense, si esta función está habilitada.</li>
      </ul>
    ),
  },
  {
    titulo: '3. Dónde se almacenan tus datos',
    contenido: (
      <p>
        Los datos de Parci se almacenan y procesan mediante proveedores de infraestructura como
        Supabase, utilizado para la base de datos y almacenamiento de archivos, y Vercel, utilizado
        para alojar y ejecutar el sitio. Estos proveedores tienen sus propias políticas y medidas
        de seguridad y privacidad.
      </p>
    ),
  },
  {
    titulo: '4. Tus derechos',
    contenido: (
      <>
        <p>
          De acuerdo con la Ley 1581 de 2012 de Colombia y las normas que la desarrollen,
          tenés derecho a:
        </p>
        <ul className="mt-4 list-disc space-y-2 pl-5">
          <li>Conocer, actualizar y rectificar tus datos personales.</li>
          <li>Solicitar prueba de la autorización otorgada para el tratamiento de tus datos.</li>
          <li>Ser informado sobre el uso que se le ha dado a tus datos.</li>
          <li>
            Solicitar la eliminación de tus datos cuando no exista un deber legal o contractual
            que obligue a conservarlos.
          </li>
          <li>Revocar la autorización de tratamiento de tus datos cuando sea legalmente procedente.</li>
        </ul>
        <p className="mt-4">
          Para ejercer estos derechos, escribinos a{' '}
          <a
            href="mailto:parcisoporte@gmail.com"
            className="font-medium text-lapiz-rojo underline underline-offset-2"
          >
            parcisoporte@gmail.com
          </a>
          .
        </p>
      </>
    ),
  },
  {
    titulo: '5. Contenido subido por usuarios',
    contenido: (
      <p>
        Si subís un documento que no te pertenece o que infringe derechos de autor de un tercero,
        Parci puede retirarlo ante un reporte válido o cuando sea necesario para cumplir con sus
        reglas de uso. El contenido también puede ser revisado mediante nuestros mecanismos de
        moderación.
      </p>
    ),
  },
  {
    titulo: '6. Menores de edad',
    contenido: (
      <p>
        Parci está dirigido principalmente a estudiantes universitarios. Si sos menor de edad,
        recomendamos utilizar la plataforma con el conocimiento y acompañamiento de un adulto
        responsable.
      </p>
    ),
  },
  {
    titulo: '7. Cambios a esta política',
    contenido: (
      <p>
        Podemos actualizar esta política ocasionalmente para reflejar cambios en Parci, en nuestros
        proveedores o en las obligaciones legales aplicables. Si hacemos cambios importantes,
        los indicaremos de forma visible en el sitio y actualizaremos la fecha de esta página.
      </p>
    ),
  },
  {
    titulo: '8. Contacto',
    contenido: (
      <p>
        Si tenés preguntas sobre esta política, el tratamiento de tus datos o el uso de publicidad
        en Parci, escribinos a{' '}
        <a
          href="mailto:parcisoporte@gmail.com"
          className="font-medium text-lapiz-rojo underline underline-offset-2"
        >
          parcisoporte@gmail.com
        </a>
        .
      </p>
    ),
  },
]

export default function PrivacidadPage() {
  return (
    <main className="mx-auto w-full max-w-3xl px-4 py-10 sm:py-14">
      <article className="rounded border border-linea bg-papel p-5 shadow-paper sm:p-8">
        <header className="mb-8 border-b border-linea pb-6">
          <p className="mb-2 font-mono text-xs font-semibold uppercase tracking-widest text-lapiz-rojo">
            Parci
          </p>
          <h1 className="font-mono text-2xl font-bold text-tinta sm:text-3xl">
            Política de privacidad
          </h1>
          <p className="mt-3 text-sm text-tinta-suave">
            Última actualización: 30 de septiembre de 2026
          </p>
        </header>

        <p className="mb-8 text-base leading-7 text-tinta">
          Esta política explica qué datos recopila Parci, para qué se usan y qué derechos tenés
          sobre ellos. Aplica a cualquier persona que use la plataforma, con o sin cuenta registrada.
        </p>

        <div className="space-y-9">
          {secciones.map((seccion) => (
            <section key={seccion.titulo} aria-labelledby={seccion.titulo}>
              <h2 className="font-mono text-xl font-bold text-tinta">{seccion.titulo}</h2>
              <div className="mt-3 space-y-3 leading-7 text-tinta">
                {seccion.contenido}
              </div>
            </section>
          ))}
        </div>

        <aside className="mt-10 rounded border border-linea bg-white/60 p-4 text-sm leading-6 text-tinta-suave">
          <strong className="text-tinta">Importante:</strong> esta política es una base informativa
          para Parci y no reemplaza asesoría legal. Antes de publicar la versión definitiva,
          conviene revisarla con una persona con conocimiento en protección de datos en Colombia,
          especialmente si la plataforma incorpora pagos, analítica avanzada o nuevos servicios
          publicitarios.
        </aside>
      </article>
    </main>
  )
}
