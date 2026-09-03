/**
 * ARRR 사이클 #11+#12 — (Boundary 트랙)
 * 대상: src/boundary/ui/DomainScreen.tsx  (F3)
 * 계약: docs/08-UI계약.md §3 + 달성 기반 선행 잠금
 *
 * ⭐ 이 앱을 만드는 이유에 해당하는 화면이다.
 */

import { describe, it, expect, vi } from 'vitest'
import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { DomainScreen } from '../../src/boundary/ui/DomainScreen'
import type {
  DomainCard,
  DomainTarget,
  OffsetOption,
} from '../../src/boundary/ui/DomainScreen'
import { DOMAINS } from '../../src/domain/types'
import type { OffsetMonths, Standard } from '../../src/domain/types'

const 해석기준: Standard = {
  id: 'int-ko-read',
  domain: '국어',
  baselinePeriod: { start: '2026-09', end: '2027-02' },
  statement: '받침 없는 단어를 소리 내어 읽는다',
  source: { document: 'docs/04-교육기준표-2021년생.md' },
  origin: '해석',
  refines: 'std-2국02-01',
}

const 공교육기준: Standard = {
  id: 'std-2국02-01',
  domain: '국어',
  baselinePeriod: { start: '2028-03', end: '2030-02' },
  statement: '글자, 단어, 문장, 짧은 글을 정확하게 소리 내어 읽는다.',
  source: { document: '교육부 고시 제2022-33호 [별책 5]', code: '2국02-01' },
  origin: '공교육',
}

const 자체기준: Standard = {
  id: 'own-en',
  domain: '영어',
  baselinePeriod: { start: '2026-08', end: '2027-02' },
  statement: '영어 그림책 한 권을 끝까지 듣는다',
  source: null,
  origin: '자체',
}

const tgt = (s: Standard, over: Partial<DomainTarget> = {}): DomainTarget => ({
  standard: s,
  status: '활동필요',
  provenance: { kind: '공교육', doc: '성취기준' },
  activities: [],
  ...over,
})

const opts = (
  current: OffsetMonths,
  lockedFrom: OffsetMonths | null = 12,
): readonly OffsetOption[] => [
  { months: 0, label: '적기', current: current === 0, locked: false, unmetCount: 0 },
  {
    months: 12, label: '1년 선행', current: current === 12,
    locked: lockedFrom !== null && 12 >= lockedFrom, unmetCount: 2,
  },
  {
    months: 24, label: '2년 선행', current: current === 24,
    locked: lockedFrom !== null && 24 >= lockedFrom, unmetCount: 4,
  },
]

const card = (over: Partial<DomainCard> & Pick<DomainCard, 'domain' | 'coverage'>): DomainCard => ({
  offsetApplicable: true,
  targets: [],
  offsetOptions: opts(0, null),
  activityCount: 0,
  ...over,
})

const CARDS: readonly DomainCard[] = [
  card({ domain: '국어', coverage: '하는중', targets: [tgt(해석기준, { status: '챙기는중', activities: ['한글 학원 숙제'] })], offsetOptions: opts(12, null), activityCount: 1 }),
  card({ domain: '수학', coverage: '하는중', offsetOptions: opts(12, null), activityCount: 3 }),
  card({ domain: '과학·탐구', coverage: '비어있음', targets: [tgt(해석기준)] }),
  card({ domain: '영어', coverage: '기준밖', offsetApplicable: false, targets: [tgt(자체기준, { provenance: { kind: '자체' } })], activityCount: 2 }),
  card({ domain: '사회·인성', coverage: '연결필요', targets: [tgt(해석기준)], activityCount: 1 }),
  card({ domain: '예체능', coverage: '하는중', targets: [tgt(해석기준, { status: '챙기는중', activities: ['유아체육 등원'] })], activityCount: 2 }),
  card({ domain: '건강·안전', coverage: '아직아님' }),
]

const setup = (
  cards: readonly DomainCard[] = CARDS,
  handlers: Partial<Pick<React.ComponentProps<typeof DomainScreen>, 'onOffsetChange'>> = {},
  warning: React.ComponentProps<typeof DomainScreen>['warning'] = null,
) => {
  const onOffsetChange = handlers.onOffsetChange ?? vi.fn()
  const utils = render(<DomainScreen cards={cards} onOffsetChange={onOffsetChange} warning={warning} />)
  return { ...utils, onOffsetChange }
}

