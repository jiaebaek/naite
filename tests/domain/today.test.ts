/**
 * ARRR 사이클 #8 — RED
 * 대상: src/domain/today.ts  (F1 · P-1)
 * 계약: docs/07-계약.md §4
 *
 * P-1 "강제력 없는 집 활동만 선택적으로 누락된다"
 * — 시스템이 대신 강제력이 되어야 한다.
 */

import { describe, it, expect } from 'vitest'
import { deriveTodayTasks, streakOf, weekdayOf, weeklyProgressOf } from '../../src/domain/today'
import { DOMAINS } from '../../src/domain/types'
import { STANDARDS_2021 } from '../../src/domain/standards/child2021'
import type { Activity, Completion, Standard } from '../../src/domain/types'

// 2026-11-01 은 일요일이다 → 02 월, 04 수, 08 일
const 일요일 = '2026-11-01'
const 월요일 = '2026-11-02'
const 수요일 = '2026-11-04'

const 해석기준: Standard = {
  id: 'int-ko',
  domain: '국어',
  baselinePeriod: { start: '2026-08', end: '2027-02' },
  statement: '받침 없는 단어를 소리 내어 읽는다',
  source: { document: '04 문서' },
  origin: '해석',
}

const 자체기준: Standard = {
  id: 'own-en',
  domain: '영어',
  baselinePeriod: { start: '2026-08', end: '2027-02' },
  statement: '영어 그림책 한 권을 끝까지 듣는다',
  source: null,
  origin: '자체',
}

const STANDARDS = [해석기준, 자체기준]

const act = (over: Partial<Activity> & Pick<Activity, 'id' | 'domain'>): Activity => ({
  name: over.name ?? '활동',
  track: '집',
  targetIds: [],
  cadence: { kind: '매일' },
  owner: '엄마',
  active: true,
  ...over,
})

describe('weekdayOf — 요일 계산 (0=일)', () => {
  it('2026-11-01 은 일요일(0)이다', () => {
    expect(weekdayOf(일요일)).toBe(0)
  })

  it('2026-11-02 는 월요일(1)이다', () => {
    expect(weekdayOf(월요일)).toBe(1)
  })

  it('2026-11-04 는 수요일(3)이다', () => {
    expect(weekdayOf(수요일)).toBe(3)
  })

  it('시간대에 영향받지 않는다 — 같은 문자열이면 항상 같은 요일', () => {
    const results = Array.from({ length: 5 }, () => weekdayOf(수요일))
    expect(new Set(results).size).toBe(1)
  })
})

describe('INV-TASK-01 — 비활성 활동은 포함하지 않는다', () => {
  it('active=false 는 제외된다', () => {
    const tasks = deriveTodayTasks([act({ id: 'a1', domain: '국어', active: false })], 수요일, [], STANDARDS)
    expect(tasks).toHaveLength(0)
  })
})

describe('INV-TASK-02 — "매일" 은 항상 포함된다', () => {
  it.each([일요일, 월요일, 수요일])('%s 에도 포함된다', (date) => {
    const tasks = deriveTodayTasks([act({ id: 'a1', domain: '국어' })], date, [], STANDARDS)
    expect(tasks.map((t) => t.activityId)).toContain('a1')
  })
})

describe('INV-TASK-03 — "요일지정" 은 해당 요일에만 포함된다', () => {
  const 미술 = act({ id: 'art', domain: '예체능', name: '아이마음아트',
    cadence: { kind: '요일지정', weekdays: [3] } })

  it('수요일에는 포함된다', () => {
    expect(deriveTodayTasks([미술], 수요일, [], STANDARDS).map((t) => t.activityId)).toContain('art')
  })

  it('월요일에는 포함되지 않는다', () => {
    expect(deriveTodayTasks([미술], 월요일, [], STANDARDS)).toHaveLength(0)
  })

  it('여러 요일을 지정할 수 있다', () => {
    const 체육 = act({ id: 'pe', domain: '예체능', cadence: { kind: '요일지정', weekdays: [0, 3] } })
    expect(deriveTodayTasks([체육], 일요일, [], STANDARDS)).toHaveLength(1)
    expect(deriveTodayTasks([체육], 수요일, [], STANDARDS)).toHaveLength(1)
    expect(deriveTodayTasks([체육], 월요일, [], STANDARDS)).toHaveLength(0)
  })
})

