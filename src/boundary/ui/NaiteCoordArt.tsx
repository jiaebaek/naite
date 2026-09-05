/**
 * 나이테 좌표 (데이터-아트) — UX 리디자인 §07-A 공유 카드.
 * 7영역 값(0~1)이 바깥 실루엣을 만들고, 안쪽으로 겹겹이 축소한 나이테 링으로 나무 단면을 그린다.
 * 아이마다 실루엣이 달라 "우리 아이만의 좌표"가 된다(리퍼럴 훅). 순수 SVG, 값→모양 결정적.
 */

export interface CoordArea {
  readonly name: string
  /** 챙김 정도 0~1 → 바깥 반지름 */
  readonly v: number
  /** 팁 마커 상태 */
  readonly s: 'done' | 'prog' | 'gap'
}

const CX = 160, CY = 150, R0 = 26, RG = 94, RINGS = 30, TWO = Math.PI * 2

/** 닫힌 점열을 부드러운 곡선 path 로 (catmull-rom → 베지어). */
function smoothClosed(pts: readonly { x: number; y: number }[]): string {
  const n = pts.length
  let d = ''
  for (let i = 0; i < n; i++) {
    const p0 = pts[(i - 1 + n) % n]!, p1 = pts[i]!, p2 = pts[(i + 1) % n]!, p3 = pts[(i + 2) % n]!
    if (i === 0) d += `M${p1.x.toFixed(1)} ${p1.y.toFixed(1)}`
    const c1x = p1.x + (p2.x - p0.x) / 6, c1y = p1.y + (p2.y - p0.y) / 6
    const c2x = p2.x - (p3.x - p1.x) / 6, c2y = p2.y - (p3.y - p1.y) / 6
    d += `C${c1x.toFixed(1)} ${c1y.toFixed(1)} ${c2x.toFixed(1)} ${c2y.toFixed(1)} ${p2.x.toFixed(1)} ${p2.y.toFixed(1)}`
  }
  return d + 'Z'
}

export function NaiteCoordArt({ areas, ageLabel }: { areas: readonly CoordArea[]; ageLabel: string }) {
  const N = areas.length
  const dir = areas.map((_, i) => {
    const a = -Math.PI / 2 + i * (TWO / N)
    return { x: Math.cos(a), y: Math.sin(a) }
  })
  const Rd = areas.map((c) => R0 + Math.max(0, Math.min(1, c.v)) * RG)

  const ringPath = (t: number, seed: number) => {
    const p = dir.map((d, i) => {
      const jit = 2.0 * Math.sin(seed * 1.27 + i * 2.11) + 1.1 * Math.cos(seed * 0.6 + i * 3.7)
      const r = t * Rd[i]! + jit
      return { x: CX + r * d.x, y: CY + r * d.y }
    })
    return smoothClosed(p)
  }

  const outer = ringPath(1, RINGS)
  const rings = Array.from({ length: RINGS - 1 }, (_, k0) => {
    const k = k0 + 1
    const t = Math.pow(k / RINGS, 1.05)
    const op = (0.10 + 0.70 * (k / RINGS)) + (k % 2 ? 0 : 0.06)
    const w = (1.0 + 0.7 * (k / RINGS)).toFixed(2)
    const col = k % 3 === 0 ? 'var(--sage)' : 'var(--pine)'
    return <path key={k} d={ringPath(t, k)} fill="none" stroke={col} strokeWidth={w} opacity={op.toFixed(2)} />
  })

  const marks = areas.flatMap((c, j) => {
    const tx = CX + Rd[j]! * dir[j]!.x, ty = CY + Rd[j]! * dir[j]!.y
    const lr = Rd[j]! + 15, lx = CX + lr * dir[j]!.x, ly = CY + lr * dir[j]!.y + 3, co = dir[j]!.x
    const anc = co > 0.34 ? 'start' : co < -0.34 ? 'end' : 'middle'
    const mark = c.s === 'done'
      ? <circle key={`m${j}`} cx={tx.toFixed(1)} cy={ty.toFixed(1)} r={5} fill="var(--sage)" stroke="var(--paper)" strokeWidth={1.8} />
      : c.s === 'prog'
        ? <circle key={`m${j}`} cx={tx.toFixed(1)} cy={ty.toFixed(1)} r={4.2} fill="var(--paper)" stroke="var(--sage)" strokeWidth={2} />
        : <circle key={`m${j}`} cx={tx.toFixed(1)} cy={ty.toFixed(1)} r={3.4} fill="none" stroke="var(--muted)" strokeWidth={1.4} strokeDasharray="2.2 2.2" />
    const label = <text key={`t${j}`} x={lx.toFixed(1)} y={ly.toFixed(1)} fontSize={9} fontWeight={700} textAnchor={anc} fill="var(--muted)">{c.name}</text>
    return [mark, label]
  })

  return (
    <svg viewBox="0 0 320 300" width="100%" role="img" aria-label="우리 아이 나이테 좌표" data-testid="coord-art">
      <defs>
        <radialGradient id="cgf" cx="50%" cy="42%" r="62%">
          <stop offset="0%" stopColor="var(--sage)" stopOpacity={0.22} />
          <stop offset="100%" stopColor="var(--pine)" stopOpacity={0.08} />
        </radialGradient>
      </defs>
      <path d={outer} fill="url(#cgf)" />
      {rings}
      <path d={outer} fill="none" stroke="var(--pine)" strokeWidth={2.2} />
      {marks}
      <circle cx={CX} cy={CY} r={14} fill="var(--paper)" />
      <text x={CX} y={CY + 4} fontSize={10.5} fontWeight={700} textAnchor="middle" fill="var(--pine)">{ageLabel}</text>
    </svg>
  )
}
