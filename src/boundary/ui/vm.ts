/**
 * 화면용 뷰모델 타입 + 라벨 헬퍼. App 이 도메인에서 계산해 화면에 넘긴다.
 * UX 리디자인 명세(§04) 상태 모델을 그대로 따른다.
 */
import type { Domain, Provenance } from '../../domain/types'
import type { GoalStatus } from '../../domain/coverage'
import type { RecommendedActivity } from '../../domain/recommend'

/**
 * 추천 활동 표시 정보 (§10-A). 도메인의 RecommendedActivity 를 화면 라벨로만 바꾼다.
 * ⚠️ 여기서 활동을 만들지 않는다 — 근거 있는 라이브러리 항목이 있을 때만 채워진다.
 */
export interface RecommendVM {
  readonly title: string
  /** gov=공교육 근거(누리/성취기준) · own=자체(근거 표기) */
  readonly badgeCls: 'gov' | 'own'
  readonly sourceLabel: string
  readonly effortMin: number
  readonly placeLabel: string
  readonly cost: 'free' | 'paid'
}

const PLACE_LABEL: Readonly<Record<RecommendedActivity['place'], string>> = {
  home: '집', outdoor: '바깥', academy: '학원',
}

/** 근거 있는 추천 활동 → 화면 표시. 출처 배지는 §04 규칙을 따른다. */
export function recommendVM(a: RecommendedActivity): RecommendVM {
  const gov = a.source === 'nuri' || a.source === 'achievement'
  const sourceLabel = a.source === 'nuri'
    ? '공교육·누리과정'
    : a.source === 'achievement'
      ? '공교육·성취기준'
      : a.sourceRef ? `자체 · ${a.sourceRef}` : '자체'
  return {
    title: a.title,
    badgeCls: gov ? 'gov' : 'own',
    sourceLabel,
    effortMin: a.effortMin,
    placeLabel: PLACE_LABEL[a.place],
    cost: a.cost,
  }
}

/** 출처 → 배지 (gov=공교육 강조 · own=자체 · free=겨냥없음) */
export function badgeOf(p: Provenance | null): { cls: 'gov' | 'own' | 'free'; label: string } {
  if (p === null) return { cls: 'free', label: '자유' }
  if (p.kind === '자체') return { cls: 'own', label: '자체 목표' }
  return { cls: 'gov', label: p.doc === '누리과정' ? '공교육·누리과정' : '공교육·성취기준' }
}

/** 오늘 화면 할 일 카드 */
export interface TaskVM {
  readonly activityId: string
  readonly name: string
  readonly domain: Domain
  readonly badgeCls: 'gov' | 'own' | 'free'
  readonly badgeLabel: string
  /** 겨냥 목표 문장. 자유면 null */
  readonly aim: string | null
  readonly done: boolean
}

/** 목표(Milestone) — 영역 상세·관리 공용 */
export interface MilestoneVM {
  readonly standardId: string
  readonly statement: string
  readonly badgeCls: 'gov' | 'own' | 'free'
  readonly badgeLabel: string
  readonly status: GoalStatus // 됨 · 챙기는중 · 활동필요
  /** B′ 내용범주(교육과정 구조) — 상세 화면 아코디언 묶음 라벨 */
  readonly category?: string
  /** 챙기는 중이면 그 활동 이름(또는 '이미 하고 있어요') */
  readonly coveredBy: string | null
  /** 됨(직접 처리)인가 — 관리 토글 상태 */
  readonly done: boolean
  /** 추천 활동 (근거 있는 라이브러리 항목이 있을 때만) */
  readonly recommend?: RecommendVM
  /** 부모가 직접 만든 자체 목표 — 삭제할 수 있다 (공교육 원문은 삭제 불가) */
  readonly removable?: boolean
}

/** 영역 카드 · 상세 공용. 2축 3상태(§04): 이룸(done) · 챙기는 중(prog) · 비어있음(gap) */
export interface DomainVM {
  readonly domain: Domain
  readonly milestones: readonly MilestoneVM[]
  readonly total: number
  readonly on: number // 챙김(done+prog)
  readonly done: number // 이룸 (됨)
  readonly prog: number // 챙기는 중 (활동 연결·아직 이룸 아님)
  readonly gap: number // 비어있음 (활동필요)
  readonly group: 'empty' | 'partial' | 'full'
  /** 영어처럼 공교육 기준 없는 영역 */
  readonly noPublic: boolean
  /** 부모가 온보딩에서 고른 우선 분야 — 그룹 내에서 맨 위로 */
  readonly priority: boolean
}

/** 기록 탭 주간 활동 행 */
export interface RecordVM {
  readonly activityId: string
  readonly name: string
  readonly domain: Domain
  readonly count: number
}
