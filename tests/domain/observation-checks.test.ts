/**
 * 생활·마음 관찰 체크 (T9 · §06-B · docs/11 §7).
 * 질문은 생활·마음 묶음에 속하고, 모든 질문 '예'일 때만 그 묶음을 이룸으로 본다(보수적·신뢰①).
 */
import { describe, it, expect } from 'vitest'
import {
  OBSERVATION_CHECKS,
  checksForClusters,
  achievedClustersFrom,
} from '../../src/domain/standards/observationChecks'
import { CLUSTERS } from '../../src/domain/standards/clusters'
import { LIFE_DOMAINS } from '../../src/domain/lanes'

const clById = new Map(CLUSTERS.map((c) => [c.id, c]))

describe('관찰 체크 데이터 무결성', () => {
  it('모든 질문 묶음이 존재하고 생활·마음 레인이다', () => {
    for (const chk of OBSERVATION_CHECKS) {
      const cl = clById.get(chk.clusterId)
      expect(cl, `없는 묶음 ${chk.clusterId}`).toBeDefined()
      expect(LIFE_DOMAINS.includes(cl!.domain), `${chk.clusterId} 는 생활 레인이어야`).toBe(true)
      expect(chk.questions.length).toBeGreaterThan(0)
    }
  })

  it('질문 id 가 전역에서 중복되지 않는다', () => {
    const ids = OBSERVATION_CHECKS.flatMap((c) => c.questions.map((q) => q.id))
    expect(new Set(ids).size).toBe(ids.length)
  })

  it('취학 전 10문항 / 초1~2 8문항 (docs/11 §7)', () => {
    const count = (prefix: string) => OBSERVATION_CHECKS
      .filter((c) => c.clusterId.startsWith(prefix))
      .reduce((n, c) => n + c.questions.length, 0)
    expect(count('cl-nuri-')).toBe(10)
    expect(count('cl-el-')).toBe(8)
  })

  it('checksForClusters 는 현재 band 묶음만 준다', () => {
    const nuri = checksForClusters(new Set(['cl-nuri-soc-self', 'cl-nuri-hs-health']))
    expect(nuri.map((c) => c.clusterId)).toEqual(['cl-nuri-soc-self', 'cl-nuri-hs-health'])
  })
})

describe('⭐ achievedClustersFrom — 모든 질문 예일 때만 이룸 (과소청구)', () => {
  const check = OBSERVATION_CHECKS.find((c) => c.clusterId === 'cl-nuri-soc-self')!
  const [q1, q2] = check.questions

  it('묶음의 모든 질문이 예 → 그 묶음 이룸', () => {
    const answers = { [q1!.id]: 'yes' as const, [q2!.id]: 'yes' as const }
    expect(achievedClustersFrom([check], answers)).toEqual(['cl-nuri-soc-self'])
  })

  it('일부만 예(나머지 아직/모름) → 이룸 아님', () => {
    expect(achievedClustersFrom([check], { [q1!.id]: 'yes', [q2!.id]: 'not-yet' })).toEqual([])
    expect(achievedClustersFrom([check], { [q1!.id]: 'yes' })).toEqual([])
  })

  it('아무 답 없음 → 빈 배열', () => {
    expect(achievedClustersFrom([check], {})).toEqual([])
  })
})
