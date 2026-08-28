// 野生工具铺 · LLM 无状态转发代理
// key 只路过不落地；无日志；仅支持 chat/completions
const hits = new Map();
const RATE_LIMIT = 30, WINDOW = 60000;

function normalizeBase(raw) {
  let u = String(raw || "").trim().replace(/\/+$/, "");
  if (!/^https?:\/\//i.test(u)) u = "https://" + u;
  if (/\/chat\/completions$/i.test(u)) return u;
  const bare = /^https?:\/\/[^\/]+$/i.test(u);
  if (/\/v1$/i.test(u) || bare) return u + "/chat/completions";
  return u + "/chat/completions";
}

export async function onRequestPost({ request }) {
  const ip = request.headers.get("CF-Connecting-IP") || "unknown";
  const now = Date.now();
  const arr = (hits.get(ip) || []).filter(t => now - t < WINDOW);
  if (arr.length >= RATE_LIMIT) return json({ error: "请求太频繁，请稍后再试" }, 429);
  arr.push(now); hits.set(ip, arr);

  let body;
  try { body = await request.json(); } catch { return json({ error: "请求体不是合法 JSON" }, 400); }
  const { baseURL, apiKey, model, messages, temperature } = body || {};
  if (!baseURL || !apiKey || !model || !Array.isArray(messages)) return json({ error: "缺少 baseURL / apiKey / model / messages" }, 400);
  if (!/^https:\/\//i.test(baseURL)) return json({ error: "baseURL 必须是 https://" }, 400);

  try {
    const resp = await fetch(normalizeBase(baseURL), {
      method: "POST",
      headers: { "Content-Type": "application/json", "Authorization": "Bearer " + apiKey },
      body: JSON.stringify({ model, messages, temperature: typeof temperature === "number" ? temperature : 0.2, max_tokens: 1600 }),
      signal: AbortSignal.timeout(60000)
    });
    const text = await resp.text();
    return new Response(text, { status: resp.status, headers: { "Content-Type": "application/json; charset=utf-8" } });
  } catch (e) {
    return json({ error: "转发失败：" + (e && e.message ? e.message : String(e)) }, 502);
  }
}

function json(obj, status) {
  return new Response(JSON.stringify(obj), { status: status || 200, headers: { "Content-Type": "application/json; charset=utf-8" } });
}
