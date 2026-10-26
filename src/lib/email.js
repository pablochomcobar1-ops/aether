import { Resend } from "resend";
import { formatINR } from "./money.js";
import { SITE_URL } from "./site.js";

const escape = (value) =>
  String(value ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);

export function buildOrderEmail(order, siteUrl = SITE_URL) {
  const a = order.address;
  const rows = order.items
    .map(
      (i) => `<tr>
        <td style="padding:12px 0;border-bottom:1px solid #262626">${escape(i.name)}<br><span style="color:#a3a3a3;font-size:13px">UK ${i.size} × ${i.qty}</span></td>
        <td style="padding:12px 0;border-bottom:1px solid #262626;text-align:right">${formatINR(i.unitPrice * i.qty)}</td>
      </tr>`
    )
    .join("");
  const line = (label, value, strong = false) =>
    `<tr><td style="padding:4px 0;color:${strong ? "#fafafa" : "#a3a3a3"}">${label}</td><td style="padding:4px 0;text-align:right;${strong ? "font-weight:600" : ""}">${value}</td></tr>`;
  const trackUrl = `${siteUrl}/orders/track?order=${order.orderNumber}`;

  const html = `<!doctype html><html><body style="margin:0;background:#000;color:#fafafa;font-family:Helvetica,Arial,sans-serif">
  <div style="max-width:560px;margin:0 auto;padding:40px 24px">
    <p style="font-size:28px;font-weight:700;letter-spacing:2px;margin:0">AETHER</p>
    <h1 style="font-size:22px;margin:32px 0 8px">Your order is confirmed</h1>
    <p style="color:#a3a3a3;margin:0 0 24px">Order ${escape(order.orderNumber)}. Use the link below to follow its progress.</p>
    <table style="width:100%;border-collapse:collapse;font-size:15px">${rows}</table>
    <table style="width:100%;border-collapse:collapse;font-size:15px;margin-top:16px">
      ${line("Subtotal", formatINR(order.subtotal))}
      ${order.discount ? line(`Discount (${escape(order.couponCode)})`, `−${formatINR(order.discount)}`) : ""}
      ${line("Shipping", order.shipping ? formatINR(order.shipping) : "Free")}
      ${line("Total", formatINR(order.total), true)}
    </table>
    <p style="margin:32px 0 4px;color:#a3a3a3;font-size:13px">Delivering to</p>
    <p style="margin:0;line-height:1.5">${escape(a.name)}<br>${escape(a.line1)}${a.line2 ? `<br>${escape(a.line2)}` : ""}<br>${escape(a.city)}, ${escape(a.state)} ${escape(a.pincode)}</p>
    <p style="margin:32px 0"><a href="${escape(trackUrl)}" style="background:#fafafa;color:#000;padding:12px 20px;text-decoration:none;font-weight:600">Track your order</a></p>
    <p style="color:#737373;font-size:12px;margin-top:40px">AETHER is a demo store. This order was paid in Razorpay test mode and will not be shipped.</p>
  </div></body></html>`;

  const text = [
    `AETHER: order ${order.orderNumber} confirmed`,
    "",
    ...order.items.map((i) => `${i.name} (UK ${i.size} × ${i.qty}): ${formatINR(i.unitPrice * i.qty)}`),
    "",
    `Subtotal: ${formatINR(order.subtotal)}`,
    ...(order.discount ? [`Discount (${order.couponCode}): −${formatINR(order.discount)}`] : []),
    `Shipping: ${order.shipping ? formatINR(order.shipping) : "Free"}`,
    `Total: ${formatINR(order.total)}`,
    "",
    `Track your order: ${trackUrl}`,
    "",
    "AETHER is a demo store. This order was paid in Razorpay test mode and will not be shipped.",
  ].join("\n");

  return { subject: `Order ${order.orderNumber} confirmed`, html, text };
}

let resend;

export async function sendOrderConfirmation(order) {
  const key = process.env.RESEND_API_KEY;
  if (!key) {
    console.warn(`[email] RESEND_API_KEY missing, skipped confirmation for ${order.orderNumber}`);
    return;
  }
  resend ??= new Resend(key);
  const { subject, html, text } = buildOrderEmail(order);
  const { error } = await resend.emails.send(
    { from: process.env.EMAIL_FROM || "AETHER <onboarding@resend.dev>", to: order.email, subject, html, text },
    { idempotencyKey: `order-confirmation/${order.orderNumber}` }
  );
  if (error) throw new Error(`Resend: ${error.message ?? "send failed"}`);
}
