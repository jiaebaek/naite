/**
 * GoalSheet — 공교육 기준 없는 영역(영어)에 부모가 목표를 직접 입력.
 * 원칙 8(회상보다 인식): 제안 칩 + 자유 입력. 빈 값이면 추가 불가.
 */
import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { GoalSheet } from '../../src/boundary/ui/GoalSheet'

const setup = () => {
  const onAdd = vi.fn(); const onClose = vi.fn()
  render(<GoalSheet domain="영어" onAdd={onAdd} onClose={onClose} />)
  return { onAdd, onClose }
}

describe('GoalSheet — 부모가 영어 목표를 입력', () => {
  it('영역 배지와 안내가 보인다 (공교육 아님)', () => {
    setup()
    expect(screen.getByText('영어')).toBeInTheDocument()
    expect(screen.getByText(/우리 집 목표를 직접 정해요/)).toBeInTheDocument()
  })

  it('제안 칩을 누르면 입력칸이 채워진다 (회상보다 인식)', async () => {
    setup()
    await userEvent.click(screen.getByRole('button', { name: '영어 그림책 읽기' }))
    expect(screen.getByLabelText('목표 문장')).toHaveValue('영어 그림책 읽기')
  })

  it('⭐ 자유 입력 후 추가하면 onAdd(문장)', async () => {
    const { onAdd } = setup()
    await userEvent.type(screen.getByLabelText('목표 문장'), '영어 노래 매일 한 곡')
    await userEvent.click(screen.getByRole('button', { name: /이 목표 추가하기/ }))
    expect(onAdd).toHaveBeenCalledWith('영어 노래 매일 한 곡')
  })

  it('빈 값이면 추가 버튼이 비활성', () => {
    setup()
    expect(screen.getByRole('button', { name: /이 목표 추가하기/ })).toBeDisabled()
  })

  it('공백만 입력해도 추가되지 않는다 (trim)', async () => {
    const { onAdd } = setup()
    await userEvent.type(screen.getByLabelText('목표 문장'), '   ')
    expect(screen.getByRole('button', { name: /이 목표 추가하기/ })).toBeDisabled()
    expect(onAdd).not.toHaveBeenCalled()
  })
})
