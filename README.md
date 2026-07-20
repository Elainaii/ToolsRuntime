# ToolsRuntime

供个人工具使用的公开运行时资源。

## Loon

- `loon/zhihu_keyword_filter.js`：知乎首页推荐关键词过滤脚本。
- `loon/zhihu_block_next_related.js`：可选的回答页“下一个相关问题”拦截脚本。
- 脚本仅处理 Loon 传入的当前请求、响应和插件参数，不包含 Cookie、Token、HAR 或任何预设个人关键词。
- 完整插件源码和离线测试保存在独立的私有仓库。

Raw URLs:

```text
https://raw.githubusercontent.com/Elainaii/ToolsRuntime/main/loon/zhihu_keyword_filter.js
https://raw.githubusercontent.com/Elainaii/ToolsRuntime/main/loon/zhihu_block_next_related.js
```
