import { createClient } from "@supabase/supabase-js"

export interface RankingEntry {
  id?: number
  nome: string
  jogadas: number
  tempo: number // tempo em segundos
  data_criacao?: string
}

// Verificar se as variáveis de ambiente estão disponíveis
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

export const supabase = supabaseUrl && supabaseKey ? createClient(supabaseUrl, supabaseKey) : null

// Função para verificar se o Supabase está disponível
export const isSupabaseAvailable = () => {
  return supabase !== null
}
