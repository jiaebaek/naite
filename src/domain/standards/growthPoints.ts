/**
 * 성장 좌표(Growth Coordinate) 큐레이션 데이터 — 취학전(누리) 전 영역 (SSOT §5-B).
 *
 * 큐레이션 원본 = [14-성장좌표-데이터모델-과학탐구.md] + [15-성장좌표-큐레이션-취학전.md] (전략 산출물).
 * ⚠️ 그대로 인코딩 — 임의 자작·추가 금지. 관찰행동 근거(sourceRef)=누리 원문(child2021 런타임 id).
 *
 * 4층 분리(§5-B): ①기준(근거, 뒤) ②관찰행동(부모 언어, 앞) ③좌표(관찰로 계산한 지금 모습) ④다음 경험.
 *   - GrowthPoint ← 기존 묶음(cluster). 취학전 14묶음 = 14 GrowthPoint. (초1~2 std-*는 미큐레이션.)
 *   - 부모 화면 = 서술(label). 내부 order(ordinal)은 계산용·비노출.
 *   - 덜 보임 = 결핍 아니라 다음 경험. 또래비교·도달선·정상지연 없음(가드레일).
 */
import type { Domain, StandardId } from '../types'

/** 관찰 가능한 행동 — 완만한 연속선(내부 ordinal=order). parentText=체크 문항, label=도달 시 부모 서술. */
export interface ObservableBehavior {
  readonly order: number
  readonly parentText: string
  readonly label: string
  readonly sourceRef: StandardId
}

/** 다음 경험 — observedOrder <= uptoOrder 일 때 제안. activityId 없으면 "가볍게/급하지 않아요". */
export interface NextExperience {
  readonly uptoOrder: number
  readonly parentText: string
  readonly activityId?: string
}

export interface GrowthPoint {
  readonly id: string
  readonly domain: Domain
  /** 기존 묶음(cluster) id — 커버리지/이룸을 좌표 근거로 잇는다. */
  readonly clusterId: string
  readonly name: string
  readonly blurb: string
  readonly behaviors: readonly ObservableBehavior[]
  readonly nextExperiences: readonly NextExperience[]
  readonly sourceRefs: readonly StandardId[]
}

const S = (code: string): StandardId => `nuri-${code}`

