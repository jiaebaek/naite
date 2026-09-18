/**
 * 온보딩 3장 — UX 리디자인 §06. 전체화면 오버레이. 완료/건너뛰기 후 오늘로.
 */
import { useState } from 'react'
import { IconCheck, NaiteRingsOnboard } from './icons'

export function Onboarding({ onClose }: { onClose: () => void }) {
  const [i, setI] = useState(0)
  const last = 2
  const next = () => (i < last ? setI(i + 1) : onClose())

  return (
    <div className="onboard" data-testid="onboard">
      <button className="ob-skip" onClick={onClose}>건너뛰기</button>
      <div className="ob-stage">
        {/* 1. 정체성 */}
        <div className={`ob-slide${i === 0 ? ' active' : ''}`}>
          <div className="ob-art"><NaiteRingsOnboard /></div>
          <div className="ob-text">
            <div className="eyebrow">나이테</div>
            <h2 className="ob-h">아이의 나이테를<br />함께 쌓아요</h2>
            <p className="ob-p">지금 나이에 챙겨야 할 것들을 놓치지 않게. <b>앞서가지 않아도, 뒤쳐지지 않게</b> — 매년 한 겹씩이면 충분해요.</p>
          </div>
        </div>
        {/* 2. 갭 찾기 */}
        <div className={`ob-slide${i === 1 ? ' active' : ''}`}>
          <div className="ob-art">
            <div className="ob-mock">
              <div className="coverbar" style={{ marginBottom: 16 }} aria-hidden="true">
                <span className="seg on" /><span className="seg on" /><span className="seg on" />
                <span className="seg on" /><span className="seg on" /><span className="seg on" />
                <span className="seg gap" />
              </div>
              <div className="ob-domrow"><span className="nm">지금 시기</span><span className="pill on">대부분 챙김</span></div>
              <div className="ob-domrow"><span className="nm">딱 한 곳</span><span className="pill calm">천천히 봐요</span></div>
            </div>
          </div>
          <div className="ob-text">
            <div className="eyebrow">이 앱이 하는 일</div>
            <h2 className="ob-h">우리 애가 지금<br />어디쯤인지 알려줘요</h2>
            <p className="ob-p"><b>아이 발달·교육 전문가가 세운 기준</b>으로, 지금 잘 되고 있는 것부터 보여드려요. 놓친 곳은 넌지시.</p>
          </div>
        </div>
        {/* 3. 일상 루프 */}
        <div className={`ob-slide${i === 2 ? ' active' : ''}`}>
          <div className="ob-art">
            <div className="ob-mock">
              <div className="ob-task">
                <div className="cbox"><IconCheck /></div>
                <span className="nm">한글 학원 숙제</span>
              </div>
              <div className="ob-arrow">
                <svg width={20} height={20} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.2}><path d="M12 5v14M6 13l6 6 6-6" /></svg>
              </div>
              <div className="ob-grow">
                <svg width={72} height={72} viewBox="0 0 80 80" aria-hidden="true">
                  <circle cx="40" cy="40" r="33" fill="none" stroke="var(--line-strong)" strokeWidth={7} />
                  <circle cx="40" cy="40" r="33" fill="none" stroke="var(--sage)" strokeWidth={7} strokeLinecap="round" strokeDasharray="135 73" transform="rotate(-90 40 40)" />
                  <circle cx="40" cy="40" r="16" fill="none" stroke="var(--pine)" strokeWidth={7} opacity={0.6} />
                </svg>
                <span className="cap">오늘 체크할수록<br />한 겹씩 자라요</span>
              </div>
            </div>
          </div>
          <div className="ob-text">
            <div className="eyebrow">매일 이렇게</div>
            <h2 className="ob-h">오늘 하나씩,<br />한 겹씩</h2>
            <p className="ob-p">매일 <b>'오늘' 화면</b>만 열면 돼요. <b>유치원 다니면 대부분 저절로 채워지고</b>, 오늘 할 일을 체크하면 나이테가 자라요.</p>
          </div>
        </div>
      </div>
      <div className="ob-foot">
        <div className="dots" aria-hidden="true">
          {[0, 1, 2].map((n) => <span key={n} className={`dot-i${n === i ? ' on' : ''}`} />)}
        </div>
        <button className="btn-primary ob-next" onClick={next}>{i === last ? '시작하기' : '다음'}</button>
      </div>
    </div>
  )
}