describe('INV-TASK-04 — "비정기" 는 오늘 할 일에 포함되지 않는다', () => {
  it('⭐ 밀어붙이지 않는다', () => {
    const 비정기 = act({ id: 'x', domain: '국어', cadence: { kind: '비정기' } })
    expect(deriveTodayTasks([비정기], 수요일, [], STANDARDS)).toHaveLength(0)
  })
})

describe('INV-TASK-08 — "주N회" 는 요일을 강제하지 않는다', () => {
  const 보드게임 = act({ id: 'bg', domain: '국어', name: '보드게임',
    cadence: { kind: '주N회', times: 2 } })

  it.each([일요일, 월요일, 수요일])('%s — 매일 노출된다', (date) => {
    expect(deriveTodayTasks([보드게임], date, [], STANDARDS).map((t) => t.activityId)).toContain('bg')
  })

  it('⭐ 시스템이 "오늘이 그 날"이라고 정하지 않는다 — 재량은 사용자에게 있다', () => {
    const tasks = deriveTodayTasks([보드게임], 수요일, [], STANDARDS)
    expect(tasks[0]?.weeklyProgress).toEqual({ done: 0, times: 2, met: false })
  })

  it('이번 주 달성 횟수가 함께 나온다', () => {
    const done: readonly Completion[] = [
      { activityId: 'bg', date: 월요일 },
      { activityId: 'bg', date: '2026-11-03' },
    ]
    const tasks = deriveTodayTasks([보드게임], 수요일, done, STANDARDS)
    expect(tasks[0]?.weeklyProgress).toEqual({ done: 2, times: 2, met: true })
  })

  it('"매일" 활동에는 weeklyProgress 가 없다', () => {
    const tasks = deriveTodayTasks([act({ id: 'a1', domain: '국어' })], 수요일, [], STANDARDS)
    expect(tasks[0]?.weeklyProgress).toBeUndefined()
  })
})

describe('INV-TASK-05 — done 은 해당 날짜의 Completion 으로 결정된다', () => {
  const 활동 = act({ id: 'a1', domain: '국어' })

  it('기록이 있으면 done 이다', () => {
    const tasks = deriveTodayTasks([활동], 수요일, [{ activityId: 'a1', date: 수요일 }], STANDARDS)
    expect(tasks[0]?.done).toBe(true)
  })

  it('기록이 없으면 done 이 아니다', () => {
    expect(deriveTodayTasks([활동], 수요일, [], STANDARDS)[0]?.done).toBe(false)
  })

  it('다른 날짜의 기록은 오늘을 done 으로 만들지 않는다', () => {
    const tasks = deriveTodayTasks([활동], 수요일, [{ activityId: 'a1', date: 월요일 }], STANDARDS)
    expect(tasks[0]?.done).toBe(false)
  })
})

describe('INV-TASK-06 — 같은 activityId 가 두 번 나타나지 않는다', () => {
  it('중복 입력이 있어도 결과는 유일하다', () => {
    const 활동 = act({ id: 'a1', domain: '국어' })
    const tasks = deriveTodayTasks([활동, 활동], 수요일, [], STANDARDS)
    expect(tasks).toHaveLength(1)
  })
})

describe('INV-TASK-07 — 영역별 그룹핑이 가능하다 (C-2 한 화면)', () => {
  it('각 Task 가 domain 을 들고 있다', () => {
    const tasks = deriveTodayTasks(
      [act({ id: 'a1', domain: '국어' }), act({ id: 'a2', domain: '영어' })],
      수요일, [], STANDARDS,
    )
    const domains = new Set(tasks.map((t) => t.domain))
    expect(domains).toEqual(new Set(['국어', '영어']))
  })

  it('그룹 수는 영역 수를 넘지 않는다', () => {
    const many = DOMAINS.map((d, i) => act({ id: `a${i}`, domain: d }))
    const tasks = deriveTodayTasks(many, 수요일, [], STANDARDS)
    expect(new Set(tasks.map((t) => t.domain)).size).toBeLessThanOrEqual(DOMAINS.length)
  })
})

