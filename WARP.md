# WARP.md

This file provides guidance to WARP (warp.dev) when working with code in this repository.

## Project Overview

**AlgoBrute** is an AI-powered trading strategy generator that democratizes algorithmic trading through conversational AI, real-time market data, and advanced visual strategy development. The application enables retail traders to develop, visualize, backtest, and iterate on trading strategies using natural language conversation with AI.

### Core Technology Stack
- **Frontend**: Next.js 15.5.4 with App Router, React 19.1.0, TypeScript 5.0+
- **Styling**: Tailwind CSS 4.0 with custom trading theme, shadcn/ui components
- **Charting**: Dual implementation with TradingView Lightweight Charts 4.2.0 and Plotly.js 3.1.1
- **Database**: PostgreSQL with market data aggregates
- **AI Integration**: OpenAI GPT-4 and xAI Grok-2 support (planned)
- **State Management**: SWR for data fetching, React state for UI components

### Key Features
- **Conversational AI Strategy Generation**: Natural language to trading strategy conversion
- **Exposed AI Reasoning**: Transparent "thinking process" with collapsible reasoning sections
- **Visual Strategy Trees**: Node-based hierarchical strategy representation similar to Composer.trade
- **Advanced Charting**: Professional OHLCV charts with technical indicators and signal overlays
- **Market Intelligence**: Real-time data integration with Yahoo Finance, company fundamentals, news analysis

## Quick Start Commands

```bash
# Development
npm run dev          # Start development server with Turbopack
npm run build        # Build for production with optimizations
npm start            # Start production server

# Code Quality
npm run lint         # Run ESLint with Next.js configuration
npx tsc --noEmit     # TypeScript type checking without build

# Dependencies
npm install          # Install all dependencies
npm update           # Update to latest compatible versions
```

### Environment Setup

Copy `.env.local.example` to `.env.local` and configure:

```bash
# Essential for AI features (when implemented)
OPENAI_API_KEY=your_openai_api_key_here
GROK_API_KEY=your_grok_api_key_here

# Database connection for real market data
PG_HOST=localhost
PG_PORT=5432
PG_USER=your_username
PG_PASSWORD=your_password
PG_DATABASE=market_data

# Application settings
NEXT_PUBLIC_ENABLE_MOCK_DATA=true  # Use mock data during development
```

## Architecture Overview

### Application Structure

```
src/
├── app/                           # Next.js 15 App Router
│   ├── api/                      # API routes for data fetching
│   │   ├── market-data/route.ts  # PostgreSQL market data queries
│   │   ├── stock-info/route.ts   # Real-time stock information
│   │   └── db-test/route.ts      # Database connectivity testing
│   ├── layout.tsx               # Root layout with theme providers
│   └── page.tsx                 # Single-page application entry point
├── components/                   # Feature-based component organization
│   ├── ui/                      # shadcn/ui base components
│   ├── layout/                  # Application layout (header, tabs, action bar)
│   ├── chart/                   # Dual charting system (Plotly + TradingView)
│   ├── conversation/            # AI chat interface with reasoning display
│   ├── strategy/                # Visual strategy tree representation
│   ├── info/                    # Market intelligence panels
│   └── ai/                      # LLM provider selection
├── lib/                         # Core services and utilities
│   ├── dataService.ts          # Mock data service with intelligent fallbacks
│   ├── realDataService.ts      # PostgreSQL and API integration
│   └── utils.ts                # Shared utility functions
└── utils/                       # Helper functions
    └── chartUtils.ts           # TradingView chart configuration
```

### Data Flow Architecture

1. **UI Components** → SWR hooks for data fetching
2. **SWR** → API routes (`/api/market-data`, `/api/stock-info`)
3. **API Routes** → Service layer (`realDataService.ts`)
4. **Service Layer** → PostgreSQL database or external APIs
5. **Fallback Pattern** → `dataService.ts` provides mock data when APIs unavailable

### State Management Patterns

- **Global State**: Minimal React state, prefer server state via SWR
- **Data Fetching**: SWR with 5-minute cache TTL for market data
- **UI State**: Local component state for interactions, theme context for dark mode
- **Form State**: Controlled components with TypeScript validation

## Development Patterns

### Component Organization

Components are organized by feature/domain rather than type:
- `layout/` - App-wide layout components (header, navigation, action bar)
- `chart/` - All charting-related components and utilities
- `conversation/` - AI chat interface and message components
- `strategy/` - Strategy visualization and tree components
- `info/` - Market intelligence and company data displays

### TypeScript Conventions

- **Strict Mode Enabled**: All code must pass TypeScript strict checks
- **Interface Definitions**: Defined in component files or shared in `/lib` for reuse
- **Path Aliases**: Use `@/` for imports from `src/` directory
- **Type Safety**: Prefer interfaces over types, explicit return types for functions

### Data Service Switching Pattern

The application uses a dual-service pattern for data handling:

```typescript
// Mock data service - always available, realistic data generation
import { dataService } from '@/lib/dataService';

// Real data service - connects to APIs and database
import { realDataService } from '@/lib/realDataService';

// Usage in components with fallback
const data = await realDataService.getOHLCData(symbol, timeframe)
  .catch(() => dataService.getOHLCData(symbol, timeframe));
```

### Tailwind CSS Theme Usage

