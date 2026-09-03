/**
 * ARRR 사이클 #5 — RED
 * 대상: src/domain/coverage.ts
 * 계약: docs/07-계약.md §3
 *
 * P-6 "모든 영역에서 다 하고 있는지 확인하고 싶어서 이걸 정리하는 것"
 * — 이 앱을 만드는 이유.
 */

import { describe, it, expect } from 'vitest'
import { evaluateCoverage, evaluateAllCoverage, goalStatusOf } from '../../src/domain/coverage'
import { currentTargets } from '../../src/domain/pace'
import { isDomainError } from '../../src/domain/errors'
import { STANDARDS_2021, INITIAL_OFFSETS } from '../../src/domain/standards/child2021'
import { DOMAINS } from '../../src/domain/types'
import type { Activity, Domain, Standard } from '../../src/domain/types'

// ── 픽스처 ─────────────────────────────────────────────
const 목표A: Standard = {
  id: 'target-a',
  domain: '국어',
  baselinePeriod: { start: '2026-09', end: '2027-02' },
  statement: '받침 없는 단어를 소리 내어 읽는다',
  source: { document: '04 문서' },
  origin: '해석',
}

const act = (over: Partial<Activity> & Pick<Activity, 'id' | 'domain'>): Activity => ({
  name: over.name ?? '활동',
  track: '집',
  targetIds: [],
  cadence: { kind: '매일' },
  owner: '엄마',
  active: true,
  ...over,
})

describe('INV-COV-02 — 활성 활동이 0개면 "대기"(목표 0) 또는 "공백"(목표 O)', () => {
  it('목표는 있는데 활동이 없으면 공백', () => {
    expect(evaluateCoverage('국어', [목표A], [])).toBe('비어있음')
  })

  it('다른 영역 활동만 있으면 공백', () => {
    expect(evaluateCoverage('국어', [목표A], [act({ id: 'a1', domain: '수학' })])).toBe('비어있음')
  })

  it('비활성 활동만 있으면 공백', () => {
    expect(
      evaluateCoverage('국어', [목표A], [act({ id: 'a1', domain: '국어', active: false })]),
    ).toBe('비어있음')
  })
})

describe('INV-COV-08 — 목표 0 + 활동 0 이면 반드시 "대기" (설계 정정 ④)', () => {
  it('⭐ 아직 시기가 아닌 영역은 공백이 아니라 대기다', () => {
    // 오프셋이 0이라 목표 시기가 아직 안 온 영역이 "빠뜨렸다"로 읽히면 C-6 위반이다.
    expect(evaluateCoverage('국어', [], [])).toBe('아직아님')
  })

  it('대기는 공백과 구별된다 — 조치가 필요 없는 정상 상태다', () => {
    expect(evaluateCoverage('국어', [], [])).not.toBe('비어있음')
    expect(evaluateCoverage('국어', [목표A], [])).toBe('비어있음')
  })

  it('다른 영역 활동이 있어도 이 영역이 비어 있으면 대기다', () => {
    expect(evaluateCoverage('국어', [], [act({ id: 'a1', domain: '수학' })])).toBe('아직아님')
  })
})

describe('INV-COV-03 — 활성 활동이 1개 이상이면 절대 "공백"이 아니다', () => {
  it('⭐ 목표를 겨냥하지 않는 활동만 있어도 공백은 아니다 (설계 정정 ②)', () => {
    // 사용자 지적: "플러스인데 왜 공백이야?"
    const result = evaluateCoverage('국어', [목표A], [act({ id: 'a1', domain: '국어' })])
    expect(result).not.toBe('비어있음')
    expect(result).toBe('연결필요')
  })

  it('어떤 조합에서도 활동이 있으면 공백이 아니다', () => {
    const cases: Array<[readonly Standard[], readonly Activity[]]> = [
      [[목표A], [act({ id: 'a1', domain: '국어' })]],
      [[목표A], [act({ id: 'a2', domain: '국어', targetIds: ['target-a'] })]],
      [[], [act({ id: 'a3', domain: '국어' })]],
    ]
    for (const [targets, activities] of cases) {
      expect(evaluateCoverage('국어', targets, activities)).not.toBe('비어있음')
    }
  })
})

