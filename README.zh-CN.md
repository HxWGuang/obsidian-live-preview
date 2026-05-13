# Obsidian Live Preview

[English](README.md) | [简体中文](README.zh-CN.md)

受 VSCode Live Preview 启发的 [Obsidian](https://obsidian.md) 实时 HTML 预览插件。启动本地 HTTP 服务器、支持自动刷新、提供内嵌预览面板，还可一键在外部浏览器中打开。

## 功能特性

- **本地 HTTP 服务器** — 以 HTML 文件所在目录为根目录启动静态服务，CSS、JS、字体、图片等相对路径资源全部正常加载。
- **自动刷新** — 通过 WebSocket 推送重载信号。编辑 HTML 或关联的 CSS/JS 文件后，预览约 300ms 内自动刷新。
- **内嵌预览面板** — 在 Obsidian 右侧边栏（或任意分屏位置）以 iframe 形式展示实时预览。
- **外部浏览器打开** — 一键将当前预览页面在系统默认浏览器中打开。
- **路径遍历防护** — 服务器仅提供指定目录树内的文件，拒绝目录穿越攻击。
- **端口自动递增** — 若配置的端口被占用，自动尝试下一可用端口。

## 安装

### Obsidian 社区插件市场

在 **设置 → 第三方插件 → 浏览** 中搜索 "Live Preview"，安装并启用。

### 手动安装

1. 从 [Releases](https://github.com/HxWGuang/obsidian-live-preview/releases) 下载最新版本。
2. 解压到 `<笔记仓库>/.obsidian/plugins/obsidian-live-preview/`。
3. 重新加载 Obsidian（`Cmd/Ctrl + R`）。
4. 在 **设置 → 第三方插件 → 已安装插件** 中启用 **Live Preview**。

### 通过 BRAT 安装

1. 安装 [BRAT](https://github.com/TfTHacker/obsidian42-brat) 插件。
2. 在 BRAT 设置中添加此仓库地址：`HxWGuang/obsidian-live-preview`。
3. 在第三方插件列表中启用。

## 使用方法

1. 在文件列表中打开任意 `.html` 或 `.htm` 文件，预览自动在右侧面板启动。
2. 编辑文件内容，预览自动刷新。
3. 使用命令面板（`Cmd/Ctrl + P`）：
   - **Start Live Preview** — 为当前 HTML 文件手动启动预览。
   - **Stop Live Preview** — 关闭本地服务器。
   - **Open Preview in Browser** — 在系统浏览器中打开当前预览页面。

## 设置

| 设置项 | 默认值 | 说明 |
|--------|--------|------|
| **Port** | `5500` | 本地 HTTP 服务器起始端口，冲突时自动递增。 |
| **Debounce delay** | `300` ms | 文件变更后刷新预览的延迟时间。 |

## 安全性

- HTTP 服务器仅绑定 `127.0.0.1`（仅本地可访问），不对外暴露。
- 仅提供白名单内的静态文件扩展名（`.html`、`.css`、`.js`、图片、字体等）。
- 服务器层拦截路径遍历攻击（如 `../../../`）。
- 内嵌预览使用 iframe 的 `sandbox` 属性进行隔离。

## 开发

```bash
# 克隆仓库
git clone https://github.com/HxWGuang/obsidian-live-preview.git
cd obsidian-live-preview

# 安装依赖
npm install

# 构建
npm run build

# 复制到笔记仓库进行测试
cp main.js manifest.json styles.css /path/to/vault/.obsidian/plugins/obsidian-live-preview/
```

## 技术栈

- **语言**：TypeScript
- **打包工具**：esbuild
- **WebSocket**：ws
- **平台**：Obsidian Plugin API、Node.js http 模块
- **最低 Obsidian 版本**：0.15.0
- **仅支持桌面端**（使用了 Node.js 内置模块启动 HTTP 服务器）

## 许可证

[MIT](LICENSE)
