import { errorResponse, handleCors, jsonResponse } from "../_shared/cors.ts";
import { formatNewsForPrompt, searchNewsForMarket } from "../_shared/news-search.ts";
import { getUsageStatus, incrementBlockedCount, incrementUsage } from "../_shared/rate-limit.ts";
import { detectSensitive } from "../_shared/sensitive.ts";
import { createServiceClient } from "../_shared/supabase.ts";

const OPENAI_API_URL = "https://api.openai.com/v1/chat/completions";

const nowKST = () => new Date(Date.now() + 9 * 60 * 60 * 1000).toISOString().slice(0, -1);

type RequestBody = {
  deviceId: string;
  requestType: string;
  message: string;
  tone?: "formal" | "casual" | "simple";
  market?: "nasdaq" | "kospi";
  marketCap?: "large" | "mid" | "small";
  rewardId?: string;
};

Deno.serve(async (req) => {
  const cors = handleCors(req);
  if (cors) return cors;

  // ── 1. 요청 파싱 ──────────────────────────────────────────────
  let body: RequestBody;
  try {
    body = await req.json();
  } catch {
    return errorResponse("INVALID_JSON", "요청 형식이 올바르지 않아요.");
  }

  const { deviceId, requestType, message, tone, market, marketCap, rewardId } = body;

  if (!deviceId || !requestType || !message) {
    return errorResponse("MISSING_FIELDS", "필수 항목이 빠져 있어요.");
  }

  if (message.length > 1000) {
    return errorResponse("INPUT_TOO_LONG", "입력이 너무 길어요. 1000자 이내로 줄여주세요.");
  }

  // ── 2. DB 클라이언트 / OpenAI 키 ─────────────────────────────
  const db = createServiceClient();
  const openAiKey = Deno.env.get("OPENAI_API_KEY");
  if (!openAiKey) {
    return errorResponse("CONFIG_ERROR", "서버 설정 오류가 발생했어요.", 500);
  }

  // ── 3. 민감정보 검사 ──────────────────────────────────────────
  const sensitive = detectSensitive(message);
  if (sensitive.detected) {
    await Promise.all([
      db.from("blocked_inputs").insert({
        device_id: deviceId,
        input_preview: sensitive.preview,
      }),
      incrementBlockedCount(db, deviceId),
    ]);
    return errorResponse(
      "BLOCKED_SENSITIVE_INPUT",
      "개인정보(주민번호, 카드번호 등)가 포함된 것 같아요. 개인정보는 입력하지 말아주세요.",
      400
    );
  }

  const usage = await getUsageStatus(db, deviceId);

  if (usage.isBlocked) {
    await incrementBlockedCount(db, deviceId);
    return errorResponse(
      "DAILY_LIMIT_EXCEEDED",
      "오늘 사용 한도를 모두 채웠어요. 내일 다시 이용해주세요.",
      429
    );
  }

  const isAdRequest = !!rewardId;

  if (usage.requiresAd && !isAdRequest) {
    return jsonResponse(
      {
        error: {
          code: "AD_REQUIRED",
          message: "무료 사용 횟수를 모두 썼어요. 광고를 보면 더 사용할 수 있어요.",
        },
        usage: {
          freeCount: usage.freeCount,
          adCount: usage.adCount,
          requiresAd: true,
          isBlocked: false,
        },
      },
      402
    );
  }

  // ── 4. 광고 보상 검증 + 일회성 소비 ────────────────────────────
  if (isAdRequest) {
    const { data: reward, error } = await db
      .from("ad_rewards")
      .select("id, used, expires_at")
      .eq("id", rewardId)
      .eq("device_id", deviceId)
      .maybeSingle();

    if (error || !reward) {
      return errorResponse("AD_REWARD_INVALID", "유효하지 않은 광고 보상이에요.", 403);
    }
    if (reward.used) {
      return errorResponse("AD_REWARD_INVALID", "이미 사용된 광고 보상이에요.", 403);
    }
    if (new Date(reward.expires_at) < new Date()) {
      return errorResponse("AD_REWARD_INVALID", "광고 보상이 만료됐어요.", 403);
    }

    // 조건부 update로 동시 사용 방어: where used=false 일 때만 used=true 변경
    const { data: consumed, error: consumeErr } = await db
      .from("ad_rewards")
      .update({ used: true, used_at: nowKST() })
      .eq("id", rewardId)
      .eq("used", false)
      .select("id");

    if (consumeErr || !consumed || consumed.length === 0) {
      return errorResponse("AD_REWARD_INVALID", "이미 사용된 광고 보상이에요.", 403);
    }
  }

  // ── 5. 프롬프트 조회 ──────────────────────────────────────────
  const { data: template, error: tplError } = await db
    .from("prompt_templates")
    .select("system_prompt, user_template, max_output_tokens, model")
    .eq("request_type", requestType)
    .single();

  if (tplError || !template) {
    return errorResponse("TEMPLATE_NOT_FOUND", "요청 유형을 찾을 수 없어요.", 400);
  }

  const marketLabel: Record<string, string> = {
    nasdaq: "나스닥",
    kospi: "코스피",
  };
  const marketCapLabel: Record<string, string> = {
    large: "대형주 (시총 상위)",
    mid: "중형주 (시총 중간)",
    small: "소형주 (시총 하위)",
  };

  // 수혜주 찾기는 최신 뉴스 검색 결과를 컨텍스트로 주입
  let newsContext = "";
  if (requestType === "stock_beneficiary" && market) {
    const newsItems = await searchNewsForMarket(message, market);
    newsContext = formatNewsForPrompt(newsItems);
  }

  const userPrompt = template.user_template
    .replace("{{user_input}}", message)
    .replace("{{tone}}", tone ?? "")
    .replace("{{market}}", market ? (marketLabel[market] ?? market) : "")
    .replace("{{market_cap}}", marketCap ? (marketCapLabel[marketCap] ?? marketCap) : "")
    .replace("{{news_context}}", newsContext);

  // ── 6. free_chat 대화 히스토리 조회 ─────────────────────────────
  type ChatMessage = { role: string; content: string };
  let conversationHistory: ChatMessage[] = [];
  if (requestType === "free_chat") {
    const { data: history } = await db
      .from("conversation_messages")
      .select("role, content")
      .eq("device_id", deviceId)
      .order("created_at", { ascending: false })
      .limit(10);
    if (history) {
      conversationHistory = (history as ChatMessage[]).reverse();
    }
  }

  // ── 7. ai_requests 로그 생성 ──────────────────────────────────
  const { data: reqRow } = await db
    .from("ai_requests")
    .insert({
      device_id: deviceId,
      request_type: requestType,
      user_input_length: message.length,
      ad_watched: isAdRequest,
      status: "processing",
    })
    .select("id")
    .single();

  const requestId = reqRow?.id ?? "unknown";

  // ── 7. OpenAI 호출 ────────────────────────────────────────────
  let answer = "";
  let promptTokens = 0;
  let completionTokens = 0;

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 30_000);

    const aiRes = await fetch(OPENAI_API_URL, {
      method: "POST",
      signal: controller.signal,
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${openAiKey}`,
      },
      body: JSON.stringify({
        model: template.model,
        messages: [
          { role: "system", content: template.system_prompt },
          ...conversationHistory,
          { role: "user", content: userPrompt },
        ],
        // gpt-5 계열은 max_completion_tokens, 그 외(gpt-4o 등)는 max_tokens
        ...(template.model.startsWith("gpt-5")
          ? { max_completion_tokens: template.max_output_tokens }
          : { max_tokens: template.max_output_tokens }),
        temperature: 0.7,
      }),
    });
    clearTimeout(timeoutId);

    if (!aiRes.ok) {
      const aiErr = await aiRes.json().catch(() => ({}));
      throw new Error(aiErr?.error?.message ?? "OpenAI 호출 실패");
    }

    const aiJson = await aiRes.json();
    answer = aiJson.choices?.[0]?.message?.content ?? "";
    promptTokens = aiJson.usage?.prompt_tokens ?? 0;
    completionTokens = aiJson.usage?.completion_tokens ?? 0;
  } catch (err) {
    const isTimeout = err instanceof Error && err.name === "AbortError";
    await db
      .from("ai_requests")
      .update({ status: "failed", error_message: String(err), updated_at: nowKST() })
      .eq("id", requestId);

    return errorResponse(
      isTimeout ? "AI_TIMEOUT" : "AI_ERROR",
      isTimeout
        ? "AI 응답이 너무 늦어지고 있어요. 잠시 후 다시 시도해주세요."
        : "AI 응답 중 오류가 발생했어요. 잠시 후 다시 시도해주세요.",
      502
    );
  }

  // ── 8. 로그 업데이트 + 사용량 증가 + 대화 히스토리 저장 ────────
  const saveHistory = requestType === "free_chat"
    ? db.from("conversation_messages").insert([
        { device_id: deviceId, role: "user", content: message },
        { device_id: deviceId, role: "assistant", content: answer },
      ])
    : Promise.resolve();

  await Promise.all([
    db.from("ai_requests").update({
      ai_output: answer,
      status: "success",
      model_name: template.model,
      prompt_tokens: promptTokens,
      completion_tokens: completionTokens,
      updated_at: nowKST(),
    }).eq("id", requestId),

    incrementUsage(db, deviceId, isAdRequest ? "ad_count" : "free_count"),

    saveHistory,
  ]);

  // ── 9. 최신 사용량으로 응답 ───────────────────────────────────
  const newUsage = await getUsageStatus(db, deviceId);

  return jsonResponse({
    answer,
    requestId,
    usage: {
      freeCount: newUsage.freeCount,
      adCount: newUsage.adCount,
      requiresAd: newUsage.requiresAd,
      isBlocked: newUsage.isBlocked,
    },
  });
});
