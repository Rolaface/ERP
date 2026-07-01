const RESERVED_WORDS = new Set([
  "if", "else", "elif", "and", "or", "not", "in", "is", "None", "True", "False",
  "min", "max", "abs", "round", "int", "float", "str", "len",
  "base", "base_salary", "gross_pay", "basic_pay", "total_days", "payment_days",
  "working_days", "absent_days", "leave_without_pay", "ctc",
]);

export function extractFormulaAbbreviations(formula: string): string[] {
  if (!formula) return [];
  const cleaned = formula.replace(/(["'`]).*?\1/g, " "); 
  const tokens = cleaned.match(/[A-Za-z_][A-Za-z0-9_]*/g) || [];
  const seen = new Set<string>();
  const result: string[] = [];
  for (const t of tokens) {
    if (RESERVED_WORDS.has(t) || seen.has(t)) continue;
    seen.add(t);
    result.push(t);
  }
  return result;
}