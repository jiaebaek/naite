/**
 * 커버리지 (F3 · P-6). docs/07-계약.md §3
 *   "모든 영역에서 다 하고 있는지 확인하고 싶어서" — 이 앱을 만드는 이유.
 *
 * 앱은 **영역 단위**로 챙김을 판정한다:
 *   - coveringActivities: 목표를 명시적으로 겨냥한 활동(활동 연결)
 *   - domainHasActivity : 그 영역에 활성 활동/등원이 있는가(일반 · 특정 아이 데이터 의존 없음)
 *   - publicGoalStatusOf: 위 둘 + 부모의 '됨' 표시로 3상태를 낸다
 */
import { describe, it, expect } from 'vitest'
import { coveringActivities, publicGoalStatusOf, domainHasActivity } from '../../src/domain/coverage'
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

describe('⭐ 영역 단위 챙김 — 학부모가 넣은 학원·활동이 그 영역을 챙긴다 (특정 아이 데이터 의존 X)', () => {
  it('domainHasActivity — 그 영역에 활성 활동이 있으면 true', () => {
    expect(domainHasActivity('국어', [act({ id: 'a', domain: '국어' })])).toBe(true)
    expect(domainHasActivity('국어', [act({ id: 'a', domain: '수학' })])).toBe(false)
    expect(domainHasActivity('국어', [act({ id: 'a', domain: '국어', active: false })])).toBe(false)
    expect(domainHasActivity('국어', [])).toBe(false)
  })

  it('⭐ 목표를 명시로 안 겨냥해도(targetIds=[]) 같은 영역 활동이 있으면 챙기는중', () => {
    // 셋업 활동·등원은 영역만 지정한다. 그래도 그 영역 목표가 챙김으로 잡혀야 한다(어떤 나이든).
    const 국어활동 = act({ id: 'home', domain: '국어', targetIds: [] })
    expect(publicGoalStatusOf('nuri-com-1', [], [국어활동], STANDARDS_2021)).toBe('챙기는중')
  })

  it('다른 영역 활동은 이 영역 목표를 챙기지 않는다', () => {
    const 수학활동 = act({ id: 'm', domain: '수학', targetIds: [] })
    expect(publicGoalStatusOf('nuri-com-1', [], [수학활동], STANDARDS_2021)).toBe('활동필요')
  })

  it('겨냥·활동 모두 없으면 활동필요(갭) — 이 앱이 찾으려는 것', () => {
    expect(publicGoalStatusOf('nuri-com-1', [], [], STANDARDS_2021)).toBe('활동필요')
  })

  it('부모가 됨 표시하면 활동과 무관하게 됨 (INV-COV-05: 수행 이력 아님)', () => {
    expect(publicGoalStatusOf('nuri-com-1', ['nuri-com-1'], [], STANDARDS_2021)).toBe('됨')
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
