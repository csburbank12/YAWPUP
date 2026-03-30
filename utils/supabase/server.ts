// Initialize Supabase Client
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://your-project-ref.supabase.co';
const supabaseAnonKey = 'your-anon-key';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Helper functions
export const fetchData = async (tableName) => {
  const { data, error } = await supabase
    .from(tableName)
    .select('*');
  if (error) throw error;
  return data;
};

export const insertData = async (tableName, newData) => {
  const { data, error } = await supabase
    .from(tableName)
    .insert(newData);
  if (error) throw error;
  return data;
};

export const updateData = async (tableName, id, updates) => {
  const { data, error } = await supabase
    .from(tableName)
    .update(updates)
    .eq('id', id);
  if (error) throw error;
  return data;
};

export const deleteData = async (tableName, id) => {
  const { data, error } = await supabase
    .from(tableName)
    .delete()
    .eq('id', id);
  if (error) throw error;
  return data;
};