# TripZone

TripZone 프론트엔드와 설계 문서 허브를 함께 관리하는 저장소다.  
현재 기준은 `프론트 우선`, `백엔드는 팀원 연결용 최소 골격 유지`, `설계 문서는 HTML 대시보드로 제공`이다.

## 프로젝트 목적

- 국내 숙소 예약 서비스 프론트 구현
- 설계도, 기준서, DDL, 발표자료를 한 번에 볼 수 있는 HTML 문서 허브 제공
- 팀원이 이후 백엔드 API, DB, 상태 처리 로직을 바로 이어붙일 수 있는 기준점 유지

## 핵심 기준

- 루트 패키지명: `com.kh.trip`
- 문의 모델: `InquiryRoom`, `InquiryMessage`
- DB 기준 원문: `docs/tripzone-ddl-v2.sql`
- 통합 설계 기준: `docs/tripzone-company-spec.md`
- 구조 기준: `docs/tripzone-structure-spec-v2.md`

## 설계도 기준 vs 현재 백엔드 구현

이 저장소의 source of truth는 `docs/` 설계 문서다.
프론트와 README는 기본적으로 설계도 기준을 유지한다.

다만 2026-03-26 기준으로 팀원 백엔드 구현과 설계도가 일부 어긋나는 항목이 있다.

### 한눈에 정리

| 항목 | 어떤 기준을 따를지 | 지금 처리 방식 |
|---|---|---|
| 숙소 | 현재 백엔드 DTO 사용 가능 | 프론트 `services`에서 필드명만 맞춘다 |
| 예약 | 현재 백엔드 DTO 사용 가능 | 프론트 `services`에서 `bookingNo -> bookingId` 매핑 |
| 결제 | 현재 백엔드 DTO 사용 가능 | 프론트 `services`에서 `paymentNo/paymentId` 구분 |
| 리뷰 | 현재 백엔드 API 사용 가능 | 프론트 `services`에서 목록/통계 연결 |
| 인증 | 합의 필요 | `email` 또는 `loginId` 중 하나로 고정 |
| 문의 | 설계도 우선 | 백엔드가 `InquiryRoom/InquiryMessage` 구조로 따라와야 함 |
| 관리자 운영 | 설계도 우선 | 백엔드 admin API 구현 필요 |

### 설계도 기준으로 유지하는 항목

- 문의 모델: `InquiryRoom`, `InquiryMessage`
- 문의 상태: `OPEN`, `ANSWERED`, `CLOSED`, `BLOCKED`
- 문의 흐름: 문의방 생성 + 메시지 송수신
- 관리자 운영: 전용 admin API / service / audit 흐름

### 현재 팀원 백엔드 구현 상태

- 문의는 단일 `Inquiry` 엔티티 기반
- 문의 상태는 `PENDING`, `COMPLETED`, `DELETE`
- 문의 타입은 `SYSTEM`, `MANAGEMENT`, `ETC`
- `AdminController`는 아직 사실상 비어 있음
- 인증 로그인 요청 필드는 `email`이 아니라 `loginId`

판정:

- 문의/운영 구조는 `백엔드가 설계도 최신본을 아직 미반영한 상태`로 본다.
- 인증은 설계 문서가 필드명까지 고정한 것은 아니므로 `합의 필요 항목`으로 본다.

### 바로 판단 규칙

- 설계 문서와 팀원 백엔드 코드가 같으면: 그대로 연결
- 설계 문서와 팀원 백엔드 코드가 다르지만 `숙소/예약/결제/리뷰`면: 프론트 `services`에서 어댑터로 해결
- 설계 문서와 팀원 백엔드 코드가 다르고 `문의/관리자 운영`이면: 프론트가 아니라 백엔드가 설계도 쪽으로 수정
- 인증처럼 설계 문서가 세부 필드를 못 박지 않은 경우는: 먼저 합의하고 하나로 고정

### 팀원에게 바로 전달할 문장

