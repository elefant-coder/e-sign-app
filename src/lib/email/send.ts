import { Resend } from 'resend'
import {
  signRequestTemplate,
  completionTemplate,
  SignRequestTemplateData,
  CompletionTemplateData,
} from './templates'

// Lazy initialization to avoid build-time errors
let resend: Resend | null = null

function getResend(): Resend {
  if (!resend) {
    const apiKey = process.env.RESEND_API_KEY
    if (!apiKey) {
      throw new Error('RESEND_API_KEY is not configured')
    }
    resend = new Resend(apiKey)
  }
  return resend
}

// Use verified domain for production, or resend.dev for testing (can only send to account owner's email)
const FROM_EMAIL = process.env.FROM_EMAIL || 'EleSign <onboarding@resend.dev>'

interface SendSignRequestEmailParams {
  to: string
  clientName: string
  companyName: string
  contractTitle: string
  signUrl: string
}

export async function sendSignRequestEmail({
  to,
  clientName,
  companyName,
  contractTitle,
  signUrl,
}: SendSignRequestEmailParams): Promise<void> {
  const templateData: SignRequestTemplateData = {
    clientName,
    companyName,
    contractTitle,
    signUrl,
  }

  const { error } = await getResend().emails.send({
    from: FROM_EMAIL,
    to,
    subject: `【署名のお願い】${contractTitle} - ${companyName}`,
    html: signRequestTemplate(templateData),
  })

  if (error) {
    console.error('Failed to send sign request email:', error)
    throw new Error('メールの送信に失敗しました')
  }
}

interface SendCompletionEmailParams {
  to: string[]
  recipientNames: string[]
  contractTitle: string
  signers: Array<{
    name: string
    signedAt: string
  }>
  downloadUrl?: string
  attachmentBase64?: string
  attachmentFilename?: string
}

export async function sendCompletionEmail({
  to,
  recipientNames,
  contractTitle,
  signers,
  downloadUrl,
  attachmentBase64,
  attachmentFilename,
}: SendCompletionEmailParams): Promise<void> {
  const client = getResend()

  // Send individual emails to each recipient
  const sendPromises = to.map((email, index) => {
    const recipientName = recipientNames[index] || '関係者'

    const templateData: CompletionTemplateData = {
      recipientName,
      contractTitle,
      signers,
      downloadUrl,
    }

    const attachments = attachmentBase64 && attachmentFilename
      ? [
          {
            filename: attachmentFilename,
            content: attachmentBase64,
          },
        ]
      : undefined

    return client.emails.send({
      from: FROM_EMAIL,
      to: email,
      subject: `【署名完了】${contractTitle}`,
      html: completionTemplate(templateData),
      attachments,
    })
  })

  const results = await Promise.all(sendPromises)

  const errors = results.filter((r) => r.error)
  if (errors.length > 0) {
    console.error('Failed to send some completion emails:', errors)
    // Don't throw, as some emails may have succeeded
  }
}
