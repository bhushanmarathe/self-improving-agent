import { getImprovements } from "../eval/improvements.js";

export function buildImprovementPrompt(): string {
  const improvements = getImprovements();

  if (improvements.length === 0) {
    return "";
  }

  const rules = improvements
    .map((improvement, index) => `${index + 1}. ${improvement.rule}`)
    .join("\n");

  return `
LEARNED IMPROVEMENTS

These rules were learned from previous evaluation failures.
Apply them when relevant:

${rules}
`;
}
