import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

/*
 * Hit once a day by the Vercel cron in vercel.json. Supabase's free plan
 * pauses a project after 7 days without activity (it did, 2026-10-11), and a
 * paused project takes sign-in and every saved plan down with it. One tiny
 * query a day keeps it awake. RLS means the anon read returns no rows, but
 * the database still does the work, which is what counts.
 */

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  // Vercel sends this header on cron calls when CRON_SECRET is set.
  const secret = process.env.CRON_SECRET;
  if (secret && req.headers.get("authorization") !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { error } = await supabase.from("profiles").select("id").limit(1);
  if (error) return NextResponse.json({ ok: false, error: error.message }, { status: 503 });
  return NextResponse.json({ ok: true });
}