// ── 과학·탐구 (doc14) ──
const SCI: readonly GrowthPoint[] = [
  {
    id: 'sci-inquiry', domain: '과학·탐구', clusterId: 'cl-nuri-sci-inquiry',
    name: '탐구하는 태도', blurb: "궁금한 걸 알아가는 힘 — 이 시기엔 '왜?'가 자라는 게 중요해요.",
    sourceRefs: [S('nat-1'), S('nat-2'), S('nat-3')],
    behaviors: [
      { order: 1, parentText: '새로운 것·자연을 보면 관심 있게 봐요', label: '새로운 것에 관심을 보이는 모습이 보여요', sourceRef: S('nat-1') },
      { order: 2, parentText: '"왜?"·"이건 뭐야?" 궁금한 걸 물어봐요', label: '궁금한 걸 물어보는 모습이 보여요', sourceRef: S('nat-1') },
      { order: 3, parentText: '궁금하면 직접 만져보고 살펴봐요', label: '궁금하면 직접 알아보는 모습이 보여요', sourceRef: S('nat-2') },
      { order: 4, parentText: '한 방법이 안 되면 다른 방법도 해봐요', label: '여러 방법으로 알아보는 모습이 보여요', sourceRef: S('nat-2') },
      { order: 5, parentText: '발견한 걸 이야기하거나 다른 사람 생각도 궁금해해요', label: '발견을 나누고 다른 생각에도 관심 갖는 모습이 보여요', sourceRef: S('nat-3') },
    ],
    nextExperiences: [
      { uptoOrder: 1, parentText: "다음엔 '왜?'를 같이 궁금해하는 모습을 볼 수 있어요", activityId: 'act-sci-1' },
      { uptoOrder: 3, parentText: '다음엔 여러 방법으로 알아보는 모습을 볼 수 있어요', activityId: 'act-sci-4' },
      { uptoOrder: 5, parentText: '충분히 잘 자라고 있어요 — 급하지 않아요' },
    ],
  },
  {
    id: 'sci-things', domain: '과학·탐구', clusterId: 'cl-nuri-sci-things',
    name: '사물·도구 살펴보기', blurb: '물건이 어떻게 되고 도구가 어떻게 움직이는지 알아가요.',
    sourceRefs: [S('nat-4'), S('nat-10')],
    behaviors: [
      { order: 1, parentText: '물건의 다른 점(크기·무게·촉감)을 알아차려요', label: '물건의 다른 점을 알아차리는 모습이 보여요', sourceRef: S('nat-4') },
      { order: 2, parentText: '물건이 어떻게 되는지(섞이나·뜨나) 해보고 봐요', label: '직접 해보며 살펴보는 모습이 보여요', sourceRef: S('nat-4') },
      { order: 3, parentText: '가위·집게·자석 같은 도구에 관심 가져요', label: '도구에 관심 갖는 모습이 보여요', sourceRef: S('nat-10') },
      { order: 4, parentText: '도구를 직접 써보려고 해요', label: '도구를 스스로 써보는 모습이 보여요', sourceRef: S('nat-10') },
    ],
    nextExperiences: [
      { uptoOrder: 2, parentText: '다음엔 도구가 어떻게 움직이나 함께 살펴보는 모습을 볼 수 있어요', activityId: 'act-sci-5' },
      { uptoOrder: 4, parentText: '충분히 잘 자라고 있어요 — 급하지 않아요' },
    ],
  },
  {
    id: 'sci-nature', domain: '과학·탐구', clusterId: 'cl-nuri-sci-nature',
    name: '자연·생명 느끼기', blurb: '동식물·날씨·계절을 관심 있게 보고 아껴요.',
    sourceRefs: [S('nat-11'), S('nat-12'), S('nat-13')],
    behaviors: [
      { order: 1, parentText: '동식물(개미·꽃·강아지)에 관심을 보여요', label: '동식물에 관심을 보이는 모습이 보여요', sourceRef: S('nat-11') },
      { order: 2, parentText: '식물·동물을 아끼고 함부로 하지 않으려 해요', label: '생명을 아끼는 모습이 보여요', sourceRef: S('nat-12') },
      { order: 3, parentText: '날씨·계절 변화를 알아차리고 말해요("추워졌어")', label: '날씨·계절 변화를 알아차리는 모습이 보여요', sourceRef: S('nat-13') },
      { order: 4, parentText: '날씨에 맞춰 뭘 할지 연결해요("비 오니 우산")', label: '변화를 생활과 연결하는 모습이 보여요', sourceRef: S('nat-13') },
    ],
    nextExperiences: [
      { uptoOrder: 1, parentText: '다음엔 개미·꽃을 함께 관찰하는 모습을 볼 수 있어요', activityId: 'act-sci-6' },
      { uptoOrder: 3, parentText: '다음엔 창밖 날씨를 보고 옷을 정해보는 모습을 볼 수 있어요', activityId: 'act-sci-9' },
      { uptoOrder: 4, parentText: '충분히 잘 자라고 있어요 — 급하지 않아요' },
    ],
  },
]

