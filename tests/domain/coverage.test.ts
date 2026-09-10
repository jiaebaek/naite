/**
 * 커버리지 (F3 · P-6). docs/07-계약.md §3
 *   "모든 영역에서 다 하고 있는지 확인하고 싶어서" — 이 앱을 만드는 이유.
 *
 * ⭐ 챙김은 **활동이 명시적으로 겨냥한 특정 목표(targetIds)** 로만 판정한다(2026-09 결정 · docs/10 배선).
 *    영역-whole 자동커버(학원 넣으면 그 영역 전부 챙김)는 오버클레임(신뢰①)이라 폐기했다.
 *   - coveringActivities: 목표를 명시적으로 겨냥한 활성 활동(셋업 프리셋 확정·활동 연결)
 *   - publicGoalStatusOf: 위 + 부모의 '됨' 표시로 3상태를 낸다
 */
import { describe, it, expect } from 'vitest'
import { coveringActivities, publicGoalStatusOf } from '../../src/domain/coverage'
import { STANDARDS_2021 } from '../../src/domain/standards/child2021'
import { DOMAINS } from '../../src/domain/types'
import type { Activity } from '../../src/domain/types'

const act = (over: Partial<Activity> & Pick<Activity, 'id' | 'domain'>): Activity => ({
  name: over.name ?? '활동',
  track: '집',
  targetIds: [],
  cadence: { kind: '매일' },
  owner: '엄마',
  active: true,
  ...over,
})

describe('coveringActivities — 목표를 명시적으로 겨냥한 활동(활동 연결)', () => {
  it('목표를 직접 겨냥하는 활동을 찾는다', () => {
    const 직접 = act({ id: 'd1', domain: '국어', targetIds: ['nuri-com-1'] })
    expect(coveringActivities('nuri-com-1', [직접], STANDARDS_2021).map((a) => a.id)).toEqual(['d1'])
  })

  it('다른 목표만 겨냥하면 이 목표는 안 잡힌다', () => {
    const 딴목표 = act({ id: 'x', domain: '국어', targetIds: ['nuri-com-2'] })
    expect(coveringActivities('nuri-com-1', [딴목표], STANDARDS_2021)).toEqual([])
  })

  it('비활성 활동은 제외', () => {
    const 꺼짐 = act({ id: 'x', domain: '국어', targetIds: ['nuri-com-1'], active: false })
    expect(coveringActivities('nuri-com-1', [꺼짐], STANDARDS_2021)).toEqual([])
  })
})

describe('⭐ publicGoalStatusOf — 명시적으로 겨냥한 목표만 챙긴다 (영역-whole 자동커버 폐기)', () => {
  it('이 목표를 겨냥하는 활성 활동이 있으면 챙기는중', () => {
    const 겨냥 = act({ id: 'home', domain: '국어', targetIds: ['nuri-com-1'] })
    expect(publicGoalStatusOf('nuri-com-1', [], [겨냥], STANDARDS_2021)).toBe('챙기는중')
  })

  it('⭐ 목표를 명시로 안 겨냥하면(targetIds=[]) 같은 영역 활동이 있어도 활동필요 — 오버클레임 방지(신뢰①)', () => {
    // 예: 국어 학원을 다녀도 특정 목표를 확정하지 않았으면 그 목표는 아직 갭이다.
    const 국어활동 = act({ id: 'home', domain: '국어', targetIds: [] })
    expect(publicGoalStatusOf('nuri-com-1', [], [국어활동], STANDARDS_2021)).toBe('활동필요')
  })

  it('다른 목표만 겨냥하는 활동은 이 목표를 챙기지 않는다', () => {
    const 딴목표 = act({ id: 'm', domain: '국어', targetIds: ['nuri-com-2'] })
    expect(publicGoalStatusOf('nuri-com-1', [], [딴목표], STANDARDS_2021)).toBe('활동필요')
  })

  it('겨냥·활동 모두 없으면 활동필요(갭) — 이 앱이 찾으려는 것', () => {
    expect(publicGoalStatusOf('nuri-com-1', [], [], STANDARDS_2021)).toBe('활동필요')
  })

  it('부모가 됨 표시하면 활동과 무관하게 됨 (INV-COV-05: 수행 이력 아님)', () => {
    expect(publicGoalStatusOf('nuri-com-1', ['nuri-com-1'], [], STANDARDS_2021)).toBe('됨')
  })

  it('⭐ 아무리 많은 활동이 겨냥해도 achieved 없으면 절대 됨이 아니다 (2축: 챙김 ≠ 이룸)', () => {
    const 겨냥 = act({ id: 'a', domain: '국어', targetIds: ['nuri-com-1'] })
    expect(publicGoalStatusOf('nuri-com-1', [], [겨냥], STANDARDS_2021)).toBe('챙기는중')
  })
})

describe('영역 구조 — P-6 전제', () => {
  it('INV-TASK-07 — 영역은 7개를 넘지 않는다 (C-2 한 화면)', () => {
    expect(DOMAINS.length).toBeLessThanOrEqual(7)
  })

  it('교육과정 원문의 모든 영역이 갈 곳을 가진다', () => {
    // 5개로는 과학·탐구, 사회·인성, 건강·안전이 갈 곳이 없었다.
    expect(DOMAINS).toContain('과학·탐구')
    expect(DOMAINS).toContain('사회·인성')
    expect(DOMAINS).toContain('건강·안전')
  })
})