/** 카드는 기본 접힘 — 자세한 목표·오프셋을 보려면 헤더를 눌러 펼친다 */
const openCard = async (domain: string) => {
  await userEvent.click(
    within(screen.getByTestId(`domain-${domain}`)).getByRole('button', { name: new RegExp(domain) }),
  )
}

describe('INV-UI-14 — 7개 영역 전부', () => {
  it('필터로 숨기지 않는다', () => {
    setup()
    for (const d of DOMAINS) {
      expect(screen.getByRole('heading', { name: new RegExp(d) })).toBeInTheDocument()
    }
    expect(screen.getAllByTestId(/^domain-/)).toHaveLength(7)
  })
})

describe('⭐ 과목 접기 (프로토타입) — 눌러야 자세히', () => {
  it('기본은 접힘 — 목표·오프셋이 안 보인다', () => {
    setup()
    const 국어 = screen.getByTestId('domain-국어')
    expect(국어).toHaveAttribute('data-expanded', 'false')
    expect(within(국어).queryByText('공교육·성취기준')).not.toBeInTheDocument()
    expect(within(국어).queryByRole('button', { name: /적기/ })).not.toBeInTheDocument()
  })

  it('요약(세그먼트 집계)은 접힌 상태에서도 보인다', () => {
    setup()
    const 국어 = screen.getByTestId('domain-국어')
    expect(within(국어).getByText(/지금 목표 1/)).toBeInTheDocument()
  })

  it('헤더를 누르면 펼쳐진다', async () => {
    setup()
    await openCard('국어')
    const 국어 = screen.getByTestId('domain-국어')
    expect(국어).toHaveAttribute('data-expanded', 'true')
    expect(within(국어).getByText('공교육·성취기준')).toBeInTheDocument()
  })
})

describe('커버리지 표현 — INV-UI-29', () => {
  it.each([
    ['국어', '하는중'],
    ['과학·탐구', '비어있음'],
    ['영어', '기준밖'],
    ['사회·인성', '연결필요'],
    ['건강·안전', '아직아님'],
  ])('%s 카드에 "%s" 라벨이 있다', (domain, label) => {
    setup()
    expect(within(screen.getByTestId(`domain-${domain}`)).getByText(label)).toBeInTheDocument()
  })
})

describe('INV-UI-20 / 21 — 톤', () => {
  it('아직아님은 가장 약한 톤, 조치 버튼 없음', () => {
    setup()
    const c = screen.getByTestId('domain-건강·안전')
    expect(c).toHaveAttribute('data-tone', 'faint')
    expect(within(c).queryByRole('button', { name: /활동 추가/ })).not.toBeInTheDocument()
  })

  it('기준밖은 경고색이 아니라 info', () => {
    setup()
    expect(screen.getByTestId('domain-영어')).toHaveAttribute('data-tone', 'info')
  })
})

describe('INV-UI-16 — 자체를 공교육처럼 보이게 하지 않는다', () => {
  it('자체 배지 클래스가 공교육과 다르다', async () => {
    setup()
    await openCard('영어')
    const el = screen.getByTestId('영어-target-own-en')
    expect(el).toHaveAttribute('data-origin', '자체')
    expect(el.querySelector('.origin--공교육')).toBeNull()
  })
})

describe('INV-UI-17 — 오프셋 조정은 카드 안에서', () => {
  it('세 버튼이 있다', async () => {
    setup()
    await openCard('국어')
    const 국어 = screen.getByTestId('domain-국어')
    for (const name of ['적기', '1년 선행', '2년 선행']) {
      expect(within(국어).getByRole('button', { name: new RegExp(name) })).toBeInTheDocument()
    }
  })

  it('영어는 버튼 대신 이유를 보여준다', async () => {
    setup()
    await openCard('영어')
    const 영어 = screen.getByTestId('domain-영어')
    expect(within(영어).queryByRole('button', { name: /1년 선행/ })).not.toBeInTheDocument()
    expect(within(영어).getByText(/공교육 기준이 없어/)).toBeInTheDocument()
  })
})

// ── 달성 기반 선행 잠금 ─────────────────────────────────
describe('⭐ INV-UI-40 — 적기 버튼은 절대 잠기지 않는다', () => {
  it('모든 카드에서 적기는 열려 있다', async () => {
    setup()
    await openCard('국어')
    const 국어 = screen.getByTestId('domain-국어')
    const 적기 = within(국어).getByRole('button', { name: /적기/ })
    expect(적기).toHaveAttribute('data-locked', 'false')
  })
})

