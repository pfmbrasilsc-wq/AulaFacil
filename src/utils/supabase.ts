import { createClient } from '@supabase/supabase-js';
import { School, ClassGroup, Subject, TimeSlot, Activity, ClassJournal } from '../types';

// Retrieve Supabase credentials. Checked in order:
// 1. localStorage (allows teachers using APKs to configure custom servers directly inside the app)
// 2. Environment variables (set during build/hosting)
// NO hardcoded default credentials to ensure 100% local-first operation by default.
const getSupabaseConfig = () => {
  try {
    const url = localStorage.getItem('pedagogical_planner_supabase_url') || (import.meta as any).env.VITE_SUPABASE_URL || '';
    const key = localStorage.getItem('pedagogical_planner_supabase_anon_key') || (import.meta as any).env.VITE_SUPABASE_ANON_KEY || '';
    return { url: url.trim(), key: key.trim() };
  } catch (e) {
    const url = (import.meta as any).env.VITE_SUPABASE_URL || '';
    const key = (import.meta as any).env.VITE_SUPABASE_ANON_KEY || '';
    return { url: url.trim(), key: key.trim() };
  }
};

const config = getSupabaseConfig();

export const isSupabaseConfigured = !!(config.url && config.key);

export const supabase = isSupabaseConfigured
  ? createClient(config.url, config.key)
  : null;

// Generic helper to fetch all rows from a table
export async function fetchFromSupabase<T>(table: string): Promise<T[]> {
  if (!supabase) throw new Error('Supabase não configurado');
  const { data, error } = await supabase.from(table).select('*');
  if (error) {
    if (error.code === '42P01' || (error.message && error.message.includes('does not exist'))) {
      throw new Error(`A tabela "${table}" não existe no seu banco de dados Supabase. Por favor, crie as tabelas executando o script SQL no painel do Supabase.`);
    }
    throw new Error(`Erro ao buscar da tabela "${table}": ${error.message || error}`);
  }
  return data as T[];
}

// Generic helper to upsert data (insert or update)
export async function upsertToSupabase<T extends { id: string }>(table: string, data: T | T[]): Promise<boolean> {
  if (!supabase) return false;
  try {
    const arrayData = Array.isArray(data) ? data : [data];
    if (arrayData.length === 0) return true;

    // Clean data for database insertion
    const cleaned = arrayData.map(item => {
      // Remove any temporary properties or ensure formats
      const cleanedItem = { ...item } as any;
      if (table === 'activities') {
        if (!cleanedItem.classGroupIds || !Array.isArray(cleanedItem.classGroupIds)) {
          cleanedItem.classGroupIds = [];
        }
      }
      return cleanedItem;
    });

    const { error } = await supabase.from(table).upsert(cleaned);
    if (error) {
      if (error.code === '42P01' || (error.message && error.message.includes('does not exist'))) {
        throw new Error(`A tabela "${table}" não existe no seu banco de dados Supabase. Por favor, crie as tabelas executando o script SQL no painel do Supabase.`);
      }
      throw new Error(`Erro ao salvar na tabela "${table}": ${error.message || error}`);
    }
    return true;
  } catch (err: any) {
    console.warn(`Erro ao salvar dados na tabela ${table}:`, err.message || err);
    throw err;
  }
}

// Generic helper to delete data by ID
export async function deleteFromSupabase(table: string, id: string): Promise<boolean> {
  if (!supabase) return false;
  try {
    const { error } = await supabase.from(table).delete().eq('id', id);
    if (error) {
      if (error.code === '42P01' || (error.message && error.message.includes('does not exist'))) {
        throw new Error(`A tabela "${table}" não existe no seu banco de dados Supabase.`);
      }
      throw new Error(`Erro ao deletar da tabela "${table}": ${error.message || error}`);
    }
    return true;
  } catch (err: any) {
    console.warn(`Erro ao deletar da tabela ${table} id ${id}:`, err.message || err);
    throw err;
  }
}

// Clear all rows in a table (for clean overwrite/sync)
export async function clearSupabaseTable(table: string): Promise<boolean> {
  if (!supabase) return false;
  try {
    const { error } = await supabase.from(table).delete().neq('id', 'placeholder-non-existent-id-to-delete-all');
    if (error) {
      if (error.code === '42P01' || (error.message && error.message.includes('does not exist'))) {
        throw new Error(`A tabela "${table}" não existe no seu banco de dados Supabase.`);
      }
      throw new Error(`Erro ao limpar tabela "${table}": ${error.message || error}`);
    }
    return true;
  } catch (err: any) {
    console.warn(`Erro ao limpar tabela ${table}:`, err.message || err);
    throw err;
  }
}

// Upload all local data to Supabase (Overwrite/First time synchronization)
export async function pushAllToSupabase(data: {
  schools: School[];
  classes: ClassGroup[];
  subjects: Subject[];
  timeSlots: TimeSlot[];
  activities: Activity[];
  journals: ClassJournal[];
}): Promise<boolean> {
  if (!supabase) return false;
  // We run these in parallel, propagating any errors thrown by upsertToSupabase
  await Promise.all([
    upsertToSupabase('schools', data.schools),
    upsertToSupabase('classes', data.classes),
    upsertToSupabase('subjects', data.subjects),
    upsertToSupabase('time_slots', data.timeSlots),
    upsertToSupabase('activities', data.activities),
    upsertToSupabase('journals', data.journals),
  ]);
  return true;
}

// Fetch everything from Supabase
export async function pullAllFromSupabase(): Promise<{
  schools: School[];
  classes: ClassGroup[];
  subjects: Subject[];
  timeSlots: TimeSlot[];
  activities: Activity[];
  journals: ClassJournal[];
} | null> {
  if (!supabase) return null;
  const [schools, classes, subjects, timeSlots, activities, journals] = await Promise.all([
    fetchFromSupabase<School>('schools'),
    fetchFromSupabase<ClassGroup>('classes'),
    fetchFromSupabase<Subject>('subjects'),
    fetchFromSupabase<TimeSlot>('time_slots'),
    fetchFromSupabase<Activity>('activities'),
    fetchFromSupabase<ClassJournal>('journals'),
  ]);

  return {
    schools,
    classes,
    subjects,
    timeSlots,
    activities,
    journals,
  };
}
