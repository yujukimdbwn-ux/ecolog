# EcoLog 웹앱

Next.js 14(App Router) 기반의 EcoLog MVP입니다. Firebase(Google 로그인·Firestore·Storage)와 Gemini Vision, Google Maps를 사용합니다.

## 사전 요구

- Node.js 18 이상(LTS 권장) — `node`, `npm`이 PATH에 있어야 합니다.
- Firebase 프로젝트: Authentication(Google), Firestore, Storage 활성화.
- Google AI Studio 등에서 **Gemini API 키**(서버 전용).
- Google Cloud에서 **Maps JavaScript API** 활성화 및 키 발급(`NEXT_PUBLIC_…`).

## 설치

```bash
cd web
npm install
```

`.env.local` 파일을 만들고 [`.env.example`](./.env.example)을 채웁니다.

## 개발 서버

```bash
npm run dev
```

**빌드 전에 반드시** 같은 폴더에서 `npm install` 을 실행해 두세요. 실행하지 않으면 `npm run build` 시 `'next'은(는) 내부 또는 외부 명령...` 오류가 납니다.

## 프로덕션 빌드

```bash
npm run build
```

Firebase 환경 변수가 없어도 **빌드는 성공**합니다. 런타임에 `.env.local` 을 채우면 브라우저에서만 Firebase가 초기화됩니다.

브라우저에서 `http://localhost:3000` — 카메라·위치 권한 테스트는 **HTTPS 배포 URL**(예: Vercel)에서 하는 것이 안전합니다.

## Firebase 보안 규칙

개발용 예시는 [`firestore.rules.sample`](./firestore.rules.sample)을 참고해 Firestore 규칙에 반영하세요. 프로덕션에서는 필드를 더 좁히고 검증 규칙을 강화하는 것이 좋습니다.

Storage는 기본적으로 인증된 사용자만 자신의 경로에 쓰도록 제한하세요(예: `observations/{uid}/...`).

## 배포 (Vercel)

Vercel에 GitHub 연동 후, Environment Variables에 `.env.local`과 동일한 키를 등록합니다. `GEMINI_API_KEY`는 **서버 전용**이므로 `NEXT_PUBLIC_` 접두어를 붙이지 않습니다.

## 프로젝트 구조 요약

| 경로 | 설명 |
|------|------|
| `app/api/identify/route.ts` | Gemini Vision 식별 API |
| `lib/saveObservation.ts` | Firestore에 관찰·도감 기록 |
| `components/UploadObservation.tsx` | 사진 업로드·AI·저장 흐름 |
| `components/PokedexGrid.tsx` | 수집 도감 그리드 |
| `components/ObservationMap.tsx` | 히트맵 + 내 관찰 마커 |
