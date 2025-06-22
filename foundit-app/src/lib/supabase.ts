import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Missing Supabase environment variables:', { 
    supabaseUrl: !!supabaseUrl, 
    supabaseAnonKey: !!supabaseAnonKey,
    actualUrl: supabaseUrl,
    actualKey: supabaseAnonKey ? supabaseAnonKey.substring(0, 20) + '...' : 'undefined'
  })
  throw new Error('Missing Supabase environment variables. Check NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY')
}

console.log('Supabase client initialized:', {
  url: supabaseUrl,
  keyPreview: supabaseAnonKey.substring(0, 20) + '...'
})

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
  },
  // Disable realtime to avoid webpack issues
  realtime: {
    disabled: true,
  },
  global: {
    headers: {
      'X-Client-Info': 'supabase-js-web',
    },
  },
})

// Database types
export interface Memory {
  id: string
  user_id: string
  title: string
  content: string | null
  url: string | null
  type: 'document' | 'note' | 'link' | 'text' | 'image' | 'video' // Keep old types for backward compatibility
  category: string | null
  tags: string[] | null
  metadata: any | null
  file_path: string | null
  created_at: string
  updated_at: string
}

export interface Profile {
  id: string
  email: string
  full_name: string | null
  avatar_url: string | null
  created_at: string
  updated_at: string
}