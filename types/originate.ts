/**
 * Structured-payload type contracts for the /originate dialogue surface.
 *
 * Mirrors the engine's Pydantic shapes so the WebSocket stream's
 * ``turn_complete.structured_payload`` and per-agent payloads can be
 * routed through dedicated renderer components without ``any`` escape
 * hatches.
 *
 * Engine sources (kept in sync — these types MUST track the engine):
 *   - `src/algobrute/origination/dialogue/state.py`
 *     (DialoguePhase, BiasDisclosure, dialogue-side Screen3Payload,
 *      LightBacktestStatus, LightBacktestVerdict)
 *   - `src/algobrute/origination/agents/structured_payload.py`
 *     (Screen2Payload, agent-side Screen3Payload, ChallengePayload,
 *      PreMortemPayload, DoctorAlertPayload, MultiChoiceQuestion etc.)
 *   - `src/algobrute/contracts/trade_ideas.py` (TradeIdeaSpec)
 *
 * Wire format: the engine emits StrEnum values as their lowercase
 * ``.value`` strings (e.g. ``"entry"`` / ``"in_flight"`` /
 * ``"looks_promising"``).  Hook consumers translate to the UPPERCASE
 * variant used by existing components at the message-boundary.
 *
 * Discrimination strategy: the engine does NOT emit a ``kind`` discriminator
 * on the wire — the union members are distinguished by their **structural
 * fingerprints** (e.g. ``Screen2Payload`` has ``multi_choice_questions``;
 * ``ChallengePayload`` has ``challenges``).  ``PayloadRouter`` consumes
 * the raw dict and dispatches on field shape.  We layer a frontend-only
 * tagged variant (``TaggedStructuredPayload``) on top so React renderers
 * can switch on ``kind`` cleanly.
 */

// ---------------------------------------------------------------------------
// Lifecycle enums — UPPERCASE in TypeScript; the hook translates from the
// engine's lowercase wire values at the message boundary.
// ---------------------------------------------------------------------------

export type DialoguePhase =
  | 'ENTRY'
  | 'EXTRACTION'
  | 'EXPLORATION'
  | 'REFINEMENT'
  | 'VALIDATION'
  | 'DEPLOYMENT_DECISION'
  | 'ACCOMPANIMENT';

export type LightBacktestStatus =
  | 'NOT_STARTED'
  | 'IN_FLIGHT'
  | 'COMPLETE'
  | 'FAILED'
  | 'EXPIRED';

export type LightBacktestVerdict =
  | 'LOOKS_PROMISING'
  | 'MIXED_SIGNALS'
  | 'NOT_RECOMMENDED'
  | 'INCONCLUSIVE';

export type InvestorType =
  | 'long_term_investor'
  | 'value_investor'
  | 'growth_investor'
  | 'income_investor'
  | 'swing_trader'
  | 'options_strategy_player'
  | 'undeclared';

export type StrategyClass =
  | 'momentum'
  | 'mean_reversion'
  | 'breakout'
  | 'volatility'
  | 'event_driven'
  | 'pairs'
  | 'carry'
  | 'arbitrage'
  | 'multi_factor'
  | 'trend'
  | string;

export type TradeIdeaSpecProvenance =
  | 'llm_authored'
  | 'stub_fallback'
  | 'parse_failed';

// ---------------------------------------------------------------------------
// TradeIdeaSpec — carried inside Screen2Payload.trade_idea_spec
// ---------------------------------------------------------------------------

/** Trading-spec carried alongside Screen 2 prose (Phase O Wave 1A onwards).  */
export interface TradeIdeaSpec {
  idea_id: string;
  title: string;
  narrative: string;
  /** "long" | "short" | "both" */
  side_bias: string;
  /** "intraday" | "swing" | "position" */
  holding_horizon: string;
  preferred_regimes: string[];
  forbidden_regimes: string[];
  preferred_signal_families: string[];
  forbidden_signal_families: string[];
  setup_constraints: Record<string, unknown>;
  risk_preferences: Record<string, unknown>;
}

// ---------------------------------------------------------------------------
// Screen 1 — strategy classification + investor framing
// ---------------------------------------------------------------------------

/**
 * "Here's what we heard" classification surface — Screen 1.
 *
 * NOTE: at the time of writing the engine does not yet emit a dedicated
 * Screen1Payload type — the strategy classification surfaces on the
 * AgentResponse.audit_metadata for the Detective agent or as the
 * prelude to Screen2Payload.  We define the shape here so the future
 * engine-side payload (Phase Q) can land without a frontend rewrite,
 * and so the renderer is exercisable today via mocked / stubbed
 * fixtures in tests.
 */
export interface Screen1Payload {
  /** The classified strategy class (canonical lowercase wire value). */
  strategy_class: StrategyClass;
  /** Investor archetype the classification framed against. */
  investor_type: InvestorType;
  /** Classifier confidence in [0, 1]. */
  classified_confidence: number;
  /** Short, plain-English summary of what was heard. */
  summary?: string;
  /** Optional ticker the user mentioned. */
  ticker?: string | null;
}

// ---------------------------------------------------------------------------
// Screen 2 — "Here's what I think you mean"
// ---------------------------------------------------------------------------

export interface MultiChoiceOption {
  option_id: string;
  text: string;
  implies?: Record<string, string> | null;
}

export interface MultiChoiceQuestion {
  question_id: string;
  text: string;
  /** Exactly three options per the 3-Q principle. */
  options: [MultiChoiceOption, MultiChoiceOption, MultiChoiceOption];
}

/**
 * Mirrors `src/algobrute/origination/agents/structured_payload.py::Screen2Payload`.
 *
 * The 4-tuple `build_description` is positional: trigger / entry / exit / regime.
 */
