import { errorResponse, handleCors, jsonResponse } from "../_shared/cors.ts";
import { createServiceClient } from "../_shared/supabase.ts";
import { AD_DAILY_LIMIT, creditFreeCount, getUsageStatus, incrementUsage } from "../_shared/rate-limit.ts";

type RequestBody = {
  deviceId: string;
  nonce: string; // 클라이언트가 광고 노출 직전 생성한 UUID — 멱등성 키
};

Deno.serve(async (req) => {
  const cors = handleCors(req);
  if (cors) return cors;

  let body: RequestBody;
  try {
    body = await req.json();
  } catch {
    return errorResponse("INVALID_JSON", "요청 형식이 올바르지 않아요.");
  }

  const { deviceId, nonce } = body;
  if (!deviceId || !nonce) {
    return errorResponse("MISSING_FIELDS", "deviceId, nonce가 필요해요.");
  }
  if (nonce.length < 8 || nonce.length > 128) {
    return errorResponse("INVALID_NONCE", "nonce 길이가 올바르지 않아요.");
  }

  const db = createServiceClient();

  // 멱등성: 같은 (device_id, nonce)면 이미 적립된 보상 → 재적립 없이 현재 잔량 반환
  const { data: existing } = await db
    .from("ad_rewards")
    .select("id")
    .eq("device_id", deviceId)
    .eq("nonce", nonce)
    .maybeSingle();

  if (existing) {
    const usage = await getUsageStatus(db, deviceId);
    return jsonResponse({ freeCount: usage.freeCount });
  }

  // 일일 광고 보상 한도 체크 (free_count 적립 전)
  const usage = await getUsageStatus(db, deviceId);
  if (usage.adCount >= AD_DAILY_LIMIT) {
    return errorResponse(
      "AD_DAILY_LIMIT_EXCEEDED",
      "오늘 광고 보상 한도를 모두 채웠어요. 내일 다시 이용해주세요.",
      429
    );
  }

  // 보상 기록 (감사 + 멱등성 키)
  const { error } = await db
    .from("ad_rewards")
    .insert({ device_id: deviceId, nonce });

  if (error) {
    // unique 충돌 (동시 insert) → 재적립 없이 멱등 회복
    const usageAfter = await getUsageStatus(db, deviceId);
    return jsonResponse({ freeCount: usageAfter.freeCount });
  }

  // 보상 지급: free_count += 1, ad_count += 1 (일일 한도 추적)
  await Promise.all([
    creditFreeCount(db, deviceId),
    incrementUsage(db, deviceId, "ad_count"),
  ]);

  const usageAfter = await getUsageStatus(db, deviceId);
  return jsonResponse({ freeCount: usageAfter.freeCount });
});
