/*
 * Optional Loon feature: block the next related question on Zhihu answer pages.
 */

function shouldBlock(url) {
  const value = String(url || "");
  return /[?&]type=answer(?:&|$)/.test(value) &&
    /[?&]scenes=recommend(?:&|$)/.test(value);
}

function runLoon() {
  if (!shouldBlock($request.url)) {
    console.log("[ZhihuOptionalFeature] block-next-related status=passed");
    $done({});
    return;
  }

  console.log("[ZhihuOptionalFeature] block-next-related status=blocked");
  $done({
    response: {
      status: 200,
      headers: {
        "Content-Type": "application/json; charset=utf-8",
        "X-Zhihu-Optional-Feature": "block-next-related; status=blocked; version=1.0.0",
      },
      body: "{}",
    },
  });
}

if (typeof $request !== "undefined" && typeof $done === "function") {
  runLoon();
}

if (typeof module !== "undefined") {
  module.exports = { shouldBlock };
}
