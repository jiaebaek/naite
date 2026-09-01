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

const tgt = (s: Standard, achieved = false): DomainTarget => ({ standard: s, achieved })

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
  card({ domain: '국어', coverage: '하는중', targets: [tgt(해석기준)], offsetOptions: opts(12, null), activityCount: 1 }),
  card({ domain: '수학', coverage: '하는중', offsetOptions: opts(12, null), activityCount: 3 }),
  card({ domain: '과학·탐구', coverage: '비어있음', targets: [tgt(해석기준)] }),
  card({ domain: '영어', coverage: '기준밖', offsetApplicable: false, targets: [tgt(자체기준)], activityCount: 2 }),
  card({ domain: '사회·인성', coverage: '연결필요', targets: [tgt(해석기준)], activityCount: 1 }),
  card({ domain: '예체능', coverage: '하는중', targets: [tgt(해석기준)], activityCount: 2 }),
  card({ domain: '건강·안전', coverage: '아직아님' }),
]

const setup = (
  cards: readonly DomainCard[] = CARDS,
  handlers: Partial<Pick<React.ComponentProps<typeof DomainScreen>, 'onOffsetChange' | 'onToggleAchieved'>> = {},
  warning: React.ComponentProps<typeof DomainScreen>['warning'] = null,
) => {
  const onOffsetChange = handlers.onOffsetChange ?? vi.fn()
  const onToggleAchieved = handlers.onToggleAchieved ?? vi.fn()
  const utils = render(
    <DomainScreen cards={cards} onOffsetChange={onOffsetChange} onToggleAchieved={onToggleAchieved} warning={warning} />,
  )
  return { ...utils, onOffsetChange, onToggleAchieved }
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
  it('자체 배지 클래스가 공교육과 다르다', () => {
    setup()
    const el = screen.getByTestId('영어-target-own-en')
    expect(el).toHaveAttribute('data-origin', '자체')
    expect(el.querySelector('.origin--공교육')).toBeNull()
  })
})

describe('INV-UI-17 — 오프셋 조정은 카드 안에서', () => {
  it('세 버튼이 있다', () => {
    setup()
    const 국어 = screen.getByTestId('domain-국어')
    for (const name of ['적기', '1년 선행', '2년 선행']) {
      expect(within(국어).getByRole('button', { name: new RegExp(name) })).toBeInTheDocument()
    }
  })

  it('영어는 버튼 대신 이유를 보여준다', () => {
    setup()
    const 영어 = screen.getByTestId('domain-영어')
    expect(within(영어).queryByRole('button', { name: /1년 선행/ })).not.toBeInTheDocument()
    expect(within(영어).getByText(/공교육 기준이 없어/)).toBeInTheDocument()
  })
})

// ── 달성 기반 선행 잠금 ─────────────────────────────────
describe('⭐ INV-UI-40 — 적기 버튼은 절대 잠기지 않는다', () => {
  it('모든 카드에서 적기는 열려 있다', () => {
    setup()
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

  it('잠긴 버튼에 몇 개 더 하면 열리는지 나온다', () => {
    setup(잠긴국어)
    const btn = screen.getByRole('button', { name: /1년 선행/ })
    expect(btn).toHaveAttribute('data-locked', 'true')
    expect(btn).toHaveTextContent(/2개 더/)
  })

  it('⭐ 잠긴 버튼을 눌러도 오프셋이 바뀌지 않는다', async () => {
    const { onOffsetChange } = setup(잠긴국어)
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
    await userEvent.click(screen.getByRole('button', { name: /1년 선행/ }))
    expect(onOffsetChange).toHaveBeenCalledWith('국어', 12)
  })
})

describe('⭐ INV-UI-38 / 39 — 목표 달성 토글', () => {
  it('각 목표에 "됨" 토글이 있다', () => {
    setup()
    const 국어 = screen.getByTestId('domain-국어')
    expect(within(국어).getByRole('checkbox', { name: /됨/ })).toBeInTheDocument()
  })

  it('⭐ 능력 서술이다 — "달성/미달성"·점수·퍼센트가 없다', () => {
    const { container } = setup()
    const text = container.textContent ?? ''
    expect(text).not.toContain('달성')
    expect(text).not.toContain('미달성')
    expect(text).not.toMatch(/\d+%/)
    expect(text).not.toMatch(/\d+\s*\/\s*\d+/)
  })

  it('탭 1회로 토글된다 — 다이얼로그 없음', async () => {
    const { onToggleAchieved } = setup()
    const 국어 = screen.getByTestId('domain-국어')
    await userEvent.click(within(국어).getByRole('checkbox', { name: /됨/ }))
    expect(onToggleAchieved).toHaveBeenCalledWith('int-ko-read')
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })

  it('달성 상태가 data 속성으로 노출된다', () => {
    const 달성됨 = [card({ domain: '국어', coverage: '하는중', targets: [tgt(해석기준, true)] })]
    setup(달성됨)
    expect(screen.getByTestId('국어-target-int-ko-read')).toHaveAttribute('data-achieved', 'true')
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

  it('경고와 신호가 모두 보이고 건너뛰기 버튼이 없다', () => {
    setup(CARDS, {}, 경고)
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
