/**
 * 활동유형 프리셋 무결성 + 부풀리기 가드레일 (T2 · SSOT §5).
 * 큐레이션 원본: docs/10-프리셋-활동목표-큐레이션.md.
 */
import { describe, it, expect } from 'vitest'
import { ACTIVITY_PRESETS, presetGuardrailViolations } from '../../src/domain/standards/activityPresets'
import type { ActivityPreset } from '../../src/domain/standards/activityPresets'
import { STANDARDS_2021 } from '../../src/domain/standards/child2021'
import type { Standard } from '../../src/domain/types'

const byId = new Map(STANDARDS_2021.map((s) => [s.id, s]))

describe('프리셋 데이터 무결성', () => {
  it('type 이 중복되지 않는다', () => {
    const types = ACTIVITY_PRESETS.map((p) => p.type)
    expect(new Set(types).size).toBe(types.length)
  })

  it('primary·secondary 의 nuri-* 목표는 모두 존재하고 영역이 맞는다', () => {
    for (const p of ACTIVITY_PRESETS) {
      for (const id of [...p.primary, ...(p.secondary ?? [])]) {
        const s = byId.get(id)
        expect(s, `${p.type} → 없는 목표 ${id}`).toBeDefined()
      }
      // primary 는 반드시 주 영역 소속(정의상)
      for (const id of p.primary) {
        expect(byId.get(id)!.domain, `${p.type} → ${id}`).toBe(p.domain)
      }
    }
  })

  it('⭐ 영어는 공교육 매핑 0 — 자체목표로만 연결(가짜 근거 금지)', () => {
    const en = ACTIVITY_PRESETS.find((p) => p.type === '영어')!
    expect(en.primary).toEqual([])
    expect(en.domain).toBe('영어')
  })
})

describe('⭐ 부풀리기 가드레일 — 주 매핑은 1영역·목표 ≤2 (SSOT §5)', () => {
  it('모든 프리셋이 가드레일을 통과한다', () => {
    for (const p of ACTIVITY_PRESETS) {
      expect(presetGuardrailViolations(p, STANDARDS_2021), `${p.type}`).toEqual([])
    }
  })

  it('태권도 = 예체능 1영역 2목표(phy-3,4). 인성·규칙은 부수(opt-in)', () => {
    const t = ACTIVITY_PRESETS.find((p) => p.type === '태권도')!
    expect(t.primary).toEqual(['nuri-phy-3', 'nuri-phy-4'])
    expect(t.secondary).toContain('nuri-soc-9') // 규칙 = 부수
  })

  it('⭐ 3목표면 가드레일이 실패로 잡는다', () => {
    const bad: ActivityPreset = { type: 'X', domain: '예체능', primary: ['nuri-phy-3', 'nuri-phy-4', 'nuri-art-6'] }
    expect(presetGuardrailViolations(bad, STANDARDS_2021).length).toBeGreaterThan(0)
  })

  it('⭐ 2영역에 걸치면 가드레일이 실패로 잡는다', () => {
    const bad: ActivityPreset = { type: 'X', domain: '예체능', primary: ['nuri-phy-3', 'nuri-com-1'] }
    const v = presetGuardrailViolations(bad, STANDARDS_2021)
    expect(v.some((m) => m.includes('영역'))).toBe(true)
  })

  it('없는 목표를 가리키면 잡는다', () => {
    const bad: ActivityPreset = { type: 'X', domain: '국어', primary: ['nuri-없음'] }
    expect(presetGuardrailViolations(bad, STANDARDS_2021).length).toBeGreaterThan(0)
  })
})

describe('⭐ INV — 매핑은 "챙기는 중"만 만든다. "이룸"은 만들지 않는다 (SSOT §2, 2축)', () => {
  // 프리셋/활동 매핑은 이룸을 낳을 수 없다. 이룸은 언제나 부모의 별도 관찰(achieved).
  const 예체능목표: Standard = {
    id: 'nuri-phy-3', domain: '예체능', baselinePeriod: { start: '2024-03', end: '2028-02' },
    statement: '기초 운동', source: { document: '누리' }, origin: '공교육',
  }

  it('아무리 많은 활동이 겨냥해도 achieved 가 없으면 절대 됨이 아니다', async () => {
    const { publicGoalStatusOf } = await import('../../src/domain/coverage')
    const acts = ['a', 'b', 'c'].map((id) => ({
      id, name: id, domain: '예체능' as const, track: '학원' as const,
      targetIds: ['nuri-phy-3'], cadence: { kind: '매일' as const }, owner: '엄마' as const, active: true,
    }))
    const status = publicGoalStatusOf('nuri-phy-3', [], acts, [예체능목표])
    expect(status).toBe('챙기는중')
    expect(status).not.toBe('됨')
  })

  it('이룸은 부모가 achieved 로 표시할 때만', async () => {
    const { publicGoalStatusOf } = await import('../../src/domain/coverage')
    expect(publicGoalStatusOf('nuri-phy-3', ['nuri-phy-3'], [], [예체능목표])).toBe('됨')
  })
})
