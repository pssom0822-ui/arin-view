ARIN View v1.1 AUTO FINAL

- SBS 8뉴스: 공식 RSS를 Cloudflare Worker가 읽어 자동 갱신
- MBC: 공식 MBC 뉴스 페이지에서 최신 기사 링크를 읽어 자동 갱신
- 앱 열기/복귀 시 갱신 + 15분 간격 갱신
- 네트워크/원본 소스 오류 시 기존 화면을 유지하고 "갱신 실패" 표시
- KRX KOSPI/KOSDAQ: 공식 API 인증키/활용 승인 전에는 숫자를 만들지 않고 대기 표시

배포 구조: Cloudflare Worker + Static Assets
worker.js와 wrangler.jsonc가 백엔드/정적자산을 함께 배포하도록 구성됨.