// ── 국어 (doc15) ──
const KO: readonly GrowthPoint[] = [
  {
    id: 'ko-listen', domain: '국어', clusterId: 'cl-nuri-ko-listen',
    name: '말하고 듣기', blurb: '자기 생각을 말하고, 남의 말을 듣는 힘.',
    sourceRefs: [S('com-1'), S('com-2'), S('com-3'), S('com-4'), S('com-5'), S('com-6')],
    behaviors: [
      { order: 1, parentText: '말·이야기를 관심 있게 들어요', label: '말을 관심 있게 듣는 모습이 보여요', sourceRef: S('com-1') },
      { order: 2, parentText: '자기 경험·기분을 말로 이야기해요', label: '자기 이야기를 말로 하는 모습이 보여요', sourceRef: S('com-2') },
      { order: 3, parentText: '상황·상대에 맞게 고운 말로 말해요', label: '상황에 맞게 말하는 모습이 보여요', sourceRef: S('com-3') },
      { order: 4, parentText: '상대 말을 듣고 이어서 주고받아요', label: '대화를 주고받는 모습이 보여요', sourceRef: S('com-4') },
    ],
    nextExperiences: [
      { uptoOrder: 1, parentText: '다음엔 오늘 있었던 일을 물어보고 끝까지 듣는 모습을 볼 수 있어요', activityId: 'act-ko-2' },
      { uptoOrder: 3, parentText: "다음엔 '모르겠어요'도 편히 말하는 모습을 볼 수 있어요", activityId: 'act-ko-3' },
      { uptoOrder: 4, parentText: '충분히 잘 자라고 있어요 — 급하지 않아요' },
    ],
  },
  {
    id: 'ko-literacy', domain: '국어', clusterId: 'cl-nuri-ko-literacy',
    name: '글자에 관심', blurb: '읽기·쓰기로 가는 첫 관심 — 해득(읽고 쓰기)은 초등이에요.',
    sourceRefs: [S('com-7'), S('com-8'), S('com-9')],
    behaviors: [
      { order: 1, parentText: '주변 글자(간판·과자봉지)에 관심 가져요', label: '주변 글자에 관심 갖는 모습이 보여요', sourceRef: S('com-8') },
      { order: 2, parentText: '아는 글자를 찾아내요', label: '아는 글자를 찾아내는 모습이 보여요', sourceRef: S('com-8') },
      { order: 3, parentText: '말과 글이 이어진다는 걸 알아가요', label: '말과 글의 관계를 알아가는 모습이 보여요', sourceRef: S('com-7') },
      { order: 4, parentText: '글자 비슷한 형태로 끄적여 표현해요', label: '끄적여 표현하는 모습이 보여요', sourceRef: S('com-9') },
    ],
    nextExperiences: [
      { uptoOrder: 1, parentText: '다음엔 마트·길에서 글자를 함께 찾는 모습을 볼 수 있어요', activityId: 'act-ko-4' },
      { uptoOrder: 3, parentText: '다음엔 그림에 끄적이며 표현하는 모습을 볼 수 있어요(쓰기 강요는 아니에요)', activityId: 'act-ko-5' },
      { uptoOrder: 4, parentText: '충분히 잘 자라고 있어요 — 급하지 않아요' },
    ],
  },
  {
    id: 'ko-book', domain: '국어', clusterId: 'cl-nuri-ko-book',
    name: '책·이야기 즐기기', blurb: '책과 이야기를 즐기는 마음.',
    sourceRefs: [S('com-10'), S('com-11'), S('com-12')],
    behaviors: [
      { order: 1, parentText: '책에 관심 갖고 그림·이야기를 즐겨요', label: '책을 즐기는 모습이 보여요', sourceRef: S('com-10') },
      { order: 2, parentText: '동화·동시의 말 재미(반복·운율)를 느껴요', label: '말의 재미를 느끼는 모습이 보여요', sourceRef: S('com-11') },
      { order: 3, parentText: '끝까지 듣거나 이야기를 상상해요', label: '이야기를 상상하는 모습이 보여요', sourceRef: S('com-10') },
      { order: 4, parentText: '말놀이·이야기 짓기를 즐겨요', label: '말놀이·이야기 짓기를 즐기는 모습이 보여요', sourceRef: S('com-12') },
    ],
    nextExperiences: [
      { uptoOrder: 1, parentText: '다음엔 자기 전 그림책 한 권을 함께 보는 모습을 볼 수 있어요', activityId: 'act-ko-1' },
      { uptoOrder: 3, parentText: '다음엔 끝말잇기·동시 리듬을 즐기는 모습을 볼 수 있어요', activityId: 'act-ko-7' },
      { uptoOrder: 4, parentText: '충분히 잘 자라고 있어요 — 급하지 않아요' },
    ],
  },
]

