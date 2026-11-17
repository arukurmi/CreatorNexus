export function formatINR(n: number): string {
  return `₹${Math.round(n).toLocaleString('en-IN')}`
}
