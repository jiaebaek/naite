/**
 * 예시 데이터 (인터뷰 A3·A4 의 실제 학원·활동).
 *
 * ⚠️ 앱은 더 이상 이걸 기본값으로 쓰지 않는다 — 빈 상태로 시작하고, 데이터는 사용자가
 *    온보딩 셋업(§06-A)·관리에서 직접 입력한다. 이 파일은 이제 **테스트 픽스처/예시**다.
 *
 * ⭐ 커버리지는 활동이 명시적으로 겨냥한 **묶음(cluster) id**로만 잡힌다(T7 모델 A · docs/11 §5).
 *    등원(coversDomains)은 커버리지에 쓰지 않는다 — 학원마다 **숙제 활동**을 두고 그 활동이
 *    프리셋 묶음(취학 전 cl-nuri-*)을 겨냥한다(셋업이 자동 생성하는 것과 같은 모양).
 *
 * 이 가족의 그림: 국어·수학·예체능·영어는 챙기는 중, **과학·탐구·사회·인성·건강·안전은 갭**이다.
 *   (유아체육은 예체능 신체활동을 챙기지만 '안전하게 생활하기'(건강·안전)까지 챙기진 않는다 —
 *    영역 통째 챙김을 주장하지 않는 게 신뢰다. 안전은 집에서만 채워지는 실제 갭.)
 */

import type { Academy, Activity } from '../domain/types'

export const SEED_ACADEMIES: readonly Academy[] = [
  // 더하다는 숙제(한글·팩토)가 국어·수학을 챙긴다. 등원용 영역은 없다.
  { id: 'ac-plus', name: '더하다사고력', weekdays: [1], time: '14:30', active: true },
  // 미술·체육은 등원 엔티티 + 각자의 숙제 활동(hw-art·hw-pe)이 예체능을 챙긴다.
  // coversDomains 는 과목 메타데이터일 뿐 커버리지 산정엔 쓰지 않는다.
  { id: 'ac-art', name: '아이마음아트', weekdays: [3], time: '14:30', coversDomains: ['예체능'], active: true },
  { id: 'ac-pe', name: '유아체육', weekdays: [0], time: '13:30', coversDomains: ['예체능'], active: true },
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
  {
    id: 'hw-art',
    name: '미술 학원 숙제',
    domain: '예체능',
    track: '학원',
    // 프리셋 '미술' → 취학 전 묶음 '예술 경험'.
    targetIds: ['cl-nuri-pe-art'],
    cadence: { kind: '주N회', times: 1 },
    owner: '엄마',
    active: true,
    academyId: 'ac-art',
  },
  {
    id: 'hw-pe',
    name: '유아체육 숙제',
    domain: '예체능',
    track: '학원',
    // 프리셋 '유아체육' → 취학 전 묶음 '신체활동'.
    targetIds: ['cl-nuri-pe-body'],
    cadence: { kind: '주N회', times: 1 },
    owner: '엄마',
    active: true,
    academyId: 'ac-pe',
  },

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
