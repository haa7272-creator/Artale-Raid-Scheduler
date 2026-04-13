import { createClient } from '@supabase/supabase-js'

// 這兩行會自動抓取你 .env.local 檔案裡的資料
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

export const supabase = createClient(supabaseUrl, supabaseAnonKey)