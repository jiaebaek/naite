/**
 * 저장 포트. docs/08-UI계약.md (INV-UI-32) · docs/07-계약.md §8
 *
 * ⚠️ 포트는 **비동기**다. localStorage(동기)도, Supabase(네트워크)도 같은 모양으로 끼운다.
 *    App 은 어느 어댑터인지 몰라야 한다 — 그래야 Supabase 로 바꿔도 App 이 안 바뀐다.
 */

import type {
  Academy,
  Activity,
  Completion,
  PaceOffset,
  StandardId,
} from '../../domain/types'
import type { CareState } from '../../domain/pet'

/** 스키마 버전. 구조가 바뀌면 올린다. 낮은 버전 데이터는 버리거나 마이그레이션. */
export const SNAPSHOT_VERSION = 1

/** 앱의 변하는 상태 전부. 순수 데이터만 (직렬화 가능해야 한다). */
export interface AppSnapshot {
  readonly version: number
  readonly completions: readonly Completion[]
  readonly achieved: readonly StandardId[]
  readonly offsets: readonly PaceOffset[]
  /** 사용자가 등록·편집한 활동. 없으면(구버전) 시드로 시작 */
  readonly activities?: readonly Activity[]
  /** 등록한 학원. 없으면 시드로 시작 */
  readonly academies?: readonly Academy[]
  /** 펫·돌봄 상태. 없으면 undefined (구버전 데이터) */
  readonly care?: CareState
}

export interface AppStore {
  /** 저장된 게 없으면 null */
  load(): Promise<AppSnapshot | null>
  save(snapshot: AppSnapshot): Promise<void>
  /**
   * 원격의 최신 공유 상태를 가져온다(회사↔집 C-4). 없거나 못 가져오면 null.
   * ⚠️ 로컬 전용 어댑터는 구현하지 않아도 된다(선택). App 은 있으면 앱이 다시 보일 때 당겨온다.
   */
  pull?(): Promise<AppSnapshot | null>
}
