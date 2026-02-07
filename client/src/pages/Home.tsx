import React from 'react';
import { Terminal, Shield, Cpu, Activity, ArrowRight, Code, BarChart2, Lock, Zap, Moon } from 'lucide-react';

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
                <a href="#features" className="hover:text-[#00FF41] transition-colors">CAPABILITIES</a>
                <a href="#pricing" className="hover:text-[#00FF41] transition-colors">PRICING</a>
                <a href="#research" className="hover:text-[#00FF41] transition-colors">RESEARCH</a>
                <button className="border border-[#00FF41] text-[#00FF41] px-4 py-2 hover:bg-[#00FF41] hover:text-black transition-all duration-100 uppercase text-xs font-bold">
                  Launch Terminal
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
                AUTOMATE YOUR<br />
                <span className="text-[#333]">EDGE</span>
              </h1>
              <p className="text-xl text-gray-400 mb-8 max-w-lg font-sans">
                Turn your trading ideas into automated bots without writing a single line of code. We handle the execution, risk management, and infrastructure. You handle the alpha.
              </p>
              <div className="flex flex-col sm:flex-row gap-4">
                <button className="bg-[#00FF41] text-black px-8 py-4 font-bold uppercase tracking-wider hover:bg-white transition-colors flex items-center justify-center gap-2 group">
                  Start Building Free
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </button>
                <button className="border border-[#333] text-gray-300 px-8 py-4 font-bold uppercase tracking-wider hover:border-white hover:text-white transition-colors">
                  See How It Works
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

      {/* Story 1: Idea to Execution */}
      <section id="features" className="py-24 border-b border-[#333]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-16 items-center mb-24">
            <div>
              <div className="mb-6 text-[#00FF41]">
                <Zap className="w-12 h-12" />
              </div>
              <h2 className="text-3xl font-bold mb-6">FROM ENGLISH TO <br/>EXECUTION IN SECONDS</h2>
              <p className="text-gray-400 text-lg mb-6 font-sans">
                You don't need to be a Python wizard to build a bot. Just describe your strategy in plain English.
              </p>
              <div className="bg-[#111] border border-[#333] p-6 mb-6 font-mono text-sm text-gray-300">
                <span className="text-[#00FF41]">{">"}</span> "Buy SPY when RSI is below 30 and price is above the 200-day moving average. Sell when RSI hits 70."
              </div>
              <p className="text-gray-400 font-sans">
                AlgoBrute's engine instantly converts your words into a rigorous, backtestable strategy code. Test 10 ideas in the time it used to take to code one.
              </p>
            </div>
            <div className="relative">
               <img 
                src="https://private-us-east-1.manuscdn.com/sessionFile/HqyEPK95aD98F100rJ2V7T/sandbox/FNo529hNiiEV1Hu0kNj2kt-img-4_1770440333000_na1fn_ZmVhdHVyZV9hdXRvbWF0aW9u.png?x-oss-process=image/resize,w_1920,h_1920/format,webp/quality,q_80&Expires=1798761600&Policy=eyJTdGF0ZW1lbnQiOlt7IlJlc291cmNlIjoiaHR0cHM6Ly9wcml2YXRlLXVzLWVhc3QtMS5tYW51c2Nkbi5jb20vc2Vzc2lvbkZpbGUvSHF5RVBLOTVhRDk4RjEwMHJKMlY3VC9zYW5kYm94L0ZObzUyOWhOaWlFVjFIdTBrTmoya3QtaW1nLTRfMTc3MDQ0MDMzMzAwMF9uYTFmbl9abVZoZEhWeVpWOWhkWFJ2YldGMGFXOXUucG5nP3gtb3NzLXByb2Nlc3M9aW1hZ2UvcmVzaXplLHdfMTkyMCxoXzE5MjAvZm9ybWF0LHdlYnAvcXVhbGl0eSxxXzgwIiwiQ29uZGl0aW9uIjp7IkRhdGVMZXNzVGhhbiI6eyJBV1M6RXBvY2hUaW1lIjoxNzk4NzYxNjAwfX19XX0_&Key-Pair-Id=K2HSFNDJXOU9YS&Signature=WPAw1~-p-m74Badri6ErD7B2ZSOowYoaxhjyWK4lay-4yXweMaAKNSfG5z20bks9b-hhuAh8FT86nP0fzt0jECXbNbKTdChjeN95iJBb9MiagHk8JQnwyBgViIkyOMUxh6zNd4nSgqzYM7lKMmkRh~De4fMLpcKcWGjfZAaAs-gMtY56sYqR7zJnDqkdvFeTyU-09McWyDll1zHwDQz9~L7c0vCbHhUOUavRBo7hbfH8L1iySLYzZrnp6WjhRx8-fQJmcxeyioA98P~l4AoaFkyS6ZI0ay-bksaLG~l1O3uuJz4~tmN5sT7Qe85DsoD87efQOrQQpIRLdSi1RujtMg__" 
                alt="Automation Visualization" 
                className="w-full border border-[#333] grayscale hover:grayscale-0 transition-all duration-500"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Story 2: Sleep at Night */}
      <section className="py-24 bg-[#080808]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <div className="order-2 lg:order-1">
              <img 
                src="https://private-us-east-1.manuscdn.com/sessionFile/HqyEPK95aD98F100rJ2V7T/sandbox/FNo529hNiiEV1Hu0kNj2kt-img-3_1770440330000_na1fn_ZmVhdHVyZV9yaXNr.png?x-oss-process=image/resize,w_1920,h_1920/format,webp/quality,q_80&Expires=1798761600&Policy=eyJTdGF0ZW1lbnQiOlt7IlJlc291cmNlIjoiaHR0cHM6Ly9wcml2YXRlLXVzLWVhc3QtMS5tYW51c2Nkbi5jb20vc2Vzc2lvbkZpbGUvSHF5RVBLOTVhRDk4RjEwMHJKMlY3VC9zYW5kYm94L0ZObzUyOWhOaWlFVjFIdTBrTmoya3QtaW1nLTNfMTc3MDQ0MDMzMDAwMF9uYTFmbl9abVZoZEhWeVpWOXlhWE5yLnBuZz94LW9zcy1wcm9jZXNzPWltYWdlL3Jlc2l6ZSx3XzE5MjAsaF8xOTIwL2Zvcm1hdCx3ZWJwL3F1YWxpdHkscV84MCIsIkNvbmRpdGlvbiI6eyJEYXRlTGVzc1RoYW4iOnsiQVdTOkVwb2NoVGltZSI6MTc5ODc2MTYwMH19fV19&Key-Pair-Id=K2HSFNDJXOU9YS&Signature=CvkUcNFSevY1JUqM5veOYX5XzDLzYVjrscDmgJevYcnZUysU~LDZjKHNNtudT2W72kitGqqEZXEH6uK-KXBkDTYIfEV1PSX-F9PvjhLkrXdYVlHN4e578ySjN0D7FL9R9wzzTFbfFMPdlCmW-~~eVvX5I74F33VI1IHFPv0oB3ew6vikfkyDghvEXosQOTVMqwyL5-7MtLx~J6CbEkhsx3fZ-emFCVWI4Wwo6s53OgmsJ36m8HEzl9udJrYBb-PCYWQ6iDe6pjLD5A1KPWZ2IoMNSNip8wLtJTTObchj9gh4iHuVYI2vGQCRBQyYOG98UKqs3J2SISfu56RwzbFwbQ__" 
                alt="Risk Management Shield" 
                className="w-full border border-[#333] grayscale hover:grayscale-0 transition-all duration-500"
              />
            </div>
            <div className="order-1 lg:order-2">
              <div className="mb-6 text-[#00F0FF]">
                <Moon className="w-12 h-12" />
              </div>
              <h2 className="text-3xl font-bold mb-6">THE "SLEEP AT NIGHT" <br/>GUARANTEE</h2>
              <p className="text-gray-400 text-lg mb-6 font-sans">
                The biggest risk to your portfolio isn't the market. It's you.
              </p>
              <p className="text-gray-400 mb-8 font-sans">
                Our hard-coded Risk Guardrails act as your external discipline officer. Max daily loss limits, position sizing rules, and volatility filters are enforced by the machine, not your willpower.
              </p>
              <ul className="space-y-4 font-mono text-sm text-gray-300">
                <li className="flex items-center gap-3">
                  <Shield className="w-4 h-4 text-[#00FF41]" />
                  <span>AUTOMATED STOP LOSSES</span>
                </li>
                <li className="flex items-center gap-3">
                  <Shield className="w-4 h-4 text-[#00FF41]" />
                  <span>VOLATILITY REGIME FILTERS</span>
                </li>
                <li className="flex items-center gap-3">
                  <Shield className="w-4 h-4 text-[#00FF41]" />
                  <span>MAX DRAWDOWN KILL-SWITCH</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="py-24 border-t border-[#333]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold mb-4">SIMPLE PRICING</h2>
            <p className="text-gray-400 max-w-2xl mx-auto font-sans">
              Professional tools at a price that makes sense for your portfolio size.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            {/* Tier 1 */}
            <div className="border border-[#333] bg-[#0A0A0A] p-8 flex flex-col">
              <div className="mb-4">
                <h3 className="text-xl font-bold">STARTER</h3>
                <div className="text-3xl font-bold mt-2">$29<span className="text-sm text-gray-500 font-normal">/mo</span></div>
                <p className="text-xs text-gray-500 mt-2 font-sans">Perfect for testing and validation.</p>
              </div>
              <ul className="space-y-4 mb-8 flex-1 text-sm text-gray-400 font-sans">
                <li className="flex items-center gap-2"><Code className="w-4 h-4 text-[#00FF41]" /> Unlimited Backtesting</li>
                <li className="flex items-center gap-2"><Code className="w-4 h-4 text-[#00FF41]" /> 5 Active "Paper" Bots</li>
                <li className="flex items-center gap-2"><Code className="w-4 h-4 text-[#00FF41]" /> End-of-Day Data</li>
                <li className="flex items-center gap-2"><Code className="w-4 h-4 text-[#00FF41]" /> Basic Risk Guardrails</li>
              </ul>
              <button className="w-full border border-[#333] py-3 hover:bg-white hover:text-black transition-colors uppercase font-bold text-sm">
                Start Free Trial
              </button>
            </div>

            {/* Tier 2 */}
            <div className="border border-[#00FF41] bg-[#0A0A0A] p-8 flex flex-col relative transform md:-translate-y-4">
              <div className="absolute top-0 left-0 w-full h-1 bg-[#00FF41]"></div>
              <div className="absolute top-4 right-4 text-[10px] bg-[#00FF41] text-black px-2 py-1 font-bold">MOST POPULAR</div>
              <div className="mb-4">
                <h3 className="text-xl font-bold text-[#00FF41]">PRO</h3>
                <div className="text-3xl font-bold mt-2">$79<span className="text-sm text-gray-500 font-normal">/mo</span></div>
                <p className="text-xs text-gray-400 mt-2 font-sans">For traders ready to automate live.</p>
              </div>
              <ul className="space-y-4 mb-8 flex-1 text-sm text-gray-300 font-sans">
                <li className="flex items-center gap-2"><Code className="w-4 h-4 text-[#00FF41]" /> Real-time Data (Polygon.io)</li>
                <li className="flex items-center gap-2"><Code className="w-4 h-4 text-[#00FF41]" /> Unlimited Active Bots</li>
                <li className="flex items-center gap-2"><Code className="w-4 h-4 text-[#00FF41]" /> Live Broker Execution</li>
                <li className="flex items-center gap-2"><Code className="w-4 h-4 text-[#00FF41]" /> Advanced Regime Detection</li>
                <li className="flex items-center gap-2"><Code className="w-4 h-4 text-[#00FF41]" /> Priority LLM Access</li>
              </ul>
              <button className="w-full bg-[#00FF41] text-black py-3 hover:bg-white transition-colors uppercase font-bold text-sm">
                Get Started
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
                Algorithmic trading infrastructure for the intermediate retail trader. Built to automate your edge and protect your capital.
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
