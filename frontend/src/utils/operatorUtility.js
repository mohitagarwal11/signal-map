export function deriveOperatorMetrics({
  operatorDistribution = [],
  areaKm2 = null,
}) {
  const operatorDistributionTotal = operatorDistribution.reduce(
    (sum, operator) => sum + Number(operator.tower_count ?? 0),
    0,
  );

  const topOperatorDistribution = operatorDistribution.slice(0, 5);
  const otherOperatorTowerCount = operatorDistribution
    .slice(5)
    .reduce((sum, operator) => sum + Number(operator.tower_count ?? 0), 0);

  const operatorDistributionRows =
    otherOperatorTowerCount > 0
      ? [
          ...topOperatorDistribution,
          { operator_name: "Others", tower_count: otherOperatorTowerCount },
        ]
      : topOperatorDistribution;

  const getShareText = (towerCount) => {
    if (operatorDistributionTotal <= 0) {
      return "0.00%";
    }

    return `${(
      (Number(towerCount ?? 0) * 100) /
      operatorDistributionTotal
    ).toFixed(2)}%`;
  };

  const operatorDistributionRowsWithShare = operatorDistributionRows.map(
    (row) => ({
      ...row,
      shareText: getShareText(row.tower_count),
    }),
  );

  const topOperator = operatorDistribution[0];
  const recommendedOperatorName = topOperator?.operator_name;
  const recommendedAvailability = getShareText(topOperator?.tower_count);
  const densityPerKm2 =
    areaKm2 && operatorDistributionTotal > 0
      ? operatorDistributionTotal / areaKm2
      : null;

  return {
    operatorDistributionTotal,
    operatorDistributionRowsWithShare,
    topOperator,
    recommendedOperatorName,
    recommendedAvailability,
    densityPerKm2,
  };
}