Custom trading-optimized dark theme with CSS variables:
- **Background**: Deep blacks (`#080808`, `#111827`) for reduced eye strain
- **Success**: Green (`#22C55E`) for buy signals and profits
- **Danger**: Red (`#EF4444`) for sell signals and losses
- **Typography**: Monospace fonts with `tabular-nums` for financial data
- **Custom Scrollbars**: Styled for dark theme consistency

### API Route Conventions

- **Naming**: Kebab-case with descriptive names (`market-data`, `stock-info`)
- **Error Handling**: Always return `{ success: boolean, data?, error? }` format
- **TypeScript**: Full type safety with request/response interfaces
- **Database**: PostgreSQL connection pooling with proper cleanup
- **Caching**: Service-level caching, not API-level

## AI Integration Architecture

### Conversation Interface Pattern

The AI conversation system uses:
- **Message Threading**: User/AI conversation flow with timestamps
- **Exposed Reasoning**: Collapsible sections showing AI "thinking process"
- **Strategy Context**: Persistent strategy state across conversation iterations
- **Quick Actions**: Pre-built buttons for common strategy modifications

### Strategy Generation Workflow

1. **User Input** → Natural language strategy description
2. **AI Processing** → Intent understanding and parameter identification
3. **Rule Formulation** → Convert to structured trading rules
4. **Tree Visualization** → Generate node-based visual representation
5. **Iterative Refinement** → Allow modifications through conversation

### LLM Integration Points (Planned)

```typescript
// OpenAI integration
const response = await openai.chat.completions.create({
  model: "gpt-4-turbo",
  messages: conversationHistory,
  stream: true // Enable token streaming
});

// Grok integration (similar pattern)
const response = await grok.chat({
  model: "grok-2",
  messages: conversationHistory
});
```

## Data Management

### PostgreSQL Schema

Market data is stored in `public.equity_price_aggregates`:
- **ticker**: Symbol (e.g., 'AAPL')
- **timespan**: 'minute' or 'day'
- **timestamp**: UTC timestamp
- **open, high, low, close**: OHLC price data
- **volume**: Trading volume

### Real-time Data Strategy

- **Primary**: PostgreSQL for historical data
- **Secondary**: Yahoo Finance API for live quotes (via CORS proxy)
- **Caching**: 5-minute TTL at service level, not database level
- **Fallback**: Sophisticated mock data generation when APIs unavailable

### Mock Data Service

Used for development and when external APIs are unavailable:
- **Realistic Generation**: Trends, volatility, volume patterns
- **Timeframe Support**: Minute-level to multi-year data
- **Technical Indicators**: Built-in SMA calculations
- **News Generation**: Sentiment-analyzed mock news feed

## Database Operations

### Common Queries

Test database connectivity:
```bash
curl http://localhost:3000/api/db-test
```

Fetch market data:
```bash
curl "http://localhost:3000/api/market-data?symbol=AAPL&timeframe=1D"
```

### Migration Pattern

While no formal migration system exists, database schema changes should:
1. Be backward compatible when possible
2. Include both schema and data migration scripts
3. Be tested with both development and production data volumes

## Reference Assets Usage

The `reference_assets/` directory contains development reference materials:
- **Purpose**: Visual prototyping aids and design specifications
- **Screenshots**: UI mockups and layout examples in `screenshots/`
- **GIFs**: Interaction demos and animated examples in `gifs/`
- **Data Files**: Sample data formats for prototyping

### Adding New Reference Assets

1. Place visual assets in appropriate subdirectories
2. Use descriptive filenames (e.g., `chart-tradingview-signals.png`)
3. Update README.md in reference_assets if adding new categories
4. Reference in documentation using relative paths

## Common Issues & Solutions

### Next.js 15 and Turbopack

- **Issue**: Turbopack build failures
- **Solution**: Check for unsupported imports, use `--turbopack` flag consistently
- **Alternative**: Remove `--turbopack` from scripts if issues persist

### TypeScript Strict Mode

- **Issue**: Strict null checks failing
- **Solution**: Use optional chaining (`?.`) and nullish coalescing (`??`)
- **Pattern**: Prefer explicit null checks over type assertions

### Charting Library Integration

- **Issue**: Dynamic imports for large libraries
- **Solution**: Use Next.js dynamic imports with `ssr: false`
```typescript
const Chart = dynamic(() => import('./ChartComponent'), { ssr: false });
```

### Database Connection Issues

- **Issue**: Connection pool exhaustion
- **Solution**: Always use `client.release()` in finally blocks
- **Pattern**: Use connection pooling, not individual connections

### shadcn/ui Component Updates

- **Issue**: Component version mismatches
- **Solution**: Use `npx shadcn@latest add component-name` to update
- **Pattern**: Keep components.json configuration in sync

## Performance Considerations

### Code Splitting
- Chart libraries are dynamically imported to reduce initial bundle size
- Consider splitting AI integration components when implemented

### Memoization
- Use `React.memo` for expensive chart renderings
- Use `useMemo` for technical indicator calculations
- Avoid unnecessary re-renders with proper dependency arrays

### Bundle Analysis
```bash
npm run build && npx @next/bundle-analyzer
```

## Testing Strategy (Future)

When implementing tests, follow this pattern:
- **Unit Tests**: Component behavior with @testing-library/react
- **Integration Tests**: API routes with real database connections
- **E2E Tests**: Critical user journeys with Playwright
- **Mock Services**: Test against both real and mock data services

---

*Last Updated: January 2025 • AlgoBrute v0.2.0*