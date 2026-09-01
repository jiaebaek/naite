/**
 * SyncStore — 로컬 우선(local-first) 합성 저장소. docs/07-계약.md §8
 *
 * 로컬(LocalStore)은 항상 즉시·오프라인 OK. 원격(SupabaseStore)은 회사↔집 공유 채널.
 *
 * ⚠️ INV-STORE-02 — 원격 저장 실패가 앱을 멈추지 않는다(로컬은 언제나 저장).
 * ⚠️ INV-STORE-03 — 원격 load 실패가 로컬 데이터를 절대 지우지 않는다.
 *
 * 동기화 모델: 스냅샷 통째 last-write-wins.
 *   - 기기 전환(회사→집)은 App 이 앱이 다시 보일 때 pull() 로 최신본을 당겨 해결한다.
 *   - 두 기기에서 동시에 편집하면 나중에 저장한 쪽이 이긴다(가족 2인·저빈도라 허용).
 *     실시간 병합이 필요해지면 Supabase Realtime 으로 확장(포트는 그대로).
 */

import type { AppSnapshot, AppStore } from './types'

export class SyncStore implements AppStore {
  constructor(
    private readonly local: AppStore,
    private readonly remote: AppStore,
  ) {}

  async load(): Promise<AppSnapshot | null> {
    const localSnap = await this.local.load()
    if (localSnap) return localSnap
    // 새 기기 첫 실행: 로컬이 비었으면 공유본을 당겨 로컬에 심는다.
    const remoteSnap = await this.safeRemoteLoad()
    if (remoteSnap) await this.local.save(remoteSnap)
    return remoteSnap
  }

  async save(snapshot: AppSnapshot): Promise<void> {
    // 로컬 먼저 — 언제나 성공해야 한다(오프라인·사생활 모드 포함).
    await this.local.save(snapshot)
    // 원격은 best-effort. SupabaseStore 자체가 무음 실패하지만 한 번 더 감싼다.
    try {
      await this.remote.save(snapshot)
    } catch {
      /* 무음 — 로컬에 남았고 다음에 수렴한다 */
    }
  }

  /** 원격 최신본을 당겨 로컬에 반영한다. 회사↔집 전환의 핵심. */
  async pull(): Promise<AppSnapshot | null> {
    const remoteSnap = await this.safeRemoteLoad()
    if (remoteSnap) await this.local.save(remoteSnap)
    return remoteSnap
  }

  private async safeRemoteLoad(): Promise<AppSnapshot | null> {
    try {
      return this.remote.pull ? await this.remote.pull() : await this.remote.load()
    } catch {
      return null
    }
  }
}
