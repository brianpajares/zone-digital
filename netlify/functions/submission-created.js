const nodemailer = require('nodemailer');

exports.handler = async (event) => {
  const { name, email, data } = JSON.parse(event.body).payload;
  const book  = data.book     || '';
  const interest = data.interest || '';
  const subject = book
    ? `Tu capítulo gratuito está en camino · Zone Digital`
    : `Tu capítulo gratuito está en camino · Zone Digital`;

  const transporter = nodemailer.createTransport({
    host: 'smtppro.zoho.com',
    port: 465,
    secure: true,
    auth: {
      user: process.env.ZOHO_EMAIL,
      pass: process.env.ZOHO_PASSWORD,
    },
  });

  const html = `
<!DOCTYPE html>
<html lang="es">
<head><meta charset="utf-8"/></head>
<body style="margin:0;padding:0;background:#F4F1EA;font-family:'Helvetica Neue',Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#F4F1EA;padding:40px 0;">
    <tr><td align="center">
      <table width="560" cellpadding="0" cellspacing="0" style="background:#0B0E14;border-radius:16px;overflow:hidden;">

        <!-- Header -->
        <tr>
          <td style="padding:36px 40px 24px;border-bottom:1px solid #1A1D24;">
            <span style="font-size:22px;font-weight:700;color:#FFFFFF;letter-spacing:-0.5px;">Zone Digital</span>
          </td>
        </tr>

        <!-- Body -->
        <tr>
          <td style="padding:36px 40px;">
            <p style="margin:0 0 8px;font-size:13px;font-weight:600;letter-spacing:2px;text-transform:uppercase;color:#D8FF3D;">Capítulo gratuito</p>
            <h1 style="margin:0 0 20px;font-size:26px;font-weight:700;color:#FFFFFF;line-height:1.2;">
              Hola, ${name}.<br/>Tu capítulo está en camino.
            </h1>
            <p style="margin:0 0 24px;font-size:15px;color:#A0A4B0;line-height:1.6;">
              ${book
                ? `Hemos recibido tu solicitud del libro <strong style="color:#FFFFFF;">${book}</strong>. Te enviaremos el capítulo gratuito a la brevedad.`
                : `Hemos recibido tu solicitud. Te enviaremos el capítulo gratuito sobre <strong style="color:#FFFFFF;">${interest}</strong> a la brevedad.`
              }
            </p>
            <p style="margin:0 0 32px;font-size:15px;color:#A0A4B0;line-height:1.6;">
              Mientras tanto, puedes explorar toda nuestra biblioteca de libros, cursos y apps sobre IA, minería, negocios y certificaciones.
            </p>
            <a href="https://www.zone-digital.com"
               style="display:inline-block;background:#D8FF3D;color:#0B0E14;font-size:14px;font-weight:700;padding:14px 28px;border-radius:8px;text-decoration:none;letter-spacing:0.3px;">
              Explorar la biblioteca →
            </a>
          </td>
        </tr>

        <!-- Footer -->
        <tr>
          <td style="padding:24px 40px;border-top:1px solid #1A1D24;">
            <p style="margin:0;font-size:13px;color:#555A6B;line-height:1.5;">
              El equipo de marketing de Zone Digital<br/>
              <a href="https://www.zone-digital.com" style="color:#2547F0;text-decoration:none;">www.zone-digital.com</a>
            </p>
          </td>
        </tr>

      </table>
      <p style="margin:20px 0 0;font-size:12px;color:#999;">Recibiste este email porque solicitaste un capítulo gratuito en Zone Digital.</p>
    </td></tr>
  </table>
</body>
</html>`;

  await transporter.sendMail({
    from: '"Zone Digital" <info@zone-digital.com>',
    to: email,
    subject,
    html,
  });

  return { statusCode: 200, body: 'OK' };
};
