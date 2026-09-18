/**
 * 문서·코드 정합성 — 2026-09 문서 대청소 후 재정합.
 *
 * 배경: 옛 기준 문서(04 교육기준표·05 목표표·06 PRD·07 계약·08 UI계약)는 SSOT/명세로 통합되며
 *      삭제됐다. 그 문서들의 세부 어휘(내부 커버리지 enum·에러코드 등)를 검사하던 옛 정합 테스트는
 *      대상이 사라져 무의미해졌다. → 여기서는 **살아있는 핵심 문서**에 코드의 공개 어휘(영역·출처)가
 *      있는지와, **원문(누리·성취기준)이 제자리**에 있는지만 확인한다.
 *
 * 마크다운은 타입 검사를 안 받으니, "코드 어휘가 문서에 실제로 존재하는지"를 테스트로 지킨다.
 */
import { describe, it, expect } from 'vitest'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { DOMAINS, STANDARD_ORIGINS } from '../../src/domain/types'

const read = (rel: string) => readFileSync(resolve(process.cwd(), rel), 'utf-8')

/** 대청소 후 살아있는 핵심 문서 (전략·명세·백로그·큐레이션·성장좌표). */
const LIVING_DOCS = [
  'docs/00-전략-원칙.md',
  'docs/ux/나이테-리디자인-명세.md',
  'docs/09-작업지시-백로그.md',
  'docs/10-프리셋-활동목표-큐레이션.md',
  'docs/11-묶음-온보딩-큐레이션.md',
  'docs/14-성장좌표-데이터모델-과학탐구.md',
  'docs/15-성장좌표-큐레이션-취학전.md',
]
const 본문 = LIVING_DOCS.map(read).join('\n')

describe('살아있는 문서가 코드의 공개 어휘를 담는다', () => {
  it.each(DOMAINS)('영역 "%s" 이 문서에 등장한다', (domain) => {
    expect(본문).toContain(domain)
  })

  it.each(STANDARD_ORIGINS)('origin "%s" 이 문서에 등장한다', (origin) => {
    expect(본문).toContain(origin)
  })
})

describe('원문 문서가 제자리에 있다 (신뢰의 근거 · 삭제 금지)', () => {
  it.each([
    'docs/원문/누리과정_취학전.md',
    'docs/원문/성취기준_초1-2학년군.md',
    'docs/원문/전수매핑.md',
  ])('%s 가 존재하고 비어 있지 않다', (path) => {
    expect(read(path).length).toBeGreaterThan(500)
  })
})
