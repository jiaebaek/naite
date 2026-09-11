/**
 * 예시 데이터 (인터뷰 A3·A4 의 실제 학원·활동).
 *
 * ⚠️ 앱은 더 이상 이걸 기본값으로 쓰지 않는다 — 빈 상태로 시작하고, 데이터는 사용자가
 *    온보딩 셋업(§06-A)·관리에서 직접 입력한다. 이 파일은 이제 **테스트 픽스처/예시**다.
 *
 * ⭐ 커버리지는 활동/등원이 명시적으로 겨냥한 **묶음(cluster) id**로만 잡힌다(T7 모델 A · docs/11 §5).
 *    커버 방식은 둘(T8·SSOT §5):
 *      - 숙제형 학원(한글·수학) = 딸린 **숙제 활동**(targetIds)이 커버. 오늘 화면에 체크로 뜬다.
 *      - 등원형 학원(미술·유아체육) = 등원 자체(`coversClusters`)가 커버. 오늘 화면엔 일정만(체크 X).
 *
 * 이 가족의 그림: 국어·수학·예체능·영어는 챙기는 중, **과학·탐구(학습 갭)**. 생활·마음(사회·인성·건강·안전)은
 *   안심 레인이라 배너 갭으로 세지 않는다.
 */

import type { Academy, Activity } from '../domain/types'

export const SEED_ACADEMIES: readonly Academy[] = [
  // 더하다 = 숙제형. 숙제(한글·팩토)가 국어·수학 묶음을 챙긴다.
  { id: 'ac-plus', name: '더하다사고력', weekdays: [1], time: '14:30', active: true },
  // 미술·유아체육 = 등원형. 숙제 없이 등원 자체가 예체능 묶음을 챙긴다(오늘=일정만).
  { id: 'ac-art', name: '아이마음아트', weekdays: [3], time: '14:30', coversClusters: ['cl-nuri-pe-art'], active: true },
  { id: 'ac-pe', name: '유아체육', weekdays: [0], time: '13:30', coversClusters: ['cl-nuri-pe-body'], active: true },
]

export const SEED_ACTIVITIES: readonly Activity[] = [
  // ── 학원 숙제 (academyId 로 연결) ──────────────────
  {
    id: 'hw-hangul',
    name: '한글 학원 숙제',
    domain: '국어',
    track: '학원',
    // 프리셋 '한글' → 취학 전 묶음 '읽기·쓰기 관심'(글자 읽기 관심, 해득 아님).
    targetIds: ['cl-nuri-ko-literacy'],
    cadence: { kind: '주N회', times: 1 },
    owner: '아빠',
    active: true,
    academyId: 'ac-plus',
  },
  {
    id: 'hw-facto',
    name: '팩토 숙제',
    domain: '수학',
    track: '학원',
    // 프리셋 '사고력수학' → 취학 전 묶음 '생활 속 수·규칙·공간'.
    targetIds: ['cl-nuri-ma-explore'],
    cadence: { kind: '주N회', times: 1 },
    owner: '아빠',
    active: true,
    academyId: 'ac-plus',
  },
  // (미술·유아체육은 등원형 → 숙제 활동 없음. 예체능 커버는 학원 coversClusters 로.)

  // ── 엄마표 활동 (academyId 없음) ───────────────────
  {
    id: 'board-game',
    name: '수학 보드게임',
    domain: '수학',
    track: '집',
    // 프리셋 '보드게임' → 취학 전 묶음 '생활 속 수·규칙·공간'.
    targetIds: ['cl-nuri-ma-explore'],
    cadence: { kind: '주N회', times: 2 },
    owner: '엄마',
    active: true,
  },
  {
    id: 'alpha',
    name: '알파짱 워크지',
    domain: '수학',
    track: '집',
    targetIds: [],
    cadence: { kind: '주N회', times: 3 },
    owner: '엄마',
    active: true,
  },
  {
    id: 'en-book',
    name: '영어 원서 1권',
    domain: '영어',
    track: '집',
    targetIds: ['own-en-listen-picturebook'],
    cadence: { kind: '매일' },
    owner: '엄마',
    active: true,
  },
  {
    id: 'en-video',
    name: '영어 영상 20분',
    domain: '영어',
    track: '집',
    targetIds: ['own-en-daily-video'],
    cadence: { kind: '매일' },
    owner: '엄마',
    active: true,
  },
]
