# ARIN View · focused briefing

This is the news briefing service, separate from pssom0822-ui/arin-beta. Existing Today/News/Market/Arin tabs and real SBS/MBC + ECB sources are preserved. No companion chat, MASTER or private gallery is added.

Three stories are selected using rule-based importance, publication freshness when available, local interest preferences, unread priority, exact normalized headline duplicates and category diversity. Arin comments explain the topic's relevance; they are rule-based guidance, not generated summaries or independently verified facts. The source pool is currently SBS/MBC, not a private chat/community connector. Read markers and interests are nonsensitive local preferences. Rendered titles use textContent, links are restricted to HTTP(S). Feed failures are explicit. MBC source year follows the current year; SBS publication dates are parsed from each item.

SD uses contain without zoom, with safe padding and keyboard-accessible touch/drag behavior. Position reset and day/night/automatic theme are supported. Inline original image bytes are extracted unchanged to this repository's assets directory. No assets from the App repository are reused. API routing runs the Worker for /api/*; service worker does not cache API responses or serve HTML as an API/image fallback. Source/config files are excluded from static assets.

## Recovery and validation

Previous main preserved at backup/before-prototype-20261008, 19eacf959b8c72c6e4a7c9385acebdc64d3c04dd. Work branch feature/mobile-briefing-20261008. Revert the change commit to recover without rewriting history.
Node syntax, mock DOM shortlist/interest/storage-failure/URL/offline handling, mocked live RSS/MBC parsing and source outage handling, manifest and static structure checked. No rendering browser is available in this environment; actual mobile screenshots, live upstream source quality and physical PWA checks remain to validate.
