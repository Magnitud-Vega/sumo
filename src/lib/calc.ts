// src/lib/calc.ts
export type SplitMode = "EVEN" | "WEIGHTED";

/**
 * Devuelve un array con los montos por persona que suman EXACTAMENTE delivery.
 * - EVEN: partes iguales
 * - WEIGHTED: proporcional al subtotal
 * Se usa “largest remainder” para ajustar centavos/guaraníes por redondeo.
 */
export function splitDelivery(
  delivery: number,
  subtotals: number[],
  mode: SplitMode
): number[] {
  const n = subtotals.length;
  if (n === 0 || delivery <= 0) return subtotals.map(() => 0);

  if (mode === "EVEN") {
    const base = Math.floor(delivery / n);
    let remainder = delivery - base * n;
    const shares = Array(n).fill(base);
    // reparte el sobrante a los primeros “remainder”
    for (let i = 0; i < remainder; i++) shares[i] += 1;
    return shares;
  }

  const sum = subtotals.reduce((a, b) => a + b, 0);
  if (sum <= 0) {
    // si todos 0, caemos en EVEN
    return splitDelivery(delivery, subtotals, "EVEN");
  }

  // cuotas ideales y enteros por piso
  const raw = subtotals.map((s) => (delivery * s) / sum);
  const floor = raw.map(Math.floor);
  const partial = floor.reduce((a, b) => a + b, 0);
  let remainder = delivery - partial;

  // ordenar por mayor parte fraccionaria para asignar el remanente
  const frac = raw.map((v, i) => ({ i, frac: v - Math.floor(v) }));
  frac.sort((a, b) => b.frac - a.frac);

  const shares = [...floor];
  for (let k = 0; k < remainder; k++) shares[frac[k].i] += 1;
  return shares;
}
