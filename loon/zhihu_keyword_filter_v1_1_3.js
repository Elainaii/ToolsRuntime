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
  const values = [];

  function collect(value) {
    if (Array.isArray(value)) {
      for (const item of value) collect(item);
      return;
    }
    if (typeof value !== "string") return;

    const text = value.trim();
    if (!text) return;
    try {
      const parsed = JSON.parse(text);
      if (parsed !== text) {
        collect(parsed);
        return;
      }
    } catch (_) {
      // A plain comma-separated string is also supported.
    }
    values.push(text.replace(/^(["'])(.*)\1$/, "$2"));
  }

  collect(argument);
  return [...new Set(
    values.join(",")
      .split(/[,，\n]+/)
      .map((item) => normalizeText(item).trim())
      .filter(Boolean)
  )];
}

function describeArgument(argument) {
  const type = Array.isArray(argument) ? "array" : typeof argument;
  let text = "";
  try {
    text = typeof argument === "string" ? argument.trim() : JSON.stringify(argument ?? "");
  } catch (_) {
    text = "";
  }

  let format = "plain";
  if (!text || text === "[]" || text === '""') format = "empty";
  else if (text.startsWith("[[")) format = "nested-json-array";
  else if (text.startsWith("[")) format = "json-array";
  else if (text.includes(",") || text.includes("，")) format = "csv";

  return { type, format, length: text.length };
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
    const argument = typeof $argument === "undefined" ? "" : $argument;
    const keywordCount = parseKeywords(argument).length;
    const beforeCount = Array.isArray(payload?.data) ? payload.data.length : 0;
    const filtered = filterPayload(payload, argument);
    const afterCount = Array.isArray(filtered?.data) ? filtered.data.length : 0;
    const headers = { ...($response.headers || {}) };
    const argumentInfo = describeArgument(argument);
    const removedCount = beforeCount - afterCount;

    delete headers["Content-Length"];
    delete headers["content-length"];
    headers["X-Zhihu-Keyword-Filter"] =
      `applied; keywords=${keywordCount}; removed=${removedCount}`;
    headers["X-Zhihu-Keyword-Filter-Log"] =
      `version=1.1.3; status=ok; argument-type=${argumentInfo.type}; ` +
      `argument-format=${argumentInfo.format}; argument-length=${argumentInfo.length}; ` +
      `keywords=${keywordCount}; before=${beforeCount}; after=${afterCount}; removed=${removedCount}`;

    console.log(
      `[ZhihuKeywordFilter] version=1.1.3, status=ok, ` +
      `argumentType=${argumentInfo.type}, argumentFormat=${argumentInfo.format}, ` +
      `argumentLength=${argumentInfo.length}, keywords=${keywordCount}, ` +
      `before=${beforeCount}, after=${afterCount}, removed=${removedCount}`
    );
    $done({ headers, body: JSON.stringify(filtered) });
  } catch (error) {
    const headers = { ...($response?.headers || {}) };
    delete headers["Content-Length"];
    delete headers["content-length"];
    headers["X-Zhihu-Keyword-Filter"] = "applied; status=error";
    headers["X-Zhihu-Keyword-Filter-Log"] =
      `version=1.1.3; status=error; error=${error?.name || "Error"}`;
    console.log(`[ZhihuKeywordFilter] version=1.1.3, status=error, ${error}`);
    $done({ headers });
  }
}

if (typeof $response !== "undefined" && typeof $done === "function") {
  runLoon();
}

if (typeof module !== "undefined") {
  module.exports = { parseKeywords, describeArgument, cardMatches, filterPayload };
}
