# 区块链可视化演示

> 基于 React + Canvas + Vite 的交互式区块链可视化工具，直观演示区块链核心概念。

[English](README.md)

## 解决什么问题

区块链的核心概念——哈希函数、工作量证明、链式结构、分布式共识——对初学者来说非常抽象。现有工具要么只有文字描述，要么只有静态图表。本项目解决了：

| 原始方案的问题 | 本项目的改进 |
|---|---|
| jQuery + Bootstrap 3 技术栈过时 | React + TypeScript + Vite 现代化技术栈 |
| 区块间无视觉连接，链式关系靠数值理解 | Canvas 绘制箭头连线，直观展示区块链接关系 |
| 挖矿瞬间完成，看不到过程 | Canvas 粒子动画 + nonce 跳动模拟挖矿过程 |
| 分布式网络只有并排列表，无拓扑感 | 节点拓扑图 + 广播飞行动画 + 分叉合并模拟 |
| 无多语言支持 | 中/英双语，可扩展更多语言 |
| 只有深色主题 | 浅色/深色主题一键切换，自动保存偏好 |

## 功能概览

### 1. Hash — SHA256 哈希函数
- 实时输入并计算哈希值
- 前导零金色高亮，字符变化翻转动画
- 雪崩效应对比演示（两个几乎相同的输入产生完全不同的哈希）
- 输入到输出的粒子流动效果

### 2. Block — 单区块挖矿
- 交互展示区块结构：编号、Nonce、Data、PrevHash、Hash
- 可调节挖矿难度（前导零数量）
- 挖矿时 nonce 高速跳动（老虎机效果）+ Canvas 粒子涌动
- 挖到矿时烟花效果 + 绿色闪烁

### 3. Blockchain — 区块链式结构
- 多个区块水平排列，Canvas 绘制区块间的箭头连线
- 修改任意区块数据，后续所有区块连锁变红（链断裂效果）
- 一键「修复链」自动重新挖矿，展示篡改代价
- 支持动态添加新区块

### 4. Distributed — 分布式网络共识
- 3 个 Peer 节点三角拓扑布局
- 节点间连线颜色表示同步状态（绿=同步，黄=延迟，红=分叉）
- 在任意节点挖矿，自动广播到其他节点（飞行动画）
- 模拟网络分叉 → 共识解决 → 最长链胜出

### 5. Tokens — 代币转账
- 账户头像 + 余额展示
- 选择发送方/接收方/金额进行转账
- 代币飞行动画从发送方飞向接收方
- 交易历史记录列表

### 6. Coinbase — 挖矿奖励与减半
- 旋转齿轮动画模拟矿机运转
- 挖到矿时金币掉落动画 + 余额增加
- 减半进度条展示奖励递减（50 → 25 → 12.5 → ... BTC）

## 技术栈

| 层 | 技术 | 用途 |
|---|---|---|
| 构建 | Vite | 开发服务器、HMR、生产构建 |
| 框架 | React 18 + TypeScript | UI 组件、类型安全 |
| 路由 | React Router v6 | 客户端路由 |
| 状态 | Zustand | 轻量级全局状态管理 |
| 国际化 | i18next + react-i18next | 中/英多语言支持 |
| 加密 | Web Crypto API | 浏览器原生 SHA256 计算 |
| 动画 | Canvas 2D + requestAnimationFrame | 粒子系统、飞行动画、连线绘制 |
| 样式 | CSS Modules | 组件级样式隔离 |

## 快速开始

### 环境要求

- Node.js >= 18
- npm >= 9

### 安装

```bash
npm install
```

### 开发

```bash
npm run dev
```

启动后浏览器访问 `http://localhost:5173/`。支持热更新，修改代码后自动刷新。

### 构建

```bash
npm run build
```

产物输出到 `dist/` 目录，包含优化后的静态资源。

### 预览生产构建

```bash
npm run preview
```

## 架构设计

### Canvas 渲染分层

```
┌─────────────────────────────────────┐
│  Canvas 动效层 (z:2)                │
│  particles, fireworks, flights      │  ← 每帧重绘, pointer-events: none
├─────────────────────────────────────┤
│  React DOM 组件 (z:1)               │
│  BlockCard, inputs, buttons         │  ← 用户交互层
├─────────────────────────────────────┤
│  Canvas 静态层 (z:0)                │
│  arrows, connections, topology      │  ← 仅数据变化时重绘
└─────────────────────────────────────┘
```

### 状态流

```
用户操作 (React DOM)
    │
    ▼
Zustand Store 更新
    │
    ├──► 组件重新渲染（DOM 更新）
    │
    └──► CanvasLayer.onStaticDraw 触发
            │
            ▼
         Canvas 2D 重绘（箭头/连线/节点）
            │
            ▼
         ParticleSystem 持续动画（requestAnimationFrame）
```

### 主题切换原理

CSS 变量在 `globals.css` 中定义了两套主题：

```css
:root, [data-theme='dark'] { /* 深色主题 */ }
[data-theme='light'] { /* 浅色主题 */ }
```

Zustand 的 `useThemeStore` 调用 `document.documentElement.setAttribute('data-theme', theme)` 切换主题。所有使用 CSS 变量的组件自动适配。选择保存到 `localStorage`。

### 多语言原理

- `i18next` 首次加载检测浏览器语言，默认回退到英文
- 所有页面使用 `useTranslation()` hook 通过 `t()` 函数获取翻译
- 翻译文件位于 `src/i18n/locales/`
- 语言选择保存到 `localStorage`

## 如何扩展

### 添加新语言

1. 在 `src/i18n/locales/` 下创建新目录，如 `ja/translation.json`
2. 在 `src/i18n/index.ts` 的 `resources` 中注册
3. 在 `src/components/Navbar/index.tsx` 的 `LANGUAGES` 数组中添加条目

### 添加新页面

1. `src/pages/` 下创建新目录，编写 `index.tsx` + `*.module.css`
2. 在 `src/App.tsx` 的 `<Routes>` 中添加路由
3. 在 `src/components/Navbar/index.tsx` 的导航项中添加链接
4. 在中英文翻译文件中添加对应的翻译键

### 添加新的 Canvas 动效

1. 在 `src/components/ParticleSystem/index.ts` 中添加新的 `emit*` 方法
2. 在 `src/config/canvas.ts` 中添加新的颜色常量
3. 在页面的 `onAnimDraw` 回调中调用新的 emit 方法

## License

MIT
