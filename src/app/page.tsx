export default function HomePage() {
  return (
    <main
      style={{
        minHeight: "100dvh",
        display: "grid",
        placeItems: "center",
        padding: "3rem",
      }}
    >
      <section style={{ textAlign: "center", maxWidth: 720 }}>
        <h1 style={{ fontSize: "2rem", marginBottom: "0.5rem" }}>
          Agentic Webhook is Running
        </h1>
        <p style={{ color: "#4b5563" }}>
          Use the POST endpoint at <code>/api/webhook</code> from Make.com
          to send Google Sheets row data. The server will generate a report with
          OpenAI, export a DOCX, and upload it to Google Drive under a
          classified folder.
        </p>
      </section>
    </main>
  );
}
