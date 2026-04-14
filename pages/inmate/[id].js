import { useState } from "react";
import { useRouter } from "next/router";
import Head from "next/head";
import Link from "next/link";
import { toInmate } from "../../lib/helpers.js";

const GOOGLE_BASE = "https://www.googleapis.com/books/v1/volumes";

export async function getServerSideProps({ params, res }) {
  res.setHeader("Cache-Control", "s-maxage=3600, stale-while-revalidate=7200");

  try {
    const response = await fetch(`${GOOGLE_BASE}/${encodeURIComponent(params.id)}`);
    if (!response.ok) return { notFound: true };

    const vol  = await response.json();
    if (!vol || !vol.id) return { notFound: true };

    const { parseGoogleBook } = await import("../../lib/helpers.js");
    const book   = parseGoogleBook(vol);
    const inmate = toInmate(book);

    return { props: { inmate } };
  } catch {
    return { notFound: true };
  }
}

/* ── 실루엣 아이콘 ── */
function SilhouetteIcon({ size = 120 }) {
  return (
    <div style={{
      width: size,
      height: size,
      background: "linear-gradient(135deg, #3a6fc4 0%, #1a3a6b 100%)",
      borderRadius: 4,
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      border: "2px solid #2a5aaa",
      flexShrink: 0,
    }}>
      <svg width={size * 0.6} height={size * 0.6} viewBox="0 0 54 54" fill="none" aria-hidden="true">
        <circle cx="27" cy="18" r="11" fill="rgba(255,255,255,0.75)"/>
        <path d="M6 48c0-11.598 9.402-21 21-21s21 9.402 21 21" fill="rgba(255,255,255,0.75)"/>
      </svg>
    </div>
  );
}

/* ── 상태 배지 ── */
function StatusBadge({ status }) {
  const map = {
    AVAILABLE:   { label: "VISITATION OPEN",       color: "#1B5E20", bg: "#F1F8F1" },
    CHECKED_OUT: { label: "IN VISITATION",          color: "#BF360C", bg: "#FFF3EE" },
    RESTRICTED:  { label: "VISITATION RESTRICTED",  color: "#B71C1C", bg: "#FFF0F0" },
  };
  const s = map[status] || map.AVAILABLE;
  return (
    <span style={{
      display: "inline-block",
      padding: "3px 10px",
      background: s.bg,
      color: s.color,
      border: `1px solid ${s.color}`,
      fontSize: 12,
      borderRadius: 2,
      fontWeight: 600,
    }}>
      {s.label}
    </span>
  );
}

/* ── 정보 행 ── */
function InfoRow({ label, value }) {
  if (!value || value === "—") return null;
  return (
    <tr>
      <td style={{
        padding: "5px 16px 5px 0",
        color: "#555",
        fontSize: 13,
        whiteSpace: "nowrap",
        verticalAlign: "top",
        width: 160,
      }}>
        {label}
      </td>
      <td style={{ padding: "5px 0", color: "#111", fontSize: 13 }}>
        {value}
      </td>
    </tr>
  );
}

