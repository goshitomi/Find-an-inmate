# Research Report: Find an Inmate 프로젝트
> 레퍼런스 분석 및 프로젝트 방향 정리
> 작성일: 2026-04-15

---

## 1. 레퍼런스 사이트 분석: bop.gov/inmateloc/

### 1.1 사이트 개요

**Federal Bureau of Prisons (연방교도소국)** 공식 웹사이트의 수감자 위치 조회 서비스.
1982년부터 현재까지 연방 수감자의 소재를 일반에 공개하는 정부 공식 서비스.

URL: `https://www.bop.gov/inmateloc/`

---

### 1.2 전체 페이지 구조 (레이아웃)

```
┌─────────────────────────────────────────────────────┐
│  상단 배너: "An official website of the U.S. govt"    │
├─────────────────────────────────────────────────────┤
│  로고 (Bureau of Prisons 문장) + 사이트명 + 검색바     │
├─────────────────────────────────────────────────────┤
│  GNB (Global Navigation Bar)                        │
│  Home / About Us / Inmates / Locations /            │
│  Careers / Business / Resources / Contact Us        │
├─────────────────────────────────────────────────────┤
│  메인 컨텐츠 영역                                     │
│  ┌───────────────────────────────────────────────┐  │
│  │  H1: "Find an inmate."                        │  │
│  │  설명 문단 (disclaimer 포함)                   │  │
│  │  ┌─────────────────────────────────────────┐  │  │
│  │  │  탭: [Find By Number] [Find By Name]    │  │  │
│  │  │  검색 폼 (이름/번호 필드 + 필터)          │  │  │
│  │  │  [Search 버튼]                          │  │  │
│  │  └─────────────────────────────────────────┘  │  │
│  │  검색 결과 카드                                │  │  │
│  └───────────────────────────────────────────────┘  │
├─────────────────────────────────────────────────────┤
│  푸터: 법적고지 / FOIA / 접근성 / SNS               │
└─────────────────────────────────────────────────────┘
```

---

### 1.3 검색 UI 상세 분석

#### 탭 구조 (Tab Interface)
| 탭명 | 기능 |
|------|------|
| Find By Number | BOP Register / DCDC / FBI / INS 번호로 검색 |
| Find By Name | 이름(First / Middle / Last)으로 검색 |

#### Find By Name 폼 필드
| 필드명 | 타입 | 필수여부 |
|--------|------|---------|
| First | text input | 필수 |
| Middle | text input | 선택 |
| Last | text input | 필수 |
| Race | select dropdown | 선택 |
| Age | text input | 선택 |
| Sex | select dropdown | 선택 |

#### Find By Number 폼 필드
| 필드명 | 형식 | 예시 |
|--------|------|------|
| Register Number | #####-### | BOP / DCDC / FBI / INS 번호 |

