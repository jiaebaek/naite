/**
 * 활동 추천 엔진 — 명세 §10-A (AI 없이 · 큐레이션 라이브러리 + 결정적 태그 매칭).
 *
 * ⚠️ 핵심 계약: **무근거 생성 금지.** 공교육 문서는 대부분 '목표'이고 '활동'은 별도 자료에 있다.
 *    따라서 추천의 원본은 손으로 큐레이션한 라이브러리(각 항목이 출처를 밝힘)이고, 이 모듈은
 *    그중 **무엇을 보여줄지만** 규칙으로 고른다. 여기서 문장을 지어내지 않는다.
 *
 * 보이스 원칙(§10-A): ① Pull만(부모가 갭을 눌렀을 때만) ② 하나·가볍게 ③ 때론 "안 해도 됨"
 *    ④ 특정 양육자 강제 금지 ⑤ 무료·집 먼저.
 */

import type { Domain, StandardId } from './types'

/** 활동 출처 — 근거 배지(§04)로 이어진다. nuri/achievement=공교육, self=자체(근거 표기) */
export type ActivitySource = 'nuri' | 'achievement' | 'self'

/**
 * 큐레이션 라이브러리의 활동 한 개. **손으로 채우고 출처를 밝힌다.**
 * title 은 사람이 근거 자료에서 번안해 적은 것이지 규칙 코드가 만든 것이 아니다.
 */
export interface RecommendedActivity {
  readonly id: string
  readonly title: string
  /** 겨냥하는 목표(공교육 원문 id 또는 자체 목표 id). 다대다. */
  readonly milestoneIds: readonly StandardId[]
  readonly domain: Domain
  readonly source: ActivitySource
  /** 근거 인용. source='self'면 어떤 공공/컨센서스 근거인지 표기(원칙: 근거 없는 자작 금지) */
  readonly sourceRef?: string
  readonly effortMin: 5 | 10 | 15
  readonly place: 'home' | 'outdoor' | 'academy'
  readonly materials?: readonly string[]
  /** 특정 양육자 강제 금지(원칙4) — 대개 'anyone' */
  readonly doableBy: 'anyone' | 'caregiver'
  readonly cost: 'free' | 'paid'
}

/** 선택에 쓰는 우리 집 맥락 — 가족 패턴 매칭·로테이션(중복 회피)용. */
export interface RecommendContext {
  /** 최근에 이미 추천한 활동 id — 뒤로 미뤄 로테이션한다 */
  readonly recentIds?: readonly string[]
  /** 가족이 이미 하는 장소(집·바깥·학원) — 맞는 활동을 앞세운다 */
  readonly familyPlaces?: readonly RecommendedActivity['place'][]
}

/** 사전식 비교 — 앞 지표가 작을수록 우선. */
function lexCompare(a: readonly number[], b: readonly number[]): number {
  for (let i = 0; i < a.length; i++) {
    const d = (a[i] ?? 0) - (b[i] ?? 0)
    if (d !== 0) return d
  }
  return 0
}

/**
 * 한 갭 목표에 보여줄 활동을 **결정적으로** 고른다(§10-A (2)). AI 아님.
 *   - 대상 = 이 목표를 겨냥하는 활동만(Pull · 갭 목표만은 호출부가 보장한다)
 *   - 우선순위: ① 무료·집 먼저(원칙5) ② 저부담(5~15분, 원칙2) ③ 가족 기존 패턴 ④ 최근 중복 회피
 *   - **라이브러리에 근거 있는 활동이 없으면 null**(원칙3 "안 해도 됨") — 억지로 뽑지 않는다.
 */
export function recommendForGap(
  goalId: StandardId,
  library: readonly RecommendedActivity[],
  ctx: RecommendContext = {},
): RecommendedActivity | null {
  const matches = library.filter((a) => a.milestoneIds.includes(goalId))
  if (matches.length === 0) return null

  const rank = (a: RecommendedActivity): readonly number[] => [
    a.cost === 'free' ? 0 : 1, // ① 무료 먼저
    a.place === 'home' ? 0 : a.place === 'outdoor' ? 1 : 2, // ①' 집 > 바깥 > 학원
    a.effortMin, // ② 저부담
    ctx.familyPlaces?.includes(a.place) ? 0 : 1, // ③ 가족 패턴
    ctx.recentIds?.includes(a.id) ? 1 : 0, // ④ 최근 추천은 뒤로(로테이션)
  ]
  const sorted = [...matches].sort(
    (x, y) => lexCompare(rank(x), rank(y)) || x.id.localeCompare(y.id),
  )
  return sorted[0] ?? null
}
