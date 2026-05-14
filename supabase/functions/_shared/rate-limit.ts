import type { SupabaseClient } from "npm:@supabase/supabase-js@2";

export const FREE_DAILY_LIMIT = 0; // 무료 사용 없음: 첫 질문부터 광고 필요
export const AD_DAILY_LIMIT = 10; // 광고 포함 최대 하루 사용 횟수

export type UsageRow = {
  id: string;
  device_id: string;
  usage_date: string;
  free_count: number;
  ad_count: number;
  blocked_count: number;
};

export type UsageStatus = {
  freeCount: number;
  adCount: number;
  requiresAd: boolean; // 무료 소진 → 광고 시청 필요
  isBlocked: boolean;  // 광고 포함 한도도 소진 → 완전 차단
};

export async function getUsageStatus(
  db: SupabaseClient,
  deviceId: string
): Promise<UsageStatus> {
  const today = new Date().toISOString().slice(0, 10);

  const { data } = await db
    .from("usage_limits")
    .select("free_count, ad_count")
    .eq("device_id", deviceId)
    .eq("usage_date", today)
    .maybeSingle();

  const freeCount = data?.free_count ?? 0;
  const adCount = data?.ad_count ?? 0;

  return {
    freeCount,
    adCount,
    requiresAd: freeCount >= FREE_DAILY_LIMIT,
    isBlocked: freeCount >= FREE_DAILY_LIMIT && adCount >= AD_DAILY_LIMIT,
  };
}

export async function incrementUsage(
  db: SupabaseClient,
  deviceId: string,
  column: "free_count" | "ad_count"
): Promise<void> {
  const today = new Date().toISOString().slice(0, 10);

  await db.rpc("increment_usage", {
    p_device_id: deviceId,
    p_usage_date: today,
    p_column: column,
  });
}

export async function incrementBlockedCount(
  db: SupabaseClient,
  deviceId: string
): Promise<void> {
  const today = new Date().toISOString().slice(0, 10);

  await db.rpc("increment_usage", {
    p_device_id: deviceId,
    p_usage_date: today,
    p_column: "blocked_count",
  });
}
