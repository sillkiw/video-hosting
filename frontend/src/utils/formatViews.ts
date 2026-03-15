export function formatViews(n: number) {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M просмотров`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K просмотров`;
  return `${n} просмотров`;
}