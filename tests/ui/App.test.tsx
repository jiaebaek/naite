/**
 * App 통합 — 리디자인 원칙을 잠근다.
 * 앱은 빈 상태로 시작하고 사용자 입력(셋업·관리)으로 동작한다. 시나리오가 필요한
 * 테스트는 스냅샷을 심는다(시드=테스트 픽스처). 회귀 방지: 안도 배너 · 빈 시작 · 온보딩·셋업 · 탭.
 */
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { App } from '../../src/boundary/ui/App'
import { SEED_ACTIVITIES, SEED_ACADEMIES } from '../../src/boundary/seed'
import { INITIAL_CARE } from '../../src/domain/pet'
import { SNAPSHOT_VERSION } from '../../src/boundary/store/types'

const ONBOARD_KEY = 'naite.onboarded'
const SETUP_KEY = 'naite.setup'
/** 온보딩·셋업을 건너뛴 정상 상태로 */
const ready = () => { localStorage.setItem(ONBOARD_KEY, '1'); localStorage.setItem(SETUP_KEY, '1') }
// 영어(자체) 목표는 부모가 입력한 것 — 스냅샷 customGoals 로 심는다(시드 활동이 이걸 겨냥).
const SEED_CUSTOM_GOALS = [
  { id: 'own-en-listen-picturebook', domain: '영어', baselinePeriod: { start: '2000-01', end: '2099-12' }, statement: '영어 그림책 한 권을 끝까지 듣는다', source: null, origin: '자체' },
  { id: 'own-en-daily-video', domain: '영어', baselinePeriod: { start: '2000-01', end: '2099-12' }, statement: '영어 영상을 하루 20분 본다', source: null, origin: '자체' },
]
/** 앱은 이제 빈 상태로 시작한다 — 시나리오가 필요한 테스트는 스냅샷을 심는다(시드=테스트 픽스처). */
const seedData = () => localStorage.setItem(`edu-manager:v${SNAPSHOT_VERSION}`, JSON.stringify({
  version: SNAPSHOT_VERSION, completions: [], achieved: [],
  activities: SEED_ACTIVITIES, academies: SEED_ACADEMIES, care: INITIAL_CARE,
  customGoals: SEED_CUSTOM_GOALS,
}))
const readySeeded = () => { ready(); seedData() }

beforeEach(() => {
  vi.useFakeTimers({ shouldAdvanceTime: true })
  vi.setSystemTime(new Date(2026, 8, 3)) // 2026-09-03 (지금 시기)
  try { localStorage.clear() } catch { /* noop */ }
})
afterEach(() => {
  vi.useRealTimers()
})

describe('첫 방문 — 온보딩', () => {
  it('온보딩 플래그가 없으면 온보딩이 뜬다', async () => {
    render(<App />)
    expect(await screen.findByTestId('onboard')).toBeInTheDocument()
  })

  it('플래그가 있으면 온보딩이 안 뜬다', async () => {
    ready()
    render(<App />)
    await screen.findByTestId('view-today')
    expect(screen.queryByTestId('onboard')).not.toBeInTheDocument()
  })
})

describe('⭐ 첫 실행 셋업 (§06-A · 온보딩 직후)', () => {
  it('온보딩만 끝나면 셋업이 뜨고, 완료하면 오늘로 간다', async () => {
    localStorage.setItem(ONBOARD_KEY, '1') // 온보딩만 완료, 셋업은 아직
    render(<App />)
    expect(await screen.findByTestId('setup')).toBeInTheDocument()
    // S1 다음 → S2 다음 → S3 시작하기 (3스텝)
    fireEvent.click(screen.getByRole('button', { name: '다음' }))
    fireEvent.click(screen.getByRole('button', { name: '다음' }))
    fireEvent.click(screen.getByRole('button', { name: /나이테 시작하기/ }))
    await screen.findByTestId('view-today')
    expect(screen.queryByTestId('setup')).not.toBeInTheDocument()
  })

  it('셋업 완료 플래그가 있으면 셋업이 안 뜬다', async () => {
    ready()
    render(<App />)
    await screen.findByTestId('view-today')
    expect(screen.queryByTestId('setup')).not.toBeInTheDocument()
  })
})

