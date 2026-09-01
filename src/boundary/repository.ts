/**
 * Boundary 트랙 — 저장소 포트.
 *
 * ⚠️ 의존 방향: Boundary → Entity 단방향.
 *    이 인터페이스는 **도메인이 정의하고 인프라(Supabase)가 구현**한다.
 *    src/domain/ 은 이 파일을 import 하지 않는다.
 *
 * ⚠️ 스켈레톤: 시그니처만 고정.
 */

import type {
  Activity,
  ActivityId,
  Completion,
  IsoDate,
  PaceOffset,
  Standard,
} from '../domain/types'

export interface StandardRepository {
  listAll(): Promise<readonly Standard[]>
  /** origin='자체' 기준의 문장·시기 편집. MVP 에서 신규 작성 폼은 만들지 않는다 (결정 ⑥) */
  update(standard: Standard): Promise<void>
}

export interface ActivityRepository {
  listActive(): Promise<readonly Activity[]>
  save(activity: Activity): Promise<void>
  findById(id: ActivityId): Promise<Activity | null>
}

export interface CompletionRepository {
  listByDate(date: IsoDate): Promise<readonly Completion[]>
  listBetween(from: IsoDate, to: IsoDate): Promise<readonly Completion[]>
  add(completion: Completion): Promise<void>
  remove(activityId: ActivityId, date: IsoDate): Promise<void>
}

export interface PaceOffsetRepository {
  listAll(): Promise<readonly PaceOffset[]>
  save(offset: PaceOffset): Promise<void>
}

/**
 * ⚠️ OOS-1 / INV-ACT-05
 * NotificationRepository, AssignmentRepository 류를 여기에 추가하지 말 것.
 * 아빠에게 요구가 발생하는 순간 X-4(실패 조건)에 해당한다.
 */
