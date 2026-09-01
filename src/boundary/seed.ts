/**
 * 초기 데이터. 인터뷰 A3·A4 의 실제 학원·활동.
 *
 * ⚠️ 시드일 뿐이다. 실제 앱에서는 사용자가 등록·편집하는 대로 굴러간다.
 *
 * 학원(Academy) 과 활동(Activity) 을 나눈다:
 *   - 더하다사고력(월) → 한글·팩토 숙제가 딸림
 *   - 아이마음아트(수), 유아체육(일) → 숙제 없음, 등원만
 *   - 영어 원서·영상, 보드게임, 알파짱 → 엄마표(academyId 없음)
 */

import type { Academy, Activity } from '../domain/types'

export const SEED_ACADEMIES: readonly Academy[] = [
  // 더하다는 숙제(한글·팩토)가 국어·수학을 덮으므로 등원용 영역은 없다.
  { id: 'ac-plus', name: '더하다사고력', weekdays: [1], time: '14:30', active: true },
  // 미술·체육은 숙제 없이 등원 자체가 예체능을 챙긴다 (INV-ACAD-06).
  { id: 'ac-art', name: '아이마음아트', weekdays: [3], time: '14:30', coversDomains: ['예체능'], active: true },
  { id: 'ac-pe', name: '유아체육', weekdays: [0], time: '13:30', coversDomains: ['예체능', '건강·안전'], active: true },
]

export const SEED_ACTIVITIES: readonly Activity[] = [
  // ── 학원 숙제 (academyId 로 연결) ──────────────────
  {
    id: 'hw-hangul',
    name: '한글 학원 숙제',
    domain: '국어',
    track: '학원',
    targetIds: ['int-ko-letter-sounds'],
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
    targetIds: ['int-ma-count-20'],
    cadence: { kind: '주N회', times: 1 },
    owner: '아빠',
    active: true,
    academyId: 'ac-plus',
  },

  // ── 엄마표 활동 (academyId 없음) ───────────────────
  {
    id: 'board-game',
    name: '수학 보드게임',
    domain: '수학',
    track: '집',
    targetIds: ['int-ma-pattern'],
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
