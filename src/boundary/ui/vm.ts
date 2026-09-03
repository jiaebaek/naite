/**
 * 화면용 뷰모델 타입 + 라벨 헬퍼. App 이 도메인에서 계산해 화면에 넘긴다.
 * UX 리디자인 명세(§04) 상태 모델을 그대로 따른다.
 */
import type { Domain, Provenance } from '../../domain/types'
import type { GoalStatus } from '../../domain/coverage'

/**
 * 목표별 추천 활동 문구 (표현 전용 — 도메인엔 없다).
 * 갭인 목표에 "이렇게 챙겨보세요"를 제시한다. 없으면 영역 기반 기본값.
 */
const RECOMMEND: Readonly<Record<string, string>> = {
  'int-ko-listen': '자기 전 그림책 읽어주기',
  'int-ko-find-letters': '마트에서 글자 찾기 놀이',
  'int-ko-letter-sounds': '자음·모음 소리내기 놀이',
  'int-ko-write-name': '이름 따라쓰기 놀이',
  'int-ma-count-10': '계단 오르며 수 세기',
  'int-ma-compare': '장난감 크기·길이 비교하기',
  'int-ma-pattern': '색깔 블록으로 규칙 잇기',
  'int-sci-curious': '“왜?”에 같이 답 찾아보기',
  'int-sci-living': '산책하며 동식물 관찰하기',
  'int-sci-season': '오늘 날씨·계절 이야기 나누기',
  'int-soc-self-do': '스스로 옷 입고 정리하기',
  'int-soc-emotion': '감정 그림카드로 말해보기',
  'int-hs-clean': '식사 전 손 씻기 습관',
  'int-hs-traffic': '횡단보도에서 멈춰 좌우 보기',
  'int-hs-screen': '타이머 정해 영상 보기',
  'int-pe-art-express': '자유롭게 그림 그리기',
  'int-pe-body-activity': '공원에서 뛰어놀기',
  'own-en-listen-picturebook': '영어 그림책 함께 듣기',
  'own-en-daily-video': '영어 영상 20분 보기',
}

export function recommendFor(standardId: string, domain: Domain): string {
  return RECOMMEND[standardId] ?? `${domain} 놀이 활동`
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
  /** 챙기는 중이면 그 활동 이름(또는 '이미 하고 있어요') */
  readonly coveredBy: string | null
  /** 됨(직접 처리)인가 — 관리 토글 상태 */
  readonly done: boolean
  /** 추천 활동 텍스트 (있으면) */
  readonly recommend?: string
}

/** 영역 카드 · 상세 공용 */
export interface DomainVM {
  readonly domain: Domain
  readonly milestones: readonly MilestoneVM[]
  readonly total: number
  readonly on: number // 챙김(됨+챙기는중)
  readonly gap: number // 활동필요
  readonly group: 'empty' | 'partial' | 'full'
  /** 영어처럼 공교육 기준 없는 영역 */
  readonly noPublic: boolean
}

/** 기록 탭 주간 활동 행 */
export interface RecordVM {
  readonly activityId: string
  readonly name: string
  readonly domain: Domain
  readonly count: number
}
