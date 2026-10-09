import assert from "node:assert/strict";
import { test } from "node:test";
import { normalizeAnalysis, SCORE_CALLS } from "@powerhot/backend/editorial/analyze";
import { selectionMetrics, selectionThresholdMetrics, type SelectionMetricCase } from "../scripts/eval-selection-core.ts";

test("selection metrics keep valid-output quality separate from decisive coverage", () => {
  const cases: SelectionMetricCase[] = [
    { gold: "select", decision: "select" },
    { gold: "select", decision: "select" },
    { gold: "select", decision: "select" },
    { gold: "reject", decision: "reject" },
    { gold: "reject", decision: "reject" },
    { gold: "reject", decision: "select" },
    { gold: "select", decision: null },
    { gold: "reject", decision: null },
    { gold: "either", decision: "select" },
    { gold: "either", decision: null },
  ];

  assert.deepEqual(selectionMetrics(cases), {
    n: 10,
    decisiveGold: 8,
    decisive: 6,
    either: 2,
    errors: 3,
    decisiveErrors: 2,
    eitherErrors: 1,
    tp: 3,
    fp: 1,
    fn: 0,
    tn: 2,
    coverage: 0.75,
    accuracy: 0.833,
    completeAccuracy: 0.625,
    precision: 0.75,
    recall: 1,
    f1: 0.857,
    selectedRate: 0.667,
    goldSelectRate: 0.5,
  });
});

test("a case scoring over the tier threshold can still be a selection without any written copy", () => {
  // This evaluation runs the prefilter and the two scores only. normalizeAnalysis waits for a written
  // title and summary before it calls anything "pass", so its own `selected` is false for every case
  // here; the sweep must read the scores instead, or no threshold can ever select anything.
  const analysed = normalizeAnalysis({
    prefilter: { label: "PASS", reason: "电力政策", model: "m", receiptId: 1, reused: false } as never,
    scores: { values: [94, 88], threshold: 60, model: "m", receiptId: 2, reused: false, refused: false } as never,
    writing: null,
    structure: null,
  });
  assert.equal(analysed.score, 91);
  assert.equal(analysed.relevance, "unknown");
  assert.equal(analysed.selected, false);

  const sum = analysed.scores!.reduce((total, v) => total + v, 0);
  assert.equal(sum >= 60 * SCORE_CALLS, true);
  const sweep = selectionThresholdMetrics([
    { gold: "select", available: true, relevance: "pass", score: analysed.score },
  ], 60);
  assert.equal(sweep.sel, 1);
});

test("either cases do not lower decisive coverage or complete accuracy", () => {
  const metrics = selectionMetrics([
    { gold: "select", decision: "select" },
    { gold: "reject", decision: "reject" },
    { gold: "either", decision: null },
    { gold: "either", decision: null },
  ]);
  assert.equal(metrics.coverage, 1);
  assert.equal(metrics.accuracy, 1);
  assert.equal(metrics.completeAccuracy, 1);
  assert.equal(metrics.errors, 2);
  assert.equal(metrics.decisiveErrors, 0);
  assert.equal(metrics.eitherErrors, 2);
});

test("threshold sweep uses the same decisive failure denominator", () => {
  const metrics = selectionThresholdMetrics([
    { gold: "select", available: true, relevance: "pass", score: 80 },
    { gold: "select", available: false, relevance: null, score: null },
    { gold: "reject", available: true, relevance: "pass", score: 70 },
    { gold: "reject", available: true, relevance: "pass", score: 30 },
    { gold: "either", available: false, relevance: null, score: null },
  ], 60);

  assert.deepEqual(metrics, {
    t: 60,
    acc: 0.667,
    completeAcc: 0.5,
    coverage: 0.75,
    P: 0.5,
    R: 1,
    F1: 0.667,
    sel: 0.667,
    decisive: 3,
    decisiveGold: 4,
    decisiveErrors: 1,
  });
});
