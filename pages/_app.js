import Link from "next/link";

export default function App({ Component, pageProps }) {
  return (
    <>
      <style global jsx>{`
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
        html { font-size: 14px; }
        body {
          font-family: Arial, Helvetica, sans-serif;
          background: #f0f0f0;
          color: #111;
        }
        a { color: #1a74bb; text-decoration: none; }
        a:hover { text-decoration: underline; }
        button { cursor: pointer; font-family: inherit; }
        input, select, textarea { font-family: inherit; }
      `}</style>

      {/* 상단 정부 배너 */}
      <div style={{
        background: "#f0f0f0",
        borderBottom: "1px solid #d0d0d0",
        padding: "4px 16px",
        fontSize: 12,
        color: "#555",
      }}>
        An official website of the National Library of Korea.
      </div>

      {/* 헤더 */}
      <header style={{
        background: "#fff",
        borderBottom: "1px solid #d0d0d0",
        padding: "12px 24px",
        display: "flex",
        alignItems: "center",
      }}>
        <Link href="/" style={{ display: "flex", alignItems: "center", gap: 12, textDecoration: "none" }}>
          {/* 방패 아이콘 */}
          <svg width="36" height="40" viewBox="0 0 36 40" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
            <path d="M18 2L34 8V20C34 29 26 36 18 38C10 36 2 29 2 20V8L18 2Z" fill="#1a3a6b" stroke="#1a3a6b" strokeWidth="1"/>
            <path d="M18 6L30 11V20C30 27 24 33 18 35C12 33 6 27 6 20V11L18 6Z" fill="#c8a84b"/>
            <text x="18" y="24" textAnchor="middle" fill="#1a3a6b" fontSize="10" fontWeight="bold" fontFamily="serif">NLK</text>
          </svg>
          <div style={{ fontSize: 20, fontWeight: "bold", color: "#111", letterSpacing: "0.02em" }}>
            Inmate Locator
          </div>
        </Link>
      </header>

      <Component {...pageProps} />
    </>
  );
}
