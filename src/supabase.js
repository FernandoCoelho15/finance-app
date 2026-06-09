import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://mrbhiobmbvghzvvkdjsv.supabase.co'

const supabaseKey = 'sb_publishable_Uf_i9JoUHcXeaZ5K0eZtlw_15XZulf0'

export const supabase = createClient(supabaseUrl, supabaseKey)
