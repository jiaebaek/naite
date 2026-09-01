/**
 * 아키텍처 테스트 — ECB 경계와 OOS-1 을 구조로 지킨다.
 *
 * 어떤 계약은 단위 테스트로 증명하기 어렵다.
 * "아빠에게 요구하지 않는다"(INV-ACT-05 / OOS-1)는 **기능의 부재**라서
 * 값을 단언할 대상이 없다. 대신 **그런 코드가 존재하지 않음**을 검사한다.
 */

import { describe, it, expect } from 'vitest'
import { readdirSync, readFileSync } from 'node:fs'
import { resolve } from 'node:path'

const DOMAIN_DIR = resolve(process.cwd(), 'src/domain')

const domainFiles = (dir = DOMAIN_DIR): string[] =>
  readdirSync(dir, { withFileTypes: true }).flatMap((e) =>
    e.isDirectory()
      ? domainFiles(resolve(dir, e.name))
      : e.name.endsWith('.ts')
        ? [resolve(dir, e.name)]
        : [],
  )

const files = domainFiles()
const rel = (p: string) => p.slice(resolve(process.cwd()).length + 1).replace(/\\/g, '/')

/** import 문에서 모듈 경로만 뽑는다 */
const importsOf = (src: string): string[] =>
  [...src.matchAll(/from\s+['"]([^'"]+)['"]/g)].map((m) => m[1]!)

