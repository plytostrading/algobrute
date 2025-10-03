"use client";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Settings,
  Zap,
  Bot,
  DollarSign,
  Clock
} from "lucide-react";
import { useState } from "react";

interface LLMProvider {
  id: string;
  name: string;
  model: string;
  icon: React.ComponentType<{ className?: string }>;
  pricing: string;
  speed: string;
  features: string[];
  color: string;
}

const providers: LLMProvider[] = [
  {
    id: 'openai',
    name: 'OpenAI',
    model: 'GPT-4 Turbo',
    icon: Bot,
    pricing: '$0.01/1K tokens',
    speed: 'Fast',
    features: ['Best reasoning', 'Code generation', 'Complex strategies'],
    color: 'bg-green-500/10 text-green-400 border-green-500/20'
  },
  {
    id: 'grok',
    name: 'xAI',
    model: 'Grok-2 Fast',
    icon: Zap,
    pricing: '$0.005/1K tokens',
    speed: 'Very Fast',
    features: ['Real-time data', 'Market insights', 'Speed optimized'],
    color: 'bg-blue-500/10 text-blue-400 border-blue-500/20'
  }
];

interface LLMProviderSelectorProps {
  selectedProvider: string;
  onProviderChange: (providerId: string) => void;
  tokenUsage?: number;
  estimatedCost?: number;
}

export function LLMProviderSelector({ 
  selectedProvider, 
  onProviderChange,
  tokenUsage = 0,
  estimatedCost = 0
}: LLMProviderSelectorProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const currentProvider = providers.find(p => p.id === selectedProvider) || providers[0];

  if (!isExpanded) {
    return (
      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={() => setIsExpanded(true)}
          className="flex items-center gap-2"
        >
          <currentProvider.icon className="h-3 w-3" />
          <span className="text-xs">{currentProvider.model}</span>
          <Settings className="h-3 w-3" />
        </Button>
        
        {tokenUsage > 0 && (
          <Badge variant="secondary" className="text-xs">
            {tokenUsage.toLocaleString()} tokens
          </Badge>
        )}
        
        {estimatedCost > 0 && (
          <Badge variant="outline" className="text-xs">
            ${estimatedCost.toFixed(4)}
          </Badge>
        )}
      </div>
    );
  }

  return (
    <div className="bg-card border rounded-lg p-4 space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-medium text-sm">AI Provider Settings</h3>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setIsExpanded(false)}
          className="text-xs"
        >
          Close
        </Button>
      </div>
      
      <div className="grid gap-3">
        {providers.map((provider) => {
          const isSelected = selectedProvider === provider.id;
          return (
            <div
              key={provider.id}
              className={`
                relative rounded-lg border p-3 cursor-pointer transition-colors
                ${isSelected 
                  ? provider.color 
                  : 'border-border hover:bg-muted/50'
                }
              `}
              onClick={() => onProviderChange(provider.id)}
            >
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-3">
                  <div className={`
                    flex h-8 w-8 items-center justify-center rounded-md
                    ${isSelected ? 'bg-current/20' : 'bg-muted'}
                  `}>
                    <provider.icon className="h-4 w-4" />
                  </div>
                  
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <div className="font-medium text-sm">{provider.name}</div>
                      <Badge variant="outline" className="text-xs">
                        {provider.model}
                      </Badge>
                    </div>
                    
                    <div className="flex items-center gap-4 text-xs text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <DollarSign className="h-3 w-3" />
                        <span>{provider.pricing}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        <span>{provider.speed}</span>
                      </div>
                    </div>
                    
                    <div className="flex flex-wrap gap-1 mt-2">
                      {provider.features.map((feature, index) => (
                        <Badge 
                          key={index}
                          variant="secondary" 
                          className="text-xs"
                        >
                          {feature}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </div>
                
                {isSelected && (
                  <div className="flex h-5 w-5 items-center justify-center rounded-full bg-current/20">
                    <div className="h-2 w-2 rounded-full bg-current" />
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
      
      {/* Usage Statistics */}
      <div className="border-t border-border pt-3 space-y-2">
        <div className="text-xs font-medium">Session Usage</div>
        <div className="grid grid-cols-2 gap-4 text-xs">
          <div>
            <div className="text-muted-foreground">Tokens Used</div>
            <div className="font-medium">{tokenUsage.toLocaleString()}</div>
          </div>
          <div>
            <div className="text-muted-foreground">Estimated Cost</div>
            <div className="font-medium">${estimatedCost.toFixed(4)}</div>
          </div>
        </div>
      </div>
    </div>
  );
}