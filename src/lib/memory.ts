import { parseJsonWithRepairs } from "./validate";

export type StructuredMemory = {
  facts: string[];
  goals: string[];
  preferences: string[];
  stories: string[];
};

export const EMPTY_MEMORY: StructuredMemory = {
  facts: [],
  goals: [],
  preferences: [],
  stories: []
};

function isStringArray(value: unknown): value is string[] {
  return Array.isArray(value) && value.every((item) => typeof item === "string");
}

export function isStructuredMemory(value: unknown): value is StructuredMemory {
  if (!value || typeof value !== "object" || Array.isArray(value)) return false;
  const obj = value as Record<string, unknown>;
  return (
    isStringArray(obj.facts) &&
    isStringArray(obj.goals) &&
    isStringArray(obj.preferences) &&
    isStringArray(obj.stories)
  );
}

export function cloneMemory(memory: StructuredMemory): StructuredMemory {
  return {
    facts: [...memory.facts],
    goals: [...memory.goals],
    preferences: [...memory.preferences],
    stories: [...memory.stories]
  };
}

export function memoryIsEmpty(memory: StructuredMemory): boolean {
  return (
    memory.facts.length === 0 &&
    memory.goals.length === 0 &&
    memory.preferences.length === 0 &&
    memory.stories.length === 0
  );
}

export function parseAndValidateMemory(raw: string):
  | { ok: true; data: StructuredMemory }
  | { ok: false; error: string } {
  const parsed = parseJsonWithRepairs(raw);
  if (!parsed.ok) {
    return { ok: false, error: parsed.error };
  }

  if (!isStructuredMemory(parsed.parsed)) {
    return {
      ok: false,
      error:
        "Memory JSON must contain arrays for facts, goals, preferences, and stories."
    };
  }

  return { ok: true, data: parsed.parsed };
}

export function serializeMemoryForPrompt(memory: StructuredMemory): string {
  return JSON.stringify(memory, null, 2);
}
