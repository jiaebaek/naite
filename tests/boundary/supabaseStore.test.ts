/**
 * ARRR 사이클 #17 — RED (Boundary/인프라)
 * 대상: src/boundary/store/supabase.ts
 * 계약: docs/07-계약.md §8 · INV-STORE-*
 *
 * 회사↔집 동기화(C-4). Supabase REST(PostgREST)에 스냅샷 한 행을 upsert 한다.
 * ⚠️ 네트워크는 fetch 를 주입해 오프라인으로 검증한다 — 실제 Supabase 없이.
 * ⚠️ INV-STORE-01 — load/save 는 절대 던지지 않는다. 실패는 null/무음.
 */

import { describe, it, expect, vi } from 'vitest'
import { SupabaseStore } from '../../src/boundary/store/supabase'
import { SNAPSHOT_VERSION } from '../../src/boundary/store/types'
import type { AppSnapshot } from '../../src/boundary/store/types'

const snap = (over: Partial<AppSnapshot> = {}): AppSnapshot => ({
  version: SNAPSHOT_VERSION,
  completions: [{ activityId: 'a1', date: '2026-11-04' }],
  achieved: ['int-ko-read'],
  offsets: [{ domain: '국어', months: 12 }],
  ...over,
})

const CFG = {
  url: 'https://proj.supabase.co',
  anonKey: 'anon-key-123',
}

/** ok=true 로 JSON body 를 돌려주는 가짜 fetch (fetch 시그니처로 타입 지정) */
const okFetch = (body: unknown) =>
  vi.fn((_url: string | URL | Request, _init?: RequestInit) =>
    Promise.resolve(
      new Response(JSON.stringify(body), { status: 200, headers: { 'content-type': 'application/json' } }),
    ))

describe('SupabaseStore.save — upsert 한 행', () => {
  it('스냅샷 테이블로 POST(upsert) 한다', async () => {
    const fetchImpl = okFetch('')
    const store = new SupabaseStore({ ...CFG, fetchImpl })
    await store.save(snap())

    expect(fetchImpl).toHaveBeenCalledTimes(1)
    const [url, init] = fetchImpl.mock.calls[0]!
    expect(String(url)).toContain('/rest/v1/app_snapshot')
    expect(init?.method).toBe('POST')
  })

  it('⭐ upsert 헤더(merge-duplicates)와 인증 헤더를 붙인다', async () => {
    const fetchImpl = okFetch('')
    await new SupabaseStore({ ...CFG, fetchImpl }).save(snap())
    const init = fetchImpl.mock.calls[0]![1]!
    const headers = new Headers(init.headers)
    expect(headers.get('Prefer')).toContain('merge-duplicates')
    expect(headers.get('apikey')).toBe('anon-key-123')
    expect(headers.get('Authorization')).toBe('Bearer anon-key-123')
    expect(headers.get('Content-Type')).toContain('application/json')
  })

  it('본문에 user_key 와 스냅샷 전체가 담긴다', async () => {
    const fetchImpl = okFetch('')
    await new SupabaseStore({ ...CFG, fetchImpl }).save(snap({ achieved: ['x', 'y'] }))
    const body = JSON.parse(String(fetchImpl.mock.calls[0]![1]!.body))
    const row = Array.isArray(body) ? body[0] : body
    expect(row.user_key).toBe('default')
    expect(row.snapshot.achieved).toEqual(['x', 'y'])
    expect(row.snapshot.version).toBe(SNAPSHOT_VERSION)
  })

  it('⭐ INV-STORE-01 — 네트워크가 터져도 던지지 않는다', async () => {
    const fetchImpl = vi.fn(async () => {
      throw new Error('network down')
    })
    const store = new SupabaseStore({ ...CFG, fetchImpl })
    await expect(store.save(snap())).resolves.toBeUndefined()
  })

  it('4xx/5xx 여도 던지지 않는다', async () => {
    const fetchImpl = vi.fn(async () => new Response('nope', { status: 500 }))
    await expect(new SupabaseStore({ ...CFG, fetchImpl }).save(snap())).resolves.toBeUndefined()
  })
})

describe('SupabaseStore.load / pull — 최신 행을 가져온다', () => {
  it('행이 있으면 그 스냅샷을 돌려준다 (라운드트립)', async () => {
    const fetchImpl = okFetch([{ snapshot: snap({ achieved: ['from-cloud'] }) }])
    const loaded = await new SupabaseStore({ ...CFG, fetchImpl }).load()
    expect(loaded?.achieved).toEqual(['from-cloud'])
  })

  it('GET 은 user_key 로 필터하고 snapshot 을 select 한다', async () => {
    const fetchImpl = okFetch([{ snapshot: snap() }])
    await new SupabaseStore({ ...CFG, fetchImpl }).load()
    const url = String(fetchImpl.mock.calls[0]![0])
    expect(url).toContain('user_key=eq.default')
    expect(url).toContain('select=snapshot')
  })

  it('행이 없으면(빈 배열) null', async () => {
    const fetchImpl = okFetch([])
    expect(await new SupabaseStore({ ...CFG, fetchImpl }).load()).toBeNull()
  })

  it('⭐ 버전이 다르면 null — 낡은 원격 데이터로 앱을 깨뜨리지 않는다', async () => {
    const fetchImpl = okFetch([{ snapshot: { ...snap(), version: 999 } }])
    expect(await new SupabaseStore({ ...CFG, fetchImpl }).load()).toBeNull()
  })

  it('⭐ INV-STORE-01 — 네트워크가 터져도 던지지 않고 null', async () => {
    const fetchImpl = vi.fn(async () => {
      throw new Error('offline')
    })
    expect(await new SupabaseStore({ ...CFG, fetchImpl }).load()).toBeNull()
  })

  it('4xx/5xx 여도 null', async () => {
    const fetchImpl = vi.fn(async () => new Response('err', { status: 401 }))
    expect(await new SupabaseStore({ ...CFG, fetchImpl }).load()).toBeNull()
  })

  it('pull 은 load 와 같은 최신 원격 스냅샷을 준다', async () => {
    const fetchImpl = okFetch([{ snapshot: snap({ achieved: ['pulled'] }) }])
    const store = new SupabaseStore({ ...CFG, fetchImpl })
    expect((await store.pull())?.achieved).toEqual(['pulled'])
  })
})

describe('설정 오버라이드', () => {
  it('userKey·table 을 바꿀 수 있다 (멀티 가족 대비)', async () => {
    const fetchImpl = okFetch('')
    await new SupabaseStore({ ...CFG, fetchImpl, userKey: 'kim', table: 'snap2' }).save(snap())
    const [url, init] = fetchImpl.mock.calls[0]!
    expect(String(url)).toContain('/rest/v1/snap2')
    const row = JSON.parse(String(init!.body))[0]
    expect(row.user_key).toBe('kim')
  })
})
