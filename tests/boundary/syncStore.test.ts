/**
 * ARRR 사이클 #18 — RED (Boundary/인프라)
 * 대상: src/boundary/store/sync.ts
 * 계약: docs/07-계약.md §8 · INV-STORE-02/03
 *
 * 로컬 우선(local-first) 합성 저장소. 로컬은 항상 즉시·오프라인 OK,
 * 원격(Supabase)은 회사↔집 공유 채널. 원격 실패가 로컬을 절대 지우지 않는다.
 */

import { describe, it, expect, vi } from 'vitest'
import { SyncStore } from '../../src/boundary/store/sync'
import { SNAPSHOT_VERSION } from '../../src/boundary/store/types'
import type { AppSnapshot, AppStore } from '../../src/boundary/store/types'

const snap = (tag: string): AppSnapshot => ({
  version: SNAPSHOT_VERSION,
  completions: [],
  achieved: [tag],
  offsets: [],
})

/** 메모리 저장소 — 로컬/원격 둘 다 흉내낸다 */
class MemStore implements AppStore {
  constructor(private data: AppSnapshot | null = null) {}
  async load() {
    return this.data
  }
  async save(s: AppSnapshot) {
    this.data = s
  }
  async pull() {
    return this.data
  }
  peek() {
    return this.data
  }
}

describe('SyncStore.save — 로컬·원격 둘 다 쓴다', () => {
  it('저장하면 로컬과 원격 모두에 기록된다', async () => {
    const local = new MemStore()
    const remote = new MemStore()
    await new SyncStore(local, remote).save(snap('s'))
    expect(local.peek()?.achieved).toEqual(['s'])
    expect(remote.peek()?.achieved).toEqual(['s'])
  })

  it('⭐ INV-STORE-02 — 원격 저장이 터져도 로컬은 저장되고 던지지 않는다', async () => {
    const local = new MemStore()
    const remote: AppStore = {
      load: async () => null,
      save: async () => {
        throw new Error('remote save fail')
      },
    }
    const store = new SyncStore(local, remote)
    await expect(store.save(snap('safe'))).resolves.toBeUndefined()
    expect(local.peek()?.achieved).toEqual(['safe'])
  })
})

describe('SyncStore.load — 로컬 우선', () => {
  it('로컬에 있으면 로컬을 준다 (원격을 건드리지 않는다)', async () => {
    const local = new MemStore(snap('local'))
    const remote = new MemStore(snap('remote'))
    const remoteLoad = vi.spyOn(remote, 'load')
    const loaded = await new SyncStore(local, remote).load()
    expect(loaded?.achieved).toEqual(['local'])
    expect(remoteLoad).not.toHaveBeenCalled()
  })

  it('⭐ 로컬이 비었으면 원격에서 당겨오고 로컬에 캐시한다 (새 기기 첫 실행)', async () => {
    const local = new MemStore(null)
    const remote = new MemStore(snap('remote'))
    const loaded = await new SyncStore(local, remote).load()
    expect(loaded?.achieved).toEqual(['remote'])
    // 다음 오프라인 실행을 위해 로컬에 심어둔다
    expect(local.peek()?.achieved).toEqual(['remote'])
  })

  it('둘 다 비었으면 null', async () => {
    expect(await new SyncStore(new MemStore(null), new MemStore(null)).load()).toBeNull()
  })

  it('⭐ INV-STORE-03 — 원격 load 가 터져도 로컬을 준다', async () => {
    const local = new MemStore(snap('local'))
    const remote: AppStore = {
      load: async () => {
        throw new Error('remote down')
      },
      save: async () => {},
    }
    // 로컬이 있으니 원격은 아예 안 부르지만, 부르더라도 죽지 않아야 한다
    expect((await new SyncStore(local, remote).load())?.achieved).toEqual(['local'])
  })
})

describe('SyncStore.pull — 원격 최신을 당겨 로컬에 반영', () => {
  it('원격 스냅샷을 돌려주고 로컬에 캐시한다', async () => {
    const local = new MemStore(snap('old'))
    const remote = new MemStore(snap('new'))
    const pulled = await new SyncStore(local, remote).pull()
    expect(pulled?.achieved).toEqual(['new'])
    expect(local.peek()?.achieved).toEqual(['new']) // 오프라인 대비 로컬 갱신
  })

  it('원격이 비었으면 null 이고 로컬을 지우지 않는다', async () => {
    const local = new MemStore(snap('keep'))
    const remote = new MemStore(null)
    expect(await new SyncStore(local, remote).pull()).toBeNull()
    expect(local.peek()?.achieved).toEqual(['keep'])
  })

  it('⭐ 원격 pull 이 터져도 던지지 않고 null', async () => {
    const local = new MemStore(snap('keep'))
    const remote: AppStore = {
      load: async () => {
        throw new Error('down')
      },
      save: async () => {},
    }
    expect(await new SyncStore(local, remote).pull()).toBeNull()
    expect(local.peek()?.achieved).toEqual(['keep'])
  })
})
