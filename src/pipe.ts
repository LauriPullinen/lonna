export function pipe<A, B>(a: A, a2b: (a: A) => B): B
export function pipe<A, B, C>(a: A, a2b: (a: A) => B, b2c: (b: B) => C): C
export function pipe<A, B, C, D>(
  a: A,
  a2b: (a: A) => B,
  b2c: (b: B) => C,
  c2d: (c: C) => D
): D
export function pipe<A, B, C, D, E>(
  a: A,
  a2b: (a: A) => B,
  b2c: (b: B) => C,
  c2d: (c: C) => D,
  d2e: (d: D) => E
): E
export function pipe<A, B, C, D, E, F>(
  a: A,
  a2b: (a: A) => B,
  b2c: (b: B) => C,
  c2d: (c: C) => D,
  d2e: (d: D) => E,
  e2f: (e: E) => F
): F
export function pipe<A, B, C, D, E, F, G>(
  a: A,
  a2b: (a: A) => B,
  b2c: (b: B) => C,
  c2d: (c: C) => D,
  d2e: (d: D) => E,
  e2f: (e: E) => F,
  f2g: (f: F) => G
): G
export function pipe<A, B, C, D, E, F, G, H>(
  a: A,
  a2b: (a: A) => B,
  b2c: (b: B) => C,
  c2d: (c: C) => D,
  d2e: (d: D) => E,
  e2f: (e: E) => F,
  f2g: (f: F) => G,
  g2h: (g: G) => H
): H
export function pipe<A, B, C, D, E, F, G, H, I>(
  a: A,
  a2b: (a: A) => B,
  b2c: (b: B) => C,
  c2d: (c: C) => D,
  d2e: (d: D) => E,
  e2f: (e: E) => F,
  f2g: (f: F) => G,
  g2h: (g: G) => H,
  h2i: (h: H) => I
): I
export function pipe<A, B, C, D, E, F, G, H, I, J>(
  a: A,
  a2b: (a: A) => B,
  b2c: (b: B) => C,
  c2d: (c: C) => D,
  d2e: (d: D) => E,
  e2f: (e: E) => F,
  f2g: (f: F) => G,
  g2h: (g: G) => H,
  h2i: (h: H) => I,
  i2j: (i: I) => J
): J
export function pipe<A, B, C, D, E, F, G, H, I, J, K>(
  a: A,
  a2b: (a: A) => B,
  b2c: (b: B) => C,
  c2d: (c: C) => D,
  d2e: (d: D) => E,
  e2f: (e: E) => F,
  f2g: (f: F) => G,
  g2h: (g: G) => H,
  h2i: (h: H) => I,
  i2j: (i: I) => J,
  j2k: (j: J) => K
): K
export function pipe(x: any, ...fns: any[]): any {
  for (let i = 0, n = fns.length; i < n; i++) {
    x = fns[i](x)
  }
  return x
}
