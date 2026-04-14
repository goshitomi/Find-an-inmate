# Find an Inmate — 구현 플랜 v1

> 작성일: 2026-04-15 / 업데이트: 2026-04-15 (v2)
> 참조: project-summary.md, research.md, Prison-of-Literature/plan.md v3

---

## 0. 전제 확인

### 이 프로젝트와 Prison-of-Literature의 관계

| 항목 | Prison-of-Literature | Find an Inmate |
|------|----------------------|----------------|
| UI 컨셉 | Roma Publications 아카이브 스타일 리스트 | bop.gov 정부 수감자 조회 시스템 |
| 기능 | 전체 수감자 명부 + 패싯 필터 | **검색 → 단건 조회 → 접견 신청** |
| API 인프라 | NLK API + Google Books 프록시 (`pages/api/books.js`) | **동일 인프라 재사용** |
| 환경변수 | `NLK_API_KEY` (Vercel 등록됨) | 동일 키 사용 |

**핵심 결정**: API 레이어(`pages/api/books.js`, `lib/helpers.js`)는 Prison-of-Literature에서 검증된 코드를 복사해서 시작한다. 이미 NLK API 제약 (페이지당 20개, 타이틀 검색 불가 등), Google Books fallback, 한국어 도서 필터링이 모두 구현되어 있다.

---

## 1. 기술 스택

| 항목 | 결정 | 이유 |
|------|------|------|
| Framework | **Next.js (Pages Router)** | Prison-of-Literature와 동일 스택, 재사용 용이 |
| 스타일링 | **인라인 스타일** (CSS-in-JS 없음) | Prison-of-Literature 패턴 유지, 빌드 의존성 최소화 |
| 상태 관리 | **React useState / useRouter** | 외부 상태 라이브러리 불필요 |
| API | **Next.js API Routes** (서버사이드 프록시) | CORS 우회, API 키 서버에만 보관 |
| 외부 데이터 | NLK API + Google Books API | 검색 기능별로 역할 분담 (아래 상세) |
| 배포 | **Vercel** | Prison-of-Literature와 동일 환경 |

---

## 2. 페이지 구조

```
/                       ← 검색 페이지 (bop.gov 메인과 1:1 대응)
/inmate/[id]            ← 수감자(도서) 상세 페이지
```

> **변경**: `/visit/[id]` 별도 페이지 제거. 접견 신청은 결과 카드의 Related Links → 팝업으로 처리.

### 2.1 파일 트리

```
Find-an-inmate/
├── pages/
│   ├── _app.js               ← 글로벌 스타일, 헤더
│   ├── index.js              ← 검색 폼 + Recommended Inmates + 결과 목록
│   ├── inmate/
│   │   └── [id].js           ← 수감자 상세 (동적 라우트)
│   └── api/
│       ├── books.js          ← Prison-of-Literature에서 복사 후 확장
│       └── inmate/
│           └── [id].js       ← 단건 조회 API
├── lib/
│   └── helpers.js            ← Prison-of-Literature에서 복사 (parse, simStatus 등)
├── public/
└── next.config.js
```

---

## 3. 데이터 흐름 & API 설계

### 3.1 검색 모드별 API 분기

레퍼런스 사이트의 두 탭에 정확히 대응:

| 탭 | 입력 | 실제 API | 설명 |
|----|------|---------|------|
| **Find By Name** | 수감자명 (도서 제목) | Google Books API `q=intitle:<name>` | 텍스트 검색 지원, 결과 풍부 |
| **Find By Number** | 수인번호 (ISBN) | Google Books API `q=isbn:<number>` | ISBN으로 단건 특정 |

**왜 NLK API가 아닌 Google Books인가?**  
NLK `getbookList` API는 텍스트 검색 파라미터를 무시하고 BIBLIO_ID 순 페이지네이션만 지원한다 (Prison-of-Literature에서 확인된 제약). 검색 기능에는 Google Books가 유일한 현실적 옵션이다.

NLK API는 **초기 랜덤 브라우징** (검색어 없이 페이지 로드 시 랜덤 도서 표시)에만 사용한다.

### 3.2 `pages/api/books.js` — 검색 API

Prison-of-Literature의 `books.js`를 기반으로 아래 파라미터를 지원:

