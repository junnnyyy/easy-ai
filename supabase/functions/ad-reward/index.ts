import { errorResponse, handleCors, jsonResponse } from "../_shared/cors.ts";
import { createServiceClient } from "../_shared/supabase.ts";

// 보상 TTL: 10분 (광고 시청 후 곧바로 사용한다고 가정)
const REWARD_TTL_MINUTES = 10;

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

  // 멱등성: 같은 (device_id, nonce)면 기존 row 반환 (광고 재시도/네트워크 재전송 대비)
  const { data: existing } = await db
    .from("ad_rewards")
    .select("id, expires_at")
    .eq("device_id", deviceId)
    .eq("nonce", nonce)
    .maybeSingle();

  if (existing) {
    return jsonResponse({
      rewardId: existing.id,
      expiresAt: existing.expires_at,
    });
  }

  const expiresAt = new Date(Date.now() + REWARD_TTL_MINUTES * 60 * 1000).toISOString();

  const { data, error } = await db
    .from("ad_rewards")
    .insert({ device_id: deviceId, nonce, expires_at: expiresAt })
    .select("id, expires_at")
    .single();

  if (error) {
    // unique 충돌 (동시 insert) → 재조회로 멱등성 회복
    const { data: retried } = await db
      .from("ad_rewards")
      .select("id, expires_at")
      .eq("device_id", deviceId)
      .eq("nonce", nonce)
      .maybeSingle();
    if (retried) {
      return jsonResponse({
        rewardId: retried.id,
        expiresAt: retried.expires_at,
      });
    }
    return errorResponse("DB_ERROR", "보상 발급 중 오류가 발생했어요.", 500);
  }

  return jsonResponse({
    rewardId: data!.id,
    expiresAt: data!.expires_at,
  });
});
