export const metadata = {
  title: "Agentic Make.com Webhook",
  description: "Sheets -> OpenAI -> DOCX -> Drive",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body style={{ fontFamily: "ui-sans-serif, system-ui" }}>{children}</body>
    </html>
  );
}