/* ── 메인 컴포넌트 ── */
export default function InmatePage({ inmate }) {
  const router = useRouter();
  const [visitSubmitted, setVisitSubmitted] = useState(false);
  const [imgError, setImgError] = useState(false);

  const classMap = {
    RESTRICTED:          { label: "접근제한",   color: "#B71C1C" },
    "SPECIAL COLLECTION": { label: "특별소장",   color: "#BF360C" },
    GENERAL:             { label: "일반소장",   color: "#1B5E20" },
  };
  const cls = classMap[inmate.classification] || classMap.GENERAL;

  return (
    <>
      <Head>
        <title>{inmate.inmateName.toUpperCase()} — Inmate Record</title>
        <meta name="description" content={`Inmate record for ${inmate.inmateName}. Register Number: ${inmate.inmateNumber}`} />
      </Head>

      <main style={{ maxWidth: 960, margin: "0 auto", padding: "24px 16px 48px" }}>

        {/* 뒤로가기 */}
        <div style={{ marginBottom: 16 }}>
          <button
            onClick={() => router.back()}
            style={{
              background: "none",
              border: "none",
              color: "#1a74bb",
              fontSize: 13,
              cursor: "pointer",
              padding: 0,
              display: "flex",
              alignItems: "center",
              gap: 4,
            }}
          >
            ← Back to search results
          </button>
        </div>

        {/* 수감자 레코드 카드 */}
        <div style={{
          background: "#fff",
          border: "1px solid #ccc",
          borderRadius: 4,
          overflow: "hidden",
        }}>
          {/* 상단 헤더 바 */}
          <div style={{
            background: "#1a3a6b",
            color: "#fff",
            padding: "10px 20px",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}>
            <span style={{ fontSize: 13, fontWeight: 600, letterSpacing: "0.05em" }}>
              INMATE RECORD — NATIONAL LIBRARY OF KOREA
            </span>
            <StatusBadge status={inmate.inmateStatus} />
          </div>

          <div style={{ padding: 24, display: "flex", gap: 24, flexWrap: "wrap" }}>
            {/* 좌: 프로필 이미지 + 수인번호 */}
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 12, width: 140 }}>
              {inmate.coverUrl && !imgError ? (
                <img
                  src={inmate.coverUrl}
                  alt={inmate.inmateName}
                  onError={() => setImgError(true)}
                  style={{ width: 120, height: 120, objectFit: "cover", borderRadius: 4 }}
                />
              ) : (
                <SilhouetteIcon size={120} />
              )}
              <div style={{
                fontFamily: "Courier New, monospace",
                fontSize: 13,
                fontWeight: 700,
                color: "#333",
                letterSpacing: "0.08em",
                textAlign: "center",
              }}>
                {inmate.inmateNumber}
              </div>
              <div style={{ fontSize: 11, color: "#777", textAlign: "center" }}>
                Register Number
              </div>
            </div>

            {/* 중: 상세 정보 */}
            <div style={{ flex: 1, minWidth: 280 }}>
              <h1 style={{ fontSize: 22, fontWeight: "bold", color: "#111", marginBottom: 4, letterSpacing: "0.02em" }}>
                {inmate.inmateName.toUpperCase()}
              </h1>
              {inmate.alt && (
                <div style={{ fontSize: 13, color: "#666", marginBottom: 12, fontStyle: "italic" }}>
                  a.k.a. {inmate.alt}
                </div>
              )}

              <table style={{ borderSpacing: 0, width: "100%", marginBottom: 16 }}>
                <tbody>
                  <InfoRow label="Register Number"  value={inmate.inmateNumber} />
                  <InfoRow label="Resident ID"      value={inmate.residentId} />
                  <InfoRow label="Date of Birth"    value={inmate.dateOfBirth} />
                  <InfoRow label="Place of Birth"   value={inmate.placeOfBirth} />
                  <InfoRow label="Height"           value={inmate.height} />
                  <InfoRow label="Sentence"         value={inmate.sentence} />
                  <InfoRow label="Accomplice"       value={inmate.accomplice} />
                  <InfoRow label="Facility"         value={inmate.holding || "National Library of Korea"} />
                </tbody>
              </table>

              <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                <StatusBadge status={inmate.inmateStatus} />
                <span style={{
                  fontSize: 11,
                  padding: "2px 8px",
                  background: "#f5f5f5",
                  border: "1px solid #ddd",
                  borderRadius: 2,
                  color: cls.color,
                  fontWeight: 600,
                }}>
                  {cls.label}
                </span>
              </div>

              {inmate.returnDate && (
                <div style={{ fontSize: 12, color: "#BF360C", marginTop: 6 }}>
                  In custody as of: {inmate.returnDate}
                </div>
              )}
            </div>

            {/* 우: Related Links + 접견 신청 */}
            <div style={{
              borderLeft: "1px solid #d0d0d0",
              paddingLeft: 20,
              minWidth: 160,
              flexShrink: 0,
            }}>
              <div style={{ fontWeight: "bold", fontSize: 13, marginBottom: 10, color: "#111" }}>
                Related Links
              </div>
              <ul style={{ listStyle: "none", display: "flex", flexDirection: "column", gap: 8 }}>
                <li>
                  {!visitSubmitted ? (
                    <button
                      onClick={() => setVisitSubmitted(true)}
                      style={{
                        background: "#1a74bb",
                        border: "none",
                        color: "#fff",
                        padding: "6px 12px",
                        fontSize: 13,
                        borderRadius: 3,
                        cursor: "pointer",
                        fontWeight: 600,
                        width: "100%",
                        textAlign: "center",
                      }}
                    >
                      Request for Visitation
                    </button>
                  ) : (
                    <div style={{
                      background: "#F1F8F1",
                      border: "1px solid #1B5E20",
                      borderRadius: 3,
                      padding: "6px 10px",
                      fontSize: 12,
                      color: "#1B5E20",
                      fontWeight: 600,
                    }}>
                      Visitation request submitted.
                    </div>
                  )}
                </li>
              </ul>
            </div>
          </div>

          {/* 하단: 추가 정보 */}
          {(inmate.abstract || inmate.genre || inmate.keyword) && (
            <div style={{
              borderTop: "1px solid #e0e0e0",
              padding: "16px 24px",
              background: "#fafafa",
            }}>
              {inmate.genre && (
                <div style={{ fontSize: 12, color: "#555", marginBottom: 6 }}>
                  <strong>Charges:</strong> {inmate.genre}
                </div>
              )}
              {inmate.abstract && (
                <div style={{ fontSize: 12, color: "#555", lineHeight: 1.6 }}>
                  <strong>Statement:</strong>{" "}
                  <span style={{ fontStyle: "italic" }}>
                    {inmate.abstract.slice(0, 400)}{inmate.abstract.length > 400 ? "…" : ""}
                  </span>
                </div>
              )}
            </div>
          )}
        </div>

        {/* 하단 면책 문구 */}
        <div style={{
          marginTop: 20,
          fontSize: 11,
          color: "#777",
          lineHeight: 1.6,
          borderTop: "1px solid #ddd",
          paddingTop: 12,
        }}>
          This record is maintained by the National Library of Korea Inmate Registration System.
          Information displayed may not reflect the most current status due to ongoing sentence reviews.
        </div>
      </main>
    </>
  );
}
