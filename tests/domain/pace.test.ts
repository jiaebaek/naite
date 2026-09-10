/**
 * 시기 산출 (F3). docs/00-전략-원칙.md §10 결정 A.
 * 선행 오프셋은 제품에 없다 — 목표는 "현재 시기 band" 한 겹뿐. 시기는 입력 나이로 정렬한다.
 */
import { describe, it, expect } from 'vitest'
import { shiftYearMonth, cohortAlignedMonth, currentPublicGoals } from '../../src/domain/pace'
import type { Standard } from '../../src/domain/types'

// ── shiftYearMonth ─────────────────────────────────────
describe('shiftYearMonth', () => {
  it('같은 해 안에서 개월을 뺀다', () => {
    expect(shiftYearMonth('2027-09', 3)).toBe('2027-06')
  })
  it('연도 경계를 넘어간다', () => {
    expect(shiftYearMonth('2027-01', 1)).toBe('2026-12')
  })
  it('음수면 더한다(미래로)', () => {
    expect(shiftYearMonth('2026-09', -24)).toBe('2028-09')
  })
  it('0개월이면 그대로다', () => {
    expect(shiftYearMonth('2027-09', 0)).toBe('2027-09')
  })
  it('월은 항상 2자리로 채운다', () => {
    expect(shiftYearMonth('2027-11', 10)).toBe('2027-01')
  })
})

// ── cohortAlignedMonth ─────────────────────────────────
describe('⭐ cohortAlignedMonth — 시기는 달력이 아니라 입력받은 아이 나이 기준', () => {
  const 코호트 = '2021-01'

  it('코호트와 같은 생년월이면 now 그대로', () => {
    expect(cohortAlignedMonth('2026-09', '2021-01', 코호트)).toBe('2026-09')
  })
  it('2년 늦게 태어났으면(더 어림) 유효 시점을 2년 앞당긴다', () => {
    expect(cohortAlignedMonth('2026-09', '2023-01', 코호트)).toBe('2024-09')
  })
  it('⭐ 2년 일찍 태어났으면(더 큼) 유효 시점을 2년 뒤로 → 상위 학년군', () => {
    expect(cohortAlignedMonth('2026-09', '2019-01', 코호트)).toBe('2028-09')
  })
})

// ── currentPublicGoals ─────────────────────────────────
describe('currentPublicGoals — band 가 now 를 포함하는 목표만(선행 없음)', () => {
  const 공교육 = (id: string, start: string, end: string): Standard => ({
    id, domain: '국어', baselinePeriod: { start, end },
    statement: '문장', source: { document: '누리', code: '누리' }, origin: '공교육',
  })
  const 누리 = 공교육('nuri-x', '2024-03', '2028-02')
  const 초1_2 = 공교육('std-x', '2028-03', '2030-02')
  const 자체: Standard = {
    id: 'own-x', domain: '영어', baselinePeriod: { start: '2000-01', end: '2099-12' },
    statement: '영어 그림책', source: null, origin: '자체',
  }
  const all = [누리, 초1_2, 자체]

  it('취학 전(2026-09)엔 누리 band 만, 초1~2 는 아직 아님', () => {
    const ids = currentPublicGoals(all, '2026-09').map((s) => s.id)
    expect(ids).toContain('nuri-x')
    expect(ids).not.toContain('std-x')
  })
  it('입학 후(2028-06)엔 초1~2 band, 누리는 끝남', () => {
    const ids = currentPublicGoals(all, '2028-06').map((s) => s.id)
    expect(ids).toContain('std-x')
    expect(ids).not.toContain('nuri-x')
  })
  it('자체 목표는 자기 구간(항상)에 포함된다', () => {
    expect(currentPublicGoals(all, '2026-09').map((s) => s.id)).toContain('own-x')
    expect(currentPublicGoals(all, '2028-06').map((s) => s.id)).toContain('own-x')
  })
})
