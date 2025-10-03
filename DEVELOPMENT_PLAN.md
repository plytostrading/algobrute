# AlgoBrute - AI-Powered Trading Strategy Generator

## 🎯 Project Overview

AlgoBrute is a sophisticated web application designed to democratize algorithmic trading by allowing retail traders to use natural language to iteratively develop, visualize, and backtest trading strategies with AI assistance.

### Target Audience
- Millennial and Gen Z retail traders
- Intermediate level of trading sophistication  
- Users lacking programming skills but with trading ideas
- Traders who struggle to synthesize ideas into technical frameworks

### Core Value Proposition
Bridge the gap between trading intuition and technical implementation using conversational AI, visual strategy representation, and comprehensive market intelligence.

## 🏗 Architecture & Design

### Technology Stack
- **Frontend**: Next.js 15, React, TypeScript
- **Styling**: Tailwind CSS v4 with custom trading theme
- **UI Components**: shadcn/ui with trading-specific extensions
- **State Management**: Zustand (planned)
- **Charts**: TradingView Lightweight Charts (planned)
- **AI Integration**: OpenAI SDK (planned)
- **Data Fetching**: SWR (planned)
- **Icons**: Lucide React

### Layout Architecture
**3-Column Desktop Layout:**
1. **Left Panel (33%)**: AI Conversation Interface with reasoning display
2. **Center Panel (50%)**: Split between OHLCV Chart (top) and Strategy Tree (bottom)  
3. **Right Panel (25%)**: Company Intelligence with tabbed information

