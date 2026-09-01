/**
 * Supabase 저장 어댑터 — 회사↔집 동기화(C-4).
 *
 * PostgREST(REST) 로 스냅샷 한 행을 upsert 한다. @supabase/supabase-js 의존 없이
 * fetch 만 쓴다 — 번들이 가볍고, fetch 를 주입해 오프라인으로 테스트할 수 있다.
 *
 * ⚠️ INV-STORE-01 — load/save/pull 은 절대 던지지 않는다. 실패는 null / 무음.
 *    저장 실패로 앱을 멈추지 않는다. 로컬(LocalStore)이 항상 받쳐준다(SyncStore).
 *
 * ── 켜는 법 (사용자 소유 Supabase 필요) ─────────────────────
 * 1. supabase.com 에서 프로젝트 생성
 * 2. SQL 에디터에서:
 *
 *    create table app_snapshot (
 *      user_key   text primary key,   -- 단일 가족이면 'default' 하나
 *      snapshot   jsonb not null,      -- AppSnapshot 전체(버전 포함)를 통째로
 *      updated_at timestamptz default now()
 *    );
 *    alter table app_snapshot enable row level security;
 *    -- 단일 가족 MVP: anon 키로 읽고 쓰게. 민감정보 없음.
 *    create policy "single family rw" on app_snapshot for all
 *      to anon using (true) with check (true);
 *
 * 3. 프로젝트 루트 .env.local:
 *      VITE_SUPABASE_URL=https://xxxx.supabase.co
 *      VITE_SUPABASE_ANON_KEY=eyJ...
 * 4. 끝. store/index.ts 가 env 를 보고 자동으로 SyncStore(로컬+원격)로 붙인다.
 *    App 코드는 한 줄도 안 바뀐다(같은 AppStore 포트).
 */

import { SNAPSHOT_VERSION } from './types'
import type { AppSnapshot, AppStore } from './types'

export interface SupabaseConfig {
  /** https://xxxx.supabase.co */
  readonly url: string
  readonly anonKey: string
  /** 행 키. 단일 가족이면 'default'. 여러 가족을 나누려면 바꾼다. */
  readonly userKey?: string
  readonly table?: string
  /** 테스트용 주입. 없으면 전역 fetch. */
  readonly fetchImpl?: typeof fetch
}

export class SupabaseStore implements AppStore {
  private readonly base: string
  private readonly userKey: string
  private readonly headers: Record<string, string>
  private readonly doFetch: typeof fetch

  constructor(cfg: SupabaseConfig) {
    this.userKey = cfg.userKey ?? 'default'
    const table = cfg.table ?? 'app_snapshot'
    this.base = `${cfg.url.replace(/\/$/, '')}/rest/v1/${table}`
    this.headers = {
      apikey: cfg.anonKey,
      Authorization: `Bearer ${cfg.anonKey}`,
      'Content-Type': 'application/json',
    }
    this.doFetch = cfg.fetchImpl ?? fetch
  }

  async load(): Promise<AppSnapshot | null> {
    try {
      const url = `${this.base}?user_key=eq.${encodeURIComponent(this.userKey)}&select=snapshot`
      const res = await this.doFetch(url, { headers: { ...this.headers, Accept: 'application/json' } })
      if (!res.ok) return null
      const rows = (await res.json()) as { snapshot?: AppSnapshot }[]
      const snapshot = Array.isArray(rows) ? rows[0]?.snapshot : undefined
      if (!snapshot) return null
      // 낡은 원격 데이터로 앱을 깨뜨리지 않는다 (LocalStore 와 같은 규칙)
      if (snapshot.version !== SNAPSHOT_VERSION) return null
      return snapshot
    } catch {
      return null
    }
  }

  /** load 와 동일 — 회사↔집에서 "최신 공유본 당겨오기"의 의미를 이름으로 드러낸다. */
  async pull(): Promise<AppSnapshot | null> {
    return this.load()
  }

  async save(snapshot: AppSnapshot): Promise<void> {
    try {
      await this.doFetch(this.base, {
        method: 'POST',
        headers: { ...this.headers, Prefer: 'resolution=merge-duplicates,return=minimal' },
        body: JSON.stringify([{ user_key: this.userKey, snapshot }]),
      })
    } catch {
      // 무음 실패 — 로컬에 이미 남아 있고, 다음 저장/당겨오기 때 수렴한다.
    }
  }
}
