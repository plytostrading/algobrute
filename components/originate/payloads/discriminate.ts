/**
 * Structural-fingerprint discriminator for structured payloads.
 *
 * The engine emits payloads via `Pydantic.model_dump(mode="json")`
 * WITHOUT a `kind` discriminator field — the union members are
 * distinguished only by their **structural shape**.  This module is
 * the single owner of that shape → ``kind`` mapping; renderers below
 * consume the tagged union and never touch raw dicts.
 *
 * Ordering matters: more-specific shapes are checked BEFORE more-general
 * shapes (e.g., Screen2 has `multi_choice_questions` AND
 * `build_description`; Screen3 has `verdict`; Challenge has `challenges`
 * tuple but NOT the Screen-2 build_description).  Update this file when
 * the engine's structured-payload union grows.
 */

import type {
  Challenge,
  ChallengePayload,
  DoctorAlertPayload,
  PreMortemPayload,
  PreMortemScenario,
  RawStructuredPayload,
  Screen1Payload,
  Screen2Payload,
  Screen3Payload,
  StructuredPayloadKind,
  TaggedStructuredPayload,
} from '@/types/originate';

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function hasKey(obj: Record<string, unknown>, key: string): boolean {
  return Object.prototype.hasOwnProperty.call(obj, key);
}

/**
 * Inspect a raw structured payload dict and return the discriminator kind,
 * or `null` if the shape doesn't match any known payload type.
 */
export function detectKind(
  payload: RawStructuredPayload,
): StructuredPayloadKind | null {
  if (!isRecord(payload)) return null;

  // Some engines emit a literal `kind` field on the wire — honour it
  // first so future engine additions don't have to fingerprint-match.
  if (typeof payload.kind === 'string') {
    const k = payload.kind as StructuredPayloadKind;
    if (
      k === 'screen1' ||
      k === 'screen2' ||
      k === 'screen3' ||
      k === 'challenge' ||
      k === 'pre_mortem' ||
      k === 'doctor_alert'
    ) {
      return k;
    }
  }

  // Screen 3 — dialogue-side light-backtest result (the variant we
  // render).  Distinguished by `verdict` + `disclosures` + `metrics`.
  if (
    hasKey(payload, 'verdict') &&
    hasKey(payload, 'disclosures') &&
    hasKey(payload, 'metrics')
  ) {
    return 'screen3';
  }

  // Screen 2 — "here's what I think you mean".  Distinguished by the
  // 4-bullet `build_description` + 3-question `multi_choice_questions`.
  if (
    hasKey(payload, 'build_description') &&
    hasKey(payload, 'multi_choice_questions')
  ) {
    return 'screen2';
  }

  // Challenge — Cross-Examiner output.
  if (
    hasKey(payload, 'challenges') &&
    hasKey(payload, 'categories_engaged')
  ) {
    return 'challenge';
  }

  // Pre-Mortem.
  if (hasKey(payload, 'scenarios_surfaced')) {
    return 'pre_mortem';
  }

  // Doctor alert.
  if (
    hasKey(payload, 'trigger') &&
    hasKey(payload, 'severity') &&
    hasKey(payload, 'detector_evidence_count')
  ) {
    return 'doctor_alert';
  }

  // Screen 1 — defensive check, last (and least specific).
  if (
    hasKey(payload, 'strategy_class') &&
    hasKey(payload, 'classified_confidence')
  ) {
    return 'screen1';
  }

  return null;
}

// ---------------------------------------------------------------------------
// Normalisers — coerce raw wire dicts into the typed shapes the
// renderers expect.  Defensive: missing optional fields fall back to
// safe defaults; required fields that are missing fail loudly.
// ---------------------------------------------------------------------------

function asString(v: unknown, fallback = ''): string {
  return typeof v === 'string' ? v : fallback;
}

function asNumber(v: unknown, fallback = 0): number {
  return typeof v === 'number' ? v : fallback;
}

function asBoolean(v: unknown, fallback = false): boolean {
  return typeof v === 'boolean' ? v : fallback;
}

function asStringArray(v: unknown): string[] {
  if (!Array.isArray(v)) return [];
  return v.filter((x): x is string => typeof x === 'string');
}