### Visual Design System
- **Dark Theme Optimized**: Deep black background (#080808) for trading environments
- **Color Palette**: 
  - Success: Green (#22C55E) for buy signals and profits
  - Danger: Red (#EF4444) for sell signals and losses  
  - Accent: Blue (#3B82F6) for primary interactions
  - Warning: Orange (#F59E0B) for alerts and cautions
- **Typography**: Monospace for numeric data with tabular-nums
- **Custom Scrollbars**: Styled for dark theme consistency

## ✅ Completed Features

### 1. Project Foundation ✓
- [x] Next.js 15 with TypeScript setup
- [x] Tailwind CSS v4 configuration with custom trading theme
- [x] shadcn/ui component library integration
- [x] Essential dependencies installation
- [x] Dark theme optimization for trading use

### 2. Layout & Design System ✓
- [x] 3-column responsive layout architecture
- [x] Custom CSS variables for trading-specific colors
- [x] Typography system optimized for financial data
- [x] Scrollbar customization for dark theme
- [x] Component structure and organization

### 3. Core UI Components ✓

#### Strategy Header Component
- [x] AlgoBrute branding with TrendingUp icon
- [x] Current strategy status and version display
- [x] Dynamic strategy summary with performance metrics
- [x] Key performance indicators (Expected Return, Win Rate, Max Drawdown)

#### AI Conversation Panel
- [x] Message history with user/AI conversation flow
- [x] **Exposed AI Reasoning**: Collapsible "thinking process" sections showing:
  - Intent understanding
  - Parameter identification  
  - Rule formulation
  - Market context synthesis
- [x] Interactive message input with keyboard shortcuts
- [x] Quick action suggestions for common modifications
- [x] Proper message threading and timestamps

#### Interactive Chart Panel  
- [x] Mock OHLCV candlestick visualization
- [x] Timeframe selector (1m, 5m, 15m, 1H, 1D, 1W)
- [x] Buy/sell signal overlays with visual indicators
- [x] Technical indicator display (SMA values)
- [x] Price and volume information
- [x] Trading signals legend
- [x] Prepared for TradingView Lightweight Charts integration

#### Strategy Tree Visualization
- [x] **Visual Strategy Representation** similar to Composer.trade:
  - Hierarchical node-based display
  - Color-coded components (conditions, actions, indicators)
  - Interactive tree structure with proper nesting
  - Strategy complexity metrics
- [x] Quick modification buttons for common strategy changes
- [x] Performance summary integration

#### Company Intelligence Panel
- [x] **Tabbed Interface** with three sections:
  - **Company**: Fundamentals, metrics grid, strategy impact assessment
  - **News**: Real-time news feed with sentiment analysis
  - **Analysis**: Technical indicators, AI recommendations, risk assessment
- [x] **Comprehensive Market Data**:
  - Market cap, P/E ratio, EPS, dividend yield, beta
  - Volume analysis and liquidity assessment
  - News sentiment scoring (67% positive, 25% neutral, 8% negative)
- [x] **AI-Powered Insights**: Strategy recommendations and risk warnings

#### Action Bar
- [x] **Real-time Status Indicators**: Strategy validation, last update, signal count
- [x] **Performance Dashboard**: Quick access to key metrics
- [x] **Primary Actions**: Backtest and Archive buttons with proper emphasis
- [x] **Secondary Tools**: Settings, sharing, and export options
- [x] **Risk Disclaimer**: Prominent educational notice

## 🚧 Development Roadmap

### Phase 1: AI Integration & Real-time Data (In Progress)
- [ ] **OpenAI Integration**: Connect conversation panel to GPT-4 for strategy generation
- [ ] **Streaming Responses**: Implement real-time token streaming for immediate feedback
- [ ] **Context Management**: Maintain conversation history and strategy state
- [ ] **Financial Data APIs**: Integrate Alpha Vantage or Yahoo Finance for live data
- [ ] **WebSocket Implementation**: Real-time price updates and market data

### Phase 2: Advanced Charting & Strategy Engine
- [ ] **TradingView Integration**: Replace mock chart with professional charting library
- [ ] **Technical Indicators**: Implement SMA, EMA, RSI, MACD, Stochastic
- [ ] **Strategy Engine**: Build rule evaluation system for buy/sell signal generation  
- [ ] **Dynamic Signal Overlays**: Update chart markers based on strategy changes
- [ ] **Interactive Strategy Tree**: Drag-and-drop editing with React Flow

### Phase 3: Backtesting & Analysis
- [ ] **Backtest Engine**: Historical strategy testing with performance metrics
- [ ] **Results Visualization**: Equity curves, drawdown analysis, trade history
- [ ] **Parameter Optimization**: Automated strategy parameter testing
- [ ] **Risk Metrics**: Sharpe ratio, maximum drawdown, win/loss ratios
- [ ] **Export Capabilities**: PDF reports and CSV data export

### Phase 4: Strategy Management & Sharing
- [ ] **Local Storage**: Save strategies to browser storage
- [ ] **Cloud Sync**: Optional user accounts for cross-device access
- [ ] **Strategy Library**: Browse and search saved strategies  
- [ ] **Tagging System**: Organize by asset class, timeframe, performance
- [ ] **Sharing Features**: Generate shareable strategy links

### Phase 5: User Experience & Engagement
- [ ] **Gamification**: Achievement system for strategy milestones
- [ ] **Smart Notifications**: Market alerts and strategy triggers
- [ ] **Onboarding Flow**: Progressive disclosure for new users
- [ ] **Keyboard Shortcuts**: Power user efficiency features
- [ ] **Loading States**: Skeleton screens and progress indicators

### Phase 6: Production & Scale
- [ ] **Performance Optimization**: Code splitting, memoization, Web Workers
- [ ] **Error Handling**: Comprehensive error boundaries and fallbacks
- [ ] **Testing Suite**: Unit, integration, and end-to-end tests
- [ ] **Deployment**: Vercel hosting with environment configuration
- [ ] **Monitoring**: Error tracking, analytics, performance monitoring
- [ ] **Documentation**: User guides and API documentation

## 🎨 Key Features Implemented

### 1. Exposed AI Reasoning
The conversation panel includes collapsible "thinking process" sections that show:
- **Intent Understanding**: How the AI interprets user requests
- **Parameter Identification**: Recognition of trading parameters and defaults
- **Rule Formulation**: Logic behind buy/sell rule generation
- **Market Context**: Synthesis of relevant market information

### 2. Visual Strategy Representation
The strategy tree panel displays strategies as node-based hierarchical structures:
- **Color-coded Components**: Blue for conditions, green/red for buy/sell actions, gray for indicators
- **Interactive Flow**: Visual representation of IF/THEN logic
- **Complexity Metrics**: Assessment of strategy sophistication
- **Quick Modifications**: One-click additions for common enhancements

### 3. Comprehensive Market Intelligence
Three-tab information system providing:
- **Fundamental Analysis**: Key financial metrics and company overview
- **News Integration**: Sentiment-analyzed news feed with source attribution  
- **Technical Analysis**: RSI, MACD, Stochastic with AI recommendations

### 4. Iterative Strategy Development
The interface supports continuous refinement:
- **Conversation History**: Full context preservation across iterations
- **Version Tracking**: Strategy evolution with rollback capability (planned)
- **Performance Feedback**: Real-time metrics as strategies evolve
- **Suggestion Engine**: AI-powered improvements and optimizations

## 📊 Current Application State

The AlgoBrute application is now **functionally complete** for its MVP phase with:
- ✅ Full responsive layout working across desktop screens
- ✅ All core UI components rendering correctly
- ✅ Mock data demonstrating intended functionality
- ✅ Dark theme optimized for trading environments
- ✅ No TypeScript errors or critical linting issues
- ✅ Ready for AI integration and real-time data connections

**Next Priority**: Integrate OpenAI API for conversation functionality and financial data APIs for live market information.

## 🚀 Getting Started

### Development Server
```bash
npm run dev
```
Navigate to `http://localhost:3000` (or available port)

### Building for Production
```bash
npm run build
npm start
```

### Testing
```bash
npm run lint          # ESLint checking
npx tsc --noEmit      # TypeScript validation
```

## 📝 Development Notes

### Performance Considerations
- Uses React's built-in optimization patterns
- Prepared for code splitting on chart and AI components
- Monospace fonts with tabular-nums for consistent number display
- Efficient re-rendering with proper component structure

### Accessibility 
- Semantic HTML structure throughout
- Keyboard navigation support in conversation panel
- Color contrast optimized for dark trading environments
- Screen reader friendly component labeling

### Mobile Considerations
Current layout is desktop-optimized but responsive breakpoints are configured for future mobile adaptations.

---

**AlgoBrute** represents a new paradigm in retail trading tools, combining the power of AI with sophisticated financial visualization to democratize algorithmic trading strategy development.

*Last Updated: January 2024*