describe('nature 가 파생되어 실린다 (INV-NAT-*)', () => {
  it('해석 기준을 겨냥하면 적기', () => {
    const a = act({ id: 'a1', domain: '국어', targetIds: ['int-ko'] })
    expect(deriveTodayTasks([a], 수요일, [], STANDARDS)[0]?.nature).toBe('필수')
  })

  it('자체 기준을 겨냥하면 자체목표', () => {
    const a = act({ id: 'a1', domain: '영어', targetIds: ['own-en'] })
    expect(deriveTodayTasks([a], 수요일, [], STANDARDS)[0]?.nature).toBe('자체목표')
  })

  it('⭐ 목표를 겨냥하지 않으면 추가 — "어제 영상 빼먹음"은 기준 위반이 아니다', () => {
    const a = act({ id: 'a1', domain: '영어' })
    expect(deriveTodayTasks([a], 수요일, [], STANDARDS)[0]?.nature).toBe('자유')
  })
})

describe('INV-TASK-11 — 주간 목표 달성 여부는 도메인이 판정한다', () => {
  const 숙제 = act({ id: 'hw', domain: '국어', cadence: { kind: '주N회', times: 1 } })

  it('⭐ 주 1회 숙제를 아직 안 했으면 계속 뜬다 — 오늘 못 하면 내일 다시', () => {
    const tasks = deriveTodayTasks([숙제], 수요일, [], STANDARDS)
    expect(tasks).toHaveLength(1)
    expect(tasks[0]?.weeklyProgress?.met).toBe(false)
  })

  it('⭐ 이번 주에 한 번 했으면 met — 더 안 해도 된다', () => {
    const done = [{ activityId: 'hw', date: 월요일 }]
    const tasks = deriveTodayTasks([숙제], 수요일, done, STANDARDS)
    expect(tasks[0]?.weeklyProgress?.met).toBe(true)
  })

  it('달성해도 목록에서 사라지지는 않는다 — 완료로 남긴다', () => {
    const done = [{ activityId: 'hw', date: 월요일 }]
    expect(deriveTodayTasks([숙제], 수요일, done, STANDARDS)).toHaveLength(1)
  })

  it('지난 주 기록은 이번 주 달성으로 치지 않는다', () => {
    const done = [{ activityId: 'hw', date: '2026-10-28' }]
    const tasks = deriveTodayTasks([숙제], 수요일, done, STANDARDS)
    expect(tasks[0]?.weeklyProgress?.met).toBe(false)
  })
})

describe('INV-STREAK-01~04 — 매일 활동의 연속 기록', () => {
  const 영어책 = act({ id: 'en', domain: '영어', name: '영어 원서 1권' })
  const d = (day: number) => `2026-11-${String(day).padStart(2, '0')}`

  it('INV-STREAK-01 — 주N회 활동에는 streak 이 없다', () => {
    const 주2회 = act({ id: 'bg', domain: '국어', cadence: { kind: '주N회', times: 2 } })
    expect(streakOf(주2회, 수요일, [])).toBeUndefined()
  })

  it('INV-STREAK-04 — 기록이 없으면 undefined (0일째는 보여줄 것이 없다)', () => {
    expect(streakOf(영어책, d(4), [])).toBeUndefined()
  })

  it('INV-STREAK-02 — 연속 완료 일수를 센다', () => {
    const done = [d(2), d(3), d(4)].map((date) => ({ activityId: 'en', date }))
    expect(streakOf(영어책, d(4), done)).toBe(3)
  })

  it('⭐ INV-STREAK-03 — 오늘 아직 안 했어도 어제까지의 기록은 유지된다', () => {
    // 아직 끊긴 게 아니다. 오늘 하면 이어진다.
    const done = [d(2), d(3)].map((date) => ({ activityId: 'en', date }))
    expect(streakOf(영어책, d(4), done)).toBe(2)
  })

  it('중간에 하루 빠지면 거기서 끊긴다', () => {
    const done = [d(1), d(3), d(4)].map((date) => ({ activityId: 'en', date }))
    expect(streakOf(영어책, d(4), done)).toBe(2)
  })

  it('이틀 전에 끊겼으면 undefined', () => {
    const done = [d(1), d(2)].map((date) => ({ activityId: 'en', date }))
    expect(streakOf(영어책, d(5), done)).toBeUndefined()
  })

  it('다른 활동의 기록은 세지 않는다', () => {
    const done = [{ activityId: '다른것', date: d(3) }, { activityId: '다른것', date: d(4) }]
    expect(streakOf(영어책, d(4), done)).toBeUndefined()
  })

  it('deriveTodayTasks 결과에 streak 이 실린다', () => {
    const done = [d(2), d(3), d(4)].map((date) => ({ activityId: 'en', date }))
    const tasks = deriveTodayTasks([영어책], d(4), done, STANDARDS)
    expect(tasks[0]?.streak).toBe(3)
  })

  it('⭐ 매일 활동은 이월되지 않는다 — 어제 못 한 게 오늘 두 개로 뜨지 않는다', () => {
    const tasks = deriveTodayTasks([영어책], d(4), [], STANDARDS)
    expect(tasks).toHaveLength(1)
    expect(tasks[0]?.done).toBe(false)
  })
})