describe('⭐ INV-UI-37 — 잠긴 오프셋은 왜 잠겼는지 보여준다', () => {
  const 잠긴국어 = [
    card({
      domain: '국어', coverage: '하는중', targets: [tgt(해석기준)], activityCount: 1,
      offsetOptions: [
        { months: 0, label: '적기', current: true, locked: false, unmetCount: 0 },
        { months: 12, label: '1년 선행', current: false, locked: true, unmetCount: 2 },
        { months: 24, label: '2년 선행', current: false, locked: true, unmetCount: 4 },
      ],
    }),
  ]

  it('잠긴 버튼에 몇 개 더 하면 열리는지 나온다', async () => {
    setup(잠긴국어)
    await openCard('국어')
    const btn = screen.getByRole('button', { name: /1년 선행/ })
    expect(btn).toHaveAttribute('data-locked', 'true')
    expect(btn).toHaveTextContent(/2개 더/)
  })

  it('⭐ 잠긴 버튼을 눌러도 오프셋이 바뀌지 않는다', async () => {
    const { onOffsetChange } = setup(잠긴국어)
    await openCard('국어')
    await userEvent.click(screen.getByRole('button', { name: /1년 선행/ }))
    expect(onOffsetChange).not.toHaveBeenCalled()
  })

  it('열린 버튼은 눌리면 바뀐다', async () => {
    const 열린국어 = [
      card({
        domain: '국어', coverage: '하는중', targets: [tgt(해석기준)],
        offsetOptions: [
          { months: 0, label: '적기', current: true, locked: false, unmetCount: 0 },
          { months: 12, label: '1년 선행', current: false, locked: false, unmetCount: 0 },
          { months: 24, label: '2년 선행', current: false, locked: true, unmetCount: 2 },
        ],
      }),
    ]
    const { onOffsetChange } = setup(열린국어)
    await openCard('국어')
    await userEvent.click(screen.getByRole('button', { name: /1년 선행/ }))
    expect(onOffsetChange).toHaveBeenCalledWith('국어', 12)
  })
})

describe('⭐ INV-UI-38 — 능력 서술("됨"). 점수·달성/미달성 금지 (C-6)', () => {
  it('⭐ "달성/미달성"·점수·퍼센트·N/N 이 없다', () => {
    const { container } = setup()
    const text = container.textContent ?? ''
    expect(text).not.toContain('달성')
    expect(text).not.toContain('미달성')
    expect(text).not.toMatch(/\d+%/)
    expect(text).not.toMatch(/\d+\s*\/\s*\d+/)
  })

  it('상태가 배지·data 속성으로 노출된다 (활동 필요)', async () => {
    setup()
    await openCard('과학·탐구')
    const row = screen.getByTestId('과학·탐구-target-int-ko-read')
    expect(row).toHaveAttribute('data-status', '활동필요')
    expect(within(row).getByText('활동 필요')).toBeInTheDocument()
  })
})

describe('⭐ ⑥ — "됨" 표시는 영역에 없다 (관리 탭으로 이동)', () => {
  it('영역에는 됨 토글·성취 확인 컨트롤이 없다', async () => {
    setup()
    await openCard('국어')
    const 국어 = screen.getByTestId('domain-국어')
    expect(within(국어).queryByRole('checkbox')).not.toBeInTheDocument()
    expect(within(국어).queryByRole('button', { name: /됨으로|됨 취소|성취 확인/ })).not.toBeInTheDocument()
  })

  it('⭐ 됨인 목표는 영역 목록에서 숨긴다 (빈 곳에 집중)', async () => {
    const 섞인국어 = [
      card({
        domain: '국어', coverage: '하는중', activityCount: 1,
        targets: [
          tgt(해석기준, { status: '됨' }),
          tgt({ ...해석기준, id: 'int-gap', statement: '받침 없는 단어를 읽는다' }, { status: '활동필요' }),
        ],
      }),
    ]
    setup(섞인국어)
    await openCard('국어')
    const 국어 = screen.getByTestId('domain-국어')
    // 활동필요는 보이고, 됨은 목록에서 숨긴다
    expect(within(국어).getByText('받침 없는 단어를 읽는다')).toBeInTheDocument()
    expect(within(국어).queryByTestId('국어-target-int-ko-read')).not.toBeInTheDocument()
    // 됨 개수는 요약에 남긴다
    expect(within(국어).getByText(/됨 1개 숨김/)).toBeInTheDocument()
  })
})