describe('"적기" — 현재 목표를 겨냥한 활동이 있다', () => {
  it('목표를 겨냥하면 적기', () => {
    expect(
      evaluateCoverage('국어', [목표A], [act({ id: 'a1', domain: '국어', targetIds: ['target-a'] })]),
    ).toBe('하는중')
  })

  it('여러 활동 중 하나만 겨냥해도 적기', () => {
    const acts = [
      act({ id: 'a1', domain: '국어' }),
      act({ id: 'a2', domain: '국어', targetIds: ['target-a'] }),
    ]
    expect(evaluateCoverage('국어', [목표A], acts)).toBe('하는중')
  })

  it('비활성 활동이 목표를 겨냥해도 적기이 아니다', () => {
    const acts = [act({ id: 'a1', domain: '국어', targetIds: ['target-a'], active: false })]
    expect(evaluateCoverage('국어', [목표A], acts)).toBe('비어있음')
  })
})

describe('"보완필요" — 활동은 있으나 현재 목표를 겨냥한 것이 없다', () => {
  it('엉뚱한 목표를 겨냥하면 보완필요', () => {
    const acts = [act({ id: 'a1', domain: '국어', targetIds: ['다른목표'] })]
    expect(evaluateCoverage('국어', [목표A], acts)).toBe('연결필요')
  })
})

describe('INV-COV-04 — 목표가 0개인 영역에 활동이 있으면 "초과"', () => {
  it('겨냥할 목표가 없으면 초과', () => {
    expect(evaluateCoverage('영어', [], [act({ id: 'a1', domain: '영어' })])).toBe('기준밖')
  })

  it('목표가 없으면 활동이 무엇을 가리켜도 적기이 될 수 없다', () => {
    const acts = [act({ id: 'a1', domain: '영어', targetIds: ['target-a'] })]
    expect(evaluateCoverage('영어', [], acts)).not.toBe('하는중')
    expect(evaluateCoverage('영어', [], acts)).toBe('기준밖')
  })
})

describe('INV-COV-05 — 커버리지는 수행 이력(Completion)을 참조하지 않는다', () => {
  it('⭐ 함수가 completions 를 받지 않는다 — 시그니처로 보장한다', () => {
    // 커버리지는 "계획이 있는가"이지 "잘 했는가"가 아니다.
    // 며칠 빠뜨렸다고 영역이 공백으로 떨어지면 이 화면은 성적표가 된다 (C-6 / X-3).
    expect(evaluateCoverage.length).toBe(3)
  })
})

describe('INV-COV-01 — 결과는 항상 다섯 값 중 하나', () => {
  it('모든 조합이 정의된 상태를 낸다', () => {
    const valid = ['아직아님', '비어있음', '하는중', '연결필요', '기준밖']
    const combos: Array<[readonly Standard[], readonly Activity[]]> = [
      [[], []],
      [[목표A], []],
      [[], [act({ id: 'x', domain: '국어' })]],
      [[목표A], [act({ id: 'x', domain: '국어' })]],
      [[목표A], [act({ id: 'x', domain: '국어', targetIds: ['target-a'] })]],
    ]
    for (const [t, a] of combos) {
      expect(valid).toContain(evaluateCoverage('국어', t, a))
    }
  })

  it('알 수 없는 영역은 E-COV-UNKNOWN-DOMAIN 을 던진다', () => {
    try {
      evaluateCoverage('음악' as Domain, [], [])
      expect.unreachable('던져야 한다')
    } catch (e) {
      expect(isDomainError(e, 'E-COV-UNKNOWN-DOMAIN')).toBe(true)
    }
  })
})

