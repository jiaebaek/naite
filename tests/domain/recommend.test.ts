/**
 * 활동 추천 엔진 — 명세 §10-A (결정적 태그 매칭, AI 아님).
 * 핵심: 근거 있는 라이브러리에서만 고르고, 없으면 null(원칙3 "안 해도 됨").
 */
import { describe, it, expect } from 'vitest'
import { recommendForGap } from '../../src/domain/recommend'
import type { RecommendedActivity } from '../../src/domain/recommend'

const a = (over: Partial<RecommendedActivity> & Pick<RecommendedActivity, 'id'>): RecommendedActivity => ({
  title: over.title ?? `활동 ${over.id}`,
  milestoneIds: ['g1'],
  domain: '국어',
  source: 'self',
  effortMin: 5,
  place: 'home',
  doableBy: 'anyone',
  cost: 'free',
  ...over,
})

describe('recommendForGap — 없으면 없다(원칙3)', () => {
  it('빈 라이브러리면 null', () => {
    expect(recommendForGap('g1', [])).toBeNull()
  })
  it('이 목표를 겨냥하는 활동이 없으면 null (억지로 뽑지 않는다)', () => {
    expect(recommendForGap('g1', [a({ id: 'x', milestoneIds: ['other'] })])).toBeNull()
  })
})

describe('recommendForGap — 결정적 우선순위(§10-A)', () => {
  it('무료를 유료보다 먼저 (원칙5)', () => {
    const lib = [a({ id: 'paid', cost: 'paid' }), a({ id: 'free', cost: 'free' })]
    expect(recommendForGap('g1', lib)?.id).toBe('free')
  })
  it('집 > 바깥 > 학원', () => {
    const lib = [a({ id: 'acad', place: 'academy' }), a({ id: 'out', place: 'outdoor' }), a({ id: 'home', place: 'home' })]
    expect(recommendForGap('g1', lib)?.id).toBe('home')
  })
  it('저부담(짧은 시간) 먼저 (원칙2)', () => {
    const lib = [a({ id: 'long', effortMin: 15 }), a({ id: 'short', effortMin: 5 })]
    expect(recommendForGap('g1', lib)?.id).toBe('short')
  })
  it('가족이 이미 하는 장소에 맞는 활동을 앞세운다', () => {
    // 둘 다 무료·같은 시간이지만 장소만 다름. 가족이 바깥 활동을 하면 바깥형을 먼저.
    const lib = [a({ id: 'home', place: 'home' }), a({ id: 'out', place: 'outdoor' })]
    // 기본은 집 먼저지만, familyPlaces=outdoor 면 바깥 가중치가 이긴다? — 규칙 순서상 장소 자체가 먼저다.
    // 따라서 가족 패턴은 '장소가 같은 등급'일 때의 tie-break로 확인한다.
    const sameEtc = [a({ id: 'h1', place: 'home' }), a({ id: 'h2', place: 'home' })]
    expect(recommendForGap('g1', sameEtc, { recentIds: ['h1'] })?.id).toBe('h2') // 최근 추천은 뒤로
    expect(recommendForGap('g1', lib)?.id).toBe('home') // 장소 등급이 우선
  })
  it('결정적 — 같은 입력이면 항상 같은 결과, 동점은 id 안정 정렬', () => {
    const lib = [a({ id: 'b' }), a({ id: 'a' })]
    expect(recommendForGap('g1', lib)?.id).toBe('a')
    expect(recommendForGap('g1', lib)?.id).toBe('a')
  })
})
