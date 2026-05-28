export function deriveNetworkMetrics({ networkDistribution = [] }) {
  const networkDistributionRows = networkDistribution.slice(0, 5);

  return {
    networkDistributionRows,
  };
}
