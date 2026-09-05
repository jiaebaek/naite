/**
 * 안도 공유 카드 시트 — UX 리디자인 §07-A ④.
 * "스샷하고 싶은" 안도 결과 카드. 나이테 좌표(데이터-아트) + 안도 카피. 리퍼럴 루프의 씨앗.
 * 톤: 자랑 아님 — "이미 잘 챙기고 있어요". 이름은 기본 애칭/이니셜.
 */
import { useState } from 'react'
import { NaiteCoordArt } from './NaiteCoordArt'
import type { CoordArea } from './NaiteCoordArt'
import { IconX } from './icons'

export interface ShareSheetProps {
  readonly childLabel: string
  readonly ageLabel: string
  readonly onCount: number
  readonly doneCount: number
  readonly totalDomains: number
  readonly code: string
  readonly areas: readonly CoordArea[]
  readonly onClose: () => void
}

export function ShareSheet({ childLabel, ageLabel, onCount, doneCount, totalDomains, code, areas, onClose }: ShareSheetProps) {
  const [msg, setMsg] = useState<string | null>(null)

  const share = async () => {
    const text = `${childLabel} — ${totalDomains}곳 중 ${onCount}곳 챙기는 중. 나이테 좌표`
    try {
      if (navigator.share) { await navigator.share({ title: '나이테 좌표', text }); return }
      await navigator.clipboard.writeText(text)
      setMsg('링크 문구가 복사됐어요')
    } catch {
      setMsg('공유는 정식 출시에 제공돼요')
    }
  }
  const saveImg = () => setMsg('이미지 저장은 정식 출시에 제공돼요 · 지금은 화면 캡처로도 충분해요')

  return (
    <div className="sheet-wrap" data-testid="share-sheet">
      <div className="sheet-bg" onClick={onClose} />
      <div className="sheet" role="dialog" aria-label="좌표 공유">
        <div className="grab" />
        <div className="sheet-head">
          <h3>우리 아이 좌표</h3>
          <button className="sheet-x" onClick={onClose} aria-label="닫기"><IconX /></button>
        </div>
        <div className="sheet-body">
          <div className="sharecard">
            <div className="sc-eyebrow">우리 아이 나이테 좌표</div>
            <NaiteCoordArt areas={areas} ageLabel={ageLabel} />
            <div className="sc-title">{childLabel}</div>
            <div className="sc-sub">{totalDomains}곳 중 <b>{onCount}곳</b> 챙기는 중 · 이룸 {doneCount}</div>
            <div className="sc-foot">
              <span className="sc-mark">나이테</span>
              <span className="sc-code">좌표 {code}</span>
            </div>
          </div>
          <p className="sc-note">모양은 아이마다 달라요 — 우리 아이만의 좌표. 이름은 기본으로 가려지고(애칭·이니셜), 자랑이 아니라 잘 챙기고 있다는 안도예요.</p>
          {msg && <p className="sc-msg" role="status">{msg}</p>}
          <div className="sc-actions">
            <button className="btn-soft" onClick={saveImg}>이미지 저장</button>
            <button className="btn-primary" style={{ width: 'auto' }} onClick={share}>링크 공유</button>
          </div>
        </div>
      </div>
    </div>
  )
}
