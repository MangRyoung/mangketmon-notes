// 각성체 「포트 읽기」 — 세션 노트 각성체 화면의 🔍 단추가 부른다 (2026-10-29 감우).
// 각성체 그림(포켓몬 시트에 그린 각성체 모습)을 Claude 가 보고, 그 모습에 어울리는 원전 인물을 후보 DB 에서 골라 JSON 으로 돌려준다.
// (10-29 망령: 트레이너에 어울리는 각성체가 아니라, 각성체 그림에 어울리는 원전)
// GM 만: 캠페인 id + 비밀구를 nt_whoami 로 확인한다. API 키는 이 함수의 비밀값 ANTHROPIC_API_KEY 에만 둔다.
// 올리는 법은 같은 폴더의 「올리는법.txt」.
import Anthropic from "npm:@anthropic-ai/sdk";

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, apikey, content-type, x-client-info",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};
const out = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { ...CORS, "Content-Type": "application/json; charset=utf-8" } });

const MODEL = Deno.env.get("AWAKEN_MODEL") || "claude-opus-5-5";

/* 돌려받는 꼴 — 노트의 applyRead 가 읽는 것과 같다 */
const pickItem = {
  type: "object", additionalProperties: false, required: ["id", "n", "why", "cost"],
  properties: { id: { type: "string" }, n: { type: "string" }, why: { type: "string" }, cost: { type: "string" } },
};
const extraItem = {
  type: "object", additionalProperties: false,
  required: ["n", "o", "r", "e", "c", "f", "l", "d", "k", "t", "w", "g", "why", "cost"],
  properties: {
    n: { type: "string" }, o: { type: "string" }, r: { type: "string" }, e: { type: "string" },
    c: { type: "string" }, f: { type: "integer" }, l: { type: "string" }, d: { type: "string" },
    k: { type: "string" }, t: { type: "array", items: { type: "string" } },
    w: { type: "string", enum: ["지시", "육성", "통솔", "능력"] },
    g: { type: "array", items: { type: "string" } }, why: { type: "string" }, cost: { type: "string" },
  },
};
const SCHEMA = {
  type: "object", additionalProperties: false, required: ["sum", "tags", "picks", "extra"],
  properties: {
    sum: { type: "string" },
    tags: { type: "array", items: { type: "string" } },
    picks: { type: "array", items: pickItem },
    extra: { type: "array", items: extraItem },
  },
};