describe('evaluateAllCoverage — F3 영역 현황판', () => {
  it('모든 영역을 빠짐없이 판정한다', () => {
    const targets = new Map<Domain, readonly Standard[]>()
    const result = evaluateAllCoverage(targets, [])
    expect(result.size).toBe(DOMAINS.length)
    for (const d of DOMAINS) expect(result.has(d)).toBe(true)
  })

  it('INV-TASK-07 — 영역은 7개를 넘지 않는다 (C-2 한 화면의 전제)', () => {
    // 교육과정 원문을 빠짐없이 덮으려면 7개가 필요하다 (docs/원문/전수매핑.md).
    // 5개로는 과학·탐구, 사회·인성, 건강·안전이 갈 곳이 없었다.
    expect(DOMAINS.length).toBeLessThanOrEqual(7)
  })

  it('교육과정 원문의 모든 영역이 갈 곳을 가진다', () => {
    // 누리과정 5영역 + 초1~2 5교과가 전부 어딘가에 매핑되어야 P-6 가 성립한다
    expect(DOMAINS).toContain('과학·탐구') // 자연탐구(탐구과정/자연과더불어), 슬기로운 생활
    expect(DOMAINS).toContain('사회·인성') // 사회관계, 바른 생활
    expect(DOMAINS).toContain('건강·안전') // 신체운동·건강(건강/안전)
  })
})

// ═══════════════════════════════════════════════════════
// P-6 실증 — 실제 데이터로 빈 영역이 잡히는가
// ═══════════════════════════════════════════════════════
describe('⭐ P-6 실증 — 현재 우리 집 상태를 판정한다', () => {
  const NOW = '2026-11'

  /** 인터뷰 A3·A4 의 실제 활동 */
  const 현재활동: readonly Activity[] = [
    act({ id: 'hw-hangul', domain: '국어', name: '한글 학원 숙제', owner: '아빠',
          targetIds: ['int-ko-read-simple-words'] }),
    act({ id: 'hw-facto', domain: '수학', name: '팩토 숙제', owner: '아빠',
          targetIds: ['int-ma-count-50'] }),
    act({ id: 'board-game', domain: '수학', name: '수학 보드게임',
          cadence: { kind: '주N회', times: 2 }, targetIds: ['int-ma-pattern'] }),
    act({ id: 'alpha', domain: '수학', name: '알파짱 워크지',
          cadence: { kind: '주N회', times: 3 } }),
    act({ id: 'en-book', domain: '영어', name: '영어 원서 1권',
          targetIds: ['own-en-listen-picturebook'] }),
    act({ id: 'en-video', domain: '영어', name: '영어 영상 20분',
          targetIds: ['own-en-daily-video'] }),
    act({ id: 'art', domain: '예체능', name: '아이마음아트', track: '학원',
          cadence: { kind: '요일지정', weekdays: [3] }, targetIds: ['int-pe-art-express'] }),
    act({ id: 'pe', domain: '예체능', name: '유아체육', track: '학원',
          cadence: { kind: '요일지정', weekdays: [0] }, targetIds: ['int-pe-body-activity'] }),
    // 과학·탐구 / 사회·인성 / 건강·안전: 활동 없음
  ]

  const targetsByDomain = new Map<Domain, readonly Standard[]>(
    DOMAINS.map((d) => [
      d,
      currentTargets(STANDARDS_2021, INITIAL_OFFSETS, NOW).filter((s) => s.domain === d),
    ]),
  )

  const coverage = () => evaluateAllCoverage(targetsByDomain, 현재활동)

  it('국어는 적기이다 — 한글 학원 숙제가 지금 목표를 겨냥한다', () => {
    expect(coverage().get('국어')).toBe('하는중')
  })

  it('수학은 적기이다 — 팩토·보드게임이 지금 목표를 겨냥한다', () => {
    expect(coverage().get('수학')).toBe('하는중')
  })

  it('영어는 적기이다 — 자체 기준을 세웠으므로 더는 초과가 아니다 (INV-COV-06)', () => {
    expect(coverage().get('영어')).toBe('하는중')
  })

  it('예체능은 적기이다 — 누리과정 예술경험·신체운동 목표를 겨냥한다', () => {
    // 초판에서는 '기준밖'로 나왔는데, 예체능 기준 데이터를 누락했기 때문이었다.
    // 누리과정 예술경험 영역과 초1~2 '즐거운 생활'에 기준이 실제로 있다.
    expect(coverage().get('예체능')).toBe('하는중')
  })

  it('⭐ 사회·인성은 공백이다 — 04 문서 §5 가 지적한 바로 그 지점', () => {
    // "초1 적응에서 실제로 가장 중요한데 아무도 안 챙기는 영역"
    // 정식 근거: [2바01-01], 누리과정 사회관계 영역
    expect(coverage().get('사회·인성')).toBe('비어있음')
  })

  it('⭐ 과학·탐구도 공백이다 — Domain 5개 시절에는 존재조차 하지 않던 영역', () => {
    // 누리과정 자연탐구의 '탐구과정 즐기기'·'자연과 더불어 살기',
    // 초1~2 '슬기로운 생활' 16개가 갈 곳이 없었다.
    expect(coverage().get('과학·탐구')).toBe('비어있음')
  })

  it('⭐ 건강·안전도 공백이다 — 안전하게 생활하기 4개가 통째로 빠져 있었다', () => {
    expect(coverage().get('건강·안전')).toBe('비어있음')
  })

  it('빈 영역이 정확히 셋 잡힌다 — 영역을 7개로 넓히자 둘이 더 드러났다', () => {
    const blanks = [...coverage()].filter(([, c]) => c === '비어있음').map(([d]) => d)
    expect(blanks.sort()).toEqual(['건강·안전', '과학·탐구', '사회·인성'].sort())
  })

  it('활동이 있는 네 영역은 모두 적기이다', () => {
    const ok = [...coverage()].filter(([, c]) => c === '하는중').map(([d]) => d)
    expect(ok.sort()).toEqual(['국어', '수학', '영어', '예체능'].sort())
  })
})

