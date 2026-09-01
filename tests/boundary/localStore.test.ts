/**
 * ARRR 사이클 #13 — RED
 * 대상: src/boundary/store/local.ts
 * 계약: docs/07-계약.md §8 · INV-UI-32
 */

import { describe, it, expect, beforeEach } from 'vitest'
import { LocalStore } from '../../src/boundary/store/local'
import { SNAPSHOT_VERSION } from '../../src/boundary/store/types'
import type { AppSnapshot } from '../../src/boundary/store/types'

const snap = (over: Partial<AppSnapshot> = {}): AppSnapshot => ({
  version: SNAPSHOT_VERSION,
  completions: [{ activityId: 'a1', date: '2026-11-04' }],
  achieved: ['int-ko-read'],
  offsets: [{ domain: '국어', months: 12 }],
  ...over,
})

describe('LocalStore — 새로고침을 견딘다', () => {
  beforeEach(() => localStorage.clear())

  it('저장한 걸 그대로 돌려준다 (라운드트립)', async () => {
    const store = new LocalStore()
    await store.save(snap())
    const loaded = await store.load()
    expect(loaded).toEqual(snap())
  })

  it('⭐ 새 인스턴스로도 읽힌다 — 새로고침 시나리오', async () => {
    await new LocalStore().save(snap())
    const loaded = await new LocalStore().load()
    expect(loaded?.completions).toEqual([{ activityId: 'a1', date: '2026-11-04' }])
    expect(loaded?.achieved).toEqual(['int-ko-read'])
  })

  it('저장된 게 없으면 null', async () => {
    expect(await new LocalStore().load()).toBeNull()
  })

  it('버전이 다르면 무시하고 null — 낡은 데이터로 앱을 깨뜨리지 않는다', async () => {
    localStorage.setItem('edu-manager:v1', JSON.stringify({ ...snap(), version: 999 }))
    expect(await new LocalStore().load()).toBeNull()
  })

  it('깨진 JSON 이어도 던지지 않고 null — 앱은 뜬다', async () => {
    localStorage.setItem('edu-manager:v1', '{부서진')
    expect(await new LocalStore().load()).toBeNull()
  })

  it('⭐ localStorage 접근이 막혀도(사생활 모드 등) 던지지 않는다', async () => {
    // load/save 가 throw 하면 앱 전체가 죽는다. 조용히 실패해야 한다.
    const store = new LocalStore()
    const orig = Storage.prototype.setItem
    Storage.prototype.setItem = () => {
      throw new Error('blocked')
    }
    await expect(store.save(snap())).resolves.toBeUndefined()
    Storage.prototype.setItem = orig
  })

  it('덮어쓰기가 된다', async () => {
    const store = new LocalStore()
    await store.save(snap({ achieved: ['a'] }))
    await store.save(snap({ achieved: ['a', 'b'] }))
    expect((await store.load())?.achieved).toEqual(['a', 'b'])
  })
})
