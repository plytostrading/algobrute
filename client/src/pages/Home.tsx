import React from 'react';
import { Terminal, Shield, Cpu, Activity, ArrowRight, Code, BarChart2, Lock } from 'lucide-react';

export default function Home() {
  return (
    <div className="min-h-screen bg-[#050505] text-white font-mono selection:bg-[#00FF41] selection:text-black">
      {/* Navigation */}
      <nav className="fixed w-full z-50 border-b border-[#333] bg-[#050505]/90 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-[#00FF41]"></div>
              <span className="text-xl font-bold tracking-tighter">ALGOBRUTE</span>
            </div>
            <div className="hidden md:block">
              <div className="flex items-baseline space-x-8 text-sm">
                <a href="#features" className="hover:text-[#00FF41] transition-colors">MODULES</a>
                <a href="#pricing" className="hover:text-[#00FF41] transition-colors">ACCESS</a>
                <a href="#research" className="hover:text-[#00FF41] transition-colors">RESEARCH</a>
                <button className="border border-[#00FF41] text-[#00FF41] px-4 py-2 hover:bg-[#00FF41] hover:text-black transition-all duration-100 uppercase text-xs font-bold">
                  Initialize Terminal
                </button>
              </div>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative pt-32 pb-20 lg:pt-48 lg:pb-32 overflow-hidden">
        <div className="absolute inset-0 z-0 opacity-20">
          <div className="absolute inset-0 bg-[linear-gradient(to_right,#1a1a1a_1px,transparent_1px),linear-gradient(to_bottom,#1a1a1a_1px,transparent_1px)] bg-[size:4rem_4rem]"></div>
        </div>
        
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <div className="inline-flex items-center gap-2 border border-[#333] bg-[#111] px-3 py-1 mb-8">
                <span className="w-2 h-2 bg-[#00FF41] animate-pulse"></span>
                <span className="text-xs text-gray-400 uppercase tracking-widest">System Operational v2.4.0</span>
              </div>
              <h1 className="text-5xl lg:text-7xl font-bold tracking-tighter leading-none mb-6">
                INSTITUTIONAL<br />
                <span className="text-[#333]">GRADE</span><br />
                EXECUTION
              </h1>
              <p className="text-xl text-gray-400 mb-8 max-w-lg font-sans">
                Stop gambling. Start engineering. AlgoBrute provides the infrastructure for sophisticated retail traders to backtest, validate, and execute algorithmic strategies with institutional precision.
              </p>
              <div className="flex flex-col sm:flex-row gap-4">
                <button className="bg-[#00FF41] text-black px-8 py-4 font-bold uppercase tracking-wider hover:bg-white transition-colors flex items-center justify-center gap-2 group">
                  Start Backtest
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </button>
                <button className="border border-[#333] text-gray-300 px-8 py-4 font-bold uppercase tracking-wider hover:border-white hover:text-white transition-colors">
                  View Documentation
                </button>
              </div>
            </div>
            <div className="relative">
              <div className="border border-[#333] bg-[#0A0A0A] p-2">
                <div className="flex items-center justify-between px-4 py-2 border-b border-[#333] bg-[#111] mb-2">
                  <span className="text-xs text-gray-500">TERMINAL_PREVIEW</span>
                  <div className="flex gap-2">
                    <div className="w-2 h-2 rounded-full bg-red-500"></div>
                    <div className="w-2 h-2 rounded-full bg-yellow-500"></div>
                    <div className="w-2 h-2 rounded-full bg-green-500"></div>
                  </div>
                </div>
                <img 
                  src="https://private-us-east-1.manuscdn.com/sessionFile/HqyEPK95aD98F100rJ2V7T/sandbox/FNo529hNiiEV1Hu0kNj2kt-img-1_1770440327000_na1fn_aGVyb190ZXJtaW5hbA.png?x-oss-process=image/resize,w_1920,h_1920/format,webp/quality,q_80&Expires=1798761600&Policy=eyJTdGF0ZW1lbnQiOlt7IlJlc291cmNlIjoiaHR0cHM6Ly9wcml2YXRlLXVzLWVhc3QtMS5tYW51c2Nkbi5jb20vc2Vzc2lvbkZpbGUvSHF5RVBLOTVhRDk4RjEwMHJKMlY3VC9zYW5kYm94L0ZObzUyOWhOaWlFVjFIdTBrTmoya3QtaW1nLTFfMTc3MDQ0MDMyNzAwMF9uYTFmbl9hR1Z5YjE5MFpYSnRhVzVoYkEucG5nP3gtb3NzLXByb2Nlc3M9aW1hZ2UvcmVzaXplLHdfMTkyMCxoXzE5MjAvZm9ybWF0LHdlYnAvcXVhbGl0eSxxXzgwIiwiQ29uZGl0aW9uIjp7IkRhdGVMZXNzVGhhbiI6eyJBV1M6RXBvY2hUaW1lIjoxNzk4NzYxNjAwfX19XX0_&Key-Pair-Id=K2HSFNDJXOU9YS&Signature=M4warsqkbekIV5zpSF2dg6d9tLE5gQqYH1~Z75QjzCUzUZ3C7OMVFWU89jzwTigVMnEzMZ6h9w4jXyO~ZxO0qqnpFqyshw4uKcxzefeEXoEIbH1gH1HNuUgTgvw5s7uyCuSKWMVVInqPSlJI8I9FRR~WrzrvZQ6cOVxee32pwHGKIIfEF6rFGEOPrp~-OjaCvryAVfgo~VED3H7M0ooN2M388jter0vWIyBo076-HRzq2h8L1uVgFvgvLVO3M13rkMONg5KZPo5sCahDsBUNeseqzhYfU3kSDOI5AXkbTU-Hw40UePYl1SaOOKZNIN7jzet8ZwGUjRJ7EvUqiMRBdA__" 
                  alt="Trading Terminal Interface" 
                  className="w-full h-auto grayscale hover:grayscale-0 transition-all duration-500"
                />
                <div className="mt-2 flex justify-between text-[10px] text-[#00FF41]">
                  <span>CPU: 12%</span>
                  <span>MEM: 4.2GB</span>
                  <span>LATENCY: 14ms</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Ticker */}
      <div className="border-y border-[#333] bg-[#0A0A0A] overflow-hidden py-4">
        <div className="flex gap-12 animate-marquee whitespace-nowrap text-sm text-gray-400 font-mono">
          <span>BTC/USD <span className="text-[#00FF41]">$45,230.50</span></span>
          <span>ETH/USD <span className="text-red-500">$3,210.00</span></span>
          <span>SPY <span className="text-[#00FF41]">$412.55</span></span>
          <span>VIX <span className="text-[#00FF41]">18.22</span></span>
          <span>SYSTEM_STATUS: <span className="text-[#00FF41]">ONLINE</span></span>
          <span>ACTIVE_BOTS: <span className="text-white">1,240</span></span>
          <span>DAILY_VOLUME: <span className="text-white">$42M</span></span>
        </div>
      </div>

      {/* Features Grid */}
      <section id="features" className="py-24 border-b border-[#333]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mb-16">
            <h2 className="text-3xl font-bold mb-4">CORE_MODULES</h2>
            <div className="w-24 h-1 bg-[#00FF41]"></div>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {/* Feature 1 */}
            <div className="group border border-[#333] bg-[#0A0A0A] hover:border-[#00FF41] transition-colors p-8">
              <div className="mb-6 text-[#00FF41]">
                <Terminal className="w-10 h-10" />
              </div>
              <h3 className="text-xl font-bold mb-4">NATURAL LANGUAGE DISCOVERY</h3>
              <p className="text-gray-400 text-sm leading-relaxed font-sans mb-6">
                Convert plain English trade ideas into executable SDO v2 JSON strategies. Our LLM pipeline parses price action, news, and fundamentals with strict signal hierarchy.
              </p>
              <ul className="text-xs text-gray-500 space-y-2 font-mono">
                <li className="flex items-center gap-2">
                  <span className="w-1 h-1 bg-[#00FF41]"></span>
                  PROMPT_ENGINEERING_V5
                </li>
                <li className="flex items-center gap-2">
                  <span className="w-1 h-1 bg-[#00FF41]"></span>
                  SIGNAL_HIERARCHY_ENFORCEMENT
                </li>
              </ul>
            </div>

            {/* Feature 2 */}
            <div className="group border border-[#333] bg-[#0A0A0A] hover:border-[#00FF41] transition-colors p-8">
              <div className="mb-6 text-[#00F0FF]">
                <Activity className="w-10 h-10" />
              </div>
              <h3 className="text-xl font-bold mb-4">REGIME-AWARE BACKTESTING</h3>
              <p className="text-gray-400 text-sm leading-relaxed font-sans mb-6">
                Don't just backtest price. Backtest context. Our engine detects market regimes (volatility, trend, changepoints) to validate strategy robustness across different environments.
              </p>
              <ul className="text-xs text-gray-500 space-y-2 font-mono">
                <li className="flex items-center gap-2">
                  <span className="w-1 h-1 bg-[#00F0FF]"></span>
                  WALK_FORWARD_ANALYSIS
                </li>
                <li className="flex items-center gap-2">
                  <span className="w-1 h-1 bg-[#00F0FF]"></span>
                  MONTE_CARLO_SIMULATION
                </li>
              </ul>
            </div>

            {/* Feature 3 */}
            <div className="group border border-[#333] bg-[#0A0A0A] hover:border-[#00FF41] transition-colors p-8">
              <div className="mb-6 text-red-500">
                <Shield className="w-10 h-10" />
              </div>
              <h3 className="text-xl font-bold mb-4">INSTITUTIONAL RISK GUARDRAILS</h3>
              <p className="text-gray-400 text-sm leading-relaxed font-sans mb-6">
                Hard-coded risk limits that prevent emotional trading. Set max drawdown, daily loss limits, and position sizing rules that cannot be overridden during live trading.
              </p>
              <ul className="text-xs text-gray-500 space-y-2 font-mono">
                <li className="flex items-center gap-2">
                  <span className="w-1 h-1 bg-red-500"></span>
                  KILL_SWITCH_PROTOCOL
                </li>
                <li className="flex items-center gap-2">
                  <span className="w-1 h-1 bg-red-500"></span>
                  DYNAMIC_POSITION_SIZING
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Deep Dive Section */}
      <section className="py-24 bg-[#080808]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <div className="order-2 lg:order-1">
              <img 
                src="https://private-us-east-1.manuscdn.com/sessionFile/HqyEPK95aD98F100rJ2V7T/sandbox/FNo529hNiiEV1Hu0kNj2kt-img-2_1770440321000_na1fn_ZmVhdHVyZV9iYWNrdGVzdA.png?x-oss-process=image/resize,w_1920,h_1920/format,webp/quality,q_80&Expires=1798761600&Policy=eyJTdGF0ZW1lbnQiOlt7IlJlc291cmNlIjoiaHR0cHM6Ly9wcml2YXRlLXVzLWVhc3QtMS5tYW51c2Nkbi5jb20vc2Vzc2lvbkZpbGUvSHF5RVBLOTVhRDk4RjEwMHJKMlY3VC9zYW5kYm94L0ZObzUyOWhOaWlFVjFIdTBrTmoya3QtaW1nLTJfMTc3MDQ0MDMyMTAwMF9uYTFmbl9abVZoZEhWeVpWOWlZV05yZEdWemRBLnBuZz94LW9zcy1wcm9jZXNzPWltYWdlL3Jlc2l6ZSx3XzE5MjAsaF8xOTIwL2Zvcm1hdCx3ZWJwL3F1YWxpdHkscV84MCIsIkNvbmRpdGlvbiI6eyJEYXRlTGVzc1RoYW4iOnsiQVdTOkVwb2NoVGltZSI6MTc5ODc2MTYwMH19fV19&Key-Pair-Id=K2HSFNDJXOU9YS&Signature=aEtRqZsqftg5nGlhfBnnWP2clqzxxc8RbaHS58Nf5~ngPf14x8tZuU4-Fl-HU3OvkfQQfUvYgtNSbjnkf~q4WKvXagRCExSUy02bBsZiaLkNwh4MmaIWn1Plhvt2EK~x3lIPQ1JcPllwnOLY441sFZ4L3yq-pOkPd8JhMZ0EyZBFVZ1dcHHbSVBrUm1TzT-~bB5dB4OGIhWdqvUOHyl2ggTrSoY9eB5zgufsAQw9AEAkD~sLbe36ZT09eIInXgpYnewwGBblMUpPT9F3N0oU3h-ji2lpmnkT3cwC9fFAFlguxaIWgA5a6gIwMxt~NqaQpQgq9J2UnS-KSaYIHRevyQ__" 
                alt="Backtesting Engine" 
                className="w-full border border-[#333] grayscale hover:grayscale-0 transition-all duration-500"
              />
            </div>
            <div className="order-1 lg:order-2">
              <h2 className="text-3xl font-bold mb-6">THE <span className="text-[#00FF41]">MICRO-EXPERIMENT</span> ETHOS</h2>
              <p className="text-gray-400 text-lg mb-6 font-sans">
                Most retail traders fail because they treat trading as gambling. AlgoBrute forces you to treat it as science.
              </p>
              <p className="text-gray-400 mb-8 font-sans">
                Every strategy is a hypothesis. Every backtest is an experiment. Our platform provides the laboratory conditions necessary to isolate variables, test assumptions, and prove alpha before risking a single dollar of capital.
              </p>
              <div className="grid grid-cols-2 gap-4">
                <div className="border border-[#333] p-4">
                  <div className="text-2xl font-bold text-white mb-1">158+</div>
                  <div className="text-xs text-gray-500">TA-LIB INDICATORS</div>
                </div>
                <div className="border border-[#333] p-4">
                  <div className="text-2xl font-bold text-white mb-1">61</div>
                  <div className="text-xs text-gray-500">CANDLESTICK PATTERNS</div>
                </div>
                <div className="border border-[#333] p-4">
                  <div className="text-2xl font-bold text-white mb-1">4</div>
                  <div className="text-xs text-gray-500">DATA PROVIDERS</div>
                </div>
                <div className="border border-[#333] p-4">
                  <div className="text-2xl font-bold text-white mb-1">0ms</div>
                  <div className="text-xs text-gray-500">EMOTIONAL LATENCY</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="py-24 border-t border-[#333]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold mb-4">ACCESS_TIERS</h2>
            <p className="text-gray-400 max-w-2xl mx-auto font-sans">
              Transparent pricing for serious traders. No hidden fees. No commission skimming.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            {/* Tier 1 */}
            <div className="border border-[#333] bg-[#0A0A0A] p-8 flex flex-col">
              <div className="mb-4">
                <h3 className="text-xl font-bold">ANALYST</h3>
                <div className="text-3xl font-bold mt-2">$49<span className="text-sm text-gray-500 font-normal">/mo</span></div>
              </div>
              <ul className="space-y-4 mb-8 flex-1 text-sm text-gray-400 font-sans">
                <li className="flex items-center gap-2"><Code className="w-4 h-4 text-[#00FF41]" /> Basic Backtesting Engine</li>
                <li className="flex items-center gap-2"><Code className="w-4 h-4 text-[#00FF41]" /> 5 Active Strategies</li>
                <li className="flex items-center gap-2"><Code className="w-4 h-4 text-[#00FF41]" /> EOD Data (Tiingo/Finnhub)</li>
                <li className="flex items-center gap-2"><Code className="w-4 h-4 text-[#00FF41]" /> Community Support</li>
              </ul>
              <button className="w-full border border-[#333] py-3 hover:bg-white hover:text-black transition-colors uppercase font-bold text-sm">
                Select Plan
              </button>
            </div>

            {/* Tier 2 */}
            <div className="border border-[#00FF41] bg-[#0A0A0A] p-8 flex flex-col relative transform md:-translate-y-4">
              <div className="absolute top-0 left-0 w-full h-1 bg-[#00FF41]"></div>
              <div className="absolute top-4 right-4 text-[10px] bg-[#00FF41] text-black px-2 py-1 font-bold">RECOMMENDED</div>
              <div className="mb-4">
                <h3 className="text-xl font-bold text-[#00FF41]">QUANT</h3>
                <div className="text-3xl font-bold mt-2">$149<span className="text-sm text-gray-500 font-normal">/mo</span></div>
              </div>
              <ul className="space-y-4 mb-8 flex-1 text-sm text-gray-300 font-sans">
                <li className="flex items-center gap-2"><Code className="w-4 h-4 text-[#00FF41]" /> Advanced Regime Detection</li>
                <li className="flex items-center gap-2"><Code className="w-4 h-4 text-[#00FF41]" /> Unlimited Strategies</li>
                <li className="flex items-center gap-2"><Code className="w-4 h-4 text-[#00FF41]" /> Real-time Data (Polygon.io)</li>
                <li className="flex items-center gap-2"><Code className="w-4 h-4 text-[#00FF41]" /> LLM Strategy Generation</li>
                <li className="flex items-center gap-2"><Code className="w-4 h-4 text-[#00FF41]" /> Automated Execution</li>
              </ul>
              <button className="w-full bg-[#00FF41] text-black py-3 hover:bg-white transition-colors uppercase font-bold text-sm">
                Select Plan
              </button>
            </div>

            {/* Tier 3 */}
            <div className="border border-[#333] bg-[#0A0A0A] p-8 flex flex-col">
              <div className="mb-4">
                <h3 className="text-xl font-bold">INSTITUTIONAL</h3>
                <div className="text-3xl font-bold mt-2">$499<span className="text-sm text-gray-500 font-normal">/mo</span></div>
              </div>
              <ul className="space-y-4 mb-8 flex-1 text-sm text-gray-400 font-sans">
                <li className="flex items-center gap-2"><Code className="w-4 h-4 text-[#00FF41]" /> Dedicated Infrastructure</li>
                <li className="flex items-center gap-2"><Code className="w-4 h-4 text-[#00FF41]" /> Custom Data Integrations</li>
                <li className="flex items-center gap-2"><Code className="w-4 h-4 text-[#00FF41]" /> White-glove Onboarding</li>
                <li className="flex items-center gap-2"><Code className="w-4 h-4 text-[#00FF41]" /> Priority API Access</li>
              </ul>
              <button className="w-full border border-[#333] py-3 hover:bg-white hover:text-black transition-colors uppercase font-bold text-sm">
                Contact Sales
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-[#333] bg-[#050505] py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-4 gap-8 mb-8">
            <div className="col-span-2">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-3 h-3 bg-[#00FF41]"></div>
                <span className="text-xl font-bold tracking-tighter">ALGOBRUTE</span>
              </div>
              <p className="text-gray-500 text-sm max-w-xs font-sans">
                Algorithmic trading infrastructure for the sophisticated retail trader. Built on the principles of scientific rigor and risk management.
              </p>
            </div>
            <div>
              <h4 className="font-bold mb-4 text-sm">PLATFORM</h4>
              <ul className="space-y-2 text-xs text-gray-500 font-sans">
                <li><a href="#" className="hover:text-[#00FF41]">Backtesting Engine</a></li>
                <li><a href="#" className="hover:text-[#00FF41]">Risk Management</a></li>
                <li><a href="#" className="hover:text-[#00FF41]">Data Feeds</a></li>
                <li><a href="#" className="hover:text-[#00FF41]">API Documentation</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-bold mb-4 text-sm">COMPANY</h4>
              <ul className="space-y-2 text-xs text-gray-500 font-sans">
                <li><a href="#" className="hover:text-[#00FF41]">About Us</a></li>
                <li><a href="#" className="hover:text-[#00FF41]">Careers</a></li>
                <li><a href="#" className="hover:text-[#00FF41]">Legal</a></li>
                <li><a href="#" className="hover:text-[#00FF41]">Contact</a></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-[#1a1a1a] pt-8 flex flex-col md:flex-row justify-between items-center text-xs text-gray-600 font-sans">
            <p>&copy; 2024 AlgoBrute Technologies Inc. All rights reserved.</p>
            <p className="mt-2 md:mt-0">System Status: <span className="text-[#00FF41]">OPERATIONAL</span></p>
          </div>
        </div>
      </footer>
    </div>
  );
}
