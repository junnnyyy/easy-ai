import type { SupabaseClient } from "npm:@supabase/supabase-js@2";
import { todayKST } from "./time.ts";

export const AD_DAILY_LIMIT = 100;

export type UsageStatus = {
  freeCount: number;
  adCount: number;
  requiresAd: boolean;
  isBlocked: boolean;
};

// 클라이언트 응답용 usage 객체 (UsageStatus → 응답 페이로드).
export function usagePayload(u: UsageStatus) {
  return {
    freeCount: u.freeCount,
    adCount: u.adCount,
    requiresAd: u.requiresAd,
    isBlocked: u.isBlocked,
  };
}

export async function getUsageStatus(
  db: SupabaseClient,
  deviceId: string
): Promise<UsageStatus> {
  const today = todayKST();

  const [quotaRes, usageRes] = await Promise.all([
    db.from("user_quotas").select("free_count").eq("device_id", deviceId).maybeSingle(),
    db.from("usage_limits").select("ad_count").eq("device_id", deviceId).eq("usage_date", today).maybeSingle(),
  ]);

  // 첫 접속이면 free_count = 1 (기본값), 이후엔 DB 값 사용
  const freeCount = quotaRes.data?.free_count ?? 1;
  const adCount = usageRes.data?.ad_count ?? 0;

  return {
    freeCount,
    adCount,
    requiresAd: freeCount <= 0,
    isBlocked: freeCount <= 0 && adCount >= AD_DAILY_LIMIT,
  };
}

export async function incrementUsage(
  db: SupabaseClient,
  deviceId: string,
  column: "free_count" | "ad_count"
): Promise<void> {
  if (column === "free_count") {
    await db.rpc("decrement_free_count", { p_device_id: deviceId });
  } else {
    const today = todayKST();
    await db.rpc("increment_usage", {
      p_device_id: deviceId,
      p_usage_date: today,
      p_column: column,
    });
  }
}

// 광고 시청 보상: free_count += 1
export async function creditFreeCount(
  db: SupabaseClient,
  deviceId: string
): Promise<void> {
  await db.rpc("increment_free_count", { p_device_id: deviceId });
}

export async function incrementBlockedCount(
  db: SupabaseClient,
  deviceId: string
): Promise<void> {
  const today = todayKST();

  await db.rpc("increment_usage", {
    p_device_id: deviceId,
    p_usage_date: today,
    p_column: "blocked_count",
  });
}