describe('⭐ 빈 상태로 시작 + 셋업이 실제 데이터를 만든다 (제대로)', () => {
  it('데이터가 없으면 배너가 "챙길 곳을 준비했어요"로 뜬다 (시드 없음)', async () => {
    ready()
    render(<App />)
    await screen.findByTestId('view-today')
    expect(screen.getByText(/챙길 곳을 준비했어요/)).toBeInTheDocument()
    // 시드의 한글 학원 숙제 같은 하드코딩 활동이 없다
    expect(screen.queryByText('한글 학원 숙제')).not.toBeInTheDocument()
  })

  it('⭐ S2 과목 칩(학원)을 누르면 그 영역이 챙김으로 채워진다', async () => {
    localStorage.setItem(ONBOARD_KEY, '1') // 셋업 대기
    render(<App />)
    await screen.findByTestId('setup')
    fireEvent.click(screen.getByRole('button', { name: '다음' })) // S1 → S2
    fireEvent.click(screen.getByRole('button', { name: '미술' })) // 예체능 학원
    fireEvent.click(screen.getByRole('button', { name: '다음' })) // S2 → S3
    fireEvent.click(screen.getByRole('button', { name: /나이테 시작하기/ }))
    await screen.findByTestId('view-today')
    // 예체능이 등원 커버로 챙김 처리 → 안도 배너가 "벌써 1곳"
    expect(screen.getByText(/벌써 1곳을 챙기고 있어요/)).toBeInTheDocument()
  })

  it('⭐ S3 집 활동 칩을 누르면 그 영역이 챙김 + 오늘 할 일에 뜬다', async () => {
    localStorage.setItem(ONBOARD_KEY, '1')
    render(<App />)
    await screen.findByTestId('setup')
    fireEvent.click(screen.getByRole('button', { name: '다음' })) // → S2
    fireEvent.click(screen.getByRole('button', { name: '다음' })) // → S3 (학원 건너뜀)
    fireEvent.click(screen.getByRole('button', { name: '그림책 읽기' })) // 국어 집활동(해석→누리 원문 챙김)
    fireEvent.click(screen.getByRole('button', { name: /나이테 시작하기/ }))
    await screen.findByTestId('view-today')
    expect(screen.getByText(/벌써 1곳을 챙기고 있어요/)).toBeInTheDocument()
    // 집 활동은 오늘 할 일 카드로도 뜬다(등원과 달리 체크 대상)
    expect(screen.getByText('그림책 읽기')).toBeInTheDocument()
  })
})

describe('⭐ 영어(자체) 목표를 부모가 직접 입력한다', () => {
  beforeEach(ready)

  it('영역 화면에서 영어는 "우리가 정하는 영역"으로 나온다 (하드코딩 목표 없음)', async () => {
    render(<App />)
    await screen.findByTestId('view-today')
    fireEvent.click(screen.getByRole('button', { name: '영역' }))
    expect(screen.getByText('우리가 정하는 영역')).toBeInTheDocument()
    // 초판 하드코딩 영어 목표가 사라졌다
    expect(screen.queryByText('영어 영상을 하루 20분 본다')).not.toBeInTheDocument()
  })

  it('⭐ 영어 상세에서 목표를 입력하면 그 목표가 생긴다', async () => {
    render(<App />)
    await screen.findByTestId('view-today')
    fireEvent.click(screen.getByRole('button', { name: '영역' }))
    fireEvent.click(screen.getByRole('button', { name: '목표 정하기' })) // 영어 → 상세
    fireEvent.click(screen.getByTestId('add-goal'))
    fireEvent.change(screen.getByLabelText('목표 문장'), { target: { value: '영어 그림책 하루 한 권' } })
    fireEvent.click(screen.getByRole('button', { name: /이 목표 추가하기/ }))
    expect(await screen.findByText('영어 그림책 하루 한 권')).toBeInTheDocument()
    // 자체 목표라 '자체' 배지가 붙는다 (공교육 배지가 아님)
    expect(screen.getByText('자체 목표')).toBeInTheDocument()
  })
})

