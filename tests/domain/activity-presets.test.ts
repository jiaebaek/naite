/**
 * 활동유형 → 묶음 프리셋 무결성 + 부풀리기 가드레일 (T7 · SSOT §5 · docs/11 §4).
 */
import { describe, it, expect } from 'vitest'
import {
  ACTIVITY_PRESETS,
  presetByType,
  suggestedTargets,
  presetGuardrailViolations,
} from '../../src/domain/standards/activityPresets'
import type { ActivityPreset } from '../../src/domain/standards/activityPresets'
import { CLUSTERS } from '../../src/domain/standards/clusters'

const clById = new Map(CLUSTERS.map((c) => [c.id, c]))

describe('프리셋 데이터 무결성 (묶음)', () => {
  it('type 이 중복되지 않는다', () => {
    const types = ACTIVITY_PRESETS.map((p) => p.type)
    expect(new Set(types).size).toBe(types.length)
  })

  it('primary·primaryElem 의 묶음 id 는 모두 존재하고 영역이 preset.domain 과 맞는다', () => {
    for (const p of ACTIVITY_PRESETS) {
      for (const id of [...p.primary, ...(p.primaryElem ?? [])]) {
        const c = clById.get(id)
        expect(c, `${p.type} → 없는 묶음 ${id}`).toBeDefined()
        expect(c!.domain, `${p.type} → ${id}`).toBe(p.domain)
      }
    }
  })

  it('⭐ 영어는 공교육 매핑 0 (두 band 모두) — 자체목표로만 연결', () => {
    const en = ACTIVITY_PRESETS.find((p) => p.type === '영어')!
    expect(en.primary).toEqual([])
    expect(en.primaryElem ?? []).toEqual([])
    expect(en.domain).toBe('영어')
  })

  it('모든 프리셋이 why(매핑 이유) 한 줄을 가진다', () => {
    for (const p of ACTIVITY_PRESETS) {
      expect(p.why.trim().length, `${p.type}`).toBeGreaterThan(0)
    }
  })
})

describe('⭐ 부풀리기 가드레일 — 각 band 자동제안 ≤2묶음·1영역 (SSOT §5)', () => {
  it('모든 프리셋이 가드레일을 통과한다', () => {
    for (const p of ACTIVITY_PRESETS) {
      expect(presetGuardrailViolations(p), `${p.type}`).toEqual([])
    }
  })

  it('태권도 = 예체능 신체활동 묶음 (nuri=pe-body / elem=pe-body)', () => {
    const t = ACTIVITY_PRESETS.find((p) => p.type === '태권도')!
    expect(t.primary).toEqual(['cl-nuri-pe-body'])
    expect(t.primaryElem).toEqual(['cl-el-pe-body'])
  })

  it('⭐ 3묶음이면 가드레일이 실패로 잡는다', () => {
    const bad: ActivityPreset = { type: 'X', domain: '국어', why: 'x', primary: ['cl-nuri-ko-listen', 'cl-nuri-ko-literacy', 'cl-nuri-ko-book'] }
    expect(presetGuardrailViolations(bad).length).toBeGreaterThan(0)
  })

  it('⭐ 2영역에 걸치면 가드레일이 실패로 잡는다', () => {
    const bad: ActivityPreset = { type: 'X', domain: '국어', why: 'x', primary: ['cl-nuri-ko-listen', 'cl-nuri-ma-explore'] }
    expect(presetGuardrailViolations(bad).some((m) => m.includes('영역'))).toBe(true)
  })

  it('없는 묶음을 가리키면 잡는다', () => {
    const bad: ActivityPreset = { type: 'X', domain: '국어', why: 'x', primary: ['cl-없음'] }
    expect(presetGuardrailViolations(bad).length).toBeGreaterThan(0)
  })

  it('⭐ primaryElem(초1~2 band)도 각 band별로 3묶음이면 잡는다', () => {
    const bad: ActivityPreset = { type: 'X', domain: '수학', why: 'x', primary: [], primaryElem: ['cl-el-ma-num', 'cl-el-ma-pattern', 'cl-el-ma-shape'] }
    expect(presetGuardrailViolations(bad).some((m) => m.includes('primaryElem'))).toBe(true)
  })
})

describe('⭐ suggestedTargets — 현재 band 묶음만 제안 (원칙3)', () => {
  it('취학 전 band 집합이면 primary(nuri) 묶음만', () => {
    const 한글 = presetByType('한글')!
    const nuriIds = new Set(CLUSTERS.filter((c) => c.band === 'nuri').map((c) => c.id))
    expect(suggestedTargets(한글, nuriIds)).toEqual(['cl-nuri-ko-literacy'])
  })

  it('초1~2 band 집합이면 primaryElem(elem) 묶음만', () => {
    const 한글 = presetByType('한글')!
    const elemIds = new Set(CLUSTERS.filter((c) => c.band === 'elem').map((c) => c.id))
    expect(suggestedTargets(한글, elemIds)).toEqual(['cl-el-ko-hangul', 'cl-el-ko-read'])
  })

  it('band 매칭이 없으면 빈 배열 (억지 매핑 금지)', () => {
    const 연산 = presetByType('연산')! // primaryElem 만 있음
    const nuriIds = new Set(CLUSTERS.filter((c) => c.band === 'nuri').map((c) => c.id))
    expect(suggestedTargets(연산, nuriIds)).toEqual([])
  })
})

describe('⭐ INV — 매핑은 "챙기는 중"만 만든다. "이룸"은 만들지 않는다 (SSOT §2, 2축)', () => {
  const 예체능묶음 = {
    id: 'cl-nuri-pe-body', domain: '예체능' as const, baselinePeriod: { start: '2024-03', end: '2028-02' },
    statement: '신체활동', source: { document: '누리', code: 'cl-nuri-pe-body' }, origin: '공교육' as const,
  }

  it('아무리 많은 활동이 겨냥해도 achieved 가 없으면 절대 됨이 아니다', async () => {
    const { publicGoalStatusOf } = await import('../../src/domain/coverage')
    const acts = ['a', 'b', 'c'].map((id) => ({
      id, name: id, domain: '예체능' as const, track: '학원' as const,
      targetIds: ['cl-nuri-pe-body'], cadence: { kind: '매일' as const }, owner: '엄마' as const, active: true,
    }))
    const status = publicGoalStatusOf('cl-nuri-pe-body', [], acts, [예체능묶음])
    expect(status).toBe('챙기는중')
    expect(status).not.toBe('됨')
  })

  it('이룸은 부모가 achieved 로 표시할 때만', async () => {
    const { publicGoalStatusOf } = await import('../../src/domain/coverage')
    expect(publicGoalStatusOf('cl-nuri-pe-body', ['cl-nuri-pe-body'], [], [예체능묶음])).toBe('됨')
  })
})