```javascript
// GET /api/books?q=&mode=name|number|browse&pageNo=1

export default async function handler(req, res) {
  const { q = "", mode = "browse", pageNo = "1" } = req.query;

  // mode=name: 수감자명(도서 제목) 검색
  if (mode === "name" && q.trim()) {
    const result = await searchGoogleBooks(`intitle:${q.trim()}`);
    return res.status(200).json(result);
  }

  // mode=number: 수인번호(ISBN) 검색
  if (mode === "number" && q.trim()) {
    const result = await searchGoogleBooks(`isbn:${q.trim()}`);
    return res.status(200).json(result);
  }

  // mode=browse: 검색어 없음 — NLK 랜덤 페이지 (초기 화면용)
  // KOR_MONO_START + 랜덤 오프셋으로 한국 단행본 구간 샘플링
  const randomPage = KOR_MONO_START + Math.floor(Math.random() * 1000);
  const result = await fetchNLKPage(randomPage);
  // ... 한국어 도서 필터 적용
}
```

### 3.3 `pages/api/inmate/[id].js` — 단건 조회 API

상세 페이지(`/inmate/[id]`)에서 호출. Google Books ID로 단건 데이터 fetch.

```javascript
// GET /api/inmate/[id]  (id = Google Books volume ID)

export default async function handler(req, res) {
  const { id } = req.query;
  const res_ = await fetch(`https://www.googleapis.com/books/v1/volumes/${id}`);
  const vol  = await res_.json();
  const book = parseGoogleBook(vol);   // helpers.js의 parseGoogleBook 재사용
  return res.status(200).json(book);
}
```

**트레이드오프**: Google Books volume ID를 수인번호처럼 URL에 노출하면 의미가 명확하지 않다. 대안으로 ISBN을 ID로 사용할 수 있지만 ISBN 없는 도서가 많다. → **결정: volume ID 그대로 사용**. 수인번호 형식으로 포매팅하는 건 표시 레이어(helpers.js)에서 처리.

---

## 4. 메타데이터 파싱 & 변환

`lib/helpers.js`의 `parseGoogleBook()` 함수를 확장하여 Find an Inmate에 필요한 모든 필드를 생성한다.

### 4.1 서지 → 수감자 매핑 구현

```javascript
// lib/helpers.js 에 추가할 변환 레이어

export function toInmate(book) {
  return {
    // 원본 서지 데이터 (API 응답)
    ...book,

    // ── 수감자 메타데이터 (표시용 alias) ──
    inmateName:    book.title,                          // Title → Name
    inmateNumber:  formatInmateNumber(book.id),         // Volume ID → Inmate Number
    dateOfBirth:   book.pubDate ? `${book.pubDate}년생` : "—",  // 발행년도 → 출생년도
    height:        book.height,                         // 판형(cm) → 키(cm)
    sentence:      book.pages,                          // 페이지 → 형량 ("342p.")
    placeOfBirth:  book.pubPlace || "—",                // 발행지 → 출생지
    accomplice:    book.creator || "—",                 // 저자 → 공범
    residentId:    formatResidentId(book.isbn),         // ISBN → 주민등록번호
    inmateStatus:  book.status,                         // AVAILABLE / CHECKED_OUT / RESTRICTED
  };
}

// 수인번호 포매팅: Google Books ID를 "XXXXX-XXX" 형식으로 변환
function formatInmateNumber(id) {
  const n = String(Math.abs(hash(id))).padStart(8, "0").slice(0, 8);
  return `${n.slice(0, 5)}-${n.slice(5, 8)}`;
}