// ── 수학 (doc15) ──
const MATH: readonly GrowthPoint[] = [
  {
    id: 'math-explore', domain: '수학', clusterId: 'cl-nuri-ma-explore',
    name: '생활 속 수학', blurb: '세고 비교하고 규칙을 찾는 힘 — 취학전엔 연산이 아니에요.',
    sourceRefs: [S('nat-5'), S('nat-6'), S('nat-7'), S('nat-8'), S('nat-9')],
    behaviors: [
      { order: 1, parentText: '물건을 하나둘 세요', label: '수를 세는 모습이 보여요', sourceRef: S('nat-5') },
      { order: 2, parentText: '개수와 수를 연결해요("3개=3")', label: '수를 세고 개수를 아는 모습이 보여요', sourceRef: S('nat-5') },
      { order: 3, parentText: '크다/작다·길다/짧다 비교해요', label: '비교하는 모습이 보여요', sourceRef: S('nat-7') },
      { order: 4, parentText: '색·모양으로 모아 분류해요', label: '비교하고 분류하는 모습이 보여요', sourceRef: S('nat-9') },
      { order: 5, parentText: '반복 규칙을 알아차리고 이어가요 · 위치(위/앞)를 말해요', label: '규칙·공간을 알아가는 모습이 보여요', sourceRef: S('nat-8') },
    ],
    nextExperiences: [
      { uptoOrder: 1, parentText: '다음엔 개수를 세며 나눠주는 모습을 볼 수 있어요', activityId: 'act-ma-1' },
      { uptoOrder: 3, parentText: '다음엔 길이를 비교하고 규칙을 잇는 모습을 볼 수 있어요', activityId: 'act-ma-4' },
      { uptoOrder: 5, parentText: '충분히 잘 자라고 있어요 — 급하지 않아요' },
    ],
  },
]

// ── 사회·인성 (doc15) ──
const SOC: readonly GrowthPoint[] = [
  {
    id: 'soc-self', domain: '사회·인성', clusterId: 'cl-nuri-soc-self',
    name: '나 알기·자기조절', blurb: '나를 알고 마음을 다스리는 힘.',
    sourceRefs: [S('soc-1'), S('soc-2'), S('soc-3')],
    behaviors: [
      { order: 1, parentText: '자기를 소중히 여기고 좋아하는 걸 알아요', label: '자기를 소중히 여기는 모습이 보여요', sourceRef: S('soc-1') },
      { order: 2, parentText: '기쁨·속상함을 말로 표현해요', label: '감정을 말로 표현하는 모습이 보여요', sourceRef: S('soc-2') },
      { order: 3, parentText: '할 수 있는 것(신발·정리)을 스스로 해요', label: '스스로 해보는 모습이 보여요', sourceRef: S('soc-3') },
    ],
    nextExperiences: [
      { uptoOrder: 1, parentText: '다음엔 오늘 기분을 한 단어로 말해보는 모습을 볼 수 있어요', activityId: 'act-soc-1' },
      { uptoOrder: 2, parentText: '다음엔 스스로 정리 한 가지를 해보는 모습을 볼 수 있어요', activityId: 'act-soc-2' },
      { uptoOrder: 3, parentText: '충분히 잘 자라고 있어요 — 급하지 않아요' },
    ],
  },
  {
    id: 'soc-together', domain: '사회·인성', clusterId: 'cl-nuri-soc-together',
    name: '더불어 살기', blurb: '함께 지내는 마음과 규칙.',
    sourceRefs: [S('soc-4'), S('soc-5'), S('soc-6'), S('soc-7'), S('soc-8'), S('soc-9')],
    behaviors: [
      { order: 1, parentText: '가족·친구와 어울려 지내요', label: '친구와 어울리는 모습이 보여요', sourceRef: S('soc-4') },
      { order: 2, parentText: '차례를 기다리고 약속을 지키려 해요', label: '차례·약속을 지키려는 모습이 보여요', sourceRef: S('soc-9') },
      { order: 3, parentText: '다툼을 말로 풀려고 해요', label: '다툼을 말로 풀려는 모습이 보여요', sourceRef: S('soc-6') },
      { order: 4, parentText: '예의를 지키고 다른 감정·생각을 존중해요', label: '서로를 존중하는 모습이 보여요', sourceRef: S('soc-7') },
    ],
    nextExperiences: [
      { uptoOrder: 1, parentText: '다음엔 순서·차례를 함께 지켜보는 모습을 볼 수 있어요', activityId: 'act-soc-5' },
      { uptoOrder: 3, parentText: '다음엔 갈등이 생겼을 때 쓸 말을 함께 만들어보는 모습을 볼 수 있어요', activityId: 'act-soc-4' },
      { uptoOrder: 4, parentText: '충분히 잘 자라고 있어요 — 급하지 않아요' },
    ],
  },
  {
    id: 'soc-world', domain: '사회·인성', clusterId: 'cl-nuri-soc-world',
    name: '사회·세상 관심', blurb: '동네·나라·다른 문화에 대한 관심.',
    sourceRefs: [S('soc-10'), S('soc-11'), S('soc-12')],
    behaviors: [
      { order: 1, parentText: '사는 동네·주변을 궁금해해요', label: '동네·주변을 궁금해하는 모습이 보여요', sourceRef: S('soc-10') },
      { order: 2, parentText: '우리나라에 친근함을 느껴요', label: '우리나라에 친근함을 느끼는 모습이 보여요', sourceRef: S('soc-11') },
      { order: 3, parentText: '다른 나라·문화 이야기에 관심 가져요', label: '다른 문화에 관심 갖는 모습이 보여요', sourceRef: S('soc-12') },
    ],
    nextExperiences: [
      { uptoOrder: 3, parentText: '동네·세상 이야기를 일상에서 가볍게 나눠보세요 — 급하지 않아요' },
    ],
  },
]

