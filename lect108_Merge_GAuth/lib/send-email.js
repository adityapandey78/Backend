import { Resend } from "resend";

export async function sendEmail({ to, subject, html }) {
    const apiKey = process.env.RESEND_API_KEY;
    if (!apiKey) {
        // Do not throw at import time; fail at call time so app can start.
        const msg = "RESEND_API_KEY is not set. Emails cannot be sent.";
        console.warn(msg);
        throw new Error(msg);
    }

    const resend = new Resend(apiKey);

    try {
        const result = await resend.emails.send({
            from: "Website <website@resend.dev>",
            to: Array.isArray(to) ? to : [to],
            subject,
            html,
        });
        console.log("email sent:", result);
        return result;
    } catch (err) {
        console.error("sendEmail error:", err);
        throw err;
    }
}