// 주민등록번호 포매팅: ISBN-13을 "XXXXXX-XXXXXXX" 형식으로 변환
// ISBN 없으면 "등록번호 없음"
function formatResidentId(isbn) {
  if (!isbn) return "등록번호 없음";
  const digits = isbn.replace(/\D/g, "");
  if (digits.length < 13) return digits;
  return `${digits.slice(0, 6)}-${digits.slice(6)}`;
}
```

### 4.2 수감 상태 레이블 (기존 helpers.js 활용)

Prison-of-Literature에서 이미 구현된 `simStatus(id)` 함수를 그대로 사용:
- `AVAILABLE` → "접견가능"
- `CHECKED_OUT` → "접견중" (현재 접견 중인 수감자)
- `RESTRICTED` → "접견불가"

상태 결정 로직: `hash(id) % 100` 기반 의사난수 → 동일 책은 항상 동일 상태 (결정론적)

---

## 5. 페이지별 구현 상세

### 5.1 `/` — 검색 페이지 (`pages/index.js`)

bop.gov의 검색 UI를 구조적으로 재현. 디자인은 나중에, 지금은 기능 명세.

#### 상태 (useState)

```javascript
const [tab, setTab]               = useState("name");   // "name" | "number"
const [query, setQuery]           = useState("");
const [results, setResults]       = useState([]);
const [loading, setLoading]       = useState(false);
const [searched, setSearched]     = useState(false);    // 검색 실행 여부
const [error, setError]           = useState(null);
const [recommended, setRecommended] = useState([]);     // Recommended Inmates (초기화면용)
const [recLoading, setRecLoading] = useState(true);
```

#### 초기 로드 — Recommended Inmates

페이지 마운트 시 `useEffect`로 NLK API browse 모드를 호출하여 랜덤 5개 도서를 가져온다.
새로고침마다 서버에서 다른 랜덤 페이지를 샘플링하므로 매번 다른 수감자가 표시된다.

```javascript
useEffect(() => {
  fetch("/api/books?mode=browse")
    .then(r => r.json())
    .then(data => {
      const items = (data.body?.items || []).map(item => toInmate(parse(item)));
      // 결과 중 5개만 사용
      setRecommended(items.slice(0, 5));
    })
    .finally(() => setRecLoading(false));
}, []);   // 빈 deps — 마운트 1회만 실행
```

**NLK browse 모드 랜덤 처리** (`pages/api/books.js` 서버 측):

```javascript
// mode=browse: 요청마다 다른 랜덤 페이지를 샘플링
const randomOffset = Math.floor(Math.random() * 2000);  // 0~1999
const apiPage = KOR_MONO_START + randomOffset + 1;

