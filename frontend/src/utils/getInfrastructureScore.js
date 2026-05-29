const RADIO_WEIGHTS = {
  NR: 1.0,
  LTE: 0.8,
  UMTS: 0.55,
  CDMA: 0.4,
  GSM: 0.3,
};

export function getInfrastructureScore(
  total_towers,
  networks,
  operators,
) {
  if (total_towers === 0) return 0.0;

  // 1. Tech score (50) — weighted average radio quality
  const weighted_sum = networks.reduce(
    (sum, { radio, tower_count }) =>
      sum + tower_count * (RADIO_WEIGHTS[radio] ?? 0),
    0,
  );
  const tech_score = Math.min(weighted_sum / total_towers / 0.9, 1.0) * 50;

  // 2. Operator diversity (25) — capped at 5
  const operator_score = Math.min(operators.length / 5, 1.0) * 25;

  // 3. Coverage (25) — capped at 200k towers
  const coverage_score = Math.min(total_towers / 200000, 1.0) * 25;

  const raw = tech_score + operator_score + coverage_score;
  return Math.round(Math.max(0, Math.min(100, raw)) * 100) / 100;
}
