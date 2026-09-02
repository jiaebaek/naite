/**
 * ARRR 사이클 #7 — 문서·코드 정합성
 *
 * 배경: 04 문서가 코드보다 뒤처져 있었다. 영역이 4개 → 7개로 바뀌고
 *      용어가 `초과 목표` → `추가` 로 바뀌었는데 문서는 그대로였다.
 *      사용자가 직접 발견했다 — *"문서는 예전 조사한 버전으로 되어있는데, 상관없어?"*
 *
 * 마크다운은 타입 검사를 받지 않는다. 그래서 **코드의 상수가 문서에 실제로 존재하는지**
 * 를 테스트로 확인한다. 완벽하진 않지만 "이름이 바뀌었는데 문서가 안 따라온" 경우는 잡힌다.
 */

import { describe, it, expect } from 'vitest'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { COVERAGES, DOMAINS, NATURES, STANDARD_ORIGINS } from '../../src/domain/types'
import { ERROR_CODES } from '../../src/domain/errors'

const read = (rel: string) => readFileSync(resolve(process.cwd(), rel), 'utf-8')

const DOC_04 = 'docs/04-교육기준표-2021년생.md'
const DOC_05 = 'docs/05-목표표.md'
const DOC_06 = 'docs/06-PRD.md'
const DOC_07 = 'docs/07-계약.md'
const DOC_08 = 'docs/08-UI계약.md'

/** 폐기된 용어. 본문에 남아 있으면 문서가 뒤처진 것이다. */
const 폐기용어 = ['학교적응', '학교 적응', '초과 목표', '기준 연결', '기준연결', '우리목표']

describe('04 해설 문서가 코드와 같은 어휘를 쓴다', () => {
  // 정정 이력에는 옛 용어가 의도적으로 남는다. 본문만 검사한다.
  const 본문 = read(DOC_04).split('## 7. 정정 이력')[0]!

  it.each(DOMAINS)('영역 "%s" 이 문서에 등장한다', (domain) => {
    expect(본문).toContain(domain)
  })

  it.each(NATURES)('분류 "%s" 가 문서에 등장한다', (nature) => {
    expect(본문).toContain(nature)
  })

  it.each(폐기용어)('폐기된 용어 "%s" 가 본문에 남아 있지 않다', (term) => {
    expect(본문).not.toContain(term)
  })

  it('원문 문서를 링크한다 — 기준을 옮겨 적지 않는다', () => {
    expect(본문).toContain('원문/누리과정_취학전.md')
    expect(본문).toContain('원문/성취기준_초1-2학년군.md')
  })
})

describe('05 목표표가 코드와 같은 어휘를 쓴다', () => {
  const 목표표 = read(DOC_05)

  it.each(COVERAGES)('커버리지 "%s" 가 목표표에 등장한다', (coverage) => {
    expect(목표표).toContain(coverage)
  })

  it.each(NATURES)('분류 "%s" 가 목표표에 등장한다', (nature) => {
    expect(목표표).toContain(nature)
  })

  it.each(폐기용어)('폐기된 용어 "%s" 가 남아 있지 않다', (term) => {
    expect(목표표).not.toContain(term)
  })
})

describe('06 PRD 가 코드와 같은 어휘를 쓴다', () => {
  const prd = read(DOC_06)

  it.each(COVERAGES)('커버리지 "%s" 가 PRD 에 등장한다', (coverage) => {
    expect(prd).toContain(coverage)
  })

  it.each(DOMAINS)('영역 "%s" 이 PRD 에 등장한다', (domain) => {
    expect(prd).toContain(domain)
  })

  it.each(STANDARD_ORIGINS)('origin "%s" 이 PRD 에 등장한다', (origin) => {
    expect(prd).toContain(origin)
  })
})

describe('07 계약 문서가 코드의 계약을 빠짐없이 담는다', () => {
  const 계약 = read(DOC_07)

  it.each(ERROR_CODES)('에러 계약 "%s" 가 문서화되어 있다', (code) => {
    // 코드에 에러를 추가하고 문서화하지 않으면 여기서 잡힌다
    expect(계약).toContain(code)
  })

  it.each(COVERAGES)('커버리지 "%s" 가 계약 문서에 등장한다', (coverage) => {
    expect(계약).toContain(coverage)
  })

  it('코드에 있는 모든 도메인 모듈이 §8 모듈 구조에 적혀 있다', () => {
    for (const m of ['pace.ts', 'nature.ts', 'provenance.ts', 'coverage.ts', 'today.ts', 'report.ts', 'completion.ts', 'activity.ts', 'guards.ts', 'errors.ts', 'types.ts', 'gate.ts', 'pet.ts', 'academy.ts']) {
      expect(계약, m).toContain(m)
    }
  })
})

describe('08 UI 계약이 도메인 어휘를 따른다', () => {
  const ui = read(DOC_08)

  it.each(COVERAGES)('커버리지 "%s" 의 표현 규칙이 정해져 있다', (coverage) => {
    expect(ui).toContain(coverage)
  })

  it.each(NATURES)('분류 "%s" 의 표현 규칙이 정해져 있다', (nature) => {
    expect(ui).toContain(nature)
  })

  it.each(폐기용어)('폐기된 용어 "%s" 가 없다', (term) => {
    expect(ui).not.toContain(term)
  })

  it('⭐ UI 가 판단하지 않는다는 제1원칙을 명시한다', () => {
    // 컴포넌트가 색을 자의적으로 정하면 C-6 가 언제든 깨진다
    expect(ui).toContain('shouldWarnOnMiss')
    expect(ui).toContain('assessOffsetRaise')
    expect(ui).toContain('evaluateCoverage')
  })

  it('X-3(죄책감) 검증을 수동 항목으로 남겨둔다', () => {
    // 감정이 판정 기준인 계약을 자동화된 척하면 놓친다
    expect(ui).toContain('수동')
    expect(ui).toContain('X-3')
  })
})

describe('원문 문서가 제자리에 있다', () => {
  it.each([
    'docs/원문/누리과정_취학전.md',
    'docs/원문/성취기준_초1-2학년군.md',
    'docs/원문/전수매핑.md',
  ])('%s 가 존재하고 비어 있지 않다', (path) => {
    expect(read(path).length).toBeGreaterThan(500)
  })
})
