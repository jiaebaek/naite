/**
 * Vite 환경변수 타입. 필요한 것만 좁게 선언한다(vite/client 전체를 끌어오지 않음).
 * 값이 없으면 undefined — getStore() 가 로컬 전용으로 폴백한다.
 */
interface ImportMetaEnv {
  readonly VITE_SUPABASE_URL?: string
  readonly VITE_SUPABASE_ANON_KEY?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
