import React, { useState, useEffect } from 'react';
import { Terminal, Shield, Cpu, Activity, ArrowRight, Code, BarChart2, Lock, Zap, Moon, Check, X, Play, Loader2, AlertTriangle, Eye, Server, ChevronRight, Database, Layers } from 'lucide-react';

export default function Home() {
  const [email, setEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  
  // Widget State
  const [strategyInput, setStrategyInput] = useState('Buy SPY when RSI < 30 and Price > 200 SMA');
  const [isGenerating, setIsGenerating] = useState(false);
  const [showStrategyCard, setShowStrategyCard] = useState(false);

  const handleWaitlistSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setTimeout(() => {
      setIsSubmitting(false);
      setIsSubmitted(true);
      setEmail('');
    }, 1500);
  };

  const generateStrategy = () => {
    setIsGenerating(true);
    setTimeout(() => {
      setIsGenerating(false);
      setShowStrategyCard(true);
    }, 1500);
  };

  return (
    <div className="min-h-screen bg-[#050505] text-white font-mono selection:bg-[#00FF41] selection:text-black relative overflow-x-hidden">
      {/* Background Texture */}
      <div className="fixed inset-0 z-0 opacity-30 pointer-events-none">
        <img 
          src="https://private-us-east-1.manuscdn.com/sessionFile/HqyEPK95aD98F100rJ2V7T/sandbox/0LtwFffZQmWF6fBhqsuSm5-img-2_1770441977000_na1fn_ZGF0YV9zdHJlYW1fYmc.png?x-oss-process=image/resize,w_1920,h_1920/format,webp/quality,q_80&Expires=1798761600&Policy=eyJTdGF0ZW1lbnQiOlt7IlJlc291cmNlIjoiaHR0cHM6Ly9wcml2YXRlLXVzLWVhc3QtMS5tYW51c2Nkbi5jb20vc2Vzc2lvbkZpbGUvSHF5RVBLOTVhRDk4RjEwMHJKMlY3VC9zYW5kYm94LzBMdHdGZmZaUW1XRjZmQmhxc3VTbTUtaW1nLTJfMTc3MDQ0MTk3NzAwMF9uYTFmbl9aGF0YV9zdHJlYW1fYmcucG5nP3gtb3NzLXByb2Nlc3M9aW1hZ2UvcmVzaXplLHdfMTkyMCxoXzE5MjAvZm9ybWF0LHdlYnAvcXVhbGl0eSxxXzgwIiwiQ29uZGl0aW9uIjp7IkRhdGVMZXNzVGhhbiI6eyJBV1M6RXBvY2hUaW1lIjoxNzk4NzYxNjAwfX19XX0_&Key-Pair-Id=K2HSFNDJXOU9YS&Signature=spYtVgE1WSz7l31wLbYMMUlf~mWnd0c310snXM4oEs6wYWhKlSAk5zgqVThQxdcf~GYihrcUOEPtJK~ExilQIHpEYj4oAYb7G5FLVkffgHGYJx~UAWniacBp4Wf8DUOicEu5oagGTICKb5jd5eZm2LoJTtDgCZjIKaiR-sssEEcWAvY342JoyaGhlAqZnEQHapJ~0sPH2NN33aVP97MTvsuy0lUEzGgKQFveCATafbKVQaeOw7BcYdqfkcjAEK1t3kFP1DGB9hVjWuE76fJW6nJYFnpSsM56nA~hCnjNmYEYMJNwcdy4gN-3EeK4s-AhAkwazfVElTCGUvP6GZOf5A__" 
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
              <div className="border border-[#333] bg-[#0A0A0A] p-2 transform scale-110 origin-top-right">
                <div className="flex items-center justify-between px-4 py-2 border-b border-[#333] bg-[#111] mb-2">
                  <span className="text-xs text-gray-500">TERMINAL_PREVIEW</span>
                  <div className="flex gap-2">
                    <div className="w-2 h-2 rounded-full bg-red-500"></div>
                    <div className="w-2 h-2 rounded-full bg-yellow-500"></div>
                    <div className="w-2 h-2 rounded-full bg-green-500"></div>
                  </div>
                </div>
                <img 
                  src="https://private-us-east-1.manuscdn.com/sessionFile/HqyEPK95aD98F100rJ2V7T/sandbox/BXlhyLlXFkuLkkOJmGAB0Q-img-1_1770442304000_na1fn_bW9kZXJuX3Rlcm1pbmFsX3Yx.png?x-oss-process=image/resize,w_1920,h_1920/format,webp/quality,q_80&Expires=1798761600&Policy=eyJTdGF0ZW1lbnQiOlt7IlJlc291cmNlIjoiaHR0cHM6Ly9wcml2YXRlLXVzLWVhc3QtMS5tYW51c2Nkbi5jb20vc2Vzc2lvbkZpbGUvSHF5RVBLOTVhRDk4RjEwMHJKMlY3VC9zYW5kYm94L0JYbGh5TGxYRmt1TGtrT0ptR0FCMFEtaW1nLTFfMTc3MDQ0MjMwNDAwMF9uYTFmbl9iVzlrWlhKdVgzUmxjbTFwYm1Gc1gzWXgucG5nP3gtb3NzLXByb2Nlc3M9aW1hZ2UvcmVzaXplLHdfMTkyMCxoXzE5MjAvZm9ybWF0LHdlYnAvcXVhbGl0eSxxXzgwIiwiQ29uZGl0aW9uIjp7IkRhdGVMZXNzVGhhbiI6eyJBV1M6RXBvY2hUaW1lIjoxNzk4NzYxNjAwfX19XX0_&Key-Pair-Id=K2HSFNDJXOU9YS&Signature=r5LcQoNRQ3xLjo6vZGQcBgMHu-mj85lZ8gTJD2v2qhpTZobEpS8~gZdvbkWJWRDxWYMQFI68qxhSou97KhwrzB~B2HR1peBoSz65GhwkYBcM0z1KIbBnZsGT1oBTadj4Vnh6q62b7Ihoq-bY5z4TcCw2E6wSDu~DrraKuk1nGNfRCFJ~NEJQOmwXUq1Nq72QtjJBatSsU6Ik1sPVTQb5YoGZyUtQog1cGBznukD12qpywnKMnGQfQv~9JbOn0Zv1tMEeOs35rAbOqPiMX9w48Uy0A6WXi7hNUp7oNLxCoG8tyMFCsTn9BC6K0ancMImXAw7JV-dfZPTOYqBjgv~utg__" 
                  alt="Modern Trading Terminal Interface" 
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

      {/* Interactive Widget Section */}
      <section id="features" className="py-24 border-b border-[#333] z-10 relative bg-[#050505]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold mb-4">FROM ENGLISH TO EXECUTION</h2>
            <p className="text-gray-400 max-w-2xl mx-auto font-sans text-lg">
              Describe your strategy in plain language. Our LLM engine compiles it into a rigorous, backtestable algorithm instantly.
            </p>
          </div>

          <div className="grid lg:grid-cols-2 gap-12 items-stretch">
            {/* Input Side */}
            <div className="bg-[#0A0A0A] border border-[#333] p-8 flex flex-col h-full">
              <div className="flex items-center gap-2 mb-6 text-[#00FF41]">
                <Terminal className="w-6 h-6" />
                <span className="font-bold tracking-widest text-sm">STRATEGY_INPUT</span>
              </div>
              <textarea 
                className="w-full bg-[#050505] border border-[#333] p-4 text-lg text-gray-300 font-mono focus:outline-none focus:border-[#00FF41] transition-colors resize-none flex-1 min-h-[200px] mb-6"
                value={strategyInput}
                onChange={(e) => setStrategyInput(e.target.value)}
              />
              <button 
                onClick={generateStrategy}
                disabled={isGenerating}
                className="w-full bg-[#00FF41] text-black py-4 font-bold hover:bg-white transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {isGenerating ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    COMPILING...
                  </>
                ) : (
                  <>
                    GENERATE STRATEGY <ArrowRight className="w-5 h-5" />
                  </>
                )}
              </button>
            </div>

            {/* Output Side - Live Strategy Card */}
            <div className="relative min-h-[400px] flex items-center justify-center bg-[#0A0A0A] border border-[#333] p-8 overflow-hidden">
              {!showStrategyCard ? (
                <div className="text-center text-gray-600">
                  <Code className="w-16 h-16 mx-auto mb-4 opacity-20" />
                  <p className="font-mono text-sm">WAITING_FOR_INPUT...</p>
                </div>
              ) : (
                <div className="animate-in fade-in zoom-in duration-500 w-full max-w-md">
                  {/* Structured Data Card */}
                  <div className="bg-[#050505] border border-[#333] shadow-2xl font-mono text-sm relative overflow-hidden group hover:border-[#00FF41] transition-colors">
                    {/* Card Header */}
                    <div className="bg-[#111] border-b border-[#333] p-3 flex justify-between items-center">
                      <div className="flex items-center gap-2">
                        <Database className="w-4 h-4 text-[#00FF41]" />
                        <span className="font-bold text-gray-300">STRATEGY_OBJECT</span>
                      </div>
                      <span className="text-xs text-gray-600">ID: GEN-8821</span>
                    </div>
                    
                    {/* Card Body */}
                    <div className="p-6 space-y-4">
                      {/* Asset & Direction */}
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <span className="text-gray-500 text-xs block mb-1">ASSET</span>
                          <span className="text-[#00FF41] font-bold text-lg">SPY</span>
                        </div>
                        <div>
                          <span className="text-gray-500 text-xs block mb-1">DIRECTION</span>
                          <span className="text-[#00FF41] font-bold text-lg">LONG</span>
                        </div>
                      </div>

                      {/* Entry Rules */}
                      <div>
                        <span className="text-gray-500 text-xs block mb-2">ENTRY_RULES</span>
                        <div className="bg-[#111] border border-[#333] p-3 space-y-2">
                          <div className="flex items-center gap-2">
                            <div className="w-1.5 h-1.5 bg-[#00FF41]"></div>
                            <span className="text-gray-300">RSI(14) &lt; 30</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <div className="w-1.5 h-1.5 bg-[#00FF41]"></div>
                            <span className="text-gray-300">Price &gt; SMA(200)</span>
                          </div>
                        </div>
                      </div>

                      {/* Exit Rules */}
                      <div>
                        <span className="text-gray-500 text-xs block mb-2">EXIT_RULES</span>
                        <div className="bg-[#111] border border-[#333] p-3 space-y-2">
                          <div className="flex items-center gap-2">
                            <div className="w-1.5 h-1.5 bg-red-500"></div>
                            <span className="text-gray-300">RSI(14) &gt; 70</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <div className="w-1.5 h-1.5 bg-red-500"></div>
                            <span className="text-gray-300">Stop Loss: 2.0%</span>
                          </div>
                        </div>
                      </div>

                      {/* Risk Model */}
                      <div className="pt-4 border-t border-[#333] flex justify-between items-center">
                        <span className="text-gray-500 text-xs">RISK_MODEL</span>
                        <div className="flex items-center gap-2 text-[#00FF41]">
                          <Shield className="w-3 h-3" />
                          <span className="font-bold text-xs">ADAPTIVE_VOLATILITY</span>
                        </div>
                      </div>
                    </div>

                    {/* Decorative Corner */}
                    <div className="absolute top-0 right-0 w-0 h-0 border-t-[20px] border-r-[20px] border-t-transparent border-r-[#00FF41]/20"></div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Backtest Validation Section */}
      <section className="py-24 border-b border-[#333] z-10 relative bg-[#050505]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <div className="order-2 lg:order-1">
              <img 
                src="https://private-us-east-1.manuscdn.com/sessionFile/HqyEPK95aD98F100rJ2V7T/sandbox/tmVZDPFK8wT8Dg1QHzMwOz-img-1_1770442673000_na1fn_YmFja3Rlc3RfcmVwb3J0X3Yx.png?x-oss-process=image/resize,w_1920,h_1920/format,webp/quality,q_80&Expires=1798761600&Policy=eyJTdGF0ZW1lbnQiOlt7IlJlc291cmNlIjoiaHR0cHM6Ly9wcml2YXRlLXVzLWVhc3QtMS5tYW51c2Nkbi5jb20vc2Vzc2lvbkZpbGUvSHF5RVBLOTVhRDk4RjEwMHJKMlY3VC9zYW5kYm94L3RtVlpEUEZLOHdUOERnMVFIek13T3otaW1nLTFfMTc3MDQ0MjY3MzAwMF9uYTFmbl9ZbUZqYTNSbGMzUmZjbVZ3YjNKMFgzWXgucG5nP3gtb3NzLXByb2Nlc3M9aW1hZ2UvcmVzaXplLHdfMTkyMCxoXzE5MjAvZm9ybWF0LHdlYnAvcXVhbGl0eSxxXzgwIiwiQ29uZGl0aW9uIjp7IkRhdGVMZXNzVGhhbiI6eyJBV1M6RXBvY2hUaW1lIjoxNzk4NzYxNjAwfX19XX0_&Key-Pair-Id=K2HSFNDJXOU9YS&Signature=MKyhq0QZ5V~gaLTOjqQXi~~CQI3n8eC1LVCBUsJS2D9ZjGFM4qNYUGubRH90ZTfbZodZFZomFuhhIKmKMyjMGgCNU6h1d~-rX2mubr3NhZ2MOrF2O7qJdi6C~hPPhmdV6nrIrplpHtkQoi3btDoPRT68T2fGiS1vIKmmkB1g3lSaYS7t5ZQd9zU1m8n6eJsyQ10ugx~3gv8ajFwlbCsvtWKIAYphU8IIRwpBukMZpJR32Q4p8hvOSAIYkIjC1JzSBlIWp4541Fyd6sBu-hqhEtZsPeFclD9~ZUeusxvoTTlZDRknoapUSnyqkHJrk85oKuXVLhczfpPIGpWEpFtBzw__" 
                alt="Backtest Report" 
                className="w-full border border-[#333] shadow-2xl hover:border-[#00FF41] transition-colors duration-500"
              />
            </div>
            <div className="order-1 lg:order-2">
              <div className="inline-flex items-center gap-2 border border-[#333] bg-[#111] px-3 py-1 mb-6">
                <BarChart2 className="w-4 h-4 text-[#00FF41]" />
                <span className="text-xs text-gray-400 uppercase tracking-widest">VALIDATION_ENGINE</span>
              </div>
              <h2 className="text-4xl font-bold mb-6">REGIME-AWARE BACKTESTING</h2>
              <p className="text-gray-400 text-lg font-sans mb-8">
                Don't just test against price. Test against market regimes. Our engine simulates volatility shocks, liquidity crunches, and trend reversals to ensure your bot survives the real world.
              </p>
              <ul className="space-y-4 font-mono text-sm text-gray-300">
                <li className="flex items-center gap-3">
                  <div className="w-1.5 h-1.5 bg-[#00FF41]"></div>
                  <span>Walk-Forward Optimization</span>
                </li>
                <li className="flex items-center gap-3">
                  <div className="w-1.5 h-1.5 bg-[#00FF41]"></div>
                  <span>Monte Carlo Simulations</span>
                </li>
                <li className="flex items-center gap-3">
                  <div className="w-1.5 h-1.5 bg-[#00FF41]"></div>
                  <span>Slippage & Commission Modeling</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Adaptive Risk Section */}
      <section className="py-24 border-b border-[#333] z-10 relative bg-[#050505]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <div>
              <div className="inline-flex items-center gap-2 border border-[#333] bg-[#111] px-3 py-1 mb-6">
                <Shield className="w-4 h-4 text-[#00FF41]" />
                <span className="text-xs text-gray-400 uppercase tracking-widest">RISK_GUARDRAILS</span>
              </div>
              <h2 className="text-4xl font-bold mb-6">ADAPTIVE RISK MANAGEMENT</h2>
              <p className="text-gray-400 text-lg font-sans mb-8">
                Your bot watches the market 24/7. When volatility spikes, it tightens stops. When trends confirm, it pyramids positions. It's not just a script; it's an active risk manager.
              </p>
              <div className="grid grid-cols-2 gap-4">
                <div className="border border-[#333] p-4 bg-[#0A0A0A]">
                  <div className="text-[#00FF41] font-bold text-2xl mb-1">0.5s</div>
                  <div className="text-xs text-gray-500 uppercase">Reaction Time</div>
                </div>
                <div className="border border-[#333] p-4 bg-[#0A0A0A]">
                  <div className="text-[#00FF41] font-bold text-2xl mb-1">100%</div>
                  <div className="text-xs text-gray-500 uppercase">Rule Enforcement</div>
                </div>
              </div>
            </div>
            <div>
              <img 
                src="https://private-us-east-1.manuscdn.com/sessionFile/HqyEPK95aD98F100rJ2V7T/sandbox/BXlhyLlXFkuLkkOJmGAB0Q-img-2_1770442301000_na1fn_YWRhcHRpdmVfcmlza192MQ.png?x-oss-process=image/resize,w_1920,h_1920/format,webp/quality,q_80&Expires=1798761600&Policy=eyJTdGF0ZW1lbnQiOlt7IlJlc291cmNlIjoiaHR0cHM6Ly9wcml2YXRlLXVzLWVhc3QtMS5tYW51c2Nkbi5jb20vc2Vzc2lvbkZpbGUvSHF5RVBLOTVhRDk4RjEwMHJKMlY3VC9zYW5kYm94L0JYbGh5TGxYRmt1TGtrT0ptR0FCMFEtaW1nLTJfMTc3MDQ0MjMwMTAwMF9uYTFmbl9ZV1JoY0hScGRtVmZjbWx6YTE5Mk1RLnBuZz94LW9zcy1wcm9jZXNzPWltYWdlL3Jlc2l6ZSx3XzE5MjAsaF8xOTIwL2Zvcm1hdCx3ZWJwL3F1YWxpdHkscV84MCIsIkNvbmRpdGlvbiI6eyJEYXRlTGVzc1RoYW4iOnsiQVdTOkVwb2NoVGltZSI6MTc5ODc2MTYwMH19fV19&Key-Pair-Id=K2HSFNDJXOU9YS&Signature=LPmdVICMCL1xVhJwN7o2K5-~kmVeI2K4bOy732mGMQB1W~1fIIaj0Sl5f0i2kMnLaxAB7yRWHKO464Bl-8QrT9Xjjeb6oT~kbxB5d33BwyCa9HeAMylRpBo8LaPSQw38mBC6DaVwIUfg0uSRC5pKb~tySZYtukim~FBjyHKpNIQJAxkaInpit5uO6X-eepOpyAdPk4XvLFkzT59cq8zw6BSTYhRBGWbkl-8ZIaCxvB-WdlCF-yC166cSs2diuBXZD7fd5rta9KJxvv-Eu2VRaySRLv~vD7WuMNlawWjtUcTvXynS5GjGAh18ChEChufwYpJY5vumBKkJyyog~kYstQ__" 
                alt="Adaptive Risk Engine" 
                className="w-full border border-[#333] shadow-2xl hover:border-[#00FF41] transition-colors duration-500"
              />
            </div>
          </div>
        </div>
      </section>

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
