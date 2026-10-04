ARIN View v1.3 FINAL

완성 항목
- SBS 8뉴스 / MBC 뉴스 자동갱신
- ☀️ 아린의 아침 브리핑: 최대 5개, 중복·카테고리 편중 억제, 원문 링크
- 앱 열기/복귀/focus + 15분 간격 자동갱신
- 외부 소스 요청 timeout 적용, 일부 소스 실패 시 가능한 데이터 유지
- USD/KRW: ECB 공식 일일 참고환율(EUR 기준 USD·KRW 교차계산) 자동 표시
- KOSPI/KOSDAQ: KRX Open API 승인 전 — 유지 (가짜 값 금지)
- NASDAQ: 적합한 표시/재배포 데이터 라이선스 확보 전 — 유지 (가짜 값 금지)
- SD 아린 아이콘/버블, 위치 저장, 탭 상태 저장 유지
- Cloudflare 호환 날짜 2026-10-03 적용
- 서비스워커 캐시 v1.3으로 갱신

배포
기존 GitHub pssom0822-ui/arin-view 저장소의 루트 파일을 이 폴더의 8개 파일로 교체/업로드 후 커밋하면 Cloudflare Git 연동이 자동 배포합니다.

주의
USD/KRW는 실시간 체결환율이 아니라 ECB의 최근 영업일 일일 참고환율입니다.
