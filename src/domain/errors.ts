/**
 * Error Contract. docs/07-계약.md 의 E-* 코드와 1:1 대응한다.
 *
 * 이 파일은 계약 그 자체이므로 완성되어 있다.
 * 테스트는 메시지가 아니라 `code` 를 단언한다 — 계약 ID와 테스트가 1:1로 맞물리도록.
 */

export const ERROR_CODES = [
  // PaceOffset
  'E-PACE-INVALID-MONTHS',
  'E-PACE-NOT-APPLICABLE',
  // Activity
  'E-ACT-EMPTY-NAME',
  'E-ACT-EMPTY-WEEKDAYS',
  'E-ACT-INVALID-TIMES',
  'E-ACT-TARGET-NOT-FOUND',
  'E-ACT-TARGET-DOMAIN-MISMATCH',
  'E-ACT-NOT-FOUND',
  // Coverage
  'E-COV-UNKNOWN-DOMAIN',
  // Completion
  'E-COMP-DUPLICATE',
  'E-COMP-FUTURE-DATE',
  // Standard
  'E-STD-MISSING-SOURCE',
  'E-STD-MISSING-REFERENCE',
  'E-STD-INVALID-ORIGIN',
  'E-STD-INVALID-REFINES',
  // Care (pet)
  'E-CARE-NO-TOKEN',
  // Academy (학원)
  'E-ACAD-EMPTY-NAME',
] as const

export type ErrorCode = (typeof ERROR_CODES)[number]

export class DomainError extends Error {
  constructor(
    readonly code: ErrorCode,
    message?: string,
  ) {
    super(message ?? code)
    this.name = 'DomainError'
  }
}

export function isDomainError(e: unknown, code?: ErrorCode): e is DomainError {
  return e instanceof DomainError && (code === undefined || e.code === code)
}
