/**
 * 생활·마음 관찰 체크 질문 (T9 · §06-B · 큐레이션 원본 docs/11 §7).
 *
 * 생활·마음(사회·인성·건강·안전)은 학원이 없어 활동 입력이 안 맞는다. 대신 **성취기준(관찰가능
 * 행동)을 부드러운 질문**으로 물어 부모가 체크한다 → "예"=이룸(부모 관찰=이룸, SSOT §2·§5).
 *   - ⚠️ 평가·점수 아님(OOS-6): "테스트" 표현 금지. "우리 아이 요즘 이런 것 하나요?" 톤.
 *   - 3택: 예 / 아직 / 모름. "예"만 기록(이룸). "아직"=넛지 없이 그냥, "모름"=미표시.
 *   - 한 묶음의 질문에 **모두 '예'** 여야 그 묶음을 이룸으로 본다(보수적 과소청구·신뢰①).
 *   - 질문은 묶음(cluster)에 속하고 clusterId 로 이룸(achieved)에 반영된다(묶음 단위).
 */

export interface ObsQuestion {
  readonly id: string
  readonly text: string
}
export interface ObsCheck {
  /** 이 질문들이 속한 묶음 id (생활·마음 레인). */
  readonly clusterId: string
  readonly questions: readonly ObsQuestion[]
}

const q = (clusterId: string, ...texts: string[]): ObsCheck => ({
  clusterId,
  questions: texts.map((text, i) => ({ id: `${clusterId}-q${i + 1}`, text })),
})

export const OBSERVATION_CHECKS: readonly ObsCheck[] = [
  // ── 취학 전 (nuri · 총 10문항) ──
  q('cl-nuri-soc-self', '속상하거나 기쁠 때 말로 표현하나요?', '신발 신기·정리 같은 걸 스스로 하려 하나요?'),
  q('cl-nuri-soc-together', '친구와 어울려 놀거나 양보해본 적 있나요?', '차례를 기다리거나 약속을 지키려 하나요?'),
  q('cl-nuri-soc-world', '사는 동네·주변을 궁금해하나요?', '다른 사람·다른 나라 이야기에 관심 보이나요?'),
  q('cl-nuri-hs-health', '손 씻기·양치를 (도와줘도) 하나요?', '골고루·바른 자세로 먹으려 하나요?'),
  q('cl-nuri-hs-safety', '화면(TV·폰)을 정한 만큼만 보나요?', '길 건널 때 멈추고 좌우를 살피나요?'),
  // ── 초1~2 (elem · 총 8문항) ──
  q('cl-el-soc-self', '준비물·숙제를 스스로 챙기려 하나요?', '자기 감정·생각을 말로 설명하나요?'),
  q('cl-el-soc-community', '친구와 협력하거나 양보하나요?', '규칙·차례를 지키나요?'),
  q('cl-el-soc-world', '우리 동네·나라·다른 문화에 관심 보이나요?', '계절·시간 변화를 이야기하나요?'),
  q('cl-el-hs', '위생·건강 습관을 스스로 챙기나요?', '교통·생활 안전 규칙을 지키나요?'),
]

/** 아이 현재 band 묶음(currentClusterIds)에 해당하는 관찰 체크만. */
export function checksForClusters(clusterIds: ReadonlySet<string>): readonly ObsCheck[] {
  return OBSERVATION_CHECKS.filter((c) => clusterIds.has(c.clusterId))
}

/**
 * 답변(질문 id → 'yes'|'not-yet'|'unknown')에서 **이룸으로 볼 묶음 id** 를 뽑는다.
 * 한 묶음의 모든 질문이 'yes' 일 때만 그 묶음을 이룸으로(보수적·신뢰①).
 */
export function achievedClustersFrom(
  checks: readonly ObsCheck[],
  answers: Readonly<Record<string, 'yes' | 'not-yet' | 'unknown'>>,
): readonly string[] {
  return checks
    .filter((c) => c.questions.length > 0 && c.questions.every((qq) => answers[qq.id] === 'yes'))
    .map((c) => c.clusterId)
}