#### 폼 컨트롤
- **Search 버튼**: 파란색(#1a74bb 계열), 흰색 텍스트
- **Clear Form 버튼**: 쓰레기통 아이콘 + "Clear Form" 텍스트, 링크 스타일

---

### 1.4 검색 결과 카드 UI 분석

스크린샷 기준 결과 카드 구조:

```
┌──────────────────────────────────────────────────────────┐
│  [프로필 이미지]   ALEX DALMA JOHN                        │
│  (파란 아이콘)     Register Number: 58013-053             │
│                                                          │
│                   Age:  71                               │
│                   Race: Black                            │
│                   Sex:  Male                             │
│                                                          │
│                   Not in BOP Custody as of: 01/03/2000   │
│                                                  ┌────── │
│                                                  │ Related│
│                                                  │ Links  │
│                                                  │ • Call │
│                                                  │   or   │
│                                                  │   email│
│                                                  │ • Send │
│                                                  │   mail │
│                                                  │ • Send │
│                                                  │   money│
│                                                  │ • Visit│
│                                                  │ • Voice│
│                                                  │   a    │
│                                                  │   conc │
└──────────────────────────────────────────────────────────┘
```

#### 결과 카드 표시 데이터
| 항목 | 예시값 |
|------|--------|
| 이름 (대문자) | ALEX DALMA JOHN |
| Register Number | 58013-053 |
| Age | 71 |
| Race | Black |
| Sex | Male |
| 수감 상태 | Not in BOP Custody as of: 01/03/2000 |

#### Related Links (우측 패널)
- Call or email
- Send mail/package
- Send money
- Visit
- Voice a concern

---

### 1.5 시각 디자인 분석

#### 색상 팔레트
| 역할 | 색상 |
|------|------|
| 상단 배너 | 연한 회색 (#f0f0f0 계열) |
| 내비게이션 바 | 짙은 네이비/검정 (#1b2a3b 계열) |
| 검색 버튼 | 파란색 (#1a74bb 계열) |
| 본문 배경 | 흰색 (#ffffff) |
| 결과 카드 배경 | 흰색, 연한 회색 테두리 |
| 링크 텍스트 | 파란색 (#1a74bb 계열) |
| 헤더 텍스트 | 검정 (#000000 또는 짙은 회색) |

#### 타이포그래피
- H1: `Find an inmate.` — 큰 serif 또는 sans-serif, 중앙 정렬
- 결과 이름: 대문자 굵은 글씨
- 레이블: 작은 회색 텍스트

#### 프로필 이미지
- 실제 사진이 아닌 **파란색 배경에 실루엣 아이콘** 사용
- 정사각형 또는 약간의 둥근 모서리 처리

---

### 1.6 Disclaimer / 고지문 텍스트 분석

원문:
> "Locate the whereabouts of a federal inmate incarcerated from 1982 to the present. Due to the First Step Act, sentences are being reviewed and recalculated to address pending Federal Time Credit changes. As a result, an inmate's release date may not be up-to-date. Website visitors should continue to check back periodically to see if any changes have occurred."

> "If an individual is listed as 'Released' or 'Not in BOP Custody' and no facility location is indicated, the inmate is no longer in BOP custody, however, the inmate may still be in the custody of some other correctional/criminal justice system/law enforcement entity, or on parole or supervised release."

→ 이 법적 고지문은 프로젝트에서 **예술적으로 변용**할 수 있는 텍스트. 책/도서에 대한 메타포로 재작성 가능.

---

### 1.7 푸터 구조
- About Us / Inmates / Locations / Careers / Business / Resources
- 접근성(Accessibility) 정보
- FOIA (정보공개법)
- Privacy Policy
- SNS: Facebook, Twitter, LinkedIn, USAJobs

---

## 2. 프로젝트 메타데이터 매핑 분석

프로젝트 개요에 정의된 서지정보 → 수감자 정보 변환표:

| 도서관 서지 메타데이터 | 수감자 메타데이터 | 레퍼런스 사이트 대응 필드 |
|----------------------|-----------------|------------------------|
| Title (표제) | Name (수감자명) | 결과 카드 대제목 (대문자) |
| Published in (발행년도) | Date of Birth (출생년도) | Age 필드에 대응 |
| Size (판형) | Height (키) | — (별도 추가 필요) |
| Call Number (청구번호) | Inmate Number (수인번호) | Register Number |
| ISBN | Resident Registration Number (주민등록번호) | Find By Number 탭의 번호 |
| Author (저자) | Accomplice (공범) | Related Links 하단 또는 상세 페이지 |
| Page (페이지) | Sentence (형량) | 수감 상태 텍스트에 대응 |
| Place of Issue (발행지) | Place of Birth (출생지) | Race/Age/Sex 필터 옆 추가 가능 |

---

## 3. 구현 시 고려사항

### 3.1 검색 기능 구현
- **Find By Inmate Number** → ISBN 또는 청구번호로 검색
- **Find By Name** → 도서명(Title)으로 검색
- 필터: Race → 장르(Genre), Age → 출판연도(Year), Sex → 판형(Format) 등으로 대체 가능

### 3.2 결과 카드 UI
- 책 표지 이미지 없음 → 실루엣 아이콘 사용 (레퍼런스와 동일하게 처리)
- 또는 책 이미지가 있을 경우 표시, 없을 경우 placeholder
- 이름(Title)은 대문자로 표시
- Register Number → Call Number 또는 ISBN 표시

### 3.3 Related Links 섹션 변용
레퍼런스의 Related Links를 도서관/교도소 컨셉으로 재해석:

| 원본 링크 | 변용 가능한 링크 |
|-----------|----------------|
| Call or email | 도서 문의 |
| Send mail/package | 편지 보내기 (접견 신청) |
| Send money | — |
| Visit | 접견 신청 (주요 CTA) |
| Voice a concern | 건의사항 |

→ **"Visit" = "접견 신청"** 이 이 프로젝트의 핵심 CTA (Call to Action)

### 3.4 Disclaimer 변용 제안
레퍼런스의 법적 고지문을 예술적으로 재해석:

> "Locate the whereabouts of a book incarcerated in this library from [연도] to the present. Due to the Library Sentence Act, sentences are being reviewed and recalculated. An inmate's release date may not be up-to-date."

### 3.5 수감 상태 텍스트 변용
- `Not in BOP Custody as of: 01/03/2000` → `대출 중 (현재 부재) / 서가 복귀일 미정`
- `Currently in custody at: [시설명]` → `현재 수감 중: [도서관명] [서가 번호]`

---

## 4. 국립중앙도서관 API 연동 분석

### 4.1 API 개요
- 국립중앙도서관 오픈 API (data4library.kr) 사용 예정
- 서지 정보 검색 API: 도서 제목, 저자, ISBN, 청구번호 등 조회 가능

### 4.2 주요 API 응답 필드 → 프로젝트 매핑

| API 응답 필드 | 한국어명 | 프로젝트 내 역할 |
|-------------|---------|----------------|
| `title` | 표제 | Name (수감자명) |
| `pub_year` | 발행년도 | Date of Birth |
| `call_no` | 청구번호 | Inmate Number |
| `isbn` | ISBN | Resident Reg. No. |
| `author` | 저자 | Accomplice (공범) |
| `page` | 페이지수 | Sentence (형량) — "N년 형" |
| `pub_place` | 발행지 | Place of Birth |
| `form_name` | 자료 형태 | 추가 분류 가능 |

### 4.3 구현 방향
- 프론트엔드(Next.js 또는 정적 HTML)에서 API 호출
- CORS 문제가 있을 경우 서버사이드 프록시 필요
- API 키 환경변수로 관리

---

## 5. 웹사이트 페이지 구성 제안

레퍼런스를 기반으로 구현할 페이지 목록:

| 페이지 | URL | 내용 |
|--------|-----|------|
| 메인 (검색) | `/` | 검색 폼 + 결과 목록 |
| 수감자 상세 | `/inmate/[id]` | 개별 도서(수감자) 상세 정보 |
| 접견 신청 | `/visit/[id]` | 접견(대출) 신청 폼 |

---

## 6. 톤 & 무드 분석

레퍼런스 사이트의 톤:
- **공식적, 건조함** — 감정 없이 사실만 나열
- **bureaucratic** — 정부 기관 특유의 형식적 언어
- **monochromatic** — 파란색 + 흰색 + 회색의 절제된 팔레트
- **sans-serif 위주** — 가독성 중심, 장식 없음

→ 프로젝트에서 이 톤을 그대로 유지해야 "책 = 죄수"라는 개념이 작동함. 유머나 아이러니를 과도하게 강조하지 않고, 실제 정부 사이트처럼 진지하게 구현할수록 개념 미술적 효과가 극대화됨.

---

## 7. 핵심 인사이트 요약

1. **UI는 원본을 최대한 충실히 재현** — bop.gov의 레이아웃, 색상, 타이포그래피를 그대로 따르는 것이 컨셉의 핵심.
2. **메타데이터 치환이 작품의 본질** — 서지 정보를 수감자 정보로 1:1 치환하여 보는 사람이 "이게 진짜 교도소 사이트인가?" 하는 순간을 만들어야 함.
3. **접견 신청(Visit)이 핵심 CTA** — 도서관에서의 대출 신청을 교도소의 접견 신청으로 치환.
4. **프로필 이미지 처리** — 실제 책 표지 대신 실루엣 또는 책 모양 아이콘을 죄수 프로필 사진처럼 처리.
5. **법적 고지문 텍스트** — 원본의 disclaimer 형식을 유지하되 내용을 도서관 맥락으로 교체.
6. **검색 결과 "Not in BOP Custody"** — 대출 중인 책은 "현재 시설 외 이동 중" 등으로 표현 가능.
