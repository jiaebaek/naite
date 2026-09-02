/**
 * 도메인 어휘. docs/07-계약.md §0 과 1:1 대응한다.
 *
 * 이 파일은 계약 그 자체이므로 완성되어 있다. 로직은 없다.
 */

/**
 * 영역. **교육과정 원문을 빠짐없이 덮도록** 설계됐다 (docs/원문/전수매핑.md).
 *
 * | Domain    | 누리과정 (취학 전)              | 초1~2 (2022 개정)        |
 * |-----------|--------------------------------|-------------------------|
 * | 국어      | 의사소통                        | 국어                    |
 * | 수학      | 자연탐구 · 생활 속에서 탐구하기  | 수학                    |
 * | 과학·탐구 | 자연탐구 · 탐구과정 즐기기 / 자연과 더불어 살기 | 슬기로운 생활 |
 * | 영어      | — (기준 없음)                   | — (초3부터)             |
 * | 사회·인성 | 사회관계                        | 바른 생활               |
 * | 예체능    | 예술경험 / 신체운동·건강(신체활동) | 즐거운 생활            |
 * | 건강·안전 | 신체운동·건강(건강·안전)         | 바른 생활(생활습관·안전) |
 *
 * ⚠️ 초판의 '학교적응'은 교육과정 용어가 아닌 조어였다. '사회·인성'으로 대체했다.
 *    정식 근거: [2바01-01] 학교 생활 습관과 학습 습관을 형성하여 안전하고 건강하게 생활한다.
 */
export const DOMAINS = [
  '국어',
  '수학',
  '과학·탐구',
  '영어',
  '사회·인성',
  '예체능',
  '건강·안전',
] as const
export type Domain = (typeof DOMAINS)[number]

/** 공교육 기준이 존재하지 않는 영역. 영어는 초3(2030-03)에 시작한다. */
export const NO_PUBLIC_STANDARD: readonly Domain[] = ['영어']

export const STANDARD_ORIGINS = ['공교육', '해석', '자체'] as const
export type StandardOrigin = (typeof STANDARD_ORIGINS)[number]

/**
 * 활동의 성격. **할 일 목록에서 쓰는 말**이다.
 * (영역 커버리지 쪽은 `필수`/`공백` 등 다른 어휘를 쓴다 — 문맥이 다르다)
 *
 *   필수     — 공교육 기준(+오프셋)에 대응. 누적되면 문제
 *   자체목표 — 우리가 세운 목표에 대응 (origin='자체'와 이름을 맞췄다)
 *   자유     — 겨냥하는 목표 없이 하는 것. 못 해도 괜찮다
 *
 * ⚠️ 저장하지 않는다. `Activity.targetIds` 에서 파생된다.
 * INV-ACT-02 / INV-NAT-01~04
 */
export const NATURES = ['필수', '자체목표', '자유'] as const
export type Nature = (typeof NATURES)[number]

/**
 * 영역 커버리지. 세 축의 조합이다 — ①목표가 있는가 ②활동이 있는가 ③겨냥하는가
 *
 *   아직아님 목표 0 · 활동 0   → 아직 시기가 아니다. **빠뜨린 것이 아니다** (C-6)
 *   비어있음 목표 O · 활동 0   → 시기인데 비었다. 발견이 목적
 *   기준밖   목표 0 · 활동 O   → 공교육 기준 밖에서 하는 중. 자체 기준으로 정리 가능
 *   연결필요 목표 O · 활동 O · 겨냥 X → 하고는 있는데 목표를 안 겨냥
 *   하는중   목표 O · 활동 O · 겨냥 O → 제때 겨냥해 하고 있다
 */
export const COVERAGES = ['아직아님', '비어있음', '하는중', '연결필요', '기준밖'] as const
export type Coverage = (typeof COVERAGES)[number]

export type Track = '학원' | '집'

/** 표시 전용. 어떤 연산도 이 값으로 알림·할당을 만들지 않는다. INV-ACT-05 / OOS-1 */
export type Owner = '엄마' | '아빠'

export const OFFSET_MONTHS = [0, 12, 24] as const
export type OffsetMonths = (typeof OFFSET_MONTHS)[number]

/** 0 = 일요일 */
export type Weekday = 0 | 1 | 2 | 3 | 4 | 5 | 6

/** 'YYYY-MM' */
export type YearMonth = string
/** 'YYYY-MM-DD' */
export type IsoDate = string

/** 양끝 포함. INV-PERIOD-01: start <= end */
export interface Period {
  readonly start: YearMonth
  readonly end: YearMonth
}

export type Cadence =
  | { readonly kind: '매일' }
  | { readonly kind: '주N회'; readonly times: number }
  | { readonly kind: '요일지정'; readonly weekdays: readonly Weekday[] }
  | { readonly kind: '비정기' }

export type StandardId = string
export type ActivityId = string
export type AcademyId = string

/**
 * 학원. 활동(Activity)과 별개다. docs/07-계약.md §10
 *   - 영역이 없다. 숙제(Activity)가 각자 영역·목표를 가진다.
 *   - 등원(가는 것)은 오늘 화면에 그날 일정으로만 뜬다 (체크 없음).
 */
