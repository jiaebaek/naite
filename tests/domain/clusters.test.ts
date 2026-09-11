/**
 * 교육과정 묶음(cluster) 무결성 (T7 · 큐레이션 원본 docs/11 §2).
 * 묶음은 그룹핑일 뿐 — member 는 반드시 존재하는 std 이고, 한 영역 안에서만 묶인다.
 */
import { describe, it, expect } from 'vitest'
import { CLUSTERS, clusterById, clusterOfStandard } from '../../src/domain/standards/clusters'
import { STANDARDS_2021 } from '../../src/domain/standards/child2021'

const byId = new Map(STANDARDS_2021.map((s) => [s.id, s]))

describe('묶음 데이터 무결성', () => {
  it('묶음 id 가 중복되지 않는다', () => {
    const ids = CLUSTERS.map((c) => c.id)
    expect(new Set(ids).size).toBe(ids.length)
  })

  it('취학 전 14묶음 + 초1~2 18묶음 (docs/11 §2)', () => {
    expect(CLUSTERS.filter((c) => c.band === 'nuri')).toHaveLength(14)
    expect(CLUSTERS.filter((c) => c.band === 'elem')).toHaveLength(18)
  })

  it('모든 묶음 member 가 존재하는 std 이고, 영역이 묶음과 일치한다 (한 영역 안에서만 묶임)', () => {
    for (const c of CLUSTERS) {
      expect(c.memberIds.length, `${c.id} 비어있음`).toBeGreaterThan(0)
      for (const id of c.memberIds) {
        const s = byId.get(id)
        expect(s, `${c.id} → 없는 std ${id}`).toBeDefined()
        expect(s!.domain, `${c.id} → ${id}`).toBe(c.domain)
      }
    }
  })

  it('한 std 는 최대 한 묶음에만 속한다 (겹침 없음)', () => {
    const seen = new Map<string, string>()
    for (const c of CLUSTERS) {
      for (const id of c.memberIds) {
        expect(seen.has(id), `${id} 가 ${seen.get(id)} 와 ${c.id} 에 중복`).toBe(false)
        seen.set(id, c.id)
      }
    }
  })

  it('clusterById / clusterOfStandard 조회', () => {
    expect(clusterById('cl-el-pe-body')?.label).toBe('몸·놀이')
    expect(clusterById('없음')).toBeUndefined()
    expect(clusterOfStandard('std-2즐01-02')?.id).toBe('cl-el-pe-body')
    expect(clusterOfStandard('nuri-com-8')?.id).toBe('cl-nuri-ko-literacy')
  })
})