export interface Screen2Payload {
  class_summary: string;
  /** Exactly four bullets — (trigger, entry, exit, regime). */
  build_description: [string, string, string, string];
  /** Exactly three default assumptions. */
  default_assumptions: [string, string, string];
  /** Exactly three multi-choice questions (3-Q principle). */
  multi_choice_questions: [
    MultiChoiceQuestion,
    MultiChoiceQuestion,
    MultiChoiceQuestion,
  ];
  show_example_available: boolean;
  stuck_suggest_available: boolean;
  /** Optional TradeIdeaSpec when the LLM authored a valid spec. */
  trade_idea_spec?: TradeIdeaSpec | null;
  trade_idea_spec_provenance: TradeIdeaSpecProvenance;
  /** Optional audit provenance carried separately by some emit sites. */
  screen2_source?: string | null;
  /** Optional strategy-level summary surfaced from the agent. */
  strategy_summary?: string;
}

// ---------------------------------------------------------------------------
// Screen 3 — light-backtest verdict + disclosures
// ---------------------------------------------------------------------------

export interface BiasDisclosure {
  biases_not_controlled: string[];
  sample_caveats: string[];
  next_step: string;
}

/**
 * Light-backtest result presentation payload.
 *
 * Mirrors `src/algobrute/origination/dialogue/state.py::Screen3Payload`
 * (the DIALOGUE-side, light-backtest-result variant — NOT the agent-side
 * UX "final draft" Screen3 variant in `agents/structured_payload.py`).
 * The dialogue-side variant is the one the verdict UI cares about; the
 * agent-side one is reserved for the future "final draft" surface and
 * is not currently rendered.
 */
export interface Screen3Payload {
  verdict: LightBacktestVerdict;
  strategy_class: StrategyClass;
  window_description: string;
  ticker: string;
  /** Keyed metrics; values may be `null` when a metric was not computable. */
  metrics: Record<string, number | null>;
  trade_count: number;
  disclosures: BiasDisclosure;
  passport_id: string | null;
}

// ---------------------------------------------------------------------------
// Cross-Examiner — challenges
// ---------------------------------------------------------------------------

export type ChallengeCategory =
  | 'regime_fragility'
  | 'capacity'
  | 'mechanism'
  | 'lookahead'
  | 'sample'
  | 'behavioral';

/**
 * Mirrors `src/algobrute/origination/agents/structured_payload.py::ChallengePayload`.
 *
 * The engine emits `challenges` as a tuple of free-form strings — we model
 * each as `{ text, category?, severity? }` so the renderer can colour-code
 * by severity.  If the engine carries only strings, the router upgrades
 * them to `{ text }` records.
 */
export interface Challenge {
  text: string;
  category?: ChallengeCategory;
  severity?: 'low' | 'medium' | 'high';
}

export interface ChallengePayload {
  challenges: Challenge[];
  categories_engaged: ChallengeCategory[];
  evidence_count: number;
}

// ---------------------------------------------------------------------------
// Pre-Mortem Guide — failure scenarios
// ---------------------------------------------------------------------------

/**
 * One pre-mortem failure scenario.  The engine emits stable scenario IDs
 * (e.g. `"regime_shift_unwind"`) on `scenarios_surfaced`; the renderer
 * may receive enriched objects with name + description when the engine
 * upgrades.  We accept both: when only an ID is on the wire, the router
 * lifts it into `{ id }`.
 */
export interface PreMortemScenario {
  id: string;
  name?: string;
  description?: string;
  /** Probability bucket; engine may report this as a float in [0, 1] or a label. */
  probability?: number | 'low' | 'medium' | 'high';
  /** Impact bucket. */
  impact?: 'low' | 'medium' | 'high';
}

export interface PreMortemPayload {
  scenarios_surfaced: PreMortemScenario[];
  scenarios_picked: string[];
}

// ---------------------------------------------------------------------------
// Doctor — anomaly alerts
// ---------------------------------------------------------------------------

export type DoctorSeverity = 'low' | 'medium' | 'high';

export type DoctorTrigger =
  | 'anomaly_detected'
  | 'scheduled_checkin'
  | 'user_initiated'
  | 'failure_mode_materialized'
  | string;

export interface DoctorAlertPayload {
  /** MonitoringTrigger string value. */
  trigger: DoctorTrigger;
  severity: DoctorSeverity;
  action_required: boolean;
  detector_evidence_count: number;
  /** Optional human-readable message; not on the engine model today but
   *  reserved so engines can ship it without a frontend rewrite. */
  message?: string;
  metadata?: Record<string, unknown>;
}

// ---------------------------------------------------------------------------
// Tagged discriminated union — what the frontend renderers consume
// ---------------------------------------------------------------------------

/**
 * Discriminator added by the frontend router so React components can
 * `switch (payload.kind)` cleanly.  The engine does NOT emit `kind` on
 * the wire — the router computes it by structural fingerprint.
 */
export type StructuredPayloadKind =
  | 'screen1'
  | 'screen2'
  | 'screen3'
  | 'challenge'
  | 'pre_mortem'
  | 'doctor_alert';

export type TaggedStructuredPayload =
  | ({ kind: 'screen1' } & Screen1Payload)
  | ({ kind: 'screen2' } & Screen2Payload)
  | ({ kind: 'screen3' } & Screen3Payload)
  | ({ kind: 'challenge' } & ChallengePayload)
  | ({ kind: 'pre_mortem' } & PreMortemPayload)
  | ({ kind: 'doctor_alert' } & DoctorAlertPayload);

/** Raw wire shape — the union value emitted by the engine, untagged. */
export type RawStructuredPayload = Record<string, unknown>;
