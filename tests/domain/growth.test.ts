/**
 * 성장 좌표 (SSOT §5-B) — 큐레이션 데이터 무결성 + 결정적 계산 + 가드레일.
 * 데이터 원본 = docs/14(과학탐구)·15(취학전 전영역). 임의 자작 금지 → 참조 무결성으로 못박음.
 */
import { describe, it, expect } from 'vitest'
import { GROWTH_POINTS, growthPointByCluster, growthPointsForClusters } from '../../src/domain/standards/growthPoints'
import { growthStateOf, nextExperienceOf, areaGrowthProfile, signalsFor } from '../../src/domain/growth'
import { STANDARDS_2021 } from '../../src/domain/standards/child2021'
import { CLUSTERS, clusterById } from '../../src/domain/standards/clusters'
import { ACTIVITY_LIBRARY } from '../../src/domain/standards/activityLibrary'

const STD_IDS = new Set(STANDARDS_2021.map((s) => s.id))
const ACT_IDS = new Set(ACTIVITY_LIBRARY.map((a) => a.id))
const NURI_CLUSTERS = CLUSTERS.filter((c) => c.band === 'nuri')

describe('데이터 무결성 (docs/14·15 그대로 인코딩)', () => {
  it('취학전 14묶음마다 GrowthPoint 가 정확히 하나씩', () => {
    expect(GROWTH_POINTS).toHaveLength(14)
    for (const c of NURI_CLUSTERS) {
      const gps = GROWTH_POINTS.filter((g) => g.clusterId === c.id)
      expect(gps, c.id).toHaveLength(1)
    }
  })

  it('GrowthPoint.clusterId 는 실재하는 취학전 묶음', () => {
    for (const g of GROWTH_POINTS) {
      const cl = clusterById(g.clusterId)
      expect(cl, g.id).toBeDefined()
      expect(cl!.band).toBe('nuri')
      expect(g.domain).toBe(cl!.domain)
    }
  })

  it('모든 sourceRef(근거)가 실재하는 성취기준 원문 id', () => {
    for (const g of GROWTH_POINTS) {
      for (const ref of g.sourceRefs) expect(STD_IDS.has(ref), `${g.id}:${ref}`).toBe(true)
      for (const b of g.behaviors) expect(STD_IDS.has(b.sourceRef), `${g.id}#${b.order}:${b.sourceRef}`).toBe(true)
    }
  })

  it('다음 경험의 연결 활동(activityId)이 실재하는 큐레이션 활동', () => {
    for (const g of GROWTH_POINTS) {
      for (const n of g.nextExperiences) {
        if (n.activityId) expect(ACT_IDS.has(n.activityId), `${g.id}:${n.activityId}`).toBe(true)
      }
    }
  })

  it('behavior order 는 1..n 로 연속·유일', () => {
    for (const g of GROWTH_POINTS) {
      const orders = g.behaviors.map((b) => b.order)
      expect(orders, g.id).toEqual([...Array(orders.length)].map((_, i) => i + 1))
    }
  })
})

describe('가드레일 — 부모 노출 서술에 숫자/등급/비교 없음 (§5-B)', () => {
  const 금지 = ['또래', '정상', '지연', '등급', '점수', 'level', '단계', '평균', '상위', '백분위']
  it('모든 order 의 parentLabel 에 숫자·금지어 없음', () => {
    for (const g of GROWTH_POINTS) {
      for (let o = 0; o <= g.behaviors.length; o++) {
        const label = growthStateOf(g, { observedOrders: [o] }).parentLabel
        expect(label, `${g.id}@${o}`).not.toMatch(/[0-9]/)
        for (const w of 금지) expect(label.toLowerCase()).not.toContain(w.toLowerCase())
      }
    }
  })
})

describe('좌표 계산 (결정적)', () => {
  const gp = GROWTH_POINTS.find((g) => g.id === 'sci-inquiry')!

  it('근거 없음 → observedOrder 0 · "아직 덜 보여요"(다음 경험) · 강점 아님', () => {
    const s = growthStateOf(gp, {})
    expect(s.observedOrder).toBe(0)
    expect(s.parentLabel).toContain('아직 덜 보여요')
    expect(s.isStrength).toBe(false)
  })

  it('부모 관찰 켜진 최고 order 를 좌표로 · 보이면 강점(🟢)', () => {
    const s = growthStateOf(gp, { observedOrders: [1, 3, 2] })
    expect(s.observedOrder).toBe(3)
    expect(s.parentLabel).toBe('궁금하면 직접 알아보는 모습이 보여요')
    expect(s.isStrength).toBe(true)
  })

  it('활동/등원 커버 = 최소 관심(order 1) 근거', () => {
    expect(growthStateOf(gp, { covered: true }).observedOrder).toBe(1)
  })

  it('이룸(achieved) = 상단(최고 order) 근거', () => {
    expect(growthStateOf(gp, { achieved: true }).observedOrder).toBe(gp.behaviors.length)
  })

  it('범위를 넘는 order 는 maxOrder 로 clamp', () => {
    expect(growthStateOf(gp, { observedOrders: [99] }).observedOrder).toBe(gp.behaviors.length)
  })
})

describe('다음 경험', () => {
  const gp = GROWTH_POINTS.find((g) => g.id === 'sci-inquiry')!
  it('낮은 좌표 → 초대 활동 제안', () => {
    expect(nextExperienceOf(gp, 0)?.activityId).toBe('act-sci-1')
    expect(nextExperienceOf(gp, 2)?.activityId).toBe('act-sci-4')
  })
  it('상단 좌표 → "급하지 않아요"(제안 없음)', () => {
    const n = nextExperienceOf(gp, 5)
    expect(n?.activityId).toBeUndefined()
    expect(n?.parentText).toContain('급하지 않아요')
  })
})

describe('영역 프로필 — 강점(🟢) 먼저', () => {
  const nuriIds = new Set(NURI_CLUSTERS.map((c) => c.id))
  it('과학·탐구 3좌표 중 보이는 곳이 먼저 온다', () => {
    // sci-nature 관찰 있음(강점), 나머지 없음 → nature 가 맨 앞
    const profile = areaGrowthProfile('과학·탐구', nuriIds, {
      coveredClusterIds: new Set(),
      achievedClusterIds: new Set(),
      observedOrdersByGp: { 'sci-nature': [3] },
    })
    expect(profile).toHaveLength(3)
    expect(profile[0]!.growthPointId).toBe('sci-nature')
    expect(profile[0]!.isStrength).toBe(true)
    expect(profile.slice(1).every((s) => !s.isStrength)).toBe(true)
  })

  it('초1~2(elem) band 는 아직 미큐레이션 → 빈 프로필', () => {
    const elemIds = new Set(CLUSTERS.filter((c) => c.band === 'elem').map((c) => c.id))
    expect(growthPointsForClusters(elemIds)).toHaveLength(0)
  })
})

describe('기존 데이터 연결', () => {
  it('묶음 커버/이룸이 좌표 신호로 이어진다(signalsFor)', () => {
    const gp = growthPointByCluster('cl-nuri-ko-book')!
    const s = signalsFor(gp, {
      coveredClusterIds: new Set(['cl-nuri-ko-book']),
      achievedClusterIds: new Set(),
    })
    expect(s.covered).toBe(true)
    expect(s.achieved).toBe(false)
  })
})