// ── 예체능 (doc15) ──
const PE: readonly GrowthPoint[] = [
  {
    id: 'pe-art', domain: '예체능', clusterId: 'cl-nuri-pe-art',
    name: '예술로 표현·감상', blurb: '느낌을 표현하고 아름다움을 느끼는 마음.',
    sourceRefs: [S('art-1'), S('art-3'), S('art-4'), S('art-5'), S('art-6'), S('art-8')],
    behaviors: [
      { order: 1, parentText: '노래·음악을 즐겨요', label: '노래·음악을 즐기는 모습이 보여요', sourceRef: S('art-3') },
      { order: 2, parentText: '그리기·만들기로 생각·느낌을 표현해요', label: '그리기·만들기로 표현하는 모습이 보여요', sourceRef: S('art-6') },
      { order: 3, parentText: '몸·사물·악기로 소리·리듬·춤을 만들어요', label: '리듬·춤으로 표현하는 모습이 보여요', sourceRef: S('art-4') },
      { order: 4, parentText: '자연·예술의 아름다움을 느끼고 감상해요', label: '아름다움을 느끼고 감상하는 모습이 보여요', sourceRef: S('art-1') },
    ],
    nextExperiences: [
      { uptoOrder: 1, parentText: '다음엔 동요를 함께 부르는 모습을 볼 수 있어요', activityId: 'act-pe-1' },
      { uptoOrder: 3, parentText: '다음엔 자유롭게 그리는 모습을 볼 수 있어요(완성도는 안 봐요)', activityId: 'act-pe-2' },
      { uptoOrder: 4, parentText: '충분히 잘 자라고 있어요 — 급하지 않아요' },
    ],
  },
  {
    id: 'pe-body', domain: '예체능', clusterId: 'cl-nuri-pe-body',
    name: '신체활동', blurb: '몸을 움직이며 크는 힘.',
    sourceRefs: [S('phy-1'), S('phy-2'), S('phy-3'), S('phy-4')],
    behaviors: [
      { order: 1, parentText: '몸을 크게 움직이며 신나게 놀아요', label: '신나게 몸을 움직이는 모습이 보여요', sourceRef: S('phy-4') },
      { order: 2, parentText: '뛰기·던지기·기어가기 등 기초 운동을 해요', label: '기초 운동을 하는 모습이 보여요', sourceRef: S('phy-3') },
      { order: 3, parentText: '균형·멈춤 등 몸을 조절해요', label: '몸을 조절하는 모습이 보여요', sourceRef: S('phy-2') },
    ],
    nextExperiences: [
      { uptoOrder: 1, parentText: '다음엔 공을 던지고 받는 모습을 볼 수 있어요', activityId: 'act-pe-5' },
      { uptoOrder: 2, parentText: '다음엔 한 발 서기·깡충 뛰기를 해보는 모습을 볼 수 있어요', activityId: 'act-pe-6' },
      { uptoOrder: 3, parentText: '충분히 잘 자라고 있어요 — 급하지 않아요' },
    ],
  },
]