describe('⭐ INV-COV-09 — 다 됨인 영역은 비어있음이 아니다 (회귀 방지)', () => {
  const 목표B: Standard = { ...목표A, id: 'target-b', statement: '자기 이름을 쓴다' }

  it('목표가 있고 활동이 없어도, 목표가 다 됨이면 "비어있음"이 아니다', () => {
    // 회귀: 성취해서 활동이 없는데 "비어있다"고 뜨던 버그
    expect(evaluateCoverage('국어', [목표A, 목표B], [], ['target-a', 'target-b'])).not.toBe('비어있음')
    expect(evaluateCoverage('국어', [목표A, 목표B], [], ['target-a', 'target-b'])).toBe('하는중')
  })

  it('일부만 됨이고 나머지에 활동이 없으면 여전히 비어있음 (갭 존재)', () => {
    expect(evaluateCoverage('국어', [목표A, 목표B], [], ['target-a'])).toBe('비어있음')
  })

  it('achieved 를 안 주면 기존 판정 그대로 (하위호환)', () => {
    expect(evaluateCoverage('국어', [목표A], [])).toBe('비어있음')
  })
})

describe('⭐ goalStatusOf — 목표별 상태 (됨/챙기는중/아직). 현황 세그먼트용', () => {
  const 목표 = 목표A // int-like, id 'target-a'
  const 겨냥활동 = act({ id: 'a1', domain: '국어', targetIds: ['target-a'] })

  it('됨으로 표시했으면 됨', () => {
    expect(goalStatusOf('target-a', ['target-a'], [])).toBe('됨')
  })

  it('활성 활동이 겨냥하면 챙기는중', () => {
    expect(goalStatusOf('target-a', [], [겨냥활동])).toBe('챙기는중')
  })

  it('아무것도 없으면 아직', () => {
    expect(goalStatusOf('target-a', [], [])).toBe('활동필요')
  })

  it('⭐ 됨이 챙기는중보다 우선한다', () => {
    expect(goalStatusOf('target-a', ['target-a'], [겨냥활동])).toBe('됨')
  })

  it('비활성 활동이 겨냥해도 챙기는중이 아니다 (아직)', () => {
    const 꺼진활동 = act({ id: 'a2', domain: '국어', targetIds: ['target-a'], active: false })
    expect(goalStatusOf('target-a', [], [꺼진활동])).toBe('활동필요')
    void 목표
  })

  it('다른 목표를 겨냥하는 활동은 이 목표를 챙기지 않는다', () => {
    const 딴목표활동 = act({ id: 'a3', domain: '국어', targetIds: ['other'] })
    expect(goalStatusOf('target-a', [], [딴목표활동])).toBe('활동필요')
  })
})
