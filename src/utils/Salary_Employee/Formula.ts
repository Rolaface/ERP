import type { CalcContext } from "../../types/Salary_Employee/salaryTypes";
import { isValidIdentifier } from "./salary_Utils";

// ─── Python → JS Transpiler ───────────────────────────────────────────────────

// Converts ERPNext-style Python formula syntax to valid JavaScript.
// Handles: ternary (`x if cond else y`), `and`, `or`, `not`.
// To support new Python syntax, add a replacement here.
function pythonToJS(formula: string): string {
  let result = formula;

  const ternaryRe = /(.+?)\s+if\s+(.+?)\s+else\s+(.+)/;
  for (let i = 0; i < 20; i++) {
    const next = result.replace(ternaryRe, "($2 ? $1 : $3)");
    if (next === result) break;
    result = next;
  }

  return result
    .replace(/\band\b/g,    "&&")
    .replace(/\bor\b/g,     "||")
    .replace(/\bnot\b/g,    "!")
    .replace(/\bmin\s*\(/g, "Math.min(")
    .replace(/\bmax\s*\(/g, "Math.max(")
    .replace(/\bint\s*\(/g,   "Math.trunc(")
    .replace(/\babs\s*\(/g, "Math.abs(")
    .replace(/\bTrue\b/g,   "true")
    .replace(/\bFalse\b/g,  "false");
}

// ─── Formula Helpers ──────────────────────────────────────────────────────────

// These are injected as named parameters into every formula evaluation.
// Add new helpers here if ERPNext formulas use additional built-in functions.
const FORMULA_HELPERS = {
  IF:  (cond: unknown, a: number, b: number): number => (cond ? a : b),
  AND: (...args: unknown[]): number => (args.every(Boolean) ? 1 : 0),
  OR:  (...args: unknown[]): number => (args.some(Boolean)  ? 1 : 0),
} as const;

// ─── Case-Insensitive Formula Normalizer ──────────────────────────────────────

// Rewrites every identifier in a formula to match the actual key stored in ctx,
// using a case-insensitive lookup. This means formula authors can freely write
// BASIC, Basic, basic, or bAsIc — all will resolve to the same ctx entry.
//
// Only identifiers that exist in ctx (case-insensitively) are rewritten.
// Literals, operators, and unknown tokens are left untouched.
function normalizeCaseInFormula(formula: string, ctx: CalcContext): string {
  const lowerMap: Record<string, string> = {};
  for (const key of Object.keys(ctx)) {
    lowerMap[key.toLowerCase()] = key;
  }

  return formula.replace(/\b[a-zA-Z_$][a-zA-Z0-9_$]*\b/g, (token) =>
    lowerMap[token.toLowerCase()] ?? token,
  );
}

// ─── Public API ───────────────────────────────────────────────────────────────

export function evaluateFormula(formula: string, ctx: CalcContext): number {
  if (!formula?.trim()) return 0;
  try {
    // Step 1: convert Python syntax → JS syntax
    // Step 2: normalize all identifiers to match ctx keys (case-insensitive)
    const normalized = normalizeCaseInFormula(pythonToJS(formula), ctx);

    const merged: Record<string, unknown> = { ...FORMULA_HELPERS, ...ctx };

    const safeKeys:   string[]  = [];
    const safeValues: unknown[] = [];

    for (const [k, v] of Object.entries(merged)) {
      if (isValidIdentifier(k)) {
        safeKeys.push(k);
        safeValues.push(v);
      }
    }

    // eslint-disable-next-line no-new-func
    const fn = new Function(...safeKeys, `"use strict"; return +(${normalized});`);

    const n = Number(fn(...safeValues));
    return isFinite(n) ? n : 0;
  } catch {
    return 0;
  }
}