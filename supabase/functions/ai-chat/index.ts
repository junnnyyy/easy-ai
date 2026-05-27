import { errorResponse, handleCors, jsonResponse } from "../_shared/cors.ts";
import { formatNewsForPrompt, searchNews, searchNewsForMarket } from "../_shared/news-search.ts";
import { formatMacroForPrompt, getMacroIndicators } from "../_shared/macro-indicators.ts";
import { inferSectorKeywords } from "../_shared/sector-inference.ts";
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
  market?: "nasdaq" | "kospi" | "kosdaq";
  marketCap?: "large" | "mid" | "small";
  symbolName?: string;
  clientRequestId?: string; // 멱등성 키 (응답 유실 시 재시도용)
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

  const { deviceId, requestType, message, tone, market, marketCap, symbolName, clientRequestId } = body;

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

  // ── 3. 멱등성 체크 ────────────────────────────────────────────
  // 같은 client_request_id가 이미 처리됐으면, requiresAd 게이트보다 먼저
  // 저장된 답변을 재차감 없이 반환. (성공 후 응답만 유실된 케이스 복구)
  if (clientRequestId) {
    const { data: prior } = await db
      .from("ai_requests")
      .select("id, status, ai_output")
      .eq("device_id", deviceId)
      .eq("client_request_id", clientRequestId)
      .maybeSingle();

    if (prior?.status === "success") {
      const u = await getUsageStatus(db, deviceId);
      return jsonResponse({
        answer: prior.ai_output ?? "",
        requestId: prior.id,
        usage: {
          freeCount: u.freeCount,
          adCount: u.adCount,
          requiresAd: u.requiresAd,
          isBlocked: u.isBlocked,
        },
      });
    }
    if (prior?.status === "processing") {
      return errorResponse(
        "AI_IN_PROGRESS",
        "답변을 생성하고 있어요. 잠시 후 다시 시도해주세요.",
        409
      );
    }
  }

  // ── 4. 민감정보 검사 ──────────────────────────────────────────
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

  if (usage.requiresAd) {
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
    kosdaq: "코스닥",
  };
  const marketCapLabel: Record<string, string> = {
    large: "대형주 (시총 상위)",
    mid: "중형주 (시총 중간)",
    small: "소형주 (시총 하위)",
  };

  let newsContext = "";
  let macroContext = "";

  // 수혜주 찾기는 최신 뉴스 검색 결과를 컨텍스트로 주입
  if (requestType === "stock_beneficiary" && market) {
    const newsItems = await searchNewsForMarket(message, market);
    newsContext = formatNewsForPrompt(newsItems);
  }

  // 종목분석: 종목 뉴스 + 섹터 뉴스 + 거시 지표를 컨텍스트로 주입
  if (requestType === "stock_analysis" && market && symbolName) {
    const sectorKeywordsP = inferSectorKeywords(symbolName, market);
    const symbolNewsP = searchNews(symbolName);
    const macroP = getMacroIndicators(db);

    const [sectorKeywords, symbolNews, macro] = await Promise.all([
      sectorKeywordsP,
      symbolNewsP,
      macroP,
    ]);

    const sectorNewsLists = sectorKeywords.length
      ? await Promise.all(sectorKeywords.map((kw) => searchNews(kw, 4)))
      : [];

    const symbolSection = symbolNews.length
      ? `[종목 뉴스 — "${symbolName}"]\n${formatNewsForPrompt(symbolNews)}`
      : `[종목 뉴스 — "${symbolName}"]\n(검색 결과 없음)`;

    const sectorSection = sectorKeywords.length
      ? sectorKeywords
          .map((kw, i) => {
            const list = sectorNewsLists[i] ?? [];
            return `[섹터 뉴스 — "${kw}"]\n${formatNewsForPrompt(list)}`;
          })
          .join("\n\n")
      : "[섹터 뉴스]\n(섹터를 추론하지 못했어요.)";

    newsContext = `${symbolSection}\n\n${sectorSection}`;
    macroContext = formatMacroForPrompt(macro);
  }

  const userPrompt = template.user_template
    .replace("{{user_input}}", message)
    .replace("{{tone}}", tone ?? "")
    .replace("{{market}}", market ? (marketLabel[market] ?? market) : "")
    .replace("{{market_cap}}", marketCap ? (marketCapLabel[marketCap] ?? marketCap) : "")
    .replace("{{symbol_name}}", symbolName ?? "")
    .replace("{{news_context}}", newsContext)
    .replace("{{macro_context}}", macroContext);

  // ── 6. 대화 히스토리 조회 (전체 기능, 최근 24시간) ──────────────
  type ChatMessage = { role: string; content: string };
  const since = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
  const { data: history } = await db
    .from("conversation_messages")
    .select("role, content")
    .eq("device_id", deviceId)
    .eq("request_type", requestType)
    .gte("created_at", since)
    .order("created_at", { ascending: false })
    .limit(100);
  const conversationHistory: ChatMessage[] = history
    ? (history as ChatMessage[]).reverse()
    : [];

  // ── 7. ai_requests 로그 생성 (client_request_id를 멱등 락으로 사용) ──
  const { data: reqRow, error: insertErr } = await db
    .from("ai_requests")
    .insert({
      device_id: deviceId,
      request_type: requestType,
      user_input_length: message.length,
      status: "processing",
      client_request_id: clientRequestId ?? null,
    })
    .select("id")
    .single();

  // 동시 요청이 같은 키로 먼저 락을 잡은 경우 (unique 충돌)
  if (insertErr && clientRequestId) {
    const { data: prior } = await db
      .from("ai_requests")
      .select("id, status, ai_output")
      .eq("device_id", deviceId)
      .eq("client_request_id", clientRequestId)
      .maybeSingle();
    if (prior?.status === "success") {
      const u = await getUsageStatus(db, deviceId);
      return jsonResponse({
        answer: prior.ai_output ?? "",
        requestId: prior.id,
        usage: {
          freeCount: u.freeCount,
          adCount: u.adCount,
          requiresAd: u.requiresAd,
          isBlocked: u.isBlocked,
        },
      });
    }
    return errorResponse(
      "AI_IN_PROGRESS",
      "답변을 생성하고 있어요. 잠시 후 다시 시도해주세요.",
      409
    );
  }

  const requestId = reqRow?.id ?? "unknown";

  // ── 8. OpenAI 호출 ────────────────────────────────────────────
  let answer = "";
  let promptTokens = 0;
  let completionTokens = 0;

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 60_000);

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
    // 실패 시 멱등 키를 풀어(null) 같은 키로의 재시도가 새로 생성되게 함
    await db
      .from("ai_requests")
      .update({ status: "failed", error_message: String(err), client_request_id: null, updated_at: nowKST() })
      .eq("id", requestId);

    return errorResponse(
      isTimeout ? "AI_TIMEOUT" : "AI_ERROR",
      isTimeout
        ? "AI 응답이 너무 늦어지고 있어요. 잠시 후 다시 시도해주세요."
        : "AI 응답 중 오류가 발생했어요. 잠시 후 다시 시도해주세요.",
      502
    );
  }

  // ── 9. 로그 업데이트 + 사용량 증가 + 대화 히스토리 저장 ────────
  const saveHistory = db.from("conversation_messages").insert([
    { device_id: deviceId, request_type: requestType, role: "user", content: message },
    { device_id: deviceId, request_type: requestType, role: "assistant", content: answer },
  ]);

  await Promise.all([
    db.from("ai_requests").update({
      ai_output: answer,
      status: "success",
      model_name: template.model,
      prompt_tokens: promptTokens,
      completion_tokens: completionTokens,
      updated_at: nowKST(),
    }).eq("id", requestId),

    incrementUsage(db, deviceId, "free_count"),

    saveHistory,
  ]);

  // ── 10. 최신 사용량으로 응답 ──────────────────────────────────
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
