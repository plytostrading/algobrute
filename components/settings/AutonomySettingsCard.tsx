'use client';

import { Badge } from '@/components/ui/badge';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import { Switch } from '@/components/ui/switch';
import {
  useAutonomyPolicy,
  useUpdateAutonomyPolicy,
  type AutonomyMode,
} from '@/hooks/useAutonomyPolicy';

// ---------------------------------------------------------------------------
// AutonomySettingsCard
//
// Surfaces the user's posterior-aware sizer canary opt-in toggle.
// The toggle is visible to every authenticated user; the corresponding
// metrics card (ShadowSizerSummaryCard) renders only after the user
// opts in (per Decision 5 in the RAPU frontend re-authoring spec).
// ---------------------------------------------------------------------------

function AutonomySkeleton() {
  return (
    <div className="space-y-4">
      <Skeleton className="h-5 w-2/3" />
      <Skeleton className="h-4 w-full" />
      <Skeleton className="h-4 w-3/4" />
      <Skeleton className="h-9 w-32" />
    </div>
  );
}

export default function AutonomySettingsCard() {
  const policyQuery = useAutonomyPolicy();
  const updateMutation = useUpdateAutonomyPolicy();

  const policy = policyQuery.data;
  const optedIn = policy?.posterior_aware_sizer_canary_opt_in ?? false;

  function handleToggle(next: boolean) {
    if (!policy) return;
    updateMutation.mutate({
      // Mode must always be sent; everything else can omit-on-inherit.
      mode: policy.mode as AutonomyMode,
      posterior_aware_sizer_canary_opt_in: next,
    });
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          Autonomy
          <Badge variant="secondary">Beta</Badge>
        </CardTitle>
        <CardDescription>
          Opt into early autonomy features and posterior-aware position sizing
        </CardDescription>
      </CardHeader>
      <CardContent>
        {policyQuery.isLoading ? (
          <AutonomySkeleton />
        ) : policyQuery.isError ? (
          <div className="space-y-3">
            <div className="rounded-md border border-destructive/50 bg-destructive/10 p-3">
              <p className="text-sm text-destructive">
                Failed to load autonomy preferences.
              </p>
              <p className="text-xs text-destructive/80">
                {(policyQuery.error as Error).message}
              </p>
            </div>
            <Button
              size="sm"
              variant="outline"
              onClick={() => void policyQuery.refetch()}
            >
              Retry
            </Button>
          </div>
        ) : policy ? (
          <div className="space-y-5">
            <div className="flex items-start justify-between gap-4">
              <div className="space-y-1">
                <Label
                  htmlFor="posterior-aware-sizer-canary"
                  className="text-sm font-medium"
                >
                  Posterior-aware sizer (canary)
                </Label>
                <p className="text-xs text-muted-foreground">
                  Replace the legacy argmax position sizer with the
                  posterior-aware sizer that uses cluster-specific priors
                  for Kelly-cap selection.  Decisions are still tracked
                  in shadow alongside the legacy sizer; you can opt out
                  at any time.
                </p>
              </div>
              <Switch
                id="posterior-aware-sizer-canary"
                checked={optedIn}
                onCheckedChange={handleToggle}
                disabled={updateMutation.isPending}
                aria-label="Posterior-aware sizer canary opt-in"
              />
            </div>

            <div className="border-t border-border pt-3 text-xs text-muted-foreground">
              Autonomy mode: <span className="font-medium capitalize">{policy.mode}</span>
            </div>

            {updateMutation.isError && (
              <div className="rounded-md border border-destructive/50 bg-destructive/10 p-3">
                <p className="text-sm text-destructive">
                  Failed to save autonomy preferences.
                </p>
                <p className="text-xs text-destructive/80">
                  {(updateMutation.error as Error).message}
                </p>
              </div>
            )}
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
}