function normaliseChallenges(raw: unknown): Challenge[] {
  if (!Array.isArray(raw)) return [];
  return raw.map((entry): Challenge => {
    if (typeof entry === 'string') {
      return { text: entry };
    }
    if (isRecord(entry)) {
      return {
        text: asString(entry.text ?? entry.question, ''),
        category: entry.category as Challenge['category'],
        severity: entry.severity as Challenge['severity'],
      };
    }
    return { text: '' };
  });
}

function normaliseScenarios(raw: unknown): PreMortemScenario[] {
  if (!Array.isArray(raw)) return [];
  return raw.map((entry): PreMortemScenario => {
    if (typeof entry === 'string') {
      return { id: entry };
    }
    if (isRecord(entry)) {
      const probability = entry.probability;
      const impact = entry.impact;
      return {
        id: asString(entry.id, ''),
        name: typeof entry.name === 'string' ? entry.name : undefined,
        description:
          typeof entry.description === 'string' ? entry.description : undefined,
        probability:
          typeof probability === 'number' ||
          probability === 'low' ||
          probability === 'medium' ||
          probability === 'high'
            ? probability
            : undefined,
        impact:
          impact === 'low' || impact === 'medium' || impact === 'high'
            ? impact
            : undefined,
      };
    }
    return { id: '' };
  });
}

function normaliseScreen1(raw: Record<string, unknown>): Screen1Payload {
  return {
    strategy_class: asString(raw.strategy_class, 'momentum'),
    investor_type: asString(raw.investor_type, 'undeclared') as Screen1Payload['investor_type'],
    classified_confidence: asNumber(raw.classified_confidence, 0),
    summary: typeof raw.summary === 'string' ? raw.summary : undefined,
    ticker: typeof raw.ticker === 'string' ? raw.ticker : null,
  };
}

function normaliseScreen2(raw: Record<string, unknown>): Screen2Payload {
  const build = Array.isArray(raw.build_description)
    ? raw.build_description.map((b) => asString(b))
    : ['', '', '', ''];
  const defaults = Array.isArray(raw.default_assumptions)
    ? raw.default_assumptions.map((b) => asString(b))
    : ['', '', ''];
  const questions = Array.isArray(raw.multi_choice_questions)
    ? raw.multi_choice_questions
    : [];

  const normaliseOption = (o: unknown) => {
    if (!isRecord(o)) return { option_id: '', text: '' };
    return {
      option_id: asString(o.option_id, ''),
      text: asString(o.text, ''),
      implies: isRecord(o.implies) ? (o.implies as Record<string, string>) : null,
    };
  };

  const normaliseQ = (q: unknown) => {
    if (!isRecord(q)) {
      return {
        question_id: '',
        text: '',
        options: [
          normaliseOption(null),
          normaliseOption(null),
          normaliseOption(null),
        ] as Screen2Payload['multi_choice_questions'][number]['options'],
      };
    }
    const opts = Array.isArray(q.options) ? q.options : [];
    return {
      question_id: asString(q.question_id, ''),
      text: asString(q.text, ''),
      options: [
        normaliseOption(opts[0]),
        normaliseOption(opts[1]),
        normaliseOption(opts[2]),
      ] as Screen2Payload['multi_choice_questions'][number]['options'],
    };
  };

  return {
    class_summary: asString(raw.class_summary, ''),
    build_description: [
      build[0] ?? '',
      build[1] ?? '',
      build[2] ?? '',
      build[3] ?? '',
    ] as Screen2Payload['build_description'],
    default_assumptions: [
      defaults[0] ?? '',
      defaults[1] ?? '',
      defaults[2] ?? '',
    ] as Screen2Payload['default_assumptions'],
    multi_choice_questions: [
      normaliseQ(questions[0]),
      normaliseQ(questions[1]),
      normaliseQ(questions[2]),
    ] as Screen2Payload['multi_choice_questions'],
    show_example_available: asBoolean(raw.show_example_available, true),
    stuck_suggest_available: asBoolean(raw.stuck_suggest_available, true),
    trade_idea_spec: isRecord(raw.trade_idea_spec)
      ? (raw.trade_idea_spec as unknown as Screen2Payload['trade_idea_spec'])
      : null,
    trade_idea_spec_provenance: (asString(
      raw.trade_idea_spec_provenance,
      'stub_fallback',
    ) as Screen2Payload['trade_idea_spec_provenance']),
    screen2_source:
      typeof raw.screen2_source === 'string' ? raw.screen2_source : null,
    strategy_summary:
      typeof raw.strategy_summary === 'string' ? raw.strategy_summary : undefined,
  };
}