export interface Academy {
  readonly id: AcademyId
  readonly name: string
  readonly weekdays: readonly Weekday[]
  /** 'HH:MM'. 선택 */
  readonly time?: string
  /** 연락처. 선택 (우선순위 낮음, 추후 지도 연동) */
  readonly contact?: string
  /**
   * 등원 자체가 챙기는 영역 (INV-ACAD-06). 유아체육 → ['예체능'].
   * 숙제의 영역과 다르다 — 이건 "가는 것"이 덮는 영역이다. 커버리지에만 반영.
   */
  readonly coversDomains?: readonly Domain[]
  readonly active: boolean
}

export type AcademyInput = Omit<Academy, 'id' | 'active'>

/**
 * 출처. origin='공교육' 이면 document 필수 + (code | url) 최소 하나.
 * INV-STD-03 / INV-STD-03b
 */
export interface StandardSource {
  /** 예: '교육부 고시 제2022-33호 [별책 5] 국어과 교육과정' */
  readonly document: string
  /** 성취기준 코드. 예: '2국04-01' */
  readonly code?: string
  readonly url?: string
}

/**
 * origin 별로 역할이 다르다 (docs/07-계약.md §5-B)
 *   공교육 — 근거 표시용. baselinePeriod 는 **학년군 말**. 목표 판정 대상이 아니다 (INV-STD-06)
 *   해석   — 실제로 겨냥하는 목표. 오프셋 적용 대상
 *   자체   — 공교육 기준이 없는 영역의 우리 목표. 오프셋 미적용 (INV-PACE-02)
 */
export interface Standard {
  readonly id: StandardId
  readonly domain: Domain
  /** origin='공교육'이면 학년군 구간. 그 외는 우리가 배치·설정한 구간. */
  readonly baselinePeriod: Period
  /** 관찰 가능한 행동 문장. INV-STD-01 */
  readonly statement: string
  /** origin='자체'면 null 가능. INV-STD-04 */
  readonly source: StandardSource | null
  readonly origin: StandardOrigin
  /** origin='해석'이 근거로 삼은 공교육 기준. INV-STD-07/08 */
  readonly refines?: StandardId
}

/**
 * INV-ACT-02: `nature` 필드는 존재하지 않는다. 파생값이다.
 */
export interface Activity {
  readonly id: ActivityId
  readonly name: string
  readonly domain: Domain
  readonly track: Track
  /** 이 활동이 겨냥하는 목표. 0개 허용. INV-ACT-06~08 */
  readonly targetIds: readonly StandardId[]
  readonly cadence: Cadence
  readonly owner: Owner
  readonly active: boolean
  /** 학원 숙제면 그 학원 id. 엄마표면 없음. */
  readonly academyId?: AcademyId
}

export type ActivityInput = Omit<Activity, 'id' | 'active'>

export interface PaceOffset {
  readonly domain: Domain
  readonly months: OffsetMonths
}

export interface Completion {
  readonly date: IsoDate
  readonly activityId: ActivityId
  /** 선택. 입력을 강제하지 않는다. INV-COMP-04 / C-3 */
  readonly memo?: string
}

/**
 * 목표의 출처. 신뢰 앵커 표시용 (오늘·현황 화면, 피드백 ④).
 *   공교육 — 누리과정/성취기준에 근거. '해석'은 refines 를 따라 여기로 귀속된다.
 *   자체   — 공교육 기준 밖 우리 목표(영어 등), 또는 근거 없는 해석.
 */
export interface Provenance {
  readonly kind: '공교육' | '자체'
  /** kind='공교육'일 때 어느 문서인지 */
  readonly doc?: '누리과정' | '성취기준'
}

/**
 * 활동이 겨냥하는 한 목표의 표시 정보. Task.targets 에 실린다.
 * 대표(공교육 우선)부터 정렬돼 온다 — 첫째가 요약 줄·배지에 쓰인다.
 */
export interface TaskTarget {
  readonly standardId: StandardId
  readonly statement: string
  readonly provenance: Provenance
}

export interface Task {
  readonly activityId: ActivityId
  readonly name: string
  readonly domain: Domain
  /** 파생값 */
  readonly nature: Nature
  /**
   * 이 활동이 겨냥하는 목표들 (문장+출처). 0개 가능.
   * 공교육 근거 목표가 앞에 오도록 정렬돼 있다 (대표 = targets[0]). 피드백 ③④
   */
  readonly targets: readonly TaskTarget[]
  readonly done: boolean
  /**
   * cadence.kind='주N회' 일 때만. 이번 주(월~일) 달성 횟수.
   * `met` 은 도메인이 계산한다 — UI 가 done >= times 를 직접 비교하면 INV-UI-00 위반.
   */
  readonly weeklyProgress?: {
    readonly done: number
    readonly times: number
    readonly met: boolean
  }
  /**
   * cadence.kind='매일' 일 때만. 연속 완료 일수.
   * 매일 활동은 오늘 못 하면 그냥 지나간다 — 이월되지 않는다.
   * 대신 이어온 기록을 보여준다. 0이면 undefined.
   */
  readonly streak?: number
}

export interface OffsetWarning {
  readonly from: OffsetMonths
  readonly to: OffsetMonths
  readonly message: string
  /** 오프셋이 아이보다 앞서갔음을 알리는 관찰 신호 */
  readonly signals: readonly string[]
}

export type ToggleResult =
  | { readonly kind: 'created'; readonly completion: Completion }
  | { readonly kind: 'removed'; readonly activityId: ActivityId; readonly date: IsoDate }
