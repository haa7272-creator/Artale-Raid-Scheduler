import { createClient } from '@supabase/supabase-js'

// 這裡不要直接貼上網址和 Key，要用變數讀取
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  console.error("Supabase 變數遺失，請檢查環境變數設定！");
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey)