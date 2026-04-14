import { parse, parseGoogleBook, simStatus, simClass, simReturn, simVisitor, simCharges } from "../../lib/helpers.js";

const API_KEY        = process.env.NLK_API_KEY;
const NLK_BASE       = "https://apis.data.go.kr/1371029/BookInformationService/getbookList";
const GOOGLE_BASE    = "https://www.googleapis.com/books/v1/volumes";
const NLK_PAGE_SIZE  = 20;
const KOR_MONO_START = 120_000;

/* 한글 포함 여부 */
function hasKorean(s) {
  return /[\uAC00-\uD7AF\u1100-\u11FF\u3130-\u318F]/.test(s || "");
}

function isKoreanItem(item) {
  const title    = item.DCTERMS_title || item.RDFS_label || "";
  if (hasKorean(title)) return true;
  const creators = Array.isArray(item.DC_creator) ? item.DC_creator : [item.DC_creator || ""];
  return creators.some(c => hasKorean(c || ""));
}

const NON_BOOK_TYPES = [
  "bibo/Thesis", "bibo/Article", "bibo/AcademicArticle",
  "bibo/LegalDocument", "bibo/Periodical", "bibo/Journal",
  "bibo/Newspaper", "bibo/Issue",
];
function isBookItem(item) {
  if (item.BIBO_degree) return false;
  const types = Array.isArray(item.RDF_type)
    ? item.RDF_type
    : item.RDF_type ? [item.RDF_type] : [];
  if (types.some(t => NON_BOOK_TYPES.some(nb => String(t).includes(nb)))) return false;
  if (!types.some(t => String(t).includes("Book"))) return false;
  return true;
}

async function fetchNLKPage(apiPage) {
  const params = new URLSearchParams({
    serviceKey: API_KEY,
    pageNo:     String(apiPage),
    numOfRows:  String(NLK_PAGE_SIZE),
    type:       "JSON",
  });
  try {
    const res  = await fetch(`${NLK_BASE}?${params}`, { headers: { Accept: "application/json" } });
    if (!res.ok) return { items: [], totalCount: 0 };
    const data = JSON.parse(await res.text());
    return {
      items:      Array.isArray(data?.body?.items) ? data.body.items : [],
      totalCount: data?.body?.totalCount ?? 0,
    };
  } catch {
    return { items: [], totalCount: 0 };
  }
}

async function searchGoogleBooks(q, maxResults = 20) {
  const params = new URLSearchParams({
    q,
    langRestrict: "ko",
    printType:    "books",
    maxResults:   String(maxResults),
  });
  try {
    const res  = await fetch(`${GOOGLE_BASE}?${params}`);
    if (!res.ok) return { items: [], totalCount: 0 };
    const data = await res.json();
    return {
      items:      (data.items || []).map(parseGoogleBook),
      totalCount: data.totalItems || 0,
    };
  } catch {
    return { items: [], totalCount: 0 };
  }
}

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin",  "*");
  res.setHeader("Access-Control-Allow-Methods", "GET");
  res.setHeader("Cache-Control", "s-maxage=60, stale-while-revalidate=120");

  const { q = "", mode = "browse" } = req.query;

  try {
    /* ── Find By Name: 도서 제목 검색 → Google Books intitle: ── */
    if (mode === "name" && q.trim()) {
      const result = await searchGoogleBooks(`intitle:${q.trim()}`, 20);
      return res.status(200).json({
        body: { items: result.items, totalCount: result.totalCount },
      });
    }

    /* ── Find By Number: ISBN 검색 → Google Books isbn: ── */
    if (mode === "number" && q.trim()) {
      const result = await searchGoogleBooks(`isbn:${q.trim()}`, 5);
      return res.status(200).json({
        body: { items: result.items, totalCount: result.totalCount },
      });
    }

    /* ── Browse 모드: NLK 우선, 실패 시 Google Books fallback ── */

    // NLK API 키가 있으면 NLK 랜덤 페이지 시도
    if (API_KEY) {
      const randomOffset = Math.floor(Math.random() * 2000);
      const apiPage      = KOR_MONO_START + randomOffset + 1;
      const { items }    = await fetchNLKPage(apiPage);

      const filtered = items
        .filter(isBookItem)
        .filter(isKoreanItem)
        .map(parse)
        .slice(0, 5);

      if (filtered.length > 0) {
        return res.status(200).json({
          body: { items: filtered, totalCount: filtered.length },
        });
      }
    }

    // NLK 키 없거나 결과 없을 때 → Google Books fallback
    const BROWSE_KEYWORDS = ["소설", "한국 역사", "철학", "시집", "에세이", "한국문학", "과학"];
    const keyword = BROWSE_KEYWORDS[Math.floor(Math.random() * BROWSE_KEYWORDS.length)];
    const result  = await searchGoogleBooks(keyword, 10);

    // 10개 중 랜덤 5개 선택
    const shuffled = result.items.sort(() => Math.random() - 0.5).slice(0, 5);

    return res.status(200).json({
      body: { items: shuffled, totalCount: shuffled.length },
    });

  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}
