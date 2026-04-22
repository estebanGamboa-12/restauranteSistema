import { getEmailProvider, getFromEmail } from "./email-provider";

export interface ReminderEmailData {
  to: string;
  name: string;
  restaurant_name: string;
  date: string;
  time: string;
  guests: number;
}

const SUBJECT = "Recordatorio de reserva";

function buildBody(data: ReminderEmailData): string {
  const { name, restaurant_name, date, time, guests } = data;
  return `
    <div style="font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; background:#f7f3ee; padding:24px;">
      <div style="max-width:520px;margin:0 auto;background:#ffffff;border-radius:12px;padding:24px;border:1px solid #ece7df;">
        <h1 style="font-size:20px;margin:0 0 12px;color:#1f3c5a;">${SUBJECT}</h1>
        <p style="margin:0 0 16px;color:#444;">Hola ${escapeHtml(name)}</p>
        <p style="margin:0 0 16px;color:#444;">Te recordamos tu reserva en <strong>${escapeHtml(restaurant_name)}</strong></p>
        <div style="font-size:14px;color:#333;line-height:1.6;">
          <p style="margin:0;"><strong>Fecha:</strong> ${escapeHtml(date)}</p>
          <p style="margin:0;"><strong>Hora:</strong> ${escapeHtml(time)}</p>
          <p style="margin:0;"><strong>Personas:</strong> ${guests}</p>
        </div>
        <p style="margin:20px 0 0;font-size:13px;color:#777;">Te esperamos.</p>
      </div>
    </div>
  `.trim();
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export async function sendReminderEmail(data: ReminderEmailData): Promise<void> {
  const provider = await getEmailProvider();
  await provider.send({
    to: data.to,
    from: getFromEmail(),
    subject: SUBJECT,
    html: buildBody(data),
  });
}
