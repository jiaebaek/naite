/** 프로토타입의 인라인 SVG 아이콘들. 색은 currentColor/토큰을 따른다. */

export const IconCheck = ({ w = 13 }: { w?: number }) => (
  <svg width={w} height={w} viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth={3.2}>
    <path d="M4 12l5 5L20 6" />
  </svg>
)

export const IconArrow = () => (
  <svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.4}>
    <path d="M5 12h14M13 6l6 6-6 6" />
  </svg>
)

export const IconBack = () => (
  <svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.4}>
    <path d="M15 6l-6 6 6 6" />
  </svg>
)

export const IconPlus = ({ w = 15 }: { w?: number }) => (
  <svg width={w} height={w} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.4}>
    <path d="M12 5v14M5 12h14" />
  </svg>
)

export const IconX = () => (
  <svg width={15} height={15} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.4}>
    <path d="M6 6l12 12M18 6L6 18" />
  </svg>
)

export const IconGear = () => (
  <svg width={17} height={17} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
    <circle cx="12" cy="12" r="3" />
    <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
  </svg>
)

/** 브랜드 마크 — 나이테 동심원 */
export const BrandMark = () => (
  <svg className="mark" viewBox="0 0 32 32" fill="none" aria-hidden="true">
    <circle cx="16" cy="16" r="14" stroke="var(--pine)" strokeWidth={1.6} />
    <circle cx="16" cy="16" r="9.5" stroke="var(--pine)" strokeWidth={1.6} opacity={0.75} />
    <circle cx="16" cy="16" r="5" stroke="var(--pine)" strokeWidth={1.6} opacity={0.5} />
    <circle cx="16" cy="16" r="1.7" fill="var(--honey-2)" />
  </svg>
)

export const TabIconToday = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
    <path d="M12 21c-4-3-7-6-7-10a7 7 0 0 1 14 0c0 4-3 7-7 10z" />
    <path d="M12 11v6M12 11c-1.5-2.5-4-3-6-3 0 3 2.5 4.5 6 4.5z" strokeWidth={1.6} />
  </svg>
)
export const TabIconArea = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
    <circle cx="12" cy="12" r="9" />
    <circle cx="12" cy="12" r="4.5" />
    <circle cx="12" cy="12" r="1" />
  </svg>
)
export const TabIconLog = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
    <path d="M4 5.5A2 2 0 0 1 6 4h5v16H6a2 2 0 0 1-2-2z" />
    <path d="M20 5.5A2 2 0 0 0 18 4h-5v16h5a2 2 0 0 0 2-2z" />
  </svg>
)

/** 새싹 (펫) */
export const Sprout = () => (
  <svg width={38} height={38} viewBox="0 0 40 40" fill="none" aria-hidden="true">
    <path d="M20 34V20" stroke="var(--pine)" strokeWidth={2.4} strokeLinecap="round" />
    <path d="M20 22c-1-6-6-8-11-8 0 6 5 9 11 9z" fill="var(--pine-soft)" stroke="var(--pine)" strokeWidth={1.8} strokeLinejoin="round" />
    <path d="M20 19c1-5 5-7 10-7 0 5-4 8-10 8z" fill="var(--sage)" stroke="var(--pine)" strokeWidth={1.8} strokeLinejoin="round" opacity={0.85} />
  </svg>
)

/** 기록 히어로 나이테 링 — 바깥 겹이 현재 시기 채움률(pct 0~1) */
export const NaiteRingBig = ({ pct }: { pct: number }) => {
  const circ = 2 * Math.PI * 96
  const on = Math.max(0, Math.min(1, pct)) * circ
  return (
    <svg className="rings" viewBox="0 0 220 220" role="img" aria-label="성장 나이테">
      <circle cx="110" cy="110" r="96" fill="none" stroke="var(--line-strong)" strokeWidth={9} />
      <circle cx="110" cy="110" r="96" fill="none" stroke="var(--honey-2)" strokeWidth={9} strokeLinecap="round"
        strokeDasharray={`${on.toFixed(0)} ${(circ - on).toFixed(0)}`} transform="rotate(-90 110 110)" />
      <circle cx="110" cy="110" r="74" fill="none" stroke="var(--pine)" strokeWidth={9} opacity={0.9} />
      <circle cx="110" cy="110" r="54" fill="none" stroke="var(--pine)" strokeWidth={9} opacity={0.7} />
      <circle cx="110" cy="110" r="34" fill="none" stroke="var(--pine)" strokeWidth={9} opacity={0.5} />
      <circle cx="110" cy="110" r="15" fill="var(--pine-soft)" />
      <path d="M110 122v-12M110 112c-2-4-6-5-9-5 0 4 4 6 9 6zM110 110c1-3 4-5 8-5 0 4-3 6-8 6z"
        stroke="var(--pine)" strokeWidth={1.7} fill="none" strokeLinejoin="round" />
    </svg>
  )
}

/** 온보딩 1장 나이테 링 */
export const NaiteRingsOnboard = () => (
  <svg className="ob-rings" viewBox="0 0 200 200" role="img" aria-label="나이테">
    <circle cx="100" cy="100" r="86" fill="none" stroke="var(--pine)" strokeWidth={8} opacity={0.95} />
    <circle cx="100" cy="100" r="66" fill="none" stroke="var(--pine)" strokeWidth={8} opacity={0.72} />
    <circle cx="100" cy="100" r="46" fill="none" stroke="var(--pine)" strokeWidth={8} opacity={0.5} />
    <circle cx="100" cy="100" r="27" fill="none" stroke="var(--pine)" strokeWidth={8} opacity={0.32} />
    <circle cx="100" cy="14" r="5.5" fill="var(--honey-2)" />
    <circle cx="100" cy="100" r="12" fill="var(--pine-soft)" />
    <path d="M100 110V99M100 100c-2-4-6-5-9-5 0 4 4 6 9 6zM100 98c1-3 4-5 8-5 0 4-3 6-8 6z" stroke="var(--pine)" strokeWidth={1.7} fill="none" strokeLinejoin="round" />
  </svg>
)