const VERDICT_WIRE_TO_TS: Record<string, Screen3Payload['verdict']> = {
  looks_promising: 'LOOKS_PROMISING',
  mixed_signals: 'MIXED_SIGNALS',
  not_recommended: 'NOT_RECOMMENDED',
  inconclusive: 'INCONCLUSIVE',
};

function normaliseVerdict(wire: unknown): Screen3Payload['verdict'] {
  if (typeof wire !== 'string') return 'INCONCLUSIVE';
  // Tolerate already-uppercase inputs (e.g., test stubs passing tagged
  // payloads directly into PayloadRouter).
  const upper = wire.toUpperCase() as Screen3Payload['verdict'];
  if (
    upper === 'LOOKS_PROMISING' ||
    upper === 'MIXED_SIGNALS' ||
    upper === 'NOT_RECOMMENDED' ||
    upper === 'INCONCLUSIVE'
  ) {
    return upper;
  }
  return VERDICT_WIRE_TO_TS[wire.toLowerCase()] ?? 'INCONCLUSIVE';
}

function normaliseScreen3(raw: Record<string, unknown>): Screen3Payload {
  const disclosures = isRecord(raw.disclosures) ? raw.disclosures : {};
  const metricsIn = isRecord(raw.metrics) ? raw.metrics : {};
  const metrics: Record<string, number | null> = {};
  for (const [key, value] of Object.entries(metricsIn)) {
    if (typeof value === 'number') {
      metrics[key] = value;
    } else if (value === null) {
      metrics[key] = null;
    }
  }
  return {
    verdict: normaliseVerdict(raw.verdict),
    strategy_class: asString(raw.strategy_class, 'momentum'),
    window_description: asString(raw.window_description, ''),
    ticker: asString(raw.ticker, ''),
    metrics,
    trade_count: asNumber(raw.trade_count, 0),
    disclosures: {
      biases_not_controlled: asStringArray(disclosures.biases_not_controlled),
      sample_caveats: asStringArray(disclosures.sample_caveats),
      next_step: asString(disclosures.next_step, ''),
    },
    passport_id: typeof raw.passport_id === 'string' ? raw.passport_id : null,
  };
}

function normaliseChallenge(raw: Record<string, unknown>): ChallengePayload {
  return {
    challenges: normaliseChallenges(raw.challenges),
    categories_engaged: asStringArray(
      raw.categories_engaged,
    ) as ChallengePayload['categories_engaged'],
    evidence_count: asNumber(raw.evidence_count, 0),
  };
}

function normalisePreMortem(raw: Record<string, unknown>): PreMortemPayload {
  return {
    scenarios_surfaced: normaliseScenarios(raw.scenarios_surfaced),
    scenarios_picked: asStringArray(raw.scenarios_picked),
  };
}

function normaliseDoctorAlert(raw: Record<string, unknown>): DoctorAlertPayload {
  return {
    trigger: asString(raw.trigger, 'scheduled_checkin'),
    severity:
      (asString(raw.severity, 'low') as DoctorAlertPayload['severity']) ?? 'low',
    action_required: asBoolean(raw.action_required, false),
    detector_evidence_count: asNumber(raw.detector_evidence_count, 0),
    message: typeof raw.message === 'string' ? raw.message : undefined,
    metadata: isRecord(raw.metadata)
      ? (raw.metadata as Record<string, unknown>)
      : undefined,
  };
}

/**
 * Convert a raw wire payload into a tagged variant ready for rendering.
 * Returns `null` when the shape does not match any known payload type
 * — the router should skip these silently rather than crash the chat.
 */
export function tagPayload(
  raw: RawStructuredPayload | null | undefined,
): TaggedStructuredPayload | null {
  if (!raw || !isRecord(raw)) return null;
  const kind = detectKind(raw);
  if (!kind) return null;

  switch (kind) {
    case 'screen1':
      return { kind, ...normaliseScreen1(raw) };
    case 'screen2':
      return { kind, ...normaliseScreen2(raw) };
    case 'screen3':
      return { kind, ...normaliseScreen3(raw) };
    case 'challenge':
      return { kind, ...normaliseChallenge(raw) };
    case 'pre_mortem':
      return { kind, ...normalisePreMortem(raw) };
    case 'doctor_alert':
      return { kind, ...normaliseDoctorAlert(raw) };
  }
}