- `숙소/예약/결제/리뷰는 지금 백엔드 DTO로 붙여도 되고, 프론트 service에서 키만 맞추면 됩니다.`
- `문의는 설계도 최신본이 InquiryRoom/InquiryMessage 구조라서 현재 백엔드 Inquiry 단일 모델은 미반영 상태입니다.`
- `관리자 운영 API는 설계도에는 있지만 현재 백엔드 구현이 비어 있는 영역입니다.`
- `인증은 email/loginId 중 하나로 먼저 합의하고 고정해야 합니다.`

## 저장소 구조

- `frontend/`
  - React + Vite 프론트엔드
  - 현재 사용자 / 판매자 / 관리자 화면, 마이페이지, 인증, 예약 흐름 포함
- `backend/`
  - 팀원용 최소 백엔드 루트
  - 실제 API/DB 연결은 여기 기준으로 이어서 구현
- `docs/`
  - 설계 원본 문서
  - 요구사항, 기능, 구조, DB, 통합 기준, DDL, 코멘트, 프론트 연동 가이드 포함
- `frontend/public/submission-html/`
  - 현재 기준 HTML 문서 세트
  - 대시보드 1장 + 설계 문서 HTML + 발표자료 HTML

## 로컬 실행

### 프론트 실행

```bash
cd frontend
npm install
npm run dev -- --host 127.0.0.1 --port 5173
```

기본 확인 주소:

