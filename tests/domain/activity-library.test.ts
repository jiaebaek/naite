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

  it('현재 시드는 전부 self 태그다 — 놀이실행자료 원문 미확보라 가짜 nuri 인용 금지', () => {
    for (const a of ACTIVITY_LIBRARY) {
      expect(a.source, a.id).toBe('self')
    }
  })

  it('겨냥 목표는 취학 전 화면목표(누리과정)뿐이다', () => {
    for (const a of ACTIVITY_LIBRARY) {
      for (const mid of a.milestoneIds) {
        expect(mid.startsWith('nuri-'), `${a.id} → ${mid}`).toBe(true)
      }
    }
  })

  it('⭐ 시드가 실제로 엔진에 붙는다 — 갭 목표에 추천이 반환된다 (회귀 방지)', () => {
    expect(recommendForGap('nuri-com-10', ACTIVITY_LIBRARY)).not.toBeNull() // 국어 책읽기
    expect(recommendForGap('nuri-nat-5', ACTIVITY_LIBRARY)).not.toBeNull() // 수학 세기
    expect(recommendForGap('nuri-saf-3', ACTIVITY_LIBRARY)).not.toBeNull() // 건강·안전 교통
  })
})
