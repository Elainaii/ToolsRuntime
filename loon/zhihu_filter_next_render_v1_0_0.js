/*
 * Remove ad cards from Zhihu next-render responses while preserving reading.
 */

function filterNextRender(payload) {
  if (!payload || !Array.isArray(payload.data)) {
    return { payload, before: 0, after: 0, removed: 0 };
  }

  const before = payload.data.length;
  payload.data = payload.data.filter((item) => item?.type !== "ad");
  const after = payload.data.length;
  return { payload, before, after, removed: before - after };
}

function runLoon() {
  try {
    const payload = JSON.parse($response.body);
    const result = filterNextRender(payload);
    const headers = { ...($response.headers || {}) };
    delete headers["Content-Length"];
    delete headers["content-length"];
    headers["X-Zhihu-Next-Render-Filter"] =
      `version=1.0.0; status=ok; before=${result.before}; ` +
      `after=${result.after}; removed=${result.removed}`;
    console.log(
      `[ZhihuNextRenderFilter] version=1.0.0, status=ok, ` +
      `before=${result.before}, after=${result.after}, removed=${result.removed}`
    );
    $done({ headers, body: JSON.stringify(result.payload) });
  } catch (error) {
    const headers = { ...($response?.headers || {}) };
    delete headers["Content-Length"];
    delete headers["content-length"];
    headers["X-Zhihu-Next-Render-Filter"] =
      `version=1.0.0; status=error; error=${error?.name || "Error"}`;
    console.log(`[ZhihuNextRenderFilter] version=1.0.0, status=error, ${error}`);
    $done({ headers });
  }
}

if (typeof $response !== "undefined" && typeof $done === "function") {
  runLoon();
}

if (typeof module !== "undefined") {
  module.exports = { filterNextRender };
}
