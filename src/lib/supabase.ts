import "server-only";
import { createClient } from "@supabase/supabase-js";

const url = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
export const isSupabaseConfigured = Boolean(url && key);
export const supabase =
  url && key
    ? createClient(url, key, {
        auth: { persistSession: false, autoRefreshToken: false },
      })
    : null;
export function database() {
  if (!supabase) throw new Error("Database unavailable");
  return supabase;
}
export function checked<T>({
  data,
  error,
}: {
  data: T;
  error: unknown;
}): NonNullable<T> {
  if (error) throw new Error("Database operation failed");
  return data as NonNullable<T>;
}
