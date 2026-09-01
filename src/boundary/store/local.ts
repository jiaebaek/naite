/**
 * localStorage 저장 어댑터. docs/07-계약.md §8
 *
 * 새로고침·오프라인을 견딘다. 한 기기 안에서만 유지된다(회사↔집 동기화는 Supabase 몫).
 * ⚠️ 모든 접근을 try/catch 로 감싼다 — 사생활 모드·용량 초과에서 throw 하면 앱이 죽는다.
 */

import { SNAPSHOT_VERSION } from './types'
import type { AppSnapshot, AppStore } from './types'

// ⚠️ 저장소 키는 브랜드(나이테)와 무관하게 'edu-manager' 로 고정한다.
//    바꾸면 기존 사용자의 로컬 데이터가 orphan 된다(키가 곧 데이터 식별자).
const KEY = `edu-manager:v${SNAPSHOT_VERSION}`

export class LocalStore implements AppStore {
  async load(): Promise<AppSnapshot | null> {
    try {
      const raw = localStorage.getItem(KEY)
      if (!raw) return null
      const parsed = JSON.parse(raw) as AppSnapshot
      // 버전이 맞지 않으면 낡은 데이터로 앱을 깨뜨리지 않는다
      if (parsed.version !== SNAPSHOT_VERSION) return null
      return parsed
    } catch {
      return null
    }
  }

  async save(snapshot: AppSnapshot): Promise<void> {
    try {
      localStorage.setItem(KEY, JSON.stringify(snapshot))
    } catch {
      // 조용히 실패한다. 저장 실패로 사용을 막지 않는다.
    }
  }
}
