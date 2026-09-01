/**
 * DbC 가드. 사전조건을 검사하고 위반 시 E-* 코드를 가진 DomainError 를 던진다.
 *
 * ⚠️ 스켈레톤: 시그니처와 예외 위치만 고정되어 있다. 구현은 ARRR 사이클에서 채운다.
 */

import { DomainError } from './errors'
import type { ErrorCode } from './errors'
import { DOMAINS, OFFSET_MONTHS, STANDARD_ORIGINS } from './types'
import type {
  ActivityInput,
  Cadence,
  Domain,
  IsoDate,
  OffsetMonths,
  Standard,
} from './types'

const NOT_IMPLEMENTED = 'NOT_IMPLEMENTED'

/**
 * INV-PACE-01 — months 는 0 | 12 | 24 여야 한다.
 * @throws DomainError E-PACE-INVALID-MONTHS
 */
export function requireValidOffsetMonths(
  months: number,
): asserts months is OffsetMonths {
  if (!(OFFSET_MONTHS as readonly number[]).includes(months)) {
    throw new DomainError(
      'E-PACE-INVALID-MONTHS',
      `오프셋은 ${OFFSET_MONTHS.join('/')}개월만 가능합니다 (받은 값: ${months})`,
    )
  }
}

/**
 * INV-PACE-02 — origin='자체' 기준에는 오프셋을 적용하지 않는다.
 * @throws DomainError E-PACE-NOT-APPLICABLE
 */
export function requireOffsetApplicable(standard: Standard): void {
  // TODO(INV-PACE-02): standard.origin === '자체' 면 E-PACE-NOT-APPLICABLE
  throw new Error(NOT_IMPLEMENTED)
}

/**
 * INV-ACT-01 — 이름은 공백일 수 없다. 활동·학원 공용.
 * @throws DomainError (기본 E-ACT-EMPTY-NAME, 학원은 E-ACAD-EMPTY-NAME)
 */
export function requireNonEmptyName(
  name: string,
  code: ErrorCode = 'E-ACT-EMPTY-NAME',
): void {
  if (name.trim() === '') {
    throw new DomainError(code, '이름을 입력해 주세요')
  }
}

/**
 * INV-ACT-03 — '요일지정' 이면 weekdays 가 비어있지 않다.
 * INV-ACT-04 — '주N회' 이면 1 <= times <= 7.
 * @throws DomainError E-ACT-EMPTY-WEEKDAYS | E-ACT-INVALID-TIMES
 */
export function requireValidCadence(cadence: Cadence): void {
  if (cadence.kind === '요일지정' && cadence.weekdays.length === 0) {
    throw new DomainError(
      'E-ACT-EMPTY-WEEKDAYS',
      '요일을 하나 이상 선택해 주세요 (아무 날도 아닌 일정은 있을 수 없습니다)',
    )
  }
  if (cadence.kind === '주N회' && (cadence.times < 1 || cadence.times > 7)) {
    throw new DomainError(
      'E-ACT-INVALID-TIMES',
      `주간 횟수는 1~7 사이여야 합니다 (받은 값: ${cadence.times})`,
    )
  }
}

/**
 * INV-ACT-06 — targetIds 는 존재하는 Standard 를 가리켜야 한다.
 * INV-ACT-07 — 가리키는 Standard 의 domain 은 활동의 domain 과 같아야 한다.
 * INV-ACT-08 — targetIds 는 비어 있을 수 있다 (0개는 위반이 아니다).
 * @throws DomainError E-ACT-TARGET-NOT-FOUND | E-ACT-TARGET-DOMAIN-MISMATCH
 */
export function requireValidTargets(
  input: Pick<ActivityInput, 'domain' | 'targetIds'>,
  standards: readonly Standard[],
): void {
  for (const id of input.targetIds) {
    const target = standards.find((s) => s.id === id)

    if (!target) {
      throw new DomainError('E-ACT-TARGET-NOT-FOUND', `존재하지 않는 목표입니다: ${id}`)
    }
    if (target.domain !== input.domain) {
      throw new DomainError(
        'E-ACT-TARGET-DOMAIN-MISMATCH',
        `${input.domain} 활동이 ${target.domain} 목표를 겨냥할 수 없습니다: ${id}`,
      )
    }
  }
}

/**
 * INV-COMP-02 — 미래 날짜에는 기록할 수 없다.
 * 'YYYY-MM-DD' 는 사전식 비교가 곧 시간순 비교다.
 * @throws DomainError E-COMP-FUTURE-DATE
 */
export function requireNotFuture(date: IsoDate, today: IsoDate): void {
  if (date > today) {
    throw new DomainError(
      'E-COMP-FUTURE-DATE',
      `아직 오지 않은 날짜에는 기록할 수 없습니다: ${date} (오늘 ${today})`,
    )
  }
}

/**
 * INV-STD-02  origin 이 유효해야 한다
 * INV-STD-03  origin='공교육' 이면 source.document 가 필수
 * INV-STD-03b origin='공교육' 이면 code 또는 url 중 최소 하나가 필요
 * INV-STD-04  origin='자체' 는 source 없이도 유효
 * INV-STD-08  refines 는 존재하는 '공교육' 기준을 가리켜야 한다
 *
 * @throws DomainError E-STD-INVALID-ORIGIN | E-STD-MISSING-SOURCE
 *                   | E-STD-MISSING-REFERENCE | E-STD-INVALID-REFINES
 */
export function requireValidStandard(
  standard: Standard,
  all?: readonly Standard[],
): void {
  if (!(STANDARD_ORIGINS as readonly string[]).includes(standard.origin)) {
    throw new DomainError(
      'E-STD-INVALID-ORIGIN',
      `origin 은 ${STANDARD_ORIGINS.join('/')} 중 하나여야 합니다 (받은 값: ${standard.origin})`,
    )
  }

  if (standard.origin === '공교육') {
    // INV-STD-03 — 문서명 없이는 "국가 기준"이라 부를 수 없다
    if (!standard.source || standard.source.document.trim() === '') {
      throw new DomainError(
        'E-STD-MISSING-SOURCE',
        `공교육 기준에는 출처 문서가 필요합니다: "${standard.statement}"`,
      )
    }
    // INV-STD-03b — 문서명만으로는 원문에 도달할 수 없다
    const { code, url } = standard.source
    if (!code?.trim() && !url?.trim()) {
      throw new DomainError(
        'E-STD-MISSING-REFERENCE',
        `공교육 기준에는 성취기준 코드나 원문 URL이 필요합니다: "${standard.statement}"`,
      )
    }
  }

  // INV-STD-08
  if (standard.refines !== undefined && all) {
    const target = all.find((s) => s.id === standard.refines)
    if (!target || target.origin !== '공교육') {
      throw new DomainError(
        'E-STD-INVALID-REFINES',
        `refines 는 존재하는 공교육 기준을 가리켜야 합니다 (받은 값: ${standard.refines})`,
      )
    }
  }
}

/**
 * @throws DomainError E-COV-UNKNOWN-DOMAIN
 */
export function requireKnownDomain(domain: Domain): void {
  if (!(DOMAINS as readonly string[]).includes(domain)) {
    throw new DomainError(
      'E-COV-UNKNOWN-DOMAIN',
      `알 수 없는 영역입니다: ${domain} (가능: ${DOMAINS.join('/')})`,
    )
  }
}