- 메인 앱: [http://127.0.0.1:5173/](http://127.0.0.1:5173/)
- 설계 대시보드: [http://127.0.0.1:5173/submission-html/](http://127.0.0.1:5173/submission-html/)
- 발표자료: [http://127.0.0.1:5173/submission-html/presentation/index.html](http://127.0.0.1:5173/submission-html/presentation/index.html)

### 빌드 확인

```bash
cd frontend
npm run build
```

## 팀원 공유 링크

팀원에게는 로컬 주소 대신 GitHub 링크를 공유한다.

### 메인 대시보드

- 설계 대시보드 소스: [frontend/public/submission-html/index.html](https://github.com/Changwan2450/real-final-trip-zone/blob/main/frontend/public/submission-html/index.html)

### 핵심 문서

- 요구사항 명세서: [requirements.html](https://github.com/Changwan2450/real-final-trip-zone/blob/main/frontend/public/submission-html/docs/requirements.html)
- 기능 명세서: [features.html](https://github.com/Changwan2450/real-final-trip-zone/blob/main/frontend/public/submission-html/docs/features.html)
- 구조 명세서: [structure.html](https://github.com/Changwan2450/real-final-trip-zone/blob/main/frontend/public/submission-html/docs/structure.html)
- DB 명세서: [database.html](https://github.com/Changwan2450/real-final-trip-zone/blob/main/frontend/public/submission-html/docs/database.html)

### 확장 기준 문서

- 통합 기준서: [company.html](https://github.com/Changwan2450/real-final-trip-zone/blob/main/frontend/public/submission-html/docs/company.html)
- 구조 기준 v2: [structure-v2.html](https://github.com/Changwan2450/real-final-trip-zone/blob/main/frontend/public/submission-html/docs/structure-v2.html)
- DDL 기준 요약: [ddl.html](https://github.com/Changwan2450/real-final-trip-zone/blob/main/frontend/public/submission-html/docs/ddl.html)
- 제출 문서 안내: [submission-guide.html](https://github.com/Changwan2450/real-final-trip-zone/blob/main/frontend/public/submission-html/docs/submission-guide.html)
- 수정 코멘트: [comments.html](https://github.com/Changwan2450/real-final-trip-zone/blob/main/frontend/public/submission-html/docs/comments.html)
- 프론트 연동 가이드: [frontend-guide.html](https://github.com/Changwan2450/real-final-trip-zone/blob/main/frontend/public/submission-html/docs/frontend-guide.html)
- 백엔드 AI 브리프: `docs/07_백엔드AI작업브리프.md`

### 백엔드 팀원 AI 질문 방법

백엔드 팀원이 ChatGPT, Claude, Gemini, 웹 LLM 등에 질문할 때는 아래 순서를 권장한다.

1. 먼저 `docs/07_백엔드AI작업브리프.md` 전체를 통째로 넣는다.
2. 그 다음 현재 작업 중인 `controller`, `dto`, `service`, `domain` 파일이나 에러 로그를 같이 넣는다.
3. 질문은 추상적으로 하지 말고 `이 DTO를 설계도 기준으로 어떻게 고쳐야 하는지`, `이 API 응답을 프론트 service에 어떻게 맞출지`처럼 구체적으로 한다.

이 방식을 쓰는 이유:

- 프로젝트가 무엇인지 매번 다시 설명할 필요가 없다.
- AI가 설계도 우선, Oracle 기준, 프론트 `services` 연결 구조를 먼저 이해하고 답한다.
- 문의/인증/관리자 운영처럼 현재 충돌이 있는 구간에서 잘못된 답이 줄어든다.

### 발표자료

- 발표자료 HTML deck: [presentation/index.html](https://github.com/Changwan2450/real-final-trip-zone/blob/main/frontend/public/submission-html/presentation/index.html)
- 발표자료 소스 HTML: `frontend/public/submission-html/presentation/index.html`
- 발표자료 스타일: `frontend/public/submission-html/assets/presentation.css`
- 발표자료 스크립트: `frontend/public/submission-html/assets/presentation.js`

## 현재 구현 범위

### 프론트

- 메인
- 검색 리스트
- 숙소 상세
- 예약
- 로그인 / 회원가입 / 아이디 찾기 / 비밀번호 찾기
- 마이페이지 허브 및 세부 화면
- 판매자 / 관리자 화면
- 설계 문서 대시보드

### 설계도 기준으로 이미 맞춘 것

- 사용자 / 판매자 / 관리자 흐름
- 마이페이지 요구사항 추가 반영
- 리뷰는 숙박 완료 예약 기준
- 문의는 `문의방 + 메시지` 구조
- 판매자/관리자 액션은 mock 상태 변경까지 포함

## 팀원 전달 포인트

이 저장소는 지금 상태에서 아래 목적에 바로 사용 가능하다.

### 1. 프론트 확인

- 화면 흐름 확인
- 페이지 이동 확인
- 설계도 기준 UI/상태 mock 확인

### 2. 설계 문서 확인

- 대시보드에서 설계도/기준서/DDL/발표자료 한 번에 이동
- 발표 직전 또는 제출 직전 확인 용도

### 3. 백엔드 연결 시작점

팀원이 이어서 붙일 때 우선 보면 되는 파일:

- 설계 기준: `docs/tripzone-company-spec.md`
- 구조 기준: `docs/tripzone-structure-spec-v2.md`
- DB 기준: `docs/tripzone-ddl-v2.sql`
- 프론트 라우트 기준: `frontend/src/router/AppRouter.jsx`
- 공통 데이터 소스 기준: `frontend/src/lib/appClient.js`
- mock DB 기준: `frontend/src/lib/mockDb.js`
- 프론트 서비스 경계: `frontend/src/services/`
- 홈/리스트 데이터 기준: `frontend/src/data/homeData.js`, `frontend/src/data/lodgingData.js`
- 상세/예약 데이터 기준: `frontend/src/data/lodgingDetailData.js`, `frontend/src/data/bookingData.js`
- 마이페이지 데이터 기준: `frontend/src/data/mypageData.js`
- 대시보드/운영 데이터 기준: `frontend/src/data/dashboardData.js`, `frontend/src/data/opsData.js`
- 화면용 데이터 가공 기준: `frontend/src/features/`

### 실제 교체 순서

백엔드 팀원은 `pages`나 `features`부터 건드리지 말고 아래 순서로 교체한다.

1. `frontend/src/lib/appClient.js`
2. `frontend/src/services/lodgingService.js`
3. `frontend/src/services/bookingService.js`
4. `frontend/src/services/mypageService.js`
5. `frontend/src/services/dashboardService.js`
6. 마지막에 필요한 경우만 `features/` 보정

현재는 `appClient -> services -> mockDb/data` 구조다.  
실제 API 연결 시에는 `services` 내부에서 `mockDb/data` 대신 HTTP 호출로 바꾸는 것을 기준으로 한다.

## Oracle DB 연결 가이드

백엔드는 Oracle 기준으로 붙이는 것을 전제로 한다.

### 기준 원문

- 실행 DDL 원문: `docs/tripzone-ddl-v2.sql`
- DB 명세 요약: `docs/04_DB명세서.md`
- 통합 설계 기준: `docs/tripzone-company-spec.md`

### Oracle 기준 고정 사항

- PK는 기본적으로 `NUMBER(10)` + 시퀀스 사용
- 문자열은 `VARCHAR2`
- 등록/수정일은 `REG_DATE`, `UPD_DATE`
- soft-delete가 필요한 테이블은 `DELETED_AT` 사용
- 날짜 기본값은 `SYSDATE`
- 상태값은 문자열 컬럼 + `CHECK` 제약 기준으로 맞춘다

### 추천 구현 순서

1. `MEMBER_GRADES`, `USERS`, `USER_AUTH_PROVIDERS`, `USER_ROLES`
2. `HOST_PROFILES`
3. `EVENTS`, `COUPONS`, `USER_COUPONS`, `EVENT_COUPONS`
4. `LODGINGS`, `ROOMS`, `LODGING_IMAGES`
5. `BOOKINGS`, `PAYMENTS`
6. `REVIEWS`, `REVIEW_IMAGES`, `WISHLISTS`
7. `MILEAGE_HISTORY`, `USER_REFRESH_TOKENS`
8. `INQUIRY_ROOMS`, `INQUIRY_MESSAGES`
9. `AUDIT_LOGS`

### 핵심 상태값

- 회원 상태: `ACTIVE`, `DORMANT`, `BLOCKED`, `DELETED`
- 판매자 상태: `PENDING`, `APPROVED`, `REJECTED`, `SUSPENDED`
- 예약 상태: `PENDING`, `CONFIRMED`, `CANCELED`, `COMPLETED`, `NO_SHOW`
- 결제 상태: `READY`, `PAID`, `FAILED`, `CANCELED`, `PARTIAL_CANCELED`, `REFUNDED`
- 문의 상태: `OPEN`, `ANSWERED`, `CLOSED`, `BLOCKED`

### 프론트에서 바로 API로 치환할 지점

- 인증 세션 mock: `frontend/src/features/auth/authSession.js`
- 공통 데이터 소스 선택: `frontend/src/lib/appClient.js`
- mock DB 저장/수정: `frontend/src/lib/mockDb.js`
- 문의센터 mock 저장: `frontend/src/utils/myInquiryCenter.js`
- 사용자 영역 서비스 경계: `frontend/src/services/lodgingService.js`, `frontend/src/services/bookingService.js`, `frontend/src/services/mypageService.js`
- 운영 영역 서비스 경계: `frontend/src/services/dashboardService.js`
- 홈/이벤트 mock 데이터: `frontend/src/data/homeData.js`
- 숙소/리스트 mock 데이터: `frontend/src/data/lodgingData.js`
- 상세/예약 mock 데이터: `frontend/src/data/lodgingDetailData.js`, `frontend/src/data/bookingData.js`
- 마이페이지 mock 데이터: `frontend/src/data/mypageData.js`
- 대시보드 mock 데이터: `frontend/src/data/dashboardData.js`, `frontend/src/data/opsData.js`

### 현재 백엔드 코드 기준 주의 항목

아래는 설계도와 달리 `현재 팀원 백엔드 코드`에 맞춰 어댑터가 필요한 부분이다.

| 항목 | 설계도/프론트 기준 | 현재 백엔드 구현 |
|---|---|---|
| 로그인 요청 | `email`, `password` | `loginId`, `password` |
| 로그인 응답 | 프론트 mock 세션 shape | `accessToken`, `refreshToken`, `userNo`, `userName`, `roleNames` |
| 숙소 식별자 | `lodgingId` | `lodgingNo` |
| 숙소 이름 | `name` | `lodgingName` |
| 숙소 유형 | `type` | `lodgingType` |
| 예약 API 경로 | 문서상 `/api/bookings` 계열 예시 | 실제 `/api/booking` |
| 예약 식별자 | `bookingId` | `bookingNo` |
| 객실 식별자 | `roomId` | `roomNo` |
| 회원 보유 쿠폰 | `userCouponId` | `userCouponNo` |
| 결제 식별자 | `paymentId` 중심 | `paymentNo` + 외부결제키 `paymentId` 둘 다 존재 |
| 문의 모델 | `InquiryRoom`, `InquiryMessage` | 단일 `Inquiry` |
| 문의 상태 | `OPEN`, `ANSWERED`, `CLOSED`, `BLOCKED` | `PENDING`, `COMPLETED`, `DELETE` |

원칙:

- `예약/결제/숙소/리뷰`는 프론트 서비스 어댑터에서 백엔드 현재 DTO에 맞춘다.
- `문의/관리자 운영`은 설계도 기준을 유지하고, 백엔드가 따라오지 않은 상태를 문서에 명시한다.

### 화면별 API 매핑표

| 화면/도메인 | 현재 service | 우선 붙일 API 예시 |
|---|---|---|
| 홈/검색 리스트 | `lodgingService` | `GET /api/lodgings`, `GET /api/lodgings/search-suggestions` |
| 숙소 상세 | `lodgingService` | `GET /api/lodgings/{lodgingId}`, `GET /api/lodgings/{lodgingId}/reviews` |
| 예약 | `bookingService` | `GET /api/bookings/form-options`, `POST /api/bookings` |
| 내 예약 | `mypageService` | `GET /api/my/bookings`, `GET /api/my/bookings/{bookingId}` |
| 결제 내역 | `mypageService` | `GET /api/my/payments`, `GET /api/my/payments/{paymentId}` |
| 쿠폰/마일리지 | `mypageService` | `GET /api/my/coupons`, `GET /api/my/mileage` |
| 문의센터 | `mypageService` | `GET /api/my/inquiries`, `POST /api/my/inquiries`, `PATCH /api/my/inquiries/{inquiryId}` |
| 판매자 대시보드 | `dashboardService` | `GET /api/seller/dashboard` |
| 판매자 숙소/객실/예약 | `dashboardService` | `GET /api/seller/lodgings`, `GET /api/seller/rooms`, `GET /api/seller/reservations` |
| 판매자 상태 변경 | `dashboardService` | `PATCH /api/seller/lodgings/{lodgingId}`, `PATCH /api/seller/rooms/{roomId}`, `PATCH /api/seller/reservations/{bookingId}` |
| 관리자 회원/판매자 | `dashboardService` | `GET /api/admin/users`, `PATCH /api/admin/users/{userId}`, `GET /api/admin/sellers`, `PATCH /api/admin/sellers/{sellerId}` |
| 관리자 문의/이벤트/리뷰 | `dashboardService` | `GET /api/admin/inquiries`, `PATCH /api/admin/inquiries/{inquiryId}`, `GET /api/admin/events`, `PATCH /api/admin/events/{eventId}`, `GET /api/admin/reviews`, `PATCH /api/admin/reviews/{reviewId}` |
| 관리자 운영 로그 | `dashboardService` | `GET /api/admin/audit-logs` |

참고:

- 위 표는 `설계도 기준 타깃 API`다.
- 현재 팀원 백엔드 코드에 이미 존재하는 경로는 별도 어댑터로 맞춘다.
- 특히 예약은 현재 백엔드가 `/api/booking` 단수 경로를 사용한다.

### DTO/DB 연결 기준

mock 데이터는 지금부터 아래 키를 기준으로 API DTO와 맞춘다.

| 프론트 필드 | API DTO 필드 | Oracle/도메인 기준 |
|---|---|---|
| `bookingId` | `bookingId` | `BOOKINGS.BOOKING_ID` |
| `lodgingId` | `lodgingId` | `LODGINGS.LODGING_ID` |
| `roomId` | `roomId` | `ROOMS.ROOM_ID` |
| `paymentId` | `paymentId` | `PAYMENTS.PAYMENT_ID` |
| `userCouponId` | `userCouponId` | `USER_COUPONS.USER_COUPON_ID` |
| `inquiryId` 또는 `id` | `inquiryRoomId` | `INQUIRY_ROOMS.INQUIRY_ROOM_ID` |
| `status` | `status` | 문자열 상태 컬럼 |
| `statusLabel` | 서버 계산 또는 프론트 매핑 | UI 전용 라벨 |
| `issuedAt`, `paidAt`, `createdAt` | ISO date-time string | `REG_DATE`, `PAID_AT`, `UPD_DATE` 성격 컬럼 |

### mock DB 동작 방식

- `frontend/src/lib/mockDb.js`는 localStorage를 컬렉션 단위 mock DB처럼 쓴다.
- 지금 상태에서 백엔드 연결 전까지는 `services`가 이 mock DB를 읽고 쓴다.
- 실제 API 연결 후에는 `mockDb`를 건드리지 않고 `services` 내부 구현만 교체하는 것이 기준이다.
- 따라서 팀원은 `data` 파일 직접 참조를 늘리지 말고 `services` 함수만 추가/교체해야 한다.

### 백엔드 팀원 체크리스트

- 루트 패키지명은 `com.kh.trip`으로 고정
- 문의 도메인은 `InquiryRoom`, `InquiryMessage` 2단 구조 유지
- 프론트 라우트 기준 키는 `userId`, `lodgingId`, `roomId`, `bookingId`, `couponId` 중심으로 맞춘다
- 예약/리뷰/문의 흐름은 프론트가 이미 연결돼 있으므로 응답 스키마만 맞추면 교체가 쉽다
- 최신순 정렬이 필요한 화면은 API에서 정렬까지 내려주는 쪽이 안전하다
- Oracle 제약/시퀀스 이름은 가능하면 DDL 원문을 그대로 따른다
- `statusLabel` 같은 UI 라벨은 서버 계산 또는 프론트 매핑 중 하나로 고정해서 혼용하지 않는다
- `bookingId`, `paymentId`, `reviewId`, `inquiryRoomId` 같은 실제 식별자를 응답에 반드시 포함한다
- 프론트는 현재 `services` 단에서 mock/API 전환을 하므로, 새 API도 같은 서비스 단위로 묶는 것이 안전하다
- 현재 팀원 백엔드 코드의 `Inquiry`, `PENDING/COMPLETED/DELETE`는 설계도 최신본 기준과 불일치 상태임을 먼저 공유한다

### 가장 먼저 붙이면 좋은 API

1. 인증/세션
2. 숙소 목록/상세/객실
3. 예약/결제
4. 마이페이지 예약/쿠폰/마일리지/결제내역
5. 문의센터
6. 판매자 관리
7. 관리자 운영

## 주의

- 현재 상태는 프론트 중심 구현 + mock 액션 기준이다.
- 실제 DB 영속화, 인증, 결제 API, 관리자 처리 로직은 팀원 백엔드 구현이 필요하다.
- `frontend/src/lib/appClient.js`는 아직 `mock` 고정이다. 실제 API 연결 시 이 파일과 `services` 내부를 같이 바꿔야 한다.
- HTML 대시보드 기준 경로는 `frontend/public/submission-html/`가 현재 소스 오브 트루스다.
- 백엔드 저장소를 참고할 때도 설계 문서보다 우선하지 않는다. 문서와 코드가 충돌하면 문서를 기준으로 판정하고, 현재 구현 상태는 별도로 기록한다.
