/*
 * Zhihu homepage recommendation keyword filter for Loon.
 * Public runtime copy: Elainaii/ToolsRuntime/loon/zhihu_keyword_filter.js
 */

function normalizeText(value) {
  return String(value ?? "")
    .normalize("NFKC")
    .toLocaleLowerCase();
}

function parseKeywords(argument) {
  let value = typeof argument === "string" ? argument.trim() : "";

  // Loon normally passes the value without quotes. These fallbacks also accept
  // a JSON string or array so the script remains tolerant of parser changes.
  if (value) {
    try {
      const parsed = JSON.parse(value);
      if (Array.isArray(parsed)) value = parsed.join(",");
      else if (typeof parsed === "string") value = parsed;
    } catch (_) {
      value = value.replace(/^(["'])(.*)\1$/, "$2");
    }
  }

  return [...new Set(
    value
      .split(/[,，\n]+/)
      .map((item) => normalizeText(item).trim())
      .filter(Boolean)
  )];
}

function collectStrings(value, output) {
  if (typeof value === "string") {
    output.push(value);
    return;
  }

  if (Array.isArray(value)) {
    for (const item of value) collectStrings(item, output);
    return;
  }

  if (value && typeof value === "object") {
    for (const key of Object.keys(value)) collectStrings(value[key], output);
  }
}

function cardMatches(card, keywords) {
  if (keywords.length === 0) return false;
  const strings = [];
  collectStrings(card, strings);
  const searchableText = normalizeText(strings.join("\n"));
  return keywords.some((keyword) => searchableText.includes(keyword));
}

function filterPayload(payload, argument) {
  if (!payload || !Array.isArray(payload.data)) return payload;

  const keywords = parseKeywords(argument);
  payload.data = payload.data
    .filter((card) => card && card.type === "ComponentCard")
    .filter((card) => !cardMatches(card, keywords))
    .map((card) => {
      if (Array.isArray(card.children)) {
        card.children = card.children.filter((child) => child?.id !== "ring");
      }
      return card;
    });

  return payload;
}

function runLoon() {
  try {
    const payload = JSON.parse($response.body);
    const filtered = filterPayload(payload, $argument);
    $done({ body: JSON.stringify(filtered) });
  } catch (error) {
    console.log(`[ZhihuKeywordFilter] ${error}`);
    $done({});
  }
}

if (typeof $response !== "undefined" && typeof $done === "function") {
  runLoon();
}

if (typeof module !== "undefined") {
  module.exports = { parseKeywords, cardMatches, filterPayload };
}
