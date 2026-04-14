## 프로젝트 개요
명제: 책은 죄수다
설명: 책이 죄수라는 거짓말(스토리텔링) 프로젝트를 전시에 구현하기 위해 도서관 서지 정보 시스템을 이용할거야. 서지 정보, 즉 서지 메타데이터는 죄수의 메타데이터(아래 방법에 기술함)로 재정의되어 책 죄수라는 것이 설명되게끔 웹사이트를 만들거야. 

그래서 웹사이트 UI와 구조를 Find an inmate, 죄수(도서)찾기 컨셉
(레퍼런스: https://www.bop.gov/inmateloc/)

### 웹사이트 이름
Find an inmate

## 웹사이트 용도 및 목표
사용자가 수감자(도서)를 검색하여 접견 신청까지 해보는 것을 목표로 함.

## 방법
국립중앙도서관 서지 정보 API를 불러와 아래 메타데이터로 재정의

Title(표제) -> Name(수감자명)
Published in(발행년도) -> Birth of date(출생년도)
Size(판형) -> Height(키)
Call Number(청구번호) -> Inmate Number(수인번호)
ISBN -> Resident Registration Number(주민등록번호)
Author(저자) -> Accomplice(공범)
Page(페이지) -> Sentence(형량)
Place of Issue(발행지) -> Place of Birth(출생지)


