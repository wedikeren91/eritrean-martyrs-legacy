type PersonNameLike = {
  id: string;
  first_name: string;
  last_name: string;
};

export type DuplicateInsight = {
  exactMatches: string[];
  similarMatches: string[];
};

function normalizeName(value: string) {
  return value
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

function compactName(value: string) {
  return normalizeName(value).replace(/\s+/g, "");
}

function tokenizeName(value: string) {
  return normalizeName(value).split(/\s+/).filter(Boolean);
}

function buildBigrams(value: string) {
  const parts = new Set<string>();

  if (value.length < 2) {
    if (value) parts.add(value);
    return parts;
  }

  for (let index = 0; index < value.length - 1; index += 1) {
    parts.add(value.slice(index, index + 2));
  }

  return parts;
}

function diceSimilarity(left: string, right: string) {
  if (!left || !right) return 0;
  if (left === right) return 1;

  const leftBigrams = buildBigrams(left);
  const rightBigrams = buildBigrams(right);
  let overlap = 0;

  leftBigrams.forEach((part) => {
    if (rightBigrams.has(part)) overlap += 1;
  });

  return (2 * overlap) / (leftBigrams.size + rightBigrams.size);
}

function looksSimilar(
  left: { compact: string; tokens: Set<string>; lastToken: string },
  right: { compact: string; tokens: Set<string>; lastToken: string }
) {
  const sharedTokens = [...left.tokens].filter((token) => right.tokens.has(token)).length;
  const tokenCoverage = sharedTokens / Math.max(left.tokens.size, right.tokens.size, 1);
  const compactSimilarity = diceSimilarity(left.compact, right.compact);
  const sameLastToken = left.lastToken && left.lastToken === right.lastToken;

  return (
    (sharedTokens >= 2 && tokenCoverage >= 0.66) ||
    (sameLastToken && compactSimilarity >= 0.72) ||
    compactSimilarity >= 0.85
  );
}

export function buildPersonDuplicateMap<T extends PersonNameLike>(records: T[]) {
  const insights = Object.fromEntries(
    records.map((record) => [record.id, { exactMatches: [], similarMatches: [] } satisfies DuplicateInsight])
  ) as Record<string, DuplicateInsight>;

  const prepared = records.map((record) => {
    const fullName = normalizeName(`${record.first_name} ${record.last_name}`);
    const tokens = tokenizeName(`${record.first_name} ${record.last_name}`);

    return {
      id: record.id,
      fullName,
      compact: compactName(`${record.first_name} ${record.last_name}`),
      tokens: new Set(tokens),
      lastToken: tokens.at(-1) ?? "",
    };
  });

  const exactGroups = new Map<string, string[]>();
  prepared.forEach((record) => {
    if (!record.fullName) return;
    exactGroups.set(record.fullName, [...(exactGroups.get(record.fullName) ?? []), record.id]);
  });

  exactGroups.forEach((ids) => {
    if (ids.length < 2) return;

    ids.forEach((id) => {
      insights[id].exactMatches = ids.filter((matchId) => matchId !== id);
    });
  });

  const tokenIndex = new Map<string, number[]>();
  prepared.forEach((record, index) => {
    record.tokens.forEach((token) => {
      if (token.length < 3) return;
      tokenIndex.set(token, [...(tokenIndex.get(token) ?? []), index]);
    });
  });

  prepared.forEach((record, index) => {
    const candidateIndexes = new Set<number>();

    record.tokens.forEach((token) => {
      if (token.length < 3) return;
      tokenIndex.get(token)?.forEach((candidateIndex) => {
        if (candidateIndex !== index) candidateIndexes.add(candidateIndex);
      });
    });

    candidateIndexes.forEach((candidateIndex) => {
      if (candidateIndex <= index) return;

      const candidate = prepared[candidateIndex];
      if (record.fullName === candidate.fullName) return;
      if (!looksSimilar(record, candidate)) return;

      insights[record.id].similarMatches.push(candidate.id);
      insights[candidate.id].similarMatches.push(record.id);
    });
  });

  return insights;
}