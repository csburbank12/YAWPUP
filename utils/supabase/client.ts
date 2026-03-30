// Supabase client helper code for browser-side usage
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://your-project-ref.supabase.co';
const supabaseAnonKey = 'your-anon-key';

// Create a Supabase client
export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Example function to fetch data
export async function fetchData(table) {
    const { data, error } = await supabase
        .from(table)
        .select('*');
    if (error) {
        console.error('Error fetching data:', error);
    }
    return data;
}