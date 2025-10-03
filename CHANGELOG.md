# Changelog

All notable changes to this project will be documented in this file.

## [0.2.0] - 2025-10-03

### Added
- Dual charting support with TradingView Lightweight Charts and Plotly.js (candlestick + volume subplots).
- Real market data integration using Yahoo Finance with 5-minute caching and CORS proxy.
- Automated trading signals (Golden/Death Cross) using SMA(20) and SMA(50) with visual markers.
- Exposed AI reasoning in the conversation panel (intent, parameters, rules, market context) with collapsible UI.
- LLM provider selector (OpenAI GPT-4 Turbo and xAI Grok-2) with token usage and estimated cost display.
- Visual Strategy Logic Trees with color-coded nodes, complexity metrics, and quick modification actions.
- Market Intelligence panel with tabs for company fundamentals, news sentiment, and technical analysis.
- Project structure documentation, development guidelines, and contribution instructions.
- CHANGELOG.md and reference assets framework with screenshot/GIF placeholders.

### Changed
- README.md comprehensively updated to reflect current architecture, features, and roadmap.
- Upgraded dependencies to Next.js 15.5.4, React 19.1.0, TypeScript 5, Tailwind CSS 4.

### Planned
- Live AI conversation (OpenAI/Grok) with streaming responses.
- VectorBT backtesting integration (FastAPI backend and/or browser-based engine).
- Real-time data via WebSockets, parameter optimization, and export capabilities.

## [0.1.0] - 2025-09-20 (approx)

### Added
- Initial MVP layout with 3-column responsive design.
- Mock data services and initial chart/strategy/conversation components.
- Basic styling/theme and shadcn/ui component setup.
- Next.js 15 foundation with TypeScript and Tailwind CSS.