describe('⭐ ⑤ 커버리지 세그먼트·집계 — 점수 아님', () => {
  it('진행바(progressbar) 역할을 쓰지 않는다', () => {
    setup()
    expect(screen.queryAllByRole('progressbar')).toHaveLength(0)
  })

  it('목표 상태 집계 문구가 보인다 (점수·퍼센트 아님)', () => {
    setup()
    const 국어 = screen.getByTestId('domain-국어')
    expect(within(국어).getByText(/지금 목표 1/)).toBeInTheDocument()
    expect(within(국어).getByText(/챙기는 중 1/)).toBeInTheDocument()
  })

  it('⭐ 핵심가치 — 활동 없는 목표는 "활동 필요"로 드러나고 갭 안내가 보인다', async () => {
    setup()
    const c = screen.getByTestId('domain-과학·탐구') // 활동 없는 목표 1개
    // 갭 안내는 접힌 상태에서도 보인다 (핵심 가치)
    expect(within(c).getByText(/비어있어요/)).toBeInTheDocument()
    // '활동 필요' 배지는 펼치면 목표 옆에
    await openCard('과학·탐구')
    expect(within(c).getByText('활동 필요')).toBeInTheDocument()
  })

  it('"아직" 이라는 애매한 라벨을 쓰지 않는다 (활동 필요로 대체)', () => {
    const { container } = setup()
    // 목표 상태 배지로 "아직" 단독 라벨이 남아있으면 안 된다
    expect(container.querySelector('.gbadge')?.textContent).not.toBe('아직')
    expect(within(screen.getByTestId('domain-과학·탐구')).queryByText('아직')).not.toBeInTheDocument()
  })
})

describe('⭐ ③④ 목표별 출처·연결활동', () => {
  it('공교육 출처 배지가 목표에 붙는다', async () => {
    setup()
    await openCard('국어')
    const row = screen.getByTestId('국어-target-int-ko-read')
    expect(within(row).getByText('공교육·성취기준')).toBeInTheDocument()
  })

  it('자체 목표는 "자체 목표" 로 (공교육처럼 보이지 않게, INV-UI-16)', async () => {
    setup()
    await openCard('영어')
    const row = screen.getByTestId('영어-target-own-en')
    expect(within(row).getByText('자체 목표')).toBeInTheDocument()
  })

  it('겨냥하는 활동 이름이 목표 아래 보인다', async () => {
    setup()
    await openCard('국어')
    const row = screen.getByTestId('국어-target-int-ko-read')
    expect(within(row).getByText('한글 학원 숙제')).toBeInTheDocument()
  })

  it('겨냥 활동이 없는 목표는 "연결된 활동 없음"', async () => {
    setup()
    await openCard('과학·탐구')
    const row = screen.getByTestId('과학·탐구-target-int-ko-read')
    expect(within(row).getByText(/연결된 활동 없음/)).toBeInTheDocument()
  })
})

describe('INV-UI-18 — 오프셋 상향 경고', () => {
  const 경고 = {
    domain: '국어' as const,
    warning: {
      from: 0 as const, to: 12 as const,
      message: '오프셋은 목표 시기를 당길 뿐 발달 단계를 이기지 못합니다.',
      signals: ['아이가 회피한다', '진전이 없다'],
    },
  }

  it('경고와 신호가 모두 보이고 건너뛰기 버튼이 없다', async () => {
    setup(CARDS, {}, 경고)
    await openCard('국어')
    const box = screen.getByRole('status')
    expect(box).toHaveTextContent(/발달 단계를 이기지 못합니다/)
    for (const s of 경고.warning.signals) expect(within(box).getByText(s)).toBeInTheDocument()
    expect(within(box).queryByRole('button', { name: /건너뛰기|무시/ })).not.toBeInTheDocument()
  })

  it('경고가 없으면 렌더되지 않는다', () => {
    setup()
    expect(screen.queryByRole('status')).not.toBeInTheDocument()
  })
})

describe('INV-UI-22 — 점수·퍼센트·진행바 금지', () => {
  it('progressbar 가 없다', () => {
    setup()
    expect(screen.queryAllByRole('progressbar')).toHaveLength(0)
  })
})