const RULES = `너는 TRPG 「망켓몬 · 미사그 대학」 캠페인의 GM 을 돕는다. 각성체로 그린 그림(포트)을 보고, 그 모습이 어떤 역사 · 설화 속 인물이 각성체로 온 것인지 — 어울리는 원전 인물 후보를 고른다.

각성체란: 미사그 대학의 PC 가 은열쇠로 불러내는 간이 영령. 서번트 · 영령과 비슷하지만, 사람에게 주는 부담을 줄이려고 일부러 마이너한 인물이거나, 유명한 인물이라도 열화된 모습(한 시절 · 한 일화 · 덜 알려진 면)으로 온다.

고르는 법
- 먼저 그림에서 보이는 것만 읽는다: 분위기, 머리 · 체형 같은 모습, 복장, 소품, 모티프, 색, 동양풍 · 서양풍 같은 풍. 보이지 않는 것을 지어내지 않는다.
- tags 는 아래 「태그 목록」에 있는 낱말만, 6~12개.
- 후보는 DB 에 갇히지 않는다: extra(DB 밖 새 후보) 3~5명이 중심이고, picks(DB 후보)는 그림에 정말 잘 맞을 때만 0~2명. (2026-10-30 망령 「DB 후보 말고 새 후보로」)
- picks 는 아래 「후보 DB」에서 0~2명. id 는 DB 의 첫 칸 그대로, n 은 이름. why 는 그림의 어떤 점(모습 · 복장 · 소품 · 분위기)이 그 인물의 이야기와 닿는지 한두 문장. 그 인물이 열화된 모습으로 오면 이 그림처럼 보일 만한 인물을 앞에 둔다. 지명도(다섯째 칸)는 아래 「격」에 맞춘다.
- 격: 각성체 프라이드가 원전의 격을 정한다 — 파워 차이만큼 격 차이. C · C+ = 격 낮음(이름만 남은 사람 · 민담 조연, 지명도 1~2), B · B+ = 격 중간(한 고장 전설의 주인공, 지명도 2~3), A = 격 높음(한 나라에 알려진 인물 · 신화 조연급, 유명 인물은 열화된 한 시절, 지명도 3~4). 각성 (보조)는 C 권장. 프라이드를 모르면 지명도 1~3.
- cost 는 후보마다 그 인물에 어울리는 대가 하나를 아래 목록 안에서 「분류 · 항목」으로 (예: "통솔 · B-2 『역할』 1개 무효"). 프라이드 C · C+ 이거나 각성 (보조)면 "없음". A 는 B 에 더해 A 항목까지.
  대가 목록: 지시 B 『6령』 2개 빼기 / A 『4식』 1개 더 · 육성 B 분배레벨 −10 / A −10 더 · 통솔 B-1 PT 에 특정 타입 2체 이상 · B-2 『역할』 1개 무효 / A-1 필드 위 다른 아군에 지정 타입이 없으면 자기 포텐셜 무효 · A-2 필드 위 아군 한 체의 『역할』 무효 · 능력 B 『전용 포텐셜』 −1 / A 고유 포텐셜 점수 −0.5
- extra 는 DB 에 없지만 잘 맞는 인물 3~5명. 실존했거나 설화 · 신화 · 문학에 실제로 있는 인물만(지어내지 않는다). 죽은 지 100년이 안 된 실존 인물, 아직 살아 있는 인물은 넣지 않는다. 확실하지 않으면 넣지 않는다.
  n 이름(한국어), o 원어 · 한자, r 지역, e 시대, c 분류(역사 · 설화 · 신화 · 전설 · 문학 · 괴담 · 서사시 · 민요 중), f 지명도 1(아주 마이너)~5(누구나 앎), l 누구인지 한 문장, d 각성체로 올 때의 열화 · 마이너한 모습, k 은열쇠(그 인물을 부르는 물건 하나), t 포켓몬 타입 1~2개(노말 불꽃 물 풀 전기 얼음 격투 독 땅 비행 에스퍼 벌레 바위 고스트 드래곤 악 강철 페어리), w 대가 성향(지시 · 육성 · 통솔 · 능력 중 하나), g 태그 목록의 낱말 몇 개, why 고른 까닭.
- sum 은 그림을 읽은 것을 2~4문장으로. GM 이 읽을 말이니 한국어로, 담백하게.
- 모든 글은 한국어.`;

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: CORS });
  if (req.method !== "POST") return out({ error: "POST 만 받아요" }, 405);
  let b: any;
  try { b = await req.json(); } catch { return out({ error: "JSON 이 아니에요" }, 400); }
  const { camp, secret, image, name, bio, grade, vocab, db } = b || {};
  if (!camp || !secret) return out({ error: "GM 비밀구로 들어와 주세요" }, 401);
  if (!image || (!image.url && !image.data)) return out({ error: "각성체 그림이 없어요" }, 400);

  /* GM 확인 — 노트와 같은 nt_whoami */
  const SB = Deno.env.get("SUPABASE_URL")!;
  const KEY = Deno.env.get("SUPABASE_ANON_KEY") || Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  try {
    const r = await fetch(`${SB}/rest/v1/rpc/nt_whoami`, {
      method: "POST",
      headers: { apikey: KEY, Authorization: `Bearer ${KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({ p_camp: camp, p_secret: secret }),
    });
    const who = await r.json();
    if (who !== "gm") return out({ error: "GM 만 쓸 수 있어요" }, 403);
  } catch (e) {
    return out({ error: "비밀구 확인 실패: " + String((e as Error).message || e) }, 500);
  }

  const apiKey = Deno.env.get("ANTHROPIC_API_KEY");
  if (!apiKey) return out({ error: "함수 비밀값 ANTHROPIC_API_KEY 가 없어요" }, 500);
  const client = new Anthropic({ apiKey });

  const src = image.url
    ? { type: "url", url: String(image.url) }
    : { type: "base64", media_type: String(image.media_type || "image/png"), data: String(image.data) };
  const tagList = Array.isArray(vocab) ? vocab.join(", ") : "";
  const dbText = String(db || "").slice(0, 200000);

  try {
    const params: any = {
      model: MODEL,
      max_tokens: 16000,
      betas: ["server-side-fallback-2026-07-01"],
      fallbacks: "default",
      output_config: { effort: "medium", format: { type: "json_schema", schema: SCHEMA } },
      system: [
        { type: "text", text: RULES },
        // 태그 목록 · 후보 DB 는 요청마다 같아서 캐시해 둔다 (두 번째부터 싸다)
        {
          type: "text",
          text: `태그 목록\n${tagList}\n\n후보 DB (id|이름|지역|분류|지명도|태그)\n${dbText}`,
          cache_control: { type: "ephemeral" },
        },
      ],
      messages: [{
        role: "user",
        content: [
          { type: "image", source: src },
          {
            type: "text",
            text: `각성체: ${String(name || "").slice(0, 80)}\n${grade ? "격: " + String(grade).slice(0, 300) + "\n" : ""}${bio ? "플레이어 코멘트:\n" + String(bio).slice(0, 1500) + "\n" : ""}이 각성체 그림에 어울리는 원전 인물을 골라 줘.`,
          },
        ],
      }],
    };
    const msg: any = await client.beta.messages.create(params);
    if (msg.stop_reason === "refusal") return out({ error: "이 그림은 읽기를 거절당했어요" }, 422);
    if (msg.stop_reason === "max_tokens") return out({ error: "답이 너무 길어 끊겼어요 — 다시 눌러 주세요" }, 502);
    const text = (msg.content || []).filter((c: any) => c.type === "text").map((c: any) => c.text).join("");
    let j: any;
    try { j = JSON.parse(text); } catch { return out({ error: "답을 JSON 으로 읽지 못했어요" }, 502); }
    j.usage = msg.usage;
    return out(j);
  } catch (e: any) {
    const st = e?.status || 500;
    const m = st === 429 ? "요청이 많아요 — 잠시 뒤에" : st === 401 ? "API 키가 맞지 않아요" : st === 400 ? "요청을 받지 않았어요: " + (e?.message || "") : "Claude 호출 실패: " + (e?.message || e);
    return out({ error: m }, st >= 400 && st < 600 ? st : 500);
  }
});
