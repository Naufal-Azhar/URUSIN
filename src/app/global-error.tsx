"use client";

export default function GlobalError({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="id">
      <body
        style={{
          fontFamily: "system-ui, sans-serif",
          margin: 0,
          padding: "2rem",
          background: "#f8fafc",
          color: "#0f172a",
        }}
      >
        <main style={{ maxWidth: "32rem", margin: "0 auto" }}>
          <h1 style={{ fontSize: "1.5rem" }}>Terjadi kesalahan</h1>
          <p style={{ lineHeight: 1.6 }}>Aplikasi tidak dapat memuat halaman. Silakan coba lagi.</p>
          <button
            type="button"
            onClick={reset}
            style={{
              background: "#0f766e",
              color: "white",
              border: 0,
              borderRadius: "0.375rem",
              padding: "0.75rem 1rem",
              fontWeight: 600,
              cursor: "pointer",
            }}
          >
            Coba lagi
          </button>
        </main>
      </body>
    </html>
  );
}
