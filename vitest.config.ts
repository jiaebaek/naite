import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    // 도메인은 순수 함수라 node 로 충분하다. UI 테스트만 jsdom 을 쓴다.
    environment: 'node',
    environmentMatchGlobs: [
      ['tests/ui/**', 'jsdom'],
      ['tests/boundary/**', 'jsdom'],
    ],
    setupFiles: ['tests/setup.ts'],
    include: ['tests/**/*.test.ts', 'tests/**/*.test.tsx'],
  },
})
