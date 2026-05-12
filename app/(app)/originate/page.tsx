'use client';

/**
 * /originate — Strategy origination dialogue (Wave 1.A skeleton).
 *
 * This is a NEW top-level route (sibling to /workbench, NOT a tab inside it)
 * that hosts the collaborative-agentic strategy-origination experience:
 *   - Left/main: chat transcript + composer (OriginateChat).
 *   - Right: phase chip + light-backtest status (PhaseStatusPanel).
 *
 * Wave 1.A delivers the SKELETON only — connection, raw text rendering, and
 * the layout shell. Wave 1.B (F.1.B) layers structured-payload renderers
 * onto the same shell, and Wave 1.C (F.1.C) adds the verdict + Accept CTA.
 */

import OriginateChat from '@/components/originate/OriginateChat';
import PhaseStatusPanel from '@/components/originate/PhaseStatusPanel';
import { useDialogueSession } from '@/hooks/useDialogueSession';

export default function OriginatePage() {
  const session = useDialogueSession();

  return (
    <div className="flex flex-col gap-6" data-testid="originate-page">
      <div>
        <h2 className="text-lg font-semibold">Originate</h2>
        <p className="text-sm text-muted-foreground">
          Talk through your strategy idea — our agents validate it with a quick
          backtest before you commit to deploying.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_320px]">
        <div className="min-h-[560px]">
          <OriginateChat session={session} />
        </div>
        <div>
          <PhaseStatusPanel
            phase={session.phase}
            lightBacktest={session.lightBacktest}
          />
        </div>
      </div>
    </div>
  );
}
