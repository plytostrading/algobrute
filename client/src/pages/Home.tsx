import React, { useState, useEffect } from 'react';
import { Terminal, Shield, Cpu, Activity, ArrowRight, Code, BarChart2, Lock, Zap, Moon, Check, X, Play, Loader2, AlertTriangle, Eye, Server } from 'lucide-react';

export default function Home() {
  const [email, setEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  
  const [strategyInput, setStrategyInput] = useState('Buy SPY when RSI < 30');
  const [isCompiling, setIsCompiling] = useState(false);
  const [compiledStrategy, setCompiledStrategy] = useState<null | {
    condition: string;
    action: string;
    risk: string;
  }>(null);

  const handleWaitlistSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    // Simulate API call
    setTimeout(() => {
      setIsSubmitting(false);
      setIsSubmitted(true);
      setEmail('');
    }, 1500);
  };

  const handleCompile = () => {
    setIsCompiling(true);
    setCompiledStrategy(null);
    // Simulate compilation
    setTimeout(() => {
      setIsCompiling(false);
      setCompiledStrategy({
        condition: "IF (RSI_14 < 30) AND (PRICE > SMA_200)",
        action: "BUY MARKET (ALLOCATION: 5%)",
        risk: "STOP_LOSS: -2.5% | TAKE_PROFIT: +5.0%"
      });
    }, 2000);
  };

  return (
    <div className="min-h-screen bg-[#050505] text-white font-mono selection:bg-[#00FF41] selection:text-black relative overflow-x-hidden">
      {/* Background Texture */}
      <div className="fixed inset-0 z-0 opacity-30 pointer-events-none">
        <img 
          src="https://private-us-east-1.manuscdn.com/sessionFile/HqyEPK95aD98F100rJ2V7T/sandbox/0LtwFffZQmWF6fBhqsuSm5-img-2_1770441977000_na1fn_ZGF0YV9zdHJlYW1fYmc.png?x-oss-process=image/resize,w_1920,h_1920/format,webp/quality,q_80&Expires=1798761600&Policy=eyJTdGF0ZW1lbnQiOlt7IlJlc291cmNlIjoiaHR0cHM6Ly9wcml2YXRlLXVzLWVhc3QtMS5tYW51c2Nkbi5jb20vc2Vzc2lvbkZpbGUvSHF5RVBLOTVhRDk4RjEwMHJKMlY3VC9zYW5kYm94LzBMdHdGZmZaUW1XRjZmQmhxc3VTbTUtaW1nLTJfMTc3MDQ0MTk3NzAwMF9uYTFmbl9aR0YwWVY5emRISmxZVzFmWW1jLnBuZz94LW9zcy1wcm9jZXNzPWltYWdlL3Jlc2l6ZSx3XzE5MjAsaF8xOTIwL2Zvcm1hdCx3ZWJwL3F1YWxpdHkscV84MCIsIkNvbmRpdGlvbiI6eyJEYXRlTGVzc1RoYW4iOnsiQVdTOkVwb2NoVGltZSI6MTc5ODc2MTYwMH19fV19&Key-Pair-Id=K2HSFNDJXOU9YS&Signature=spYtVgE1WSz7l31wLbYMMUlf~mWnd0c310snXM4oEs6wYWhKlSAk5zgqVThQxdcf~GYihrcUOEPtJK~ExilQIHpEYj4oAYb7G5FLVkffgHGYJx~UAWniacBp4Wf8DUOicEu5oagGTICKb5jd5eZm2LoJTtDgCZjIKaiR-sssEEcWAvY342JoyaGhlAqZnEQHapJ~0sPH2NN33aVP97MTvsuy0lUEzGgKQFveCATafbKVQaeOw7BcYdqfkcjAEK1t3kFP1DGB9hVjWuE76fJW6nJYFnpSsM56nA~hCnjNmYEYMJNwcdy4gN-3EeK4s-AhAkwazfVElTCGUvP6GZOf5A__" 
          alt="" 
          className="w-full h-full object-cover"
        />
      </div>

      {/* Navigation */}
      <nav className="fixed w-full z-50 border-b border-[#333] bg-[#050505]/90 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-[#00FF41] animate-pulse"></div>
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
      <section className="relative pt-32 pb-20 lg:pt-48 lg:pb-32 overflow-hidden z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
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
              
              {/* Waitlist Form */}
              <div className="max-w-md mb-8">
                {!isSubmitted ? (
                  <form onSubmit={handleWaitlistSubmit} className="flex gap-2">
                    <input 
                      type="email" 
                      required
                      placeholder="Enter your email for early access"
                      className="flex-1 bg-[#0A0A0A] border border-[#333] px-4 py-3 text-sm focus:outline-none focus:border-[#00FF41] transition-colors"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                    />
                    <button 
                      type="submit" 
                      disabled={isSubmitting}
                      className="bg-[#00FF41] text-black px-6 py-3 font-bold uppercase tracking-wider hover:bg-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                    >
                      {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Join Waitlist'}
                    </button>
                  </form>
                ) : (
                  <div className="bg-[#00FF41]/10 border border-[#00FF41] p-4 flex items-center gap-3 text-[#00FF41]">
                    <Check className="w-5 h-5" />
                    <span className="font-bold text-sm">ACCESS REQUESTED. WE WILL CONTACT YOU SHORTLY.</span>
                  </div>
                )}
                <p className="text-xs text-gray-500 mt-2 font-sans">Limited spots available for the beta program.</p>
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

      {/* System Status Divider */}
      <div className="border-y border-[#333] bg-[#0A0A0A] overflow-hidden py-4 z-10 relative">
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

      {/* Narrative Thread: The Scan */}
      <div className="py-8 bg-[#050505] border-b border-[#333] flex justify-center z-10 relative">
        <div className="flex items-center gap-2 text-xs text-gray-500 font-mono">
          <Eye className="w-4 h-4 text-[#00FF41] animate-pulse" />
          <span>SCANNING MARKET REGIMES...</span>
        </div>
      </div>

      {/* Story 1: Idea to Execution (Interactive Widget) */}
      <section id="features" className="py-24 border-b border-[#333] z-10 relative bg-[#050505]">
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
              
              {/* Interactive Widget */}
              <div className="bg-[#111] border border-[#333] p-6 mb-6">
                <div className="flex items-center gap-2 mb-4 text-xs text-gray-500 uppercase tracking-widest">
                  <Terminal className="w-3 h-3" />
                  Strategy Input
                </div>
                <div className="relative">
                  <textarea 
                    className="w-full bg-[#050505] border border-[#333] p-4 text-sm text-gray-300 font-mono focus:outline-none focus:border-[#00FF41] transition-colors resize-none h-24"
                    value={strategyInput}
                    onChange={(e) => setStrategyInput(e.target.value)}
                  />
                  <button 
                    onClick={handleCompile}
                    disabled={isCompiling}
                    className="absolute bottom-4 right-4 bg-[#00FF41] text-black p-2 hover:bg-white transition-colors disabled:opacity-50"
                  >
                    {isCompiling ? <Loader2 className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <p className="text-gray-400 font-sans">
                AlgoBrute's engine instantly converts your words into a rigorous, backtestable strategy code. Test 10 ideas in the time it used to take to code one.
              </p>
            </div>
            
            {/* Widget Output / Image */}
            <div className="relative">
              {compiledStrategy ? (
                <div className="border border-[#00FF41] bg-[#0A0A0A] p-6 animate-in fade-in zoom-in duration-300">
                  <div className="flex items-center justify-between mb-6 border-b border-[#333] pb-4">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-[#00FF41] animate-pulse"></div>
                      <span className="font-bold text-[#00FF41]">STRATEGY_COMPILED</span>
                    </div>
                    <span className="text-xs text-gray-500">ID: 8X-294</span>
                  </div>
                  <div className="space-y-4 font-mono text-sm">
                    <div>
                      <span className="text-gray-500 block text-xs mb-1">ENTRY_CONDITION</span>
                      <div className="bg-[#111] p-3 border-l-2 border-[#00FF41] text-white">
                        {compiledStrategy.condition}
                      </div>
                    </div>
                    <div>
                      <span className="text-gray-500 block text-xs mb-1">EXECUTION_LOGIC</span>
                      <div className="bg-[#111] p-3 border-l-2 border-[#00F0FF] text-white">
                        {compiledStrategy.action}
                      </div>
                    </div>
                    <div>
                      <span className="text-gray-500 block text-xs mb-1">RISK_GUARDRAILS</span>
                      <div className="bg-[#111] p-3 border-l-2 border-red-500 text-white">
                        {compiledStrategy.risk}
                      </div>
                    </div>
                  </div>
                  <div className="mt-6 pt-4 border-t border-[#333] flex justify-between items-center">
                    <span className="text-xs text-gray-500">READY FOR BACKTEST</span>
                    <button className="text-[#00FF41] text-xs font-bold hover:underline">DEPLOY TO PAPER &rarr;</button>
                  </div>
                </div>
              ) : (
                 <img 
                  src="https://private-us-east-1.manuscdn.com/sessionFile/HqyEPK95aD98F100rJ2V7T/sandbox/Qg7Yyx5VQXs7Jyj3oeyyZy-img-1_1770441548000_na1fn_ZW5nbGlzaF90b19jb2RlX3Yy.png?x-oss-process=image/resize,w_1920,h_1920/format,webp/quality,q_80&Expires=1798761600&Policy=eyJTdGF0ZW1lbnQiOlt7IlJlc291cmNlIjoiaHR0cHM6Ly9wcml2YXRlLXVzLWVhc3QtMS5tYW51c2Nkbi5jb20vc2Vzc2lvbkZpbGUvSHF5RVBLOTVhRDk4RjEwMHJKMlY3VC9zYW5kYm94L1FnN1l5eDVWUVhzN0p5ajNvZXl5WnktaW1nLTFfMTc3MDQ0MTU0ODAwMF9uYTFmbl9aVzVuYkdsemFGOTBiMTlqYjJSbFgzWXkucG5nP3gtb3NzLXByb2Nlc3M9aW1hZ2UvcmVzaXplLHdfMTkyMCxoXzE5MjAvZm9ybWF0LHdlYnAvcXVhbGl0eSxxXzgwIiwiQ29uZGl0aW9uIjp7IkRhdGVMZXNzVGhhbiI6eyJBV1M6RXBvY2hUaW1lIjoxNzk4NzYxNjAwfX19XX0_&Key-Pair-Id=K2HSFNDJXOU9YS&Signature=J~GKkaiadmhyaf7JMitei1Y0VM~Z-3hCFwoRHwxjYBQ-TdhSVqBUH5aniDD05XPsFJS3kF7dIn06GtrQgx6QgJdAXMfRWfgYI9jK3stSnzd-DF~uH3xBwLtnv9HH-2yiHeIy2ikxxPNU8keST8jd6xrJ7JCWQVIA4BYyy-dnJZ5NuGDnq7-oM68qd-n2vLuSYeNzoHd76BrYYzjR46zFDvjI5xKDPJOXSZGDGbMab0YknHragBe2VlJfXfUobBI1OdzUpMr8p4g3lEUF4oYxgE2l4uDy1nTgQAlU1JER7MUePbbFQkVwTtCzVey-ufePqg2A7Ht83qOTAwp3WuEytg__" 
                  alt="English to Code Visualization" 
                  className="w-full border border-[#333] grayscale hover:grayscale-0 transition-all duration-500"
                />
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Narrative Thread: The Logic */}
      <div className="py-8 bg-[#050505] border-b border-[#333] flex justify-center z-10 relative">
        <div className="flex items-center gap-2 text-xs text-gray-500 font-mono">
          <Server className="w-4 h-4 text-[#00F0FF] animate-pulse" />
          <span>VALIDATING RISK PARAMETERS...</span>
        </div>
      </div>

      {/* Story 2: Sleep at Night (Updated Visuals) */}
      <section className="py-24 bg-[#080808] z-10 relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <div className="order-2 lg:order-1">
              <div className="relative">
                <div className="absolute -top-4 -left-4 text-xs text-red-500 font-mono animate-pulse">ALERT: TRADE_REJECTED</div>
                <img 
                  src="https://private-us-east-1.manuscdn.com/sessionFile/HqyEPK95aD98F100rJ2V7T/sandbox/0LtwFffZQmWF6fBhqsuSm5-img-1_1770441973000_na1fn_cmlza19sb2dpY192MQ.png?x-oss-process=image/resize,w_1920,h_1920/format,webp/quality,q_80&Expires=1798761600&Policy=eyJTdGF0ZW1lbnQiOlt7IlJlc291cmNlIjoiaHR0cHM6Ly9wcml2YXRlLXVzLWVhc3QtMS5tYW51c2Nkbi5jb20vc2Vzc2lvbkZpbGUvSHF5RVBLOTVhRDk4RjEwMHJKMlY3VC9zYW5kYm94LzBMdHdGZmZaUW1XRjZmQmhxc3VTbTUtaW1nLTFfMTc3MDQ0MTk3MzAwMF9uYTFmbl9jbWx6YTE5c2IyZHBZMTkyTVEucG5nP3gtb3NzLXByb2Nlc3M9aW1hZ2UvcmVzaXplLHdfMTkyMCxoXzE5MjAvZm9ybWF0LHdlYnAvcXVhbGl0eSxxXzgwIiwiQ29uZGl0aW9uIjp7IkRhdGVMZXNzVGhhbiI6eyJBV1M6RXBvY2hUaW1lIjoxNzk4NzYxNjAwfX19XX0_&Key-Pair-Id=K2HSFNDJXOU9YS&Signature=mtsIlRRA3oE2A66i~3Qs0lbTogmdJp3EUNvgUxBLG2z~nq~uigS-FKi5Y9LqAiCE3kWp58er09ktVbkTcNet5WpX2MnE12tGd3FPGzdrxr2LLmgxUD~6sKbjCJJ7DtUVG6LhSnTahIPhOmYCXxVM-8W7QH6UwpKKEloLlhLWzfJZQjUMHN7rIlaoMru6DZwr-j8mNAFgpmsG4uTEj8F42oKu1tfZo7gEQqd0MZc8zooMI7wiSaiOaLVQG8dCjxMaHVr~HMXyFuCk5Xn4EnOL002i7J8HnEO4e64yuFap74x6FZvmREfZDNwPPlfwTL14MmHK56RJkRMn~XF5TlGvkQ__" 
                  alt="Risk Logic Visualization" 
                  className="w-full border border-[#333] hover:border-red-500 transition-colors duration-500"
                />
              </div>
            </div>
            <div className="order-1 lg:order-2">
              <div className="mb-6 text-[#00F0FF]">
                <Moon className="w-12 h-12" />
              </div>
              <h2 className="text-3xl font-bold mb-6">TRADE WITH <br/>CONFIDENCE</h2>
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

      {/* Narrative Thread: The Comparison */}
      <div className="py-8 bg-[#050505] border-b border-[#333] flex justify-center z-10 relative">
        <div className="flex items-center gap-2 text-xs text-gray-500 font-mono">
          <Activity className="w-4 h-4 text-yellow-500 animate-pulse" />
          <span>BENCHMARKING PERFORMANCE...</span>
        </div>
      </div>

      {/* Feature Matrix (Revamped Comparison) */}
      <section className="py-24 border-t border-[#333] bg-[#0A0A0A] z-10 relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold mb-4">TECHNICAL SPECIFICATIONS</h2>
            <p className="text-gray-400 max-w-2xl mx-auto font-sans">
              System capabilities vs. legacy platforms.
            </p>
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse font-mono text-sm">
              <thead>
                <tr className="border-b border-[#333]">
                  <th className="p-4 text-gray-500 font-normal w-1/3">CAPABILITY</th>
                  <th className="p-4 text-[#00FF41] font-bold bg-[#111] border-x border-[#333] w-1/4 text-center">ALGOBRUTE v2.4</th>
                  <th className="p-4 text-gray-500 font-bold w-1/4 text-center">TRADINGVIEW</th>
                  <th className="p-4 text-gray-500 font-bold w-1/4 text-center">COMPOSER</th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-b border-[#333] hover:bg-[#111]/50 transition-colors">
                  <td className="p-4 text-gray-300">
                    <div className="font-bold text-white">Strategy Generation</div>
                    <div className="text-xs text-gray-500 mt-1">Method of input</div>
                  </td>
                  <td className="p-4 bg-[#111] border-x border-[#333] text-center">
                    <span className="text-[#00FF41] font-bold">LLM / Natural Language</span>
                  </td>
                  <td className="p-4 text-center text-gray-500">PineScript (Manual)</td>
                  <td className="p-4 text-center text-gray-500">Visual Blocks</td>
                </tr>
                <tr className="border-b border-[#333] hover:bg-[#111]/50 transition-colors">
                  <td className="p-4 text-gray-300">
                    <div className="font-bold text-white">Backtest Fidelity</div>
                    <div className="text-xs text-gray-500 mt-1">Accuracy of simulation</div>
                  </td>
                  <td className="p-4 bg-[#111] border-x border-[#333] text-center">
                    <span className="text-[#00FF41] font-bold">Regime-Aware</span>
                  </td>
                  <td className="p-4 text-center text-gray-500">Bar-by-Bar (Basic)</td>
                  <td className="p-4 text-center text-gray-500">Standard</td>
                </tr>
                <tr className="border-b border-[#333] hover:bg-[#111]/50 transition-colors">
                  <td className="p-4 text-gray-300">
                    <div className="font-bold text-white">Risk Enforcement</div>
                    <div className="text-xs text-gray-500 mt-1">Hard-coded guardrails</div>
                  </td>
                  <td className="p-4 bg-[#111] border-x border-[#333] text-center">
                    <Check className="w-5 h-5 text-[#00FF41] mx-auto" />
                  </td>
                  <td className="p-4 text-center text-gray-500">
                    <X className="w-5 h-5 text-red-900 mx-auto" />
                  </td>
                  <td className="p-4 text-center text-gray-500">
                    <AlertTriangle className="w-5 h-5 text-yellow-900 mx-auto" />
                  </td>
                </tr>
                <tr className="border-b border-[#333] hover:bg-[#111]/50 transition-colors">
                  <td className="p-4 text-gray-300">
                    <div className="font-bold text-white">Execution Latency</div>
                    <div className="text-xs text-gray-500 mt-1">Avg. time to fill</div>
                  </td>
                  <td className="p-4 bg-[#111] border-x border-[#333] text-center">
                    <span className="text-[#00FF41] font-bold">~14ms</span>
                  </td>
                  <td className="p-4 text-center text-gray-500">Variable (Webhook)</td>
                  <td className="p-4 text-center text-gray-500">~500ms</td>
                </tr>
                <tr>
                  <td className="p-4 text-gray-300">
                    <div className="font-bold text-white">Pricing Model</div>
                    <div className="text-xs text-gray-500 mt-1">Cost structure</div>
                  </td>
                  <td className="p-4 bg-[#111] border-x border-[#333] text-center">
                    <span className="text-white font-bold">Flat Monthly</span>
                  </td>
                  <td className="p-4 text-center text-gray-500">Tiered + Data Fees</td>
                  <td className="p-4 text-center text-gray-500">AUM % Fee</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="py-24 border-t border-[#333] z-10 relative bg-[#050505]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold mb-4">SIMPLE PRICING</h2>
            <p className="text-gray-400 max-w-2xl mx-auto font-sans">
              Professional tools at a price that makes sense for your portfolio size.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            {/* Tier 1 */}
            <div className="border border-[#333] bg-[#0A0A0A] p-8 flex flex-col hover:border-gray-500 transition-colors">
              <div className="mb-4">
                <h3 className="text-xl font-bold">STARTER</h3>
                <div className="text-3xl font-bold mt-2">$29<span className="text-sm text-gray-500 font-normal">/mo</span></div>
                <p className="text-xs text-gray-500 mt-2 font-sans">Best for: Validating ideas without risking capital.</p>
              </div>
              <ul className="space-y-4 mb-8 flex-1 text-sm text-gray-400 font-sans">
                <li className="flex items-center gap-2"><Check className="w-4 h-4 text-[#00FF41]" /> <strong>Unlimited Backtesting</strong> on EOD Data</li>
                <li className="flex items-center gap-2"><Check className="w-4 h-4 text-[#00FF41]" /> <strong>5 Active "Paper" Bots</strong> to test live</li>
                <li className="flex items-center gap-2"><Check className="w-4 h-4 text-[#00FF41]" /> <strong>Standard LLM Access</strong> for strategy gen</li>
                <li className="flex items-center gap-2"><Check className="w-4 h-4 text-[#00FF41]" /> Basic Risk Guardrails</li>
              </ul>
              <button className="w-full border border-[#333] py-3 hover:bg-white hover:text-black transition-colors uppercase font-bold text-sm">
                Start Free Trial
              </button>
            </div>

            {/* Tier 2 */}
            <div className="border border-[#00FF41] bg-[#0A0A0A] p-8 flex flex-col relative transform md:-translate-y-4 shadow-[0_0_30px_rgba(0,255,65,0.1)]">
              <div className="absolute top-0 left-0 w-full h-1 bg-[#00FF41]"></div>
              <div className="absolute top-4 right-4 text-[10px] bg-[#00FF41] text-black px-2 py-1 font-bold">MOST POPULAR</div>
              <div className="mb-4">
                <h3 className="text-xl font-bold text-[#00FF41]">PRO</h3>
                <div className="text-3xl font-bold mt-2">$79<span className="text-sm text-gray-500 font-normal">/mo</span></div>
                <p className="text-xs text-gray-400 mt-2 font-sans">Best for: Automating live trades with real money.</p>
              </div>
              <ul className="space-y-4 mb-8 flex-1 text-sm text-gray-300 font-sans">
                <li className="flex items-center gap-2"><Check className="w-4 h-4 text-[#00FF41]" /> <strong>Real-time Data</strong> (Polygon.io included)</li>
                <li className="flex items-center gap-2"><Check className="w-4 h-4 text-[#00FF41]" /> <strong>Unlimited Active Bots</strong></li>
                <li className="flex items-center gap-2"><Check className="w-4 h-4 text-[#00FF41]" /> <strong>Live Broker Execution</strong> (Alpaca/IBKR)</li>
                <li className="flex items-center gap-2"><Check className="w-4 h-4 text-[#00FF41]" /> <strong>Advanced Regime Detection</strong></li>
                <li className="flex items-center gap-2"><Check className="w-4 h-4 text-[#00FF41]" /> Priority LLM Access</li>
              </ul>
              <button className="w-full bg-[#00FF41] text-black py-3 hover:bg-white transition-colors uppercase font-bold text-sm">
                Get Started
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-[#333] bg-[#050505] py-12 z-10 relative">
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
