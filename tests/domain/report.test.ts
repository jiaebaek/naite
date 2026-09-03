/**
 * ARRR 사이클 #20 — RED
 * 대상: src/domain/report.ts
 * 계약: docs/07-계약.md §12 · 피드백 ⑧
 */

import { describe, it, expect } from 'vitest'
import { weeklyReport } from '../../src/domain/report'
import type { Activity, Completion } from '../../src/domain/types'

// 2026-11-02 월 ~ 11-08 일 (한 주). 11-04 는 수.
const 월 = '2026-11-02'
const 화 = '2026-11-03'
const 수 = '2026-11-04'
const 지난주일 = '2026-11-01' // 전 주 (범위 밖)
const 다음주월 = '2026-11-09' // 다음 주 (범위 밖)

const act = (over: Partial<Activity> & Pick<Activity, 'id' | 'name'>): Activity => ({
  domain: '영어', track: '집', targetIds: [], cadence: { kind: '매일' },
  owner: '엄마', active: true, ...over,
})

const 원서 = act({ id: 'en-book', name: '영어 원서', cadence: { kind: '매일' } })
const 보드 = act({ id: 'board', name: '보드게임', domain: '수학', cadence: { kind: '주N회', times: 2 } })

describe('weeklyReport — 이번 주 한 것을 센다 (긍정 집계)', () => {
  it('활동별로 이번 주 완료한 날 수를 준다', () => {
    const done: Completion[] = [
      { activityId: 'en-book', date: 월 },
      { activityId: 'en-book', date: 화 },
      { activityId: 'en-book', date: 수 },
      { activityId: 'board', date: 수 },
    ]
    const rows = weeklyReport([원서, 보드], done, 수)
    const book = rows.find((r) => r.activityId === 'en-book')!
    const bg = rows.find((r) => r.activityId === 'board')!
    expect(book.done).toBe(3)
    expect(bg.done).toBe(1)
    expect(book.name).toBe('영어 원서')
  })

  it('⭐ 이번 주 범위 밖(전 주·다음 주) 기록은 세지 않는다', () => {
    const done: Completion[] = [
      { activityId: 'en-book', date: 지난주일 },
      { activityId: 'en-book', date: 다음주월 },
      { activityId: 'en-book', date: 수 },
    ]
    expect(weeklyReport([원서], done, 수)[0]!.done).toBe(1)
  })

  it('비활성 활동은 리포트에서 빠진다', () => {
    const off = act({ id: 'x', name: '옛 활동', active: false })
    expect(weeklyReport([off], [], 수)).toHaveLength(0)
  })

  it("'매일' 활동은 streak 을 함께 준다", () => {
    const done: Completion[] = [
      { activityId: 'en-book', date: 화 },
      { activityId: 'en-book', date: 수 },
    ]
    expect(weeklyReport([원서], done, 수)[0]!.streak).toBe(2)
  })

  it("'주N회' 활동엔 streak 이 없다", () => {
    const rows = weeklyReport([보드], [{ activityId: 'board', date: 수 }], 수)
    expect(rows[0]!.streak).toBeUndefined()
  })

  it('한 것이 없으면 done 0 (결핍을 강조하지 않는다 — 그냥 0)', () => {
    expect(weeklyReport([원서], [], 수)[0]!.done).toBe(0)
  })
})

describe('⭐ INV-REPORT-03 — 막대 기준치(target)는 주간 리듬 (회귀 방지)', () => {
  it("'주N회'는 target=N — 주1회를 한 번 하면 done==target(꽉 참)", () => {
    const 주1 = act({ id: 'w1', name: '한글 숙제', cadence: { kind: '주N회', times: 1 } })
    const rows = weeklyReport([주1], [{ activityId: 'w1', date: 수 }], 수)
    expect(rows[0]!.target).toBe(1)
    expect(rows[0]!.done).toBe(1) // done >= target → 막대 꽉 참
  })

  it("'매일'은 target=7", () => {
    expect(weeklyReport([원서], [], 수)[0]!.target).toBe(7)
  })

  it("'주2회'는 target=2", () => {
    expect(weeklyReport([보드], [], 수)[0]!.target).toBe(2)
  })
})

describe('⭐ 주간 목표 달성(met) — 도메인이 판정 (보강 A)', () => {
  it('done >= target 이면 met', () => {
    const 주2 = act({ id: 'w2', name: '보드', cadence: { kind: '주N회', times: 2 } })
    const done = [{ activityId: 'w2', date: 화 }, { activityId: 'w2', date: 수 }]
    expect(weeklyReport([주2], done, 수)[0]!.met).toBe(true)
  })

  it('아직 미달이면 met 아님', () => {
    const 주3 = act({ id: 'w3', name: '한글', cadence: { kind: '주N회', times: 3 } })
    expect(weeklyReport([주3], [{ activityId: 'w3', date: 수 }], 수)[0]!.met).toBe(false)
  })

  it('자유 활동(target 0·비정기)은 채울 목표가 없어 met 아님', () => {
    const 자유 = act({ id: 'free', name: '알파짱', cadence: { kind: '비정기' } })
    expect(weeklyReport([자유], [{ activityId: 'free', date: 수 }], 수)[0]!.met).toBe(false)
  })
})
