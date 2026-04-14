import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/router";
import Head from "next/head";
import { toInmate, parse } from "../lib/helpers.js";

/* ── 실루엣 아이콘 (bop.gov 스타일) ── */
function SilhouetteIcon() {
  return (
    <div style={{
      width: 90,
      height: 90,
      background: "linear-gradient(135deg, #3a6fc4 0%, #1a3a6b 100%)",
      borderRadius: 4,
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      flexShrink: 0,
      border: "2px solid #2a5aaa",
    }}>
      <svg width="54" height="54" viewBox="0 0 54 54" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
        <circle cx="27" cy="18" r="11" fill="rgba(255,255,255,0.75)"/>
        <path d="M6 48c0-11.598 9.402-21 21-21s21 9.402 21 21" fill="rgba(255,255,255,0.75)"/>
      </svg>
    </div>
  );
}

/* ── 프로필 이미지 (표지 or 실루엣) ── */
function InmatePhoto({ inmate }) {
  const [imgError, setImgError] = useState(false);

  if (inmate.coverUrl && !imgError) {
    return (
      <img
        src={inmate.coverUrl}
        alt={inmate.inmateName}
        onError={() => setImgError(true)}
        style={{ width: 90, height: 90, objectFit: "cover", borderRadius: 4, flexShrink: 0 }}
      />
    );
  }
  return <SilhouetteIcon />;
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
      padding: "2px 8px",
      background: s.bg,
      color: s.color,
      border: `1px solid ${s.color}`,
      fontSize: 11,
      borderRadius: 2,
      fontWeight: 600,
      letterSpacing: "0.03em",
    }}>
      {s.label}
    </span>
  );
}

/* ── Request for Visitation 버튼 ── */
function RelatedLinks({ inmate }) {
  const [submitted, setSubmitted] = useState(false);

  return (
    <div style={{
      borderLeft: "1px solid #d0d0d0",
      paddingLeft: 16,
      minWidth: 160,
      flexShrink: 0,
      display: "flex",
      alignItems: "flex-start",
    }}>
      {!submitted ? (
        <button
          onClick={e => { e.stopPropagation(); setSubmitted(true); }}
          style={{
            background: "none",
            border: "none",
            padding: 0,
            fontSize: 13,
            color: "#1a74bb",
            cursor: "pointer",
            textDecoration: "underline",
            textAlign: "left",
          }}
        >
          Request for Visitation
        </button>
      ) : (
        <span style={{ fontSize: 13, color: "#1B5E20", fontStyle: "italic" }}>
          Visitation request submitted.
        </span>
      )}
    </div>
  );
}

/* ── 결과 카드 ── */
function ResultCard({ inmate, label }) {
  const router = useRouter();

  return (
    <div style={{
      background: "#fff",
      border: "1px solid #ccc",
      borderRadius: 4,
      padding: 16,
      display: "flex",
      gap: 16,
      alignItems: "flex-start",
      cursor: "pointer",
      transition: "box-shadow 0.15s",
    }}
      onMouseEnter={e => e.currentTarget.style.boxShadow = "0 2px 8px rgba(0,0,0,0.12)"}
      onMouseLeave={e => e.currentTarget.style.boxShadow = "none"}
    >
      {/* 좌: 프로필 */}
      <div onClick={() => router.push(`/inmate/${inmate.id}`)}>
        <InmatePhoto inmate={inmate} />
      </div>

      {/* 중: 기본 정보 */}
      <div style={{ flex: 1, minWidth: 0 }} onClick={() => router.push(`/inmate/${inmate.id}`)}>
        <div style={{ fontSize: 17, fontWeight: "bold", color: "#111", marginBottom: 4, letterSpacing: "0.02em" }}>
          {inmate.inmateName.toUpperCase()}
        </div>
        <div style={{ fontSize: 13, color: "#333", marginBottom: 8 }}>
          Register Number: <strong>{inmate.inmateNumber}</strong>
        </div>
        <table style={{ borderSpacing: 0, fontSize: 13 }}>
          <tbody>
            <tr>
              <td style={{ color: "#555", paddingRight: 12, paddingBottom: 2, whiteSpace: "nowrap" }}>Date of Birth:</td>
              <td style={{ color: "#111", paddingBottom: 2 }}>{inmate.dateOfBirth}</td>
            </tr>
            <tr>
              <td style={{ color: "#555", paddingRight: 12, paddingBottom: 2 }}>Place of Birth:</td>
              <td style={{ color: "#111", paddingBottom: 2 }}>{inmate.placeOfBirth}</td>
            </tr>
            <tr>
              <td style={{ color: "#555", paddingRight: 12, paddingBottom: 6 }}>Height:</td>
              <td style={{ color: "#111", paddingBottom: 6 }}>{inmate.height}</td>
            </tr>
          </tbody>
        </table>
        <StatusBadge status={inmate.inmateStatus} />
        {inmate.returnDate && (
          <div style={{ fontSize: 12, color: "#BF360C", marginTop: 4 }}>
            In custody as of: {inmate.returnDate}
          </div>
        )}
      </div>

      {/* 우: Related Links */}
      <RelatedLinks inmate={inmate} />
    </div>
  );
}

