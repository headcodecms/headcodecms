// Mail through Resend's API (RESEND_API_KEY, a sending-only key). Without a
// key, for example locally, the mail is written to the server log.
const from = process.env.EMAIL_FROM ?? 'Headcode <no-reply@headcodecms.com>'

export const sendEmail = async ({
  to,
  subject,
  text,
}: {
  to: string
  subject: string
  text: string
}) => {
  const key = process.env.RESEND_API_KEY
  if (!key) {
    console.log(`[email] to ${to}: ${subject}\n${text}`)
    return
  }
  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      authorization: `Bearer ${key}`,
      'content-type': 'application/json',
    },
    body: JSON.stringify({ from, to, subject, text }),
  })
  if (!res.ok) throw new Error(`Resend: ${res.status} ${await res.text()}`)
}
