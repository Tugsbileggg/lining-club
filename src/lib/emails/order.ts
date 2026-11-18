// Order email templates (Mongolian) + the notify orchestrator. Pure builders;
// delivery goes through lib/email. Imported only from server code.
import "server-only";
import type { Order } from "@/types";
import { formatPrice } from "@/lib/format";
import { siteConfig, bankTransfer } from "@/config/site";
import { sendEmail } from "@/lib/email";

function esc(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

function itemsTable(order: Order): string {
  const rows = order.items
    .map(
      (i) => `<tr>
        <td style="padding:8px 0;border-bottom:1px solid #eee;">
          ${esc(i.title)}${i.size ? ` <span style="color:#888;">(${esc(i.size)})</span>` : ""} × ${i.quantity}
        </td>
        <td style="padding:8px 0;border-bottom:1px solid #eee;text-align:right;white-space:nowrap;">
          ${formatPrice(i.price * i.quantity)}
        </td>
      </tr>`,
    )
    .join("");
  return `<table style="width:100%;border-collapse:collapse;font-size:14px;">
    ${rows}
    <tr>
      <td style="padding:12px 0 0;font-weight:600;">Нийт</td>
      <td style="padding:12px 0 0;text-align:right;font-weight:600;">${formatPrice(order.total)}</td>
    </tr>
  </table>`;
}

function shell(title: string, bodyHtml: string): string {
  return `<div style="font-family:-apple-system,Segoe UI,Roboto,Arial,sans-serif;max-width:560px;margin:0 auto;padding:24px;color:#111;">
    <h1 style="font-size:18px;letter-spacing:.04em;text-transform:uppercase;margin:0 0 16px;">Lining Club</h1>
    <h2 style="font-size:20px;margin:0 0 8px;">${esc(title)}</h2>
    ${bodyHtml}
    <p style="margin-top:24px;font-size:12px;color:#888;">Lining Club · ${esc(siteConfig.contact.phone)}</p>
  </div>`;
}

/**
 * Bank details for a transfer order. The buyer needs these once they have left
 * the site, and the order number is what staff match an incoming transfer
 * against — so it is spelled out as the transfer description.
 */
function bankBlock(order: Order): string {
  if (order.payment.provider !== "manual") return "";
  const row =(label: string, value: string, strong = false) =>
    `<tr>
       <td style="padding:3px 0;color:#666;">${esc(label)}</td>
       <td style="padding:3px 0;text-align:right;${strong ? "font-weight:600;" : ""}">${esc(value)}</td>
     </tr>`;
  return `<div style="margin-top:20px;border:1px solid #eee;border-radius:8px;padding:16px;background:#fafafa;">
    <p style="margin:0 0 10px;font-size:14px;font-weight:600;">Шилжүүлэх данс</p>
    <table style="width:100%;font-size:14px;border-collapse:collapse;">
      ${row("Банк", bankTransfer.bank)}
      ${row("Дансны дугаар", bankTransfer.account, true)}
      ${row("Хүлээн авагч", bankTransfer.accountName)}
      ${row("Шилжүүлэх дүн", formatPrice(order.total), true)}
      ${row("Гүйлгээний утга", order.orderNumber, true)}
    </table>
    <p style="margin:12px 0 0;font-size:13px;line-height:1.6;color:#444;">
      Нийт дүнг (<strong>${formatPrice(order.total)}</strong>) бүтнээр нь шилжүүлснээр захиалга баталгаажна.
      Гүйлгээний утгад <strong>${esc(order.orderNumber)}</strong> гэж заавал бичнэ үү.
    </p>
  </div>`;
}

function bankText(order: Order): string {
  if (order.payment.provider !== "manual") return "";
  return `

Шилжүүлэх данс: ${bankTransfer.bank} ${bankTransfer.account} (${bankTransfer.accountName})
Шилжүүлэх дүн: ${formatPrice(order.total)}
Гүйлгээний утга: ${order.orderNumber}
Нийт дүнг бүтнээр нь шилжүүлснээр захиалга баталгаажна.`;
}

export function orderConfirmationEmail(order: Order): {
  subject: string;
  html: string;
  text: string;
} {
  const trackUrl = `${siteConfig.url}/track?order=${order.orderNumber}`;
  const html = shell(
    "Захиалга баталгаажлаа",
    `<p style="font-size:14px;color:#444;">
       Сайн байна уу, ${esc(order.customer.name)}. Таны
       <strong>${esc(order.orderNumber)}</strong> дугаартай захиалга амжилттай үүслээ.
       Бид тантай удахгүй холбогдоно.
     </p>
     ${itemsTable(order)}
     <p style="margin-top:16px;font-size:14px;">
       Хүргэх хаяг: ${esc(order.customer.address)}${order.customer.city ? `, ${esc(order.customer.city)}` : ""}
     </p>
     ${bankBlock(order)}
     <p style="margin-top:16px;">
       <a href="${trackUrl}" style="display:inline-block;background:#111;color:#fff;text-decoration:none;padding:10px 18px;border-radius:8px;font-size:14px;">
         Захиалга хянах
       </a>
     </p>`,
  );
  const text = `Захиалга баталгаажлаа — ${order.orderNumber}\n\nСайн байна уу, ${order.customer.name}. Таны захиалга амжилттай үүслээ. Нийт: ${formatPrice(order.total)}.\nХянах: ${trackUrl}${bankText(order)}`;
  return { subject: `Захиалга баталгаажлаа — ${order.orderNumber}`, html, text };
}

export function orderNotificationEmail(order: Order): {
  subject: string;
  html: string;
  text: string;
} {
  const html = shell(
    `Шинэ захиалга — ${order.orderNumber}`,
    `<p style="font-size:14px;color:#444;">Шинэ захиалга ирлээ.</p>
     ${itemsTable(order)}
     <div style="margin-top:16px;font-size:14px;line-height:1.6;">
       <strong>Хүлээн авагч:</strong> ${esc(order.customer.name)}<br/>
       <strong>Утас:</strong> ${esc(order.customer.phone)}<br/>
       ${order.customer.email ? `<strong>И-мэйл:</strong> ${esc(order.customer.email)}<br/>` : ""}
       <strong>Хаяг:</strong> ${esc(order.customer.address)}${order.customer.city ? `, ${esc(order.customer.city)}` : ""}<br/>
       ${order.customer.note ? `<strong>Тэмдэглэл:</strong> ${esc(order.customer.note)}` : ""}
     </div>`,
  );
  const text = `Шинэ захиалга ${order.orderNumber} — ${order.customer.name} ${order.customer.phone} — Нийт ${formatPrice(order.total)}`;
  return { subject: `Шинэ захиалга — ${order.orderNumber}`, html, text };
}

/**
 * Who gets the "new order" notification. ORDER_NOTIFY_EMAIL holds one address
 * or several separated by commas, so the owner and whoever packs the orders
 * can both be on it.
 */
export function orderNotifyRecipients(): string[] {
  return (process.env.ORDER_NOTIFY_EMAIL ?? "")
    .split(",")
    .map((a) => a.trim())
    .filter(Boolean);
}

/**
 * Send order emails. Best-effort and non-blocking by design — any failure is
 * logged but never thrown, so emailing can't break order creation.
 */
export async function notifyOrder(order: Order): Promise<void> {
  const tasks: Promise<unknown>[] = [];

  if (order.customer.email) {
    const { subject, html, text } = orderConfirmationEmail(order);
    tasks.push(sendEmail({ to: order.customer.email, subject, html, text }));
  }

  const storeRecipients = orderNotifyRecipients();
  if (storeRecipients.length > 0) {
    const { subject, html, text } = orderNotificationEmail(order);
    for (const to of storeRecipients) {
      tasks.push(sendEmail({ to, subject, html, text }));
    }
  }

  try {
    await Promise.all(tasks);
  } catch (err) {
    console.error("[email] notifyOrder failed:", err);
  }
}
