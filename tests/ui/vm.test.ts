/**
 * recommendVM — 추천 활동의 출처 → 배지/라벨 매핑(§04·§10-A).
 * 근거를 화면에 드러내는 부분이라 신뢰의 핵심.
 */
import { describe, it, expect } from 'vitest'
import { recommendVM } from '../../src/boundary/ui/vm'
import type { RecommendedActivity } from '../../src/domain/recommend'

const base: RecommendedActivity = {
  id: 'x', title: '그림책 함께 읽기', milestoneIds: ['nuri-com-10'], domain: '국어',
  source: 'self', effortMin: 10, place: 'home', doableBy: 'anyone', cost: 'free',
}

describe('recommendVM — 출처 배지', () => {
  it("nuri → 공교육·누리과정 배지(gov)", () => {
    const vm = recommendVM({ ...base, source: 'nuri' })
    expect(vm).toMatchObject({ badgeCls: 'gov', sourceLabel: '공교육·누리과정', title: '그림책 함께 읽기', placeLabel: '집' })
  })
  it('achievement → 공교육·성취기준 배지(gov)', () => {
    expect(recommendVM({ ...base, source: 'achievement' })).toMatchObject({ badgeCls: 'gov', sourceLabel: '공교육·성취기준' })
  })
  it("self → 카드 배지는 짧게 '자체', 상세 근거는 sourceRef 로 분리(연결 시트용)", () => {
    // 카드는 짧게. 근거는 별도 필드(목표 카드에 이미 공교육 배지가 있어 중복 방지 · §10-A)
    expect(recommendVM({ ...base, source: 'self', sourceRef: '육아종합지원센터' }))
      .toMatchObject({ badgeCls: 'own', sourceLabel: '자체', sourceRef: '육아종합지원센터' })
  })
  it("self + 근거 없음 → '자체' (sourceRef 없음)", () => {
    const vm = recommendVM({ ...base, source: 'self' })
    expect(vm).toMatchObject({ badgeCls: 'own', sourceLabel: '자체' })
    expect(vm.sourceRef).toBeUndefined()
  })
})