// ── 건강·안전 (doc15) ──
const HS: readonly GrowthPoint[] = [
  {
    id: 'hs-health', domain: '건강·안전', clusterId: 'cl-nuri-hs-health',
    name: '건강 습관', blurb: '몸을 건강히 챙기는 습관.',
    sourceRefs: [S('hlt-1'), S('hlt-2'), S('hlt-3'), S('hlt-4')],
    behaviors: [
      { order: 1, parentText: '손 씻기·양치를 (도와줘도) 하려 해요', label: '위생 습관을 챙기려는 모습이 보여요', sourceRef: S('hlt-1') },
      { order: 2, parentText: '골고루·바른 자세로 먹으려 해요', label: '골고루 먹으려는 모습이 보여요', sourceRef: S('hlt-2') },
      { order: 3, parentText: '적당히 쉬고, 아프면 말해요', label: '몸 상태를 챙기고 말하는 모습이 보여요', sourceRef: S('hlt-3') },
    ],
    nextExperiences: [
      { uptoOrder: 1, parentText: '다음엔 손 씻기·양치를 곁에서 함께하는 모습을 볼 수 있어요', activityId: 'act-hs-1' },
      { uptoOrder: 2, parentText: '다음엔 밥 먹으며 음식 이야기를 나누는 모습을 볼 수 있어요', activityId: 'act-hs-2' },
      { uptoOrder: 3, parentText: '충분히 잘 자라고 있어요 — 급하지 않아요' },
    ],
  },
  {
    id: 'hs-safety', domain: '건강·안전', clusterId: 'cl-nuri-hs-safety',
    name: '안전 습관', blurb: '위험을 알고 조심하는 힘.',
    sourceRefs: [S('saf-1'), S('saf-2'), S('saf-3'), S('saf-4')],
    behaviors: [
      { order: 1, parentText: '화면(TV·폰)을 정한 만큼만 봐요', label: '약속한 만큼 화면을 보는 모습이 보여요', sourceRef: S('saf-2') },
      { order: 2, parentText: '길 건널 때 멈추고 좌우를 살펴요', label: '길에서 조심하는 모습이 보여요', sourceRef: S('saf-3') },
      { order: 3, parentText: '위험한 곳·상황을 조심하고 대처를 알아요', label: '위험을 알고 대처하는 모습이 보여요', sourceRef: S('saf-1') },
    ],
    nextExperiences: [
      { uptoOrder: 1, parentText: '다음엔 영상 약속을 함께 정하는 모습을 볼 수 있어요', activityId: 'act-hs-3' },
      { uptoOrder: 2, parentText: '다음엔 멈춰-보고-건너기를 해보는 모습을 볼 수 있어요', activityId: 'act-hs-4' },
      { uptoOrder: 3, parentText: '충분히 잘 자라고 있어요 — 급하지 않아요' },
    ],
  },
]

/** 취학전(누리) 전 영역 성장 좌표 — 14 GrowthPoint (14 묶음 매핑). 영어는 대상 아님(자체목표). */
export const GROWTH_POINTS: readonly GrowthPoint[] = [...SCI, ...KO, ...MATH, ...SOC, ...PE, ...HS]

/** id → GrowthPoint. */
export function growthPointById(id: string): GrowthPoint | undefined {
  return GROWTH_POINTS.find((g) => g.id === id)
}

/** 묶음 id → GrowthPoint (커버리지/이룸을 좌표로 잇는다). */
export function growthPointByCluster(clusterId: string): GrowthPoint | undefined {
  return GROWTH_POINTS.find((g) => g.clusterId === clusterId)
}

/** 현재 band 묶음 집합에 해당하는 GrowthPoint 들(취학전만 큐레이션 · 초1~2는 빈 배열). */
export function growthPointsForClusters(clusterIds: ReadonlySet<string>): readonly GrowthPoint[] {
  return GROWTH_POINTS.filter((g) => clusterIds.has(g.clusterId))
}