/* ── 메인 페이지 ── */
export default function IndexPage() {
  const [tab, setTab]           = useState("name");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName]   = useState("");
  const [numberQuery, setNumberQuery] = useState("");
  const [results, setResults]   = useState([]);
  const [loading, setLoading]   = useState(false);
  const [searched, setSearched] = useState(false);
  const [searchLabel, setSearchLabel] = useState("");
  const [error, setError]       = useState(null);
  const [recommended, setRecommended] = useState([]);
  const [recLoading, setRecLoading]   = useState(true);

  /* 초기 로드: Recommended Inmates */
  useEffect(() => {
    fetch("/api/books?mode=browse")
      .then(r => r.json())
      .then(data => {
        const items = (data.body?.items || []);
        const inmates = items.map(item => {
          if (item._source === "nlk") return toInmate(item);
          return toInmate(item);
        });
        setRecommended(inmates);
      })
      .catch(() => {})
      .finally(() => setRecLoading(false));
  }, []);

  async function handleSearch(e) {
    e.preventDefault();

    let q = "";
    let label = "";

    if (tab === "name") {
      const parts = [firstName.trim(), lastName.trim()].filter(Boolean);
      if (!parts.length) return;
      q = parts.join(" ");
      label = q;
    } else {
      q = numberQuery.trim();
      if (!q) return;
      label = q;
    }

    setLoading(true);
    setSearched(true);
    setSearchLabel(label);
    setError(null);

    try {
      const res  = await fetch(`/api/books?q=${encodeURIComponent(q)}&mode=${tab}`);
      const data = await res.json();
      const items = data.body?.items || [];
      setResults(items.map(toInmate));
    } catch (err) {
      setError("Search failed. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  function handleClear() {
    setFirstName("");
    setLastName("");
    setNumberQuery("");
    setResults([]);
    setSearched(false);
    setSearchLabel("");
    setError(null);
  }

  const inputStyle = {
    width: "100%",
    padding: "6px 8px",
    border: "1px solid #aaa",
    borderRadius: 3,
    fontSize: 14,
    background: "#fff",
  };

  const tabStyle = (active) => ({
    padding: "8px 20px",
    fontSize: 13,
    border: "1px solid",
    borderColor: active ? "#aaa" : "#ccc",
    borderBottom: active ? "1px solid #f4f4f4" : "1px solid #aaa",
    background: active ? "#f4f4f4" : "#e0e0e0",
    color: active ? "#111" : "#444",
    cursor: "pointer",
    marginBottom: active ? -1 : 0,
    position: "relative",
    zIndex: active ? 1 : 0,
    borderRadius: "4px 4px 0 0",
    fontWeight: active ? 600 : 400,
  });

  return (
    <>
      <Head>
        <title>Find an Inmate — National Library of Korea</title>
        <meta name="description" content="Locate the whereabouts of a library inmate incarcerated from 1945 to the present." />
      </Head>

      <main style={{ maxWidth: 960, margin: "0 auto", padding: "24px 16px 48px" }}>

        {/* 페이지 제목 */}
        <h1 style={{ fontSize: 26, fontWeight: "bold", textAlign: "center", marginBottom: 12 }}>
          Find an inmate.
        </h1>

        {/* Disclaimer */}
        <div style={{
          fontSize: 13,
          color: "#333",
          textAlign: "center",
          lineHeight: 1.6,
          maxWidth: 720,
          margin: "0 auto 8px",
        }}>
          Locate the whereabouts of a library inmate incarcerated from 1945 to the present.
          Due to the Library Sentence Act, sentences are being reviewed and recalculated to
          address pending Federal Time Credit changes. An inmate&apos;s release date may not be up-to-date.
        </div>
        <div style={{
          fontSize: 12,
          color: "#555",
          textAlign: "center",
          lineHeight: 1.6,
          maxWidth: 720,
          margin: "0 auto 20px",
          fontStyle: "italic",
        }}>
          If an individual is listed as &quot;Not in Custody&quot; and no facility location is indicated,
          the inmate may still be in the custody of some other correctional entity, or on supervised release.
        </div>

        {/* 검색 박스 */}
        <div style={{
          background: "#f4f4f4",
          border: "1px solid #aaa",
          borderRadius: 4,
          padding: "0 0 16px",
          marginBottom: 20,
        }}>
          {/* 탭 */}
          <div style={{ display: "flex", gap: 4, padding: "12px 16px 0", borderBottom: "1px solid #aaa", background: "#f4f4f4" }}>
            <button style={tabStyle(tab === "number")} onClick={() => setTab("number")}>
              Find By Number
            </button>
            <button style={tabStyle(tab === "name")} onClick={() => setTab("name")}>
              Find By Name
            </button>
          </div>

          <form onSubmit={handleSearch} style={{ padding: "16px 16px 0" }}>
            {tab === "name" ? (
              /* Find By Name */
              <div style={{ display: "flex", gap: 12, flexWrap: "wrap", alignItems: "flex-end" }}>
                <div style={{ flex: "1 1 140px" }}>
                  <label style={{ display: "block", fontSize: 12, color: "#555", marginBottom: 4 }}>First</label>
                  <input
                    type="text"
                    value={firstName}
                    onChange={e => setFirstName(e.target.value)}
                    style={inputStyle}
                  />
                </div>
                <div style={{ flex: "1 1 140px" }}>
                  <label style={{ display: "block", fontSize: 12, color: "#555", marginBottom: 4 }}>Last</label>
                  <input
                    type="text"
                    value={lastName}
                    onChange={e => setLastName(e.target.value)}
                    style={inputStyle}
                  />
                </div>
              </div>
            ) : (
              /* Find By Number */
              <div style={{ maxWidth: 320 }}>
                <label style={{ display: "block", fontSize: 12, color: "#555", marginBottom: 4 }}>
                  Register Number (ISBN)
                </label>
                <input
                  type="text"
                  value={numberQuery}
                  onChange={e => setNumberQuery(e.target.value)}
                  placeholder="e.g. 9788937460319"
                  style={inputStyle}
                />
              </div>
            )}

            {/* 검색/초기화 버튼 */}
            <div style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              marginTop: 14,
              flexWrap: "wrap",
              gap: 8,
            }}>
              <div style={{ fontSize: 13, color: "#333" }}>
                {searched && !loading && (
                  <>
                    <strong>{results.length}</strong>
                    {" "}Result{results.length !== 1 ? "s" : ""} for search{" "}
                    <strong>{searchLabel}</strong>
                  </>
                )}
              </div>
              <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                {(firstName || lastName || numberQuery) && (
                  <button
                    type="button"
                    onClick={handleClear}
                    style={{
                      background: "none",
                      border: "none",
                      color: "#1a74bb",
                      fontSize: 13,
                      display: "flex",
                      alignItems: "center",
                      gap: 4,
                      padding: "4px 8px",
                    }}
                  >
                    🗑 Clear Form
                  </button>
                )}
                <button
                  type="submit"
                  style={{
                    background: "#1a74bb",
                    color: "#fff",
                    border: "none",
                    borderRadius: 3,
                    padding: "8px 24px",
                    fontSize: 14,
                    fontWeight: 600,
                    letterSpacing: "0.03em",
                  }}
                >
                  Search
                </button>
              </div>
            </div>
          </form>
        </div>

        {/* 결과 영역 */}
        {!searched ? (
          /* Recommended Inmates */
          <section>
            <div style={{
              fontSize: 13,
              color: "#555",
              marginBottom: 12,
              borderBottom: "1px solid #ddd",
              paddingBottom: 8,
            }}>
              <strong>Recommended Inmates</strong>
              {recLoading && <span style={{ color: "#999", marginLeft: 8 }}>Loading...</span>}
            </div>
            {!recLoading && recommended.length === 0 && (
              <p style={{ fontSize: 13, color: "#777" }}>No recommended inmates available at this time.</p>
            )}
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              {recommended.map(inmate => (
                <ResultCard key={inmate.id} inmate={inmate} />
              ))}
            </div>
          </section>
        ) : (
          /* 검색 결과 */
          <section>
            {loading && (
              <div style={{ textAlign: "center", padding: "32px 0", color: "#555", fontSize: 13 }}>
                Searching...
              </div>
            )}
            {!loading && error && (
              <div style={{ color: "#B71C1C", fontSize: 13, padding: "8px 0" }}>{error}</div>
            )}
            {!loading && !error && results.length === 0 && (
              <div style={{ fontSize: 13, color: "#555", padding: "16px 0" }}>
                No results found for <strong>&quot;{searchLabel}&quot;</strong>.
              </div>
            )}
            {!loading && !error && results.length > 0 && (
              <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                {results.map(inmate => (
                  <ResultCard key={inmate.id} inmate={inmate} />
                ))}
              </div>
            )}
          </section>
        )}
      </main>
    </>
  );
}