describe('weeklyProgressOf — 주간 집계는 월요일에 시작한다 (INV-TASK-09)', () => {
  const 보드게임 = act({ id: 'bg', domain: '국어', cadence: { kind: '주N회', times: 3 } })

  it('같은 주(월~일)의 기록만 센다', () => {
    const done: readonly Completion[] = [
      { activityId: 'bg', date: 월요일 },      // 이번 주
      { activityId: 'bg', date: '2026-11-08' }, // 이번 주 일요일
      { activityId: 'bg', date: '2026-10-30' }, // 지난 주 금요일
    ]
    expect(weeklyProgressOf(보드게임, 수요일, done)).toEqual({ done: 2, times: 3, met: false })
  })

  it('⭐ 일요일은 그 주의 마지막 날이다', () => {
    // 한국 관습대로 월요일 시작. 일요일에 체크해도 같은 주로 잡힌다.
    const done: readonly Completion[] = [{ activityId: 'bg', date: 월요일 }]
    expect(weeklyProgressOf(보드게임, '2026-11-08', done)).toEqual({ done: 1, times: 3, met: false })
  })

  it('주N회가 아닌 활동은 undefined', () => {
    const 매일 = act({ id: 'a1', domain: '국어' })
    expect(weeklyProgressOf(매일, 수요일, [])).toBeUndefined()
  })

  it('다른 활동의 기록은 세지 않는다', () => {
    const done: readonly Completion[] = [{ activityId: '다른활동', date: 월요일 }]
    expect(weeklyProgressOf(보드게임, 수요일, done)).toEqual({ done: 0, times: 3, met: false })
  })
})

describe('Task.targets — 활동↔목표 연결·출처 (피드백 ③④)', () => {
  const real = (id: string, targetIds: readonly string[]): Activity =>
    act({ id, domain: '국어', targetIds })

  it('겨냥 목표가 문장·출처와 함께 실린다', () => {
    const t = deriveTodayTasks([real('r', ['int-ko-letter-sounds'])], 수요일, [], STANDARDS_2021)[0]!
    expect(t.targets).toHaveLength(1)
    expect(t.targets[0]!.statement).toBe('자음·모음의 소릿값을 안다')
    expect(t.targets[0]!.provenance).toEqual({ kind: '공교육', doc: '성취기준' })
  })

  it('목표 0개면 targets 는 빈 배열', () => {
    const t = deriveTodayTasks([real('r', [])], 수요일, [], STANDARDS_2021)[0]!
    expect(t.targets).toEqual([])
  })

  it('⭐ 공교육 근거 목표가 대표(첫째)로 정렬된다', () => {
    // 자체(영어) + 공교육(수학) 을 섞어도 공교육이 앞에 온다 (표시용이라 영역 혼합 허용)
    const mixed = act({ id: 'm', domain: '수학', targetIds: ['own-en-daily-video', 'int-ma-pattern'] })
    const t = deriveTodayTasks([mixed], 수요일, [], STANDARDS_2021)[0]!
    expect(t.targets).toHaveLength(2)
    expect(t.targets[0]!.provenance.kind).toBe('공교육')
    expect(t.targets[1]!.provenance.kind).toBe('자체')
  })
})