const { items } = await fetchNLKPage(apiPage);
const filtered = items.filter(isBookItem).filter(isKoreanItem);
// 최대 5개만 반환 (Recommended Inmates용)
return res.status(200).json({
  body: { items: filtered.slice(0, 5) }
});
```

> **트레이드오프**: NLK 단일 페이지는 20개를 반환하며 그 중 한국어 단행본 비율이 ~85%이므로 평균 17개 후보 중 5개 선택. 필터 후 5개 미만이 되는 경우는 드물지만, 0개가 되면 빈 섹션으로 graceful degradation.

#### 검색 실행 흐름

```javascript
async function handleSearch(e) {
  e.preventDefault();
  if (!query.trim()) return;

  setLoading(true);
  setSearched(true);

  try {
    const res = await fetch(`/api/books?q=${encodeURIComponent(query)}&mode=${tab}`);
    const data = await res.json();
    setResults((data.body?.items || []).map(toInmate));
  } catch (err) {
    setError(err.message);
  } finally {
    setLoading(false);
  }
}
```

#### 렌더링 분기

```
미검색 상태 → disclaimer 문구 + Recommended Inmates 섹션 (카드 5개)
검색 중     → "Searching..." 로딩 인디케이터
결과 0건    → "No results for [query]"
결과 있음   → 검색 결과 카드 목록 (Recommended Inmates는 숨김)
```

검색이 실행되면 `searched = true`가 되어 Recommended Inmates 섹션이 결과 카드로 교체된다.

```jsx
{!searched ? (
  <RecommendedSection inmates={recommended} loading={recLoading} />
) : (
  <SearchResults inmates={results} loading={loading} query={query} />
)}
```

#### `RecommendedSection` 컴포넌트

```jsx
function RecommendedSection({ inmates, loading }) {
  if (loading) return <p>Loading recommended inmates...</p>;
  if (!inmates.length) return null;

  return (
    <section>
      <h3>Recommended Inmates</h3>
      {inmates.map(inmate => (
        <ResultCard key={inmate.id} inmate={inmate} />
      ))}
    </section>
  );
}
```

#### 결과 카드 (`ResultCard` 컴포넌트)

`ResultCard`는 Recommended Inmates와 검색 결과 양쪽에서 동일하게 사용된다.

```jsx
function ResultCard({ inmate }) {
  return (
    <div>
      {/* 좌: 프로필 이미지 */}
      <InmatePhoto inmate={inmate} />

      {/* 중: 핵심 정보 */}
      <div>
        <h2>{inmate.inmateName.toUpperCase()}</h2>
        <p>Register Number: {inmate.inmateNumber}</p>
        <p>Date of Birth: {inmate.dateOfBirth}</p>
        <p>Place of Birth: {inmate.placeOfBirth || "—"}</p>
        <p>Height: {inmate.height}</p>
        <StatusLine inmate={inmate} />
      </div>

      {/* 우: Related Links */}
      <RelatedLinks inmate={inmate} />
    </div>
  );
}
```

#### `InmatePhoto` 컴포넌트

```jsx
function InmatePhoto({ inmate }) {
  const [imgError, setImgError] = useState(false);

  if (inmate.coverUrl && !imgError) {
    return (
      <img
        src={inmate.coverUrl}
        alt={inmate.inmateName}
        onError={() => setImgError(true)}
      />
    );
  }

  return <SilhouetteIcon />;   // 실루엣 placeholder (bop.gov 스타일)
}
```

#### `RelatedLinks` 컴포넌트 — 접견 신청 팝업

Related Links 패널에는 **"Request for Visitation" 단일 항목**만 표시한다.
클릭 시 별도 페이지로 이동하지 않고 **인라인 팝업(alert 또는 모달)**으로 "Visitation request submitted" 메시지를 표시한다.

```jsx
function RelatedLinks({ inmate }) {
  const [submitted, setSubmitted] = useState(false);

  function handleVisitRequest() {
    setSubmitted(true);
  }

  return (
    <div>
      <h3>Related Links</h3>
      {!submitted ? (
        <button onClick={handleVisitRequest}>
          Request for Visitation
        </button>
      ) : (
        // 클릭 후 → 동일 위치에 확인 메시지로 교체
        <p>Visitation request submitted.</p>
      )}
    </div>
  );
}
```

**왜 페이지 이동이 아닌 인라인 교체인가:**
- 별도 페이지(/visit/[id])는 관람자가 탐색 흐름에서 이탈하게 만든다.
- 카드 내부에서 버튼 → 확인 메시지로 즉시 교체하는 방식이 "신청 행위"의 완결감을 더 강하게 전달한다.
- 전시 맥락에서 빠른 인터랙션 피드백이 중요하다.

**트레이드오프**: `submitted` 상태가 `ResultCard` 내부에 있으므로 페이지를 새로고침하면 리셋된다 → 의도된 동작. 전시 특성상 영구 저장 불필요.

---

### 5.2 `/inmate/[id]` — 상세 페이지 (`pages/inmate/[id].js`)

bop.gov의 개별 수감자 상세 페이지에 대응. 모든 서지 메타데이터를 수감자 정보로 재해석하여 표시.

#### 데이터 패칭

```javascript
// getServerSideProps: 서버에서 데이터 받아서 렌더
export async function getServerSideProps({ params }) {
  const res  = await fetch(`${process.env.VERCEL_URL}/api/inmate/${params.id}`);
  const book = await res.json();
  return { props: { inmate: toInmate(book) } };
}
```

**트레이드오프 — getServerSideProps vs getStaticProps**

| 방식 | 장점 | 단점 |
|------|------|------|
| `getServerSideProps` | 항상 최신 데이터, 무한 도서 지원 | 매 요청마다 Google Books API 호출 |
| `getStaticProps` + fallback | 빠른 응답, Vercel 캐싱 활용 | 도서 수가 무한하여 사전 생성 불가 |

→ **결정: `getServerSideProps`** + `Cache-Control: s-maxage=3600` 헤더로 Vercel 엣지 캐싱 활용.

#### 표시 필드 전체 목록

```
수인번호     : {inmate.inmateNumber}        ← 청구번호에서 변환
수감자명     : {inmate.inmateName}          ← 도서 제목
출생년도     : {inmate.dateOfBirth}         ← 발행년도
출생지       : {inmate.placeOfBirth}        ← 발행지
키           : {inmate.height}              ← 판형(cm)
형량         : {inmate.sentence}            ← 페이지 수 ("342p.")
공범         : {inmate.accomplice}          ← 저자
주민등록번호  : {inmate.residentId}          ← ISBN
접견 상태    : {inmate.inmateStatus}        ← simStatus() 결정
자료 분류    : {inmate.classification}      ← simClass() 결정
수감 시설    : {inmate.holding || "국립중앙도서관"}
```

#### 접견 신청 CTA

상세 페이지 하단 또는 우측에 **"접견 신청" 버튼** 배치 → `/visit/[id]`로 이동.

---

---

## 6. API 제약 및 대응 전략

### 6.1 Google Books API 제약

| 제약 | 영향 | 대응 |
|------|------|------|
| 인증 없이 하루 1,000 요청 | 전시 트래픽에서 한도 초과 가능 | Vercel `s-maxage` 캐싱 + Google API Key 환경변수 추가 고려 |
| 한국어 책 검색 품질 낮음 | `langRestrict=ko`로 어느 정도 제한 가능하지만 완벽하지 않음 | `intitle:` 한정 검색으로 노이즈 감소 |
| 표지 이미지 없는 경우 많음 | `coverUrl` 없을 때 silhouette으로 fallback | 이미 구현된 패턴 |
| `pageCount` 없는 경우 있음 | 형량(sentence) 값이 "—" | 허용 — 수감자 정보 미상으로 해석 |

### 6.2 NLK API 제약 (browse 모드)

Prison-of-Literature에서 확인된 제약:
- 페이지당 최대 20개 반환 (numOfRows 무시됨)
- 텍스트 검색 파라미터 무시
- 한국 단행본은 pageNo ≈ 120,000 구간

→ **browse 모드는 초기 화면용 "랜덤 수감자 소개"에만 사용**. 실제 검색은 전부 Google Books.

### 6.3 환경변수 목록

```
NLK_API_KEY         ← 국립중앙도서관 API 키 (Prison-of-Literature에서 공유)
VERCEL_URL          ← getServerSideProps에서 내부 API 호출 시 필요 (Vercel 자동 주입)
GOOGLE_BOOKS_KEY    ← (선택) Google Books API 키, 없으면 익명 1000req/day
```

---

## 7. 구현 순서 (Phase)

### Phase 1 — 프로젝트 기반 세팅

| 작업 | 파일 | 비고 |
|------|------|------|
| Next.js 프로젝트 초기화 | `package.json`, `next.config.js` | `npx create-next-app@latest` |
| Prison-of-Literature API 레이어 복사 | `pages/api/books.js`, `lib/helpers.js` | 그대로 복사 후 수정 |
| `toInmate()` 변환 함수 작성 | `lib/helpers.js` | 서지→수감자 매핑 |
| `pages/api/inmate/[id].js` 작성 | 신규 | 단건 조회 |
| Vercel 연결 + `NLK_API_KEY` 환경변수 등록 | Vercel 대시보드 | |

### Phase 2 — 핵심 페이지 구현

| 작업 | 파일 | 비고 |
|------|------|------|
| 검색 폼 UI (`Find By Name` / `Find By Number` 탭) | `pages/index.js` | 탭 전환, 폼 submit |
| API 호출 + 결과 상태 관리 | `pages/index.js` | loading / error / empty 분기 |
| `ResultCard` 컴포넌트 | `pages/index.js` | 프로필 이미지, 핵심 정보, Related Links |
| `InmatePhoto` + 실루엣 fallback | `pages/index.js` | |
| 수감자 상세 페이지 | `pages/inmate/[id].js` | `getServerSideProps` + 전체 필드 표시 |

### Phase 3 — 인터랙션 완성 + 마무리

| 작업 | 파일 | 비고 |
|------|------|------|
| `RelatedLinks` — 접견 신청 팝업 | `pages/index.js` | 버튼 → "Visitation request submitted" 인라인 교체 |
| `_app.js` 공통 헤더 (푸터 없음) | `pages/_app.js` | |
| 에러 핸들링 (API 실패 시 UI) | 전체 | |
| Vercel 배포 테스트 | — | `NLK_API_KEY`, `GOOGLE_BOOKS_KEY` 확인 |

---

## 8. 트레이드오프 종합

### 8.1 Google Books vs NLK for 검색

- **잃는 것**: 국립중앙도서관 공식 서지 데이터 (청구번호, 소장 위치 등 풍부)
- **얻는 것**: 텍스트 검색 기능, 표지 이미지, 빠른 응답
- **왜 불가피한가**: NLK `getbookList`는 검색 파라미터를 API 수준에서 지원하지 않음 (Prison-of-Literature에서 실증)
- **완화책**: 검색 결과 카드에는 Google Books 데이터를 사용하되, 수인번호(청구번호) 표시는 ISBN 기반으로 포매팅하여 "공식 서류" 분위기 유지

### 8.2 서버사이드 렌더링 vs 클라이언트 사이드 렌더링

- **CSR (현재 Prison-of-Literature 방식)**: 클라이언트에서 `/api/books`를 직접 호출
- **SSR (`getServerSideProps`)**: 상세 페이지에서 사용
- **결정**: 검색 페이지는 CSR (사용자 인터랙션 중심), 상세/접견 페이지는 SSR (직접 URL 접근, OG 메타 필요)

### 8.3 접견 신청 — 페이지 이동 vs 인라인 팝업

- **폐기된 방안**: `/visit/[id]` 별도 페이지로 이동 → 관람자가 탐색 흐름에서 이탈, 불필요한 페이지 추가
- **채택된 방안**: `ResultCard` 내부 `RelatedLinks`의 버튼 클릭 → 같은 자리에서 "Visitation request submitted" 텍스트로 즉시 교체
- **이유**: 인터랙션의 완결감이 더 강하고, 별도 페이지/폼 없이도 "신청 행위"를 충분히 경험할 수 있다

### 8.4 수인번호 생성 방식

- **옵션 A**: ISBN / 청구번호를 그대로 수인번호로 사용
- **옵션 B**: `hash(id)` 기반 의사난수로 "XXXXX-XXX" 형식 생성
- **결정: 옵션 B** — 청구번호가 없는 Google Books 데이터에서도 일관된 형식 유지. 동일 책은 항상 동일 번호 (결정론적 해시).

### 8.5 ISBN 없는 도서의 주민등록번호

- ISBN 없는 도서(Google Books에 많음) → "등록번호 없음" 표시
- 현실의 수감자도 주민등록번호 미확인 케이스 있음 → 개념적으로 일관성 있음

### 8.6 단건 조회 API 경로

- `/api/inmate/[id]` vs 기존 `/api/books?id=xxx`
- **결정**: 별도 `/api/inmate/[id]` 경로 — URL이 "수감자 조회" 의미를 명확히 하고, Prison-of-Literature API와 분리됨

---

## 9. 수정/생성 파일 목록

| 파일 | 유형 | 내용 |
|------|------|------|
| `pages/_app.js` | 신규 | 공통 헤더, 글로벌 reset CSS (푸터 없음) |
| `pages/index.js` | 신규 | 검색 폼, 탭, Recommended Inmates, 결과 카드, 접견 신청 팝업 |
| `pages/inmate/[id].js` | 신규 | 수감자 상세 (SSR) |
| `pages/api/books.js` | PoL에서 복사 후 수정 | mode 파라미터 추가, browse 모드 랜덤 5개 반환 |
| `pages/api/inmate/[id].js` | 신규 | 단건 조회 |
| `lib/helpers.js` | PoL에서 복사 후 수정 | `toInmate()`, `formatInmateNumber()`, `formatResidentId()` 추가 |
| `next.config.js` | 신규 | reactStrictMode, 이미지 도메인 허용 |
| `package.json` | 신규 | next, react, react-dom |

---

## 10. 구현 시작 전 체크리스트

- [ ] `Documents/GitHub/Find-an-inmate`에서 작업 확인
- [ ] `npx create-next-app@latest .` 또는 수동으로 `package.json` 작성
- [ ] `Prison-of-Literature/pages/api/books.js` 복사
- [ ] `Prison-of-Literature/lib/helpers.js` 복사
- [ ] Vercel 프로젝트 생성 + GitHub 연결
- [ ] `NLK_API_KEY` 환경변수 Vercel에 등록 (Prison-of-Literature와 동일 키)
- [ ] `npm run dev`로 로컬 확인 후 push

---

*plan.md v2 — Claude Sonnet 4.6 / 2026-04-15*
