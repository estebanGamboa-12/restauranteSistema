"use client";

export default function PrivacidadPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6 lg:px-8">
      <div className="rounded-3xl border border-border bg-card p-8 text-card-foreground shadow-[0_20px_50px_rgba(45,31,28,0.25)] sm:p-10">
        <h1 className="font-display text-3xl font-semibold tracking-tight sm:text-4xl">
          Política de Privacidad
        </h1>
        <p className="mt-4 text-sm text-card-foreground/75">
          Esta política explica cómo tratamos tus datos cuando realizas una reserva.
        </p>

        <div className="prose prose-sm mt-10 max-w-none text-card-foreground prose-headings:font-display prose-headings:text-card-foreground prose-p:text-card-foreground/85 prose-li:text-card-foreground/85 prose-strong:text-card-foreground prose-h2:mt-8 prose-h2:text-lg">
          <h2>Responsable</h2>
          <p>
            El responsable del tratamiento es el restaurante que gestiona este sitio
            web. Para cualquier solicitud relacionada con privacidad, contacta con el
            restaurante.
          </p>

          <h2>Datos que recogemos</h2>
          <ul>
            <li>Nombre</li>
            <li>Teléfono</li>
            <li>Email (opcional)</li>
            <li>Detalles de la reserva (fecha, hora, número de personas, zona)</li>
            <li>Mensaje opcional (alergias, comentarios, ocasión especial)</li>
          </ul>

          <h2>Finalidad</h2>
          <p>
            Usamos los datos únicamente para gestionar tu reserva, confirmar o
            contactar contigo, y cumplir obligaciones legales.
          </p>

          <h2>Base legal</h2>
          <p>
            La base legal es la ejecución de tu solicitud de reserva y, cuando sea
            aplicable, el cumplimiento de obligaciones legales.
          </p>

          <h2>Conservación</h2>
          <p>
            Conservamos los datos el tiempo necesario para gestionar la reserva y
            durante los plazos exigidos por la normativa aplicable.
          </p>

          <h2>Destinatarios</h2>
          <p>
            No cedemos tus datos a terceros salvo obligación legal. Si realizas un
            pago de depósito, el procesamiento del pago se realiza a través de Stripe.
          </p>

          <h2>Tus derechos</h2>
          <p>
            Puedes ejercer tus derechos de acceso, rectificación, supresión,
            oposición, limitación y portabilidad contactando con el restaurante.
          </p>

          <h2>Actualizaciones</h2>
          <p>
            Esta política puede actualizarse para reflejar cambios legales o del
            servicio.
          </p>
        </div>
      </div>
    </div>
  );
}
