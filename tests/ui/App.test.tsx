/**
 * App 통합 — 실제 시드 데이터로 리디자인 원칙을 잠근다.
 * 회귀 방지: 갭 배너(2곳) · 선행 UI 부재 · 온보딩 · 탭 구조.
 */
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { App } from '../../src/boundary/ui/App'

const ONBOARD_KEY = 'naite.onboarded'
const SETUP_KEY = 'naite.setup'
/** 온보딩·셋업을 건너뛴 정상 상태로 */
const ready = () => { localStorage.setItem(ONBOARD_KEY, '1'); localStorage.setItem(SETUP_KEY, '1') }

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
    // S1 다음 → S2 → 시작하기
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
  beforeEach(ready)

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
  beforeEach(ready)

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
