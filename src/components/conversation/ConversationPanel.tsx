"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { 
  MessageSquare, 
  Send, 
  ChevronDown, 
  Brain, 
  User, 
  Bot,
  Lightbulb,
  Target,
  TrendingUp,
  AlertCircle
} from "lucide-react";
import { useState } from "react";
import { LLMProviderSelector } from "@/components/ai/LLMProviderSelector";

interface Message {
  id: string;
  type: "user" | "ai";
  content: string;
  timestamp: Date;
  thinking?: {
    intent: string;
    parameters: string;
    rules: string;
    context: string;
  };
}

export function ConversationPanel() {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "1",
      type: "user",
      content: "I want to create a strategy for trading AAPL based on moving averages",
      timestamp: new Date(Date.now() - 300000),
    },
    {
      id: "2", 
      type: "ai",
      content: "I've created a Moving Average Crossover strategy for AAPL. This strategy uses a 20-period short-term SMA and a 50-period long-term SMA to generate buy and sell signals. The strategy will buy when the shorter moving average crosses above the longer one, indicating upward momentum, and sell when it crosses below.",
      timestamp: new Date(Date.now() - 240000),
      thinking: {
        intent: "The user wants to create a new trading strategy. The core concept is identified as 'Moving Averages'.",
        parameters: "No specific periods were provided, so I'm defaulting to the standard 20-period short MA and 50-period long MA.",
        rules: "Based on the moving average crossover concept, I've generated the initial BUY and SELL rules for display.",
        context: "Gathered and summarized recent market news and sentiment for the selected ticker (AAPL) to provide relevant context."
      }
    }
  ]);
  
  const [newMessage, setNewMessage] = useState("");
  const [selectedProvider, setSelectedProvider] = useState('openai');
  const [tokenUsage] = useState(1247);
  const [estimatedCost] = useState(0.0124);
  
  const handleSendMessage = () => {
    if (newMessage.trim()) {
      // Add user message to the conversation
      const userMessage: Message = {
        id: Date.now().toString(),
        type: 'user',
        content: newMessage.trim(),
        timestamp: new Date()
      };
      
      setMessages(prev => [...prev, userMessage]);
      setNewMessage("");
      
      // Simulate AI response after a short delay
      setTimeout(() => {
        const aiResponse: Message = {
          id: (Date.now() + 1).toString(),
          type: 'ai',
          content: `I understand you want to: "${newMessage.trim()}". Let me help you refine your strategy. This would typically involve analyzing market conditions and updating the strategy parameters accordingly.`,
          timestamp: new Date(),
          thinking: {
            intent: `User wants to modify the strategy with: ${newMessage.trim()}`,
            parameters: "Analyzing the request to identify relevant trading parameters and indicators.",
            rules: "Formulating updated buy/sell rules based on the user's input and current market conditions.",
            context: "Considering current market volatility and trend strength for AAPL to optimize the strategy."
          }
        };
        setMessages(prev => [...prev, aiResponse]);
      }, 1000);
    }
  };

  return (
    <div className="flex flex-col h-full">
      {/* Fixed Header */}
      <div className="flex-shrink-0 border-b bg-card">
        <div className="flex items-center justify-between px-3 py-2">
          <div className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5" />
            <span className="text-lg font-semibold">Strategy Generator</span>
          </div>
          <LLMProviderSelector 
            selectedProvider={selectedProvider}
            onProviderChange={setSelectedProvider}
            tokenUsage={tokenUsage}
            estimatedCost={estimatedCost}
          />
        </div>
      </div>
      
      {/* Scrollable Message History */}
      <div className="flex-1 min-h-0 overflow-hidden">
        <ScrollArea className="h-full px-3 py-3">
          <div className="space-y-4">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex gap-3 ${
                  message.type === "user" ? "justify-end" : "justify-start"
                }`}
              >
                {message.type === "ai" && (
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 flex-shrink-0">
                    <Bot className="h-4 w-4 text-primary" />
                  </div>
                )}
                
                <div className={`max-w-[85%] ${message.type === "user" ? "order-2" : ""}`}>
                  {message.type === "user" && (
                    <div className="text-xs text-muted-foreground mb-1 text-right">You</div>
                  )}
                  {message.type === "ai" && (
                    <div className="text-xs text-muted-foreground mb-1">AlgoBrute AI</div>
                  )}
                  
                  <div
                    className={`rounded-lg p-3 ${
                      message.type === "user"
                        ? "bg-primary text-primary-foreground"
                        : "bg-muted text-foreground"
                    }`}
                  >
                    <p className="text-sm leading-relaxed">{message.content}</p>
                    
                    {/* AI Thinking Process */}
                    {message.type === "ai" && message.thinking && (
                      <Collapsible className="mt-3">
                        <CollapsibleTrigger asChild>
                          <Button variant="ghost" size="sm" className="w-full justify-start p-0 h-auto text-xs opacity-70 hover:opacity-100">
                            <Brain className="h-3 w-3 mr-2" />
                            View Thinking Process
                            <ChevronDown className="h-3 w-3 ml-auto" />
                          </Button>
                        </CollapsibleTrigger>
                        <CollapsibleContent className="mt-2 space-y-2 text-xs">
                          <div className="border-t border-border/50 pt-2">
                            <div className="flex items-start gap-2 mb-2">
                              <Target className="h-3 w-3 mt-0.5 text-blue-400" />
                              <div>
                                <div className="font-medium text-blue-400">Understood Intent</div>
                                <div className="text-muted-foreground">{message.thinking.intent}</div>
                              </div>
                            </div>
                            
                            <div className="flex items-start gap-2 mb-2">
                              <TrendingUp className="h-3 w-3 mt-0.5 text-green-400" />
                              <div>
                                <div className="font-medium text-green-400">Identified Parameters</div>
                                <div className="text-muted-foreground">{message.thinking.parameters}</div>
                              </div>
                            </div>
                            
                            <div className="flex items-start gap-2 mb-2">
                              <Lightbulb className="h-3 w-3 mt-0.5 text-yellow-400" />
                              <div>
                                <div className="font-medium text-yellow-400">Formulated Rules</div>
                                <div className="text-muted-foreground">{message.thinking.rules}</div>
                              </div>
                            </div>
                            
                            <div className="flex items-start gap-2">
                              <AlertCircle className="h-3 w-3 mt-0.5 text-orange-400" />
                              <div>
                                <div className="font-medium text-orange-400">Market Context</div>
                                <div className="text-muted-foreground">{message.thinking.context}</div>
                              </div>
                            </div>
                          </div>
                        </CollapsibleContent>
                      </Collapsible>
                    )}
                  </div>
                </div>
                
                {message.type === "user" && (
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-muted flex-shrink-0">
                    <User className="h-4 w-4 text-muted-foreground" />
                  </div>
                )}
              </div>
            ))}
          </div>
        </ScrollArea>
      </div>
        
      {/* Fixed Input Area */}
      <div className="flex-shrink-0 border-t border-border/50 bg-card p-3">
        <div className="flex gap-2">
          <Textarea
            placeholder="e.g., Add a stop-loss at 2%..."
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            className="flex-1 min-h-[44px] resize-none"
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                handleSendMessage();
              }
            }}
          />
          <Button 
            onClick={handleSendMessage}
            disabled={!newMessage.trim()}
            size="sm"
            className="px-3"
          >
            <Send className="h-4 w-4" />
          </Button>
        </div>
        
        {/* Quick Actions */}
        <div className="flex flex-wrap gap-2 mt-3">
          <Button 
            variant="outline" 
            size="sm" 
            className="text-xs px-3 h-7"
            onClick={() => setNewMessage("Add a 2% stop-loss to protect against downside risk")}
          >
            Add Stop-Loss
          </Button>
          <Button 
            variant="outline" 
            size="sm" 
            className="text-xs px-3 h-7"
            onClick={() => setNewMessage("Change the timeframe to 4H for better signal quality")}
          >
            Change Timeframe
          </Button>
          <Button 
            variant="outline" 
            size="sm" 
            className="text-xs px-3 h-7"
            onClick={() => setNewMessage("Add RSI indicator to confirm entry signals")}
          >
            Add RSI
          </Button>
        </div>
      </div>
    </div>
  );
}