describe('⭐ 안도 공유 카드 (§07-A)', () => {
  beforeEach(ready)

  it('"우리 아이 좌표 공유하기"를 누르면 좌표 카드(데이터-아트)가 뜬다', async () => {
    render(<App />)
    await screen.findByTestId('view-today')
    fireEvent.click(screen.getByRole('button', { name: /우리 아이 좌표 공유하기/ }))
    expect(await screen.findByTestId('share-sheet')).toBeInTheDocument()
    expect(screen.getByTestId('coord-art')).toBeInTheDocument()
  })
})

describe('⭐ 현황 배너 — 안도 먼저 (원칙 6 · 회귀 방지)', () => {
  beforeEach(readySeeded)

  it('시드로 안도 먼저: "벌써 5곳을 챙기고 있어요"로 문을 연다', async () => {
    render(<App />)
    expect(await screen.findByText(/벌써 5곳을 챙기고 있어요/)).toBeInTheDocument()
  })

  it('갭(2곳)은 서브에서 넌지시 + 영역 이름 칩', async () => {
    render(<App />)
    await screen.findByTestId('view-today')
    const banner = screen.getByText(/벌써 5곳을 챙기고 있어요/).closest('.gapcard')!
    expect(banner.textContent).toContain('2곳만 더 보면')
    expect(banner.textContent).toContain('과학·탐구')
    expect(banner.textContent).toContain('사회·인성')
  })
})

describe('⭐ 원칙 5 — 앱 어디에도 선행 UI 가 없다 (회귀 방지)', () => {
  beforeEach(ready)

  it('오늘 화면에 "선행" 문구가 없다', async () => {
    const { container } = render(<App />)
    await screen.findByTestId('view-today')
    expect(container.textContent ?? '').not.toContain('선행')
  })
})

describe('일상 3탭 구조', () => {
  beforeEach(ready)

  it('오늘·영역·기록 탭이 있다', async () => {
    render(<App />)
    await screen.findByTestId('view-today')
    const nav = screen.getByRole('navigation', { name: '화면 전환' })
    for (const t of ['오늘', '영역', '기록']) {
      expect(nav.textContent).toContain(t)
    }
  })
})

describe('⭐ 기록 탭 — 지난 날 backfill (보강 B · 회귀 방지)', () => {
  beforeEach(readySeeded)

  it('지난 날을 누르면 그 날 체크시트가 열리고, 토글하면 기록된다', async () => {
    render(<App />)
    await screen.findByTestId('view-today')

    fireEvent.click(screen.getByRole('button', { name: /기록/ }))
    await screen.findByTestId('view-log')

    // 2026-09-03(목)이 오늘 → 09-02(수)는 지난 날
    fireEvent.click(screen.getByTestId('wd-2026-09-02'))
    expect(await screen.findByTestId('day-sheet')).toBeInTheDocument()

    // 그 날 한글 학원 숙제를 소급 체크
    const task = screen.getByTestId('day-task-hw-hangul')
    expect(task).toHaveAttribute('aria-pressed', 'false')
    fireEvent.click(task)
    expect(screen.getByTestId('day-task-hw-hangul')).toHaveAttribute('aria-pressed', 'true')
  })

  it('미래 날짜 버튼은 비활성이다', async () => {
    render(<App />)
    await screen.findByTestId('view-today')
    fireEvent.click(screen.getByRole('button', { name: /기록/ }))
    await screen.findByTestId('view-log')
    expect(screen.getByTestId('wd-2026-09-05')).toBeDisabled()
  })
})
