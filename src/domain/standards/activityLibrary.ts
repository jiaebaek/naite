/**
 * 큐레이션 활동 라이브러리 — 명세 §10-A (1).
 *
 * ⚠️⚠️ 이 파일에는 **근거 없는 자작 활동을 절대 넣지 않는다.** 각 항목은 source + sourceRef 로
 *    출처를 밝혀야 한다(§10-A 출처표):
 *      - nuri        : 누리과정 놀이실행자료 / i-누리 포털 놀이사례 (공교육·누리과정)
 *      - achievement : 성취기준 '교수·학습 방법 및 유의사항'을 가정용으로 번안 (공교육·성취기준)
 *      - self        : 육아종합지원센터 등 공공자료 · 전문가 컨센서스형 일상활동 (근거 표기 필수)
 *    ⛔ 사설 학습지·교과서/지도서 활동 그대로 금지.
 *
 * 아직 **큐레이션 전이라 비어 있다.** 비면 recommendForGap 이 null(추천 없음)을 반환하고,
 * 화면은 추천을 아예 띄우지 않는다(원칙3). 근거 붙은 시드가 채워질 때까지 이대로 둔다.
 * (초판에 있던 하드코딩 추천 문구는 근거 없는 자작이라 제거했다 — 신뢰가 유일한 해자다.)
 */

import type { RecommendedActivity } from '../recommend'

export const ACTIVITY_LIBRARY: readonly RecommendedActivity[] = []
