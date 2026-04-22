import { Resend } from "resend";

const RESEND_API_KEY = process.env.RESEND_API_KEY!;
const FROM_EMAIL = process.env.RESEND_FROM_EMAIL || "reservas@example.com";

export const resend = new Resend(RESEND_API_KEY);

interface BaseEmailData {
  to: string;
  restaurantName: string;
  date: string; // YYYY-MM-DD
  time: string; // HH:mm
  guests: number;
}

export async function sendReservationConfirmedEmail(data: BaseEmailData) {
  const { to, restaurantName, date, time, guests } = data;

  await resend.emails.send({
    from: FROM_EMAIL,
    to,
    subject: "Reserva confirmada",
    html: `
      <div style="font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; background:#f7f3ee; padding:24px;">
        <div style="max-width:520px;margin:0 auto;background:#ffffff;border-radius:12px;padding:24px;border:1px solid #ece7df;">
          <h1 style="font-size:20px;margin:0 0 12px;color:#1f3c5a;">Reserva confirmada</h1>
          <p style="margin:0 0 16px;color:#444;">Tu reserva ha sido confirmada en <strong>${restaurantName}</strong>.</p>
          <div style="font-size:14px;color:#333;line-height:1.6;">
            <p style="margin:0;"><strong>Fecha:</strong> ${date}</p>
            <p style="margin:0;"><strong>Hora:</strong> ${time}</p>
            <p style="margin:0;"><strong>Comensales:</strong> ${guests}</p>
          </div>
          <p style="margin:20px 0 0;font-size:13px;color:#777;">Si necesitas modificar tu reserva, responde a este correo.</p>
        </div>
      </div>
    `,
  });
}

export async function sendReservationCancelledEmail(data: BaseEmailData) {
  const { to, restaurantName, date, time, guests } = data;

  await resend.emails.send({
    from: FROM_EMAIL,
    to,
    subject: "Reserva cancelada",
    html: `
      <div style="font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; background:#f7f3ee; padding:24px;">
        <div style="max-width:520px;margin:0 auto;background:#ffffff;border-radius:12px;padding:24px;border:1px solid #ece7df;">
          <h1 style="font-size:20px;margin:0 0 12px;color:#1f3c5a;">Reserva cancelada</h1>
          <p style="margin:0 0 16px;color:#444;">Tu reserva en <strong>${restaurantName}</strong> ha sido cancelada.</p>
          <div style="font-size:14px;color:#333;line-height:1.6;">
            <p style="margin:0;"><strong>Fecha:</strong> ${date}</p>
            <p style="margin:0;"><strong>Hora:</strong> ${time}</p>
            <p style="margin:0;"><strong>Comensales:</strong> ${guests}</p>
          </div>
        </div>
      </div>
    `,
  });
}

export async function sendRefundProcessedEmail(
  data: BaseEmailData & { amountCents: number }
) {
  const { to, restaurantName, date, time, guests, amountCents } = data;
  const amount = (amountCents / 100).toFixed(2);

  await resend.emails.send({
    from: FROM_EMAIL,
    to,
    subject: "Reembolso de depósito procesado",
    html: `
      <div style="font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; background:#f7f3ee; padding:24px;">
        <div style="max-width:520px;margin:0 auto;background:#ffffff;border-radius:12px;padding:24px;border:1px solid #ece7df;">
          <h1 style="font-size:20px;margin:0 0 12px;color:#1f3c5a;">Reembolso procesado</h1>
          <p style="margin:0 0 16px;color:#444;">
            Hemos procesado el reembolso de tu depósito para la reserva en <strong>${restaurantName}</strong>.
          </p>
          <div style="font-size:14px;color:#333;line-height:1.6;">
            <p style="margin:0;"><strong>Importe reembolsado:</strong> ${amount} €</p>
            <p style="margin:0;"><strong>Fecha:</strong> ${date}</p>
            <p style="margin:0;"><strong>Hora:</strong> ${time}</p>
            <p style="margin:0;"><strong>Comensales:</strong> ${guests}</p>
          </div>
        </div>
      </div>
    `,
  });
}

