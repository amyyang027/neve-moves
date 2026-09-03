// Supabase Storage — where member photos live once the app is hosted.
//
// Local dev without Supabase Storage configured falls back to /public/uploads
// (see src/app/members/actions.ts). Set SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY
// in .env to use the bucket.

import { createClient } from "@supabase/supabase-js";

const url = process.env.SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

export const STORAGE_BUCKET = process.env.SUPABASE_STORAGE_BUCKET ?? "uploads";
export const storageEnabled = Boolean(url && serviceKey);

// Service-role client — server-side only. Never import this into a Client
// Component. It bypasses row-level security, which is fine here because uploads
// only happen inside trusted server actions.
export const storage = storageEnabled
  ? createClient(url as string, serviceKey as string, {
      auth: { persistSession: false, autoRefreshToken: false },
    }).storage
  : null;
