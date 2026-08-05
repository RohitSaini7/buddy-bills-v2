import * as React from "react";
import {
  Html,
  Head,
  Preview,
  Body,
  Container,
  Section,
  Text,
  Button,
} from "@react-email/components";

interface GroupInviteEmailProps {
  inviterName: string;
  groupName: string;
  isNewUser: boolean;
  inviteLink: string;
}

export default function GroupInviteEmail({
  inviterName = "Someone",
  groupName = "a group",
  isNewUser = true,
  inviteLink = "https://buddybills.app",
}: GroupInviteEmailProps) {
  const previewText = isNewUser
    ? `${inviterName} has invited you to join BuddyBills!`
    : `${inviterName} added you to ${groupName}`;

  return (
    <Html>
      <Head />
      <Preview>{previewText}</Preview>
      <Body style={main}>
        <Container style={container}>
          <Section style={header}>
            <Text style={logoText}>BuddyBills</Text>
          </Section>
          <Section style={content}>
            <Text style={greeting}>Hello!</Text>
            {isNewUser ? (
              <Text style={text}>
                <strong>{inviterName}</strong> has invited you to join <strong>BuddyBills</strong>{" "}
                to help settle expenses for the group <strong>{groupName}</strong>.
              </Text>
            ) : (
              <Text style={text}>
                <strong>{inviterName}</strong> has added you to the group{" "}
                <strong>{groupName}</strong> on BuddyBills.
              </Text>
            )}

            <Section style={buttonContainer}>
              <Button style={button} href={inviteLink}>
                {isNewUser ? "Accept Invite & Join" : "View Group"}
              </Button>
            </Section>

            <Text style={footerText}>
              If you aren&apos;t expecting this invitation, you can safely ignore this email.
            </Text>
          </Section>
        </Container>
      </Body>
    </Html>
  );
}

// Styles
const main = {
  backgroundColor: "#f6f9fc",
  fontFamily:
    '-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,"Helvetica Neue",Ubuntu,sans-serif',
};

const container = {
  backgroundColor: "#ffffff",
  margin: "0 auto",
  padding: "20px 0 48px",
  marginBottom: "64px",
  borderRadius: "8px",
  boxShadow: "0 4px 6px rgba(0, 0, 0, 0.05)",
  maxWidth: "580px",
};

const header = {
  padding: "32px",
  borderBottom: "1px solid #e6ebf1",
  textAlign: "center" as const,
};

const logoText = {
  fontSize: "24px",
  fontWeight: "bold",
  color: "#3b82f6", // Primary blue color
  margin: "0",
};

const content = {
  padding: "32px",
};

const greeting = {
  fontSize: "20px",
  fontWeight: "bold",
  color: "#333",
  marginBottom: "16px",
};

const text = {
  fontSize: "16px",
  lineHeight: "26px",
  color: "#525f7f",
  marginBottom: "24px",
};

const buttonContainer = {
  textAlign: "center" as const,
  margin: "32px 0",
};

const button = {
  backgroundColor: "#3b82f6",
  borderRadius: "6px",
  color: "#fff",
  fontSize: "16px",
  fontWeight: "bold",
  textDecoration: "none",
  textAlign: "center" as const,
  display: "inline-block",
  padding: "14px 28px",
};

const footerText = {
  fontSize: "13px",
  color: "#8898aa",
  marginTop: "48px",
  textAlign: "center" as const,
};
