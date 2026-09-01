/**
 * 저장 어댑터 선택.
 *
 * env 에 Supabase 키가 있으면 → SyncStore(로컬+원격): 회사↔집 동기화(C-4).
 * 없으면 → LocalStore: 한 기기 안에서만(새로고침·오프라인 OK).
 *
 * App 은 어느 쪽인지 모른다 — 같은 AppStore 포트라 코드가 안 바뀐다.
 * 켜는 법: src/boundary/store/supabase.ts 상단 주석 참고.
 */

import { LocalStore } from './local'
import { SupabaseStore } from './supabase'
import { SyncStore } from './sync'
import type { AppStore } from './types'

export function getStore(): AppStore {
  const url = import.meta.env.VITE_SUPABASE_URL
  const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY
  const local = new LocalStore()
  if (url && anonKey) {
    return new SyncStore(local, new SupabaseStore({ url, anonKey }))
  }
  return local
}
