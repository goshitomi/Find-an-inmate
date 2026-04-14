/* ── 상태 상수 ── */
export const ST = {
  AVAILABLE:   { ko: "접견가능", en: "AVAILABLE",   c: "#1B5E20", bg: "#F1F8F1" },
  CHECKED_OUT: { ko: "접견중",   en: "CHECKED OUT", c: "#BF360C", bg: "#FFF3EE" },
  RESTRICTED:  { ko: "접견불가", en: "RESTRICTED",  c: "#B71C1C", bg: "#FFF0F0" },
};

/* ── 헬퍼 함수 ── */
export function hash(s) {
  let h = 0;
  for (let i = 0; i < (s || "").length; i++) h = ((h << 5) - h + s.charCodeAt(i)) | 0;
  return Math.abs(h);
}

export function simStatus(id) {
  const n = hash(id) % 100;
  return n < 55 ? "AVAILABLE" : n < 80 ? "CHECKED_OUT" : "RESTRICTED";
}

export function simReturn(id) {
  const d = new Date();
  d.setDate(d.getDate() + (hash(id) % 21) + 3);
  return d.toISOString().slice(0, 10);
}

export function simVisitor(id) {
  return `#${String(hash(id) % 9999).padStart(4, "0")}`;
}

export function simClass(id) {
  const n = hash(id) % 100;
  return n < 10 ? "RESTRICTED" : n < 30 ? "SPECIAL COLLECTION" : "GENERAL";
}

export function simCharges(c) {
  return c === "RESTRICTED"
    ? "접근 제한 자료 — 열람 허가 필요"
    : c === "SPECIAL COLLECTION"
    ? "특별 소장 자료 — 관내 열람만 가능"
    : "일반 소장 자료";
}

export function parsePhysical(extent) {
  const cmMatch = (extent || "").match(/(\d+)\s*cm/);
  const pMatch  = (extent || "").match(/(\d+)\s*p/i);
  return {
    height: cmMatch ? `${cmMatch[1]}cm` : "—",
    pages:  pMatch  ? `${pMatch[1]}p.`  : "—",
  };
}

export function prisonSize(extent) {
  const cmMatch = (extent || "").match(/(\d+)\s*cm/);
  return cmMatch ? `${cmMatch[1]}cm` : "—";
}

/* ── NLK API 응답 파싱 ── */
export function parse(item) {
  const id = item.BIBLIO_ID || "";
  const st = simStatus(id);
  const cl = simClass(id);

  const extentArr = Array.isArray(item.BIBFRAME_extent)
    ? item.BIBFRAME_extent
    : item.BIBFRAME_extent ? [item.BIBFRAME_extent] : [];
  const extent   = extentArr.join(", ");
  const physical = parsePhysical(extent);

  const creatorRaw = item.DC_creator || item.DCTERMS_creator;
  const creator    = Array.isArray(creatorRaw)
    ? creatorRaw.join(", ")
    : creatorRaw || "";

  const pubYear = item.NLON_issuedYear
    ? String(item.NLON_issuedYear)
    : (item.DCTERMS_issued || item.DCTERMS_date || "").replace(/\D/g, "").slice(0, 4);

  const isbnRaw = item.BIBO_isbn;
  const isbn    = Array.isArray(isbnRaw) ? isbnRaw[0] || "" : isbnRaw || "";

  return {
    _source:        "nlk",
    id,
    title:          item.DCTERMS_title || item.RDFS_label || "제목 없음",
    label:          item.RDFS_label || "",
    creator,
    isbn,
    pubPlace:       item.NLON_publicationPlace || "",
    pubDate:        pubYear,
    callNo:         [item.NLON_classificationNumberOfNLK, item.NLON_itemNumberOfNLK]
                      .filter(Boolean).join(" ") || "",
    extent,
    height:         physical.height,
    pages:          physical.pages,
    prisonSize:     prisonSize(extent),
    holding:        Array.isArray(item.NLON_localHolding)
                      ? item.NLON_localHolding.join("; ")
                      : item.NLON_localHolding || "",
    abstract:       item.DCTERMS_abstract || "",
    genre:          item.NLON_genre || "",
    desc:           item.DCTERMS_description || "",
    alt:            item.DCTERMS_alternative || "",
    format:         item.DCTERMS_hasFormat || "",
    keyword:        item.NLON_keyword || "",
    status:         st,
    classification: cl,
    charges:        simCharges(cl),
    returnDate:     st === "CHECKED_OUT" ? simReturn(id) : "",
    visitor:        st === "CHECKED_OUT" ? simVisitor(id) : "",
    year:           pubYear,
    coverUrl:       "",
  };
}

/* ── Google Books API 응답 파싱 ── */
export function parseGoogleBook(vol) {
  const id   = vol.id || "";
  const info = vol.volumeInfo || {};
  const isbns = info.industryIdentifiers || [];
  const isbn  = (isbns.find(x => x.type === "ISBN_13") || isbns.find(x => x.type === "ISBN_10") || {}).identifier || "";
  const year  = (info.publishedDate || "").slice(0, 4);
  const st    = simStatus(id);
  const cl    = simClass(id);
  const extentStr = info.dimensions
    ? `${info.dimensions.height || ""}`.replace(/[^\d.]/g, "").slice(0, 4) + "cm"
    : "";
  const physical = parsePhysical(extentStr);

  return {
    _source:        "google",
    id,
    title:          info.title || "제목 없음",
    label:          "",
    creator:        (info.authors || []).join(", "),
    isbn,
    pubPlace:       info.publisher || "",
    pubDate:        year,
    callNo:         "",
    extent:         extentStr,
    height:         physical.height,
    pages:          info.pageCount ? `${info.pageCount}p.` : "—",
    prisonSize:     extentStr || "—",
    holding:        "",
    abstract:       info.description || "",
    genre:          (info.categories || []).join(", "),
    desc:           "",
    alt:            "",
    format:         "",
    keyword:        "",
    status:         st,
    classification: cl,
    charges:        simCharges(cl),
    returnDate:     st === "CHECKED_OUT" ? simReturn(id) : "",
    visitor:        st === "CHECKED_OUT" ? simVisitor(id) : "",
    year,
    coverUrl:       (info.imageLinks?.thumbnail || "").replace("http://", "https://"),
  };
}

/* ── 수인번호 포매팅: volume/biblio ID → "XXXXX-XXX" ── */
function formatInmateNumber(id) {
  const n = String(hash(id)).padStart(8, "0").slice(0, 8);
  return `${n.slice(0, 5)}-${n.slice(5, 8)}`;
}

/* ── 주민등록번호 포매팅: ISBN-13 → "XXXXXX-XXXXXXX" ── */
function formatResidentId(isbn) {
  if (!isbn) return "등록번호 없음";
  const digits = isbn.replace(/\D/g, "");
  if (digits.length >= 13) return `${digits.slice(0, 6)}-${digits.slice(6)}`;
  return digits || "등록번호 없음";
}

/* ── 서지 데이터 → 수감자 메타데이터 변환 ── */
export function toInmate(book) {
  return {
    ...book,
    inmateName:   book.title,
    inmateNumber: formatInmateNumber(book.id),
    dateOfBirth:  book.pubDate ? `${book.pubDate}년생` : "—",
    sentence:     book.pages,
    placeOfBirth: book.pubPlace || "—",
    accomplice:   book.creator || "—",
    residentId:   formatResidentId(book.isbn),
    inmateStatus: book.status,
  };
}
