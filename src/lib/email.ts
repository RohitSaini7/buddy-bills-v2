import { Resend } from "resend";
import nodemailer from "nodemailer";
import { render } from "@react-email/render";
import GroupInviteEmail from "@emails/GroupInviteEmail";

const resend = new Resend(process.env.RESEND_API_KEY);

let nodemailerTransporter: nodemailer.Transporter | null = null;
if (process.env.SMTP_EMAIL && process.env.SMTP_PASSWORD) {
  nodemailerTransporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: process.env.SMTP_EMAIL,
      pass: process.env.SMTP_PASSWORD,
    },
  });
}

export interface SendGroupInviteEmailParams {
  to: string;
  groupName: string;
  inviterName: string;
  isNewUser: boolean;
  groupId: string;
}

export async function sendGroupInviteEmail({
  to,
  groupName,
  inviterName,
  isNewUser,
  groupId,
}: SendGroupInviteEmailParams) {
  const inviteLink = `${process.env.BETTER_AUTH_URL}/groups/${groupId}`;

  const subject = isNewUser
    ? `${inviterName} has invited you to join BuddyBills!`
    : `${inviterName} added you to ${groupName}`;

  try {
    const html = await render(
      GroupInviteEmail({
        inviterName,
        groupName,
        isNewUser,
        inviteLink,
      })
    );

    // Try Resend First
    if (process.env.RESEND_API_KEY) {
      const { data, error } = await resend.emails.send({
        from: "BuddyBills <onboarding@resend.dev>", // Change to a verified domain in production
        to: [to],
        subject,
        html,
      });

      if (!error) {
        return { success: true, method: "resend", data };
      }
      console.warn("Resend failed, attempting fallback to Nodemailer:", error);
    }

    // Fallback to Nodemailer
    if (nodemailerTransporter) {
      const info = await nodemailerTransporter.sendMail({
        from: `"BuddyBills" <${process.env.SMTP_EMAIL}>`,
        to,
        subject,
        html,
      });
      return { success: true, method: "nodemailer", data: info };
    }

    throw new Error(
      "No valid email transport configured (missing Resend API Key and SMTP credentials)."
    );
  } catch (error) {
    console.error("Failed to send invite email:", error);
    return { success: false, error };
  }
}