/** 블록·라인 주석을 걷어낸다. 주석은 계약을 설명하는 자리라 검사 대상이 아니다. */
const stripComments = (src: string): string =>
  src.replace(/\/\*[\s\S]*?\*\//g, '').replace(/\/\/.*$/gm, '')

describe('Entity 트랙은 순수하다 — Boundary → Entity 단방향', () => {
  it('도메인 파일이 하나 이상 존재한다', () => {
    expect(files.length).toBeGreaterThan(5)
  })

  it.each(files.map(rel))('%s 가 UI·인프라를 import 하지 않는다', (file) => {
    const src = readFileSync(resolve(process.cwd(), file), 'utf-8')
    const 금지 = ['react', 'react-dom', '@supabase', 'supabase', 'vite']

    for (const imp of importsOf(src)) {
      for (const bad of 금지) {
        expect(imp.toLowerCase(), `${file} → ${imp}`).not.toContain(bad)
      }
    }
  })

  it.each(files.map(rel))('%s 가 boundary 를 import 하지 않는다', (file) => {
    const src = readFileSync(resolve(process.cwd(), file), 'utf-8')
    for (const imp of importsOf(src)) {
      expect(imp, `${file} → ${imp}`).not.toContain('boundary')
    }
  })

  it.each(files.map(rel))('%s 가 I/O 를 직접 하지 않는다', (file) => {
    const src = readFileSync(resolve(process.cwd(), file), 'utf-8')
    for (const imp of importsOf(src)) {
      expect(imp, `${file} → ${imp}`).not.toMatch(/^node:/)
    }
    // fetch/localStorage 직접 호출도 금지
    expect(src, file).not.toMatch(/\bfetch\s*\(/)
    expect(src, file).not.toMatch(/\blocalStorage\b/)
  })
})

describe('⭐ OOS-1 / INV-ACT-05 — 아빠에게 요구하는 코드가 존재하지 않는다', () => {
  // 트러블을 줄이려던 기능이 트러블의 원인이 된다.
  // 사용자 결정: "아빠에게 무언가를 요구하는 형태가 되면 안 된다."
  const 금지심볼 = ['notify', 'notification', 'assign', 'assignment', 'remind', 'reminder', 'alert', 'push']

  it.each(files.map(rel))('%s 가 알림·할당 심볼을 export 하지 않는다', (file) => {
    const src = readFileSync(resolve(process.cwd(), file), 'utf-8')
    const exported = [...src.matchAll(/export\s+(?:async\s+)?(?:function|const|class|interface|type)\s+(\w+)/g)]
      .map((m) => m[1]!.toLowerCase())

    for (const name of exported) {
      for (const bad of 금지심볼) {
        expect(name, `${file}: export ${name}`).not.toContain(bad)
      }
    }
  })

  it('저장소 포트에도 알림·할당이 없다', () => {
    const src = readFileSync(resolve(process.cwd(), 'src/boundary/repository.ts'), 'utf-8')
    const exported = [...src.matchAll(/export\s+interface\s+(\w+)/g)].map((m) => m[1]!.toLowerCase())

    for (const name of exported) {
      for (const bad of 금지심볼) {
        expect(name, `repository: ${name}`).not.toContain(bad)
      }
    }
  })

  it('owner 는 타입에만 있고 분기 로직에 쓰이지 않는다', () => {
    for (const file of files) {
      const src = readFileSync(file, 'utf-8')
      // owner 로 조건 분기하면 "아빠면 ~한다" 가 생긴 것이다
      expect(src, rel(file)).not.toMatch(/owner\s*===\s*['"]아빠['"]/)
      expect(src, rel(file)).not.toMatch(/if\s*\([^)]*\.owner/)
    }
  })
})

describe('⭐ INV-UI-00 — UI 는 판단하지 않는다', () => {
  const uiDir = resolve(process.cwd(), 'src/boundary/ui')
  const uiFiles = (): string[] => {
    try {
      return readdirSync(uiDir, { withFileTypes: true })
        .filter((e) => e.isFile() && /\.tsx?$/.test(e.name))
        .map((e) => resolve(uiDir, e.name))
    } catch {
      return []
    }
  }

  it('UI 파일이 존재한다', () => {
    expect(uiFiles().length).toBeGreaterThan(0)
  })

  it.each(uiFiles().map(rel))('%s 가 nature 를 직접 비교하지 않는다', (file) => {
    // 컴포넌트가 색을 자의적으로 정하면 shouldWarnOnMiss() 가 장식이 된다.
    const code = stripComments(readFileSync(resolve(process.cwd(), file), 'utf-8'))
    expect(code, file).not.toMatch(/nature\s*===\s*['"]/)
    expect(code, file).not.toMatch(/['"]적기['"]\s*===/)
  })

  it.each(uiFiles().map(rel))('%s 가 커버리지 판정을 재구현하지 않는다', (file) => {
    const code = stripComments(readFileSync(resolve(process.cwd(), file), 'utf-8'))
    // 커버리지 판정의 핵심 시그니처는 `a.targetIds.some(id => currentTargets…)` 교집합이다.
    // UI 가 이걸 직접 하면 evaluateCoverage() 가 장식이 된다.
    // (activities.filter(a => a.active) 활성 목록 관리, targetIds.includes(id) 폼 선택 토글은
    //  판정이 아니라 정당한 용도라 허용. nature/coverage 가 실제로 도메인에서 오는지는
    //  컴포넌트 테스트가 배지 결과로 검증한다.)
    expect(code, file).not.toMatch(/targetIds\.some/)
  })

  it.each(uiFiles().map(rel))('%s 에 알림·요구 컨트롤이 없다 (OOS-1)', (file) => {
    const code = stripComments(readFileSync(resolve(process.cwd(), file), 'utf-8'))
    for (const bad of ['notify', 'remind', 'assign', 'push', 'alert(']) {
      expect(code.toLowerCase(), `${file}: ${bad}`).not.toContain(bad)
    }
  })
})

describe('INV-ACT-02 — nature 는 저장되지 않는다', () => {
  it('Activity 인터페이스에 nature 필드가 없다', () => {
    const src = readFileSync(resolve(process.cwd(), 'src/domain/types.ts'), 'utf-8')
    const activityBlock = src.slice(
      src.indexOf('export interface Activity'),
      src.indexOf('export type ActivityInput'),
    )
    expect(activityBlock).toContain('targetIds')
    expect(activityBlock).not.toMatch(/^\s*readonly nature/m)
  })
})

describe('INV-COV-05 — 커버리지는 수행 이력을 참조하지 않는다', () => {
  it('coverage.ts 의 코드가 Completion 을 다루지 않는다 (주석 설명은 허용)', () => {
    const src = readFileSync(resolve(process.cwd(), 'src/domain/coverage.ts'), 'utf-8')
    // 주석은 이 계약을 *설명*하는 자리다. 검사 대상은 실제 코드다.
    const code = stripComments(src)
    expect(code).not.toMatch(/\bCompletion\b/)
    expect(code).not.toMatch(/\bcompletions\b/)
  })
})
