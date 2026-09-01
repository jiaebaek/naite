/**
 * ARRR 사이클 #14 — RED (Boundary)
 * 대상: src/boundary/ui/PetPanel.tsx
 * 계약: docs/08-UI계약.md §3-B
 */

import { describe, it, expect, vi } from 'vitest'
import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { PetPanel } from '../../src/boundary/ui/PetPanel'
import type { CareState } from '../../src/domain/pet'

const setup = (care: CareState, onCare = vi.fn()) => {
  const utils = render(<PetPanel care={care} onCare={onCare} />)
  return { ...utils, onCare }
}

describe('INV-UI-43 — 토큰 표시', () => {
  it('돌볼 수 있는 횟수가 보인다', () => {
    setup({ available: 3, careCount: 0 })
    expect(screen.getByTestId('pet')).toHaveTextContent(/3/)
  })
})

describe('INV-UI-42 — 돌봄 버튼은 토큰이 있을 때만 활성', () => {
  it('토큰이 있으면 세 버튼이 활성', () => {
    setup({ available: 2, careCount: 0 })
    for (const name of ['먹이주기', '쓰다듬기', '놀아주기']) {
      expect(screen.getByRole('button', { name: new RegExp(name) })).toBeEnabled()
    }
  })

  it('⭐ 토큰 0이면 버튼이 비활성', () => {
    setup({ available: 0, careCount: 5 })
    expect(screen.getByRole('button', { name: /먹이주기/ })).toBeDisabled()
  })

  it('⭐ 토큰 0이면 긍정 안내 — 굶는/슬픈 표현이 아니다', () => {
    setup({ available: 0, careCount: 5 })
    const pet = screen.getByTestId('pet')
    expect(pet).toHaveTextContent(/할 일.*돌볼 수 있어요/)
    expect(pet.textContent ?? '').not.toMatch(/굶|배고|슬퍼|아파|울/)
  })
})

describe('INV-UI-45 — 돌봄은 탭 1회', () => {
  it('먹이주기를 누르면 onCare 가 불린다', async () => {
    const { onCare } = setup({ available: 1, careCount: 0 })
    await userEvent.click(screen.getByRole('button', { name: /먹이주기/ }))
    expect(onCare).toHaveBeenCalledTimes(1)
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })

  it('비활성 버튼을 눌러도 onCare 가 안 불린다', async () => {
    const { onCare } = setup({ available: 0, careCount: 0 })
    await userEvent.click(screen.getByRole('button', { name: /놀아주기/ }))
    expect(onCare).not.toHaveBeenCalled()
  })
})

describe('INV-UI-44 — 성장은 careCount 로', () => {
  it('careCount 가 크면 더 자란 단계가 보인다', () => {
    const { rerender } = render(<PetPanel care={{ available: 0, careCount: 0 }} onCare={vi.fn()} />)
    const stage0 = screen.getByTestId('pet-stage').getAttribute('data-stage')
    rerender(<PetPanel care={{ available: 0, careCount: 30 }} onCare={vi.fn()} />)
    const stage1 = screen.getByTestId('pet-stage').getAttribute('data-stage')
    expect(Number(stage1)).toBeGreaterThan(Number(stage0))
  })

  it('펫 이모지와 단계 이름이 보인다', () => {
    setup({ available: 0, careCount: 0 })
    const pet = screen.getByTestId('pet')
    expect(within(pet).getByTestId('pet-emoji').textContent?.length).toBeGreaterThan(0)
  })
})

describe('⭐ INV-UI-41 — 벌 없음', () => {
  it('어떤 상태에서도 굶는·아픈·슬픈 표현이 없다', () => {
    for (const care of [
      { available: 0, careCount: 0 },
      { available: 0, careCount: 20 },
      { available: 5, careCount: 3 },
    ]) {
      const { container, unmount } = render(<PetPanel care={care} onCare={vi.fn()} />)
      expect(container.textContent ?? '').not.toMatch(/굶|배고|슬퍼|아파|울|죽/)
      unmount()
    }
  })
})
