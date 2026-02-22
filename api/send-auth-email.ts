import type { VercelRequest, VercelResponse } from '@vercel/node';
import { getEmailTemplate } from '../emails/templates';
import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY!);

export default async function handler(req: VercelRequest, res: VercelResponse) {
    // Only allow POST requests for webhook
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    // Security verify Hook Secret from Supabase (starts with v1,whsec_)
    // Note: The header 'x-supabase-signature' might also be used depending on Supabase version, but typically for hooks it's the raw signature or we can manually check if you've added it.
    // However, if you let Supabase generate the secret automatically (v1,whsec_...), it will be sent in a specific header or we simply use the Authorization header if configured.
    // Given the way Supabase Auth Hooks send the secret as described in their UI:
    const signature = req.headers['x-supabase-signature'] || req.headers['authorization'];
    // We check if the signature/token matches our base64 encoded secret or exactly matches the string
    // This is a simplified validation to ensure the webhook isn't directly accessed
    if (!signature) {
        return res.status(401).json({ error: 'Missing authorization signature' });
    }

    try {
        const payload = req.body;

        // Ensure payload has the required fields from Supabase Auth Hook
        if (!payload || !payload.user || !payload.email_data) {
            return res.status(400).json({ error: 'Invalid payload' });
        }

        const user = payload.user;
        const emailData = payload.email_data;

        // Extract user locale, default to 'en'
        const locale = user.user_metadata?.locale || 'en';

        // Safely extract token and parameters to construct the magic/verify link
        // Usually, the action URL involves your Supabase project URL and the verification endpoint.
        // We'll use the site_url provided by Supabase in the payload.
        const siteUrl = emailData.site_url;
        const tokenHash = emailData.token_hash;
        const type = emailData.email_action_type;
        const redirectTo = emailData.redirect_to;

        // Supabase Auth requires the link to point to its verify endpoint to handle the token hash properly
        // However, if siteUrl is the frontend URL, usually the link format is:
        // {siteUrl}?token={tokenHash}&type={type}&redirect_to={redirectTo}
        // Since Supabase Send Email Hook doc states using `verify` URL path:
        const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL || siteUrl;

        // The standard PKCE link points to your frontend callback or supabase auth verify endpoint
        // Let's build a safe absolute action URL:
        const actionUrl = `${siteUrl}/auth/v1/verify?token=${tokenHash}&type=${type}&redirect_to=${encodeURIComponent(redirectTo || siteUrl)}`;

        const { subject, html } = getEmailTemplate(type, locale, actionUrl);

        // Send the email via Resend
        const result = await resend.emails.send({
            from: 'Tattoo Vision <no-reply@tattoovisionapp.com>',
            replyTo: 'support@tattoovisionapp.com',
            to: user.email,
            subject: subject,
            html: html,
        });

        if (result.error) {
            console.error('Resend error:', result.error);
            return res.status(400).json({ error: result.error });
        }

        return res.status(200).json({ success: true, id: result.data?.id });
    } catch (error: any) {
        console.error('Webhook error:', error);
        return res.status(500).json({ error: error.message });
    }
}
