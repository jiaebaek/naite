/**
 * 활동 라이브러리 데이터 무결성 — 명세 §10-A.
 * 계약: ① 근거 없는 자작 금지(모든 항목 sourceRef) ② 존재하는 목표만 겨냥
 *      ③ 활동 영역 = 목표 영역 ④ 가짜 인용 금지(원문 미확보 → self) ⑤ 엔진 연결.
 */
import { describe, it, expect } from 'vitest'
import { ACTIVITY_LIBRARY } from '../../src/domain/standards/activityLibrary'
import { STANDARDS_2021 } from '../../src/domain/standards/child2021'
import { recommendForGap } from '../../src/domain/recommend'

const byId = new Map(STANDARDS_2021.map((s) => [s.id, s]))

describe('활동 라이브러리 무결성 (§10-A)', () => {
  it('id 가 중복되지 않는다', () => {
    const ids = ACTIVITY_LIBRARY.map((a) => a.id)
    expect(new Set(ids).size).toBe(ids.length)
  })

  it('⭐ 모든 활동은 근거(sourceRef)를 밝힌다 — 무근거 자작 금지', () => {
    for (const a of ACTIVITY_LIBRARY) {
      expect(a.sourceRef?.trim(), `${a.id} 에 sourceRef 가 없다`).toBeTruthy()
    }
  })

  it('⭐ 겨냥 목표(milestoneIds)는 모두 존재하는 기준을 가리킨다', () => {
    for (const a of ACTIVITY_LIBRARY) {
      expect(a.milestoneIds.length, a.id).toBeGreaterThan(0)
      for (const mid of a.milestoneIds) {
        expect(byId.has(mid), `${a.id} → 없는 목표 ${mid}`).toBe(true)
      }
    }
  })

  it('⭐ 활동의 영역은 겨냥 목표의 영역과 일치한다', () => {
    for (const a of ACTIVITY_LIBRARY) {
      for (const mid of a.milestoneIds) {
        expect(byId.get(mid)!.domain, `${a.id} → ${mid} 영역 불일치`).toBe(a.domain)
      }
    }
  })

  it('출처는 self 또는 achievement 만 — 놀이실행자료 원문 미확보라 nuri 가짜 인용 없음', () => {
    for (const a of ACTIVITY_LIBRARY) {
      expect(['self', 'achievement'], a.id).toContain(a.source)
      expect(a.source, `${a.id} 는 nuri 를 자칭하면 안 됨(원문 미확보)`).not.toBe('nuri')
    }
  })

  it('⭐ achievement(공교육·성취기준) 항목은 별책5 국어과를 근거로 인용한다', () => {
    const gov = ACTIVITY_LIBRARY.filter((a) => a.source === 'achievement')
    expect(gov.length, 'achievement 시드가 있어야 한다').toBeGreaterThan(0)
    for (const a of gov) {
      expect(a.sourceRef, a.id).toMatch(/별책5|국어과 교육과정/)
      expect(a.domain, `${a.id} — 국어과만 achievement 로 승격됨`).toBe('국어')
    }
  })

  it('겨냥 목표는 화면목표(취학 전 nuri-* / 초1~2 std-*)뿐이다', () => {
    for (const a of ACTIVITY_LIBRARY) {
      for (const mid of a.milestoneIds) {
        expect(mid.startsWith('nuri-') || mid.startsWith('std-'), `${a.id} → ${mid}`).toBe(true)
      }
    }
  })

  it('⭐ 취학 전 시드가 엔진에 붙는다 — 누리 갭 목표에 추천 반환 (회귀 방지)', () => {
    expect(recommendForGap('nuri-com-10', ACTIVITY_LIBRARY)).not.toBeNull() // 국어 책읽기
    expect(recommendForGap('nuri-nat-5', ACTIVITY_LIBRARY)).not.toBeNull() // 수학 세기
    expect(recommendForGap('nuri-saf-3', ACTIVITY_LIBRARY)).not.toBeNull() // 건강·안전 교통
  })

  it('⭐ 초1~2 시드가 엔진에 붙는다 — 성취기준 갭 목표에 추천 반환', () => {
    expect(recommendForGap('std-2국05-01', ACTIVITY_LIBRARY)).not.toBeNull() // 국어 말놀이
    expect(recommendForGap('std-2수04-01', ACTIVITY_LIBRARY)).not.toBeNull() // 수학 분류
    expect(recommendForGap('std-2슬01-04', ACTIVITY_LIBRARY)).not.toBeNull() // 슬기 생태 탐구
    expect(recommendForGap('std-2즐04-01', ACTIVITY_LIBRARY)).not.toBeNull() // 즐생 놀잇감
  })

  it('적기 원칙 — 학교가 담당하는 형식 학습엔 추천을 두지 않는다(선행 금지)', () => {
    expect(recommendForGap('std-2국04-01', ACTIVITY_LIBRARY)).toBeNull() // 한글 자모 소릿값
    expect(recommendForGap('std-2수01-11', ACTIVITY_LIBRARY)).toBeNull() // 곱셈구구
  })
})
