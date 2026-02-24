# Animal Globe 动物地球仪

一个交互式3D地球仪，展示全球动物栖息地、种群数量和食物链关系。

## 特性
- 🌍 3D 交互式地球仪（globe.gl）
- 📱 iPhone 手势支持（捏合缩放、拖动旋转）
- 📺 Apple TV AirPlay 投屏支持
- 🦁 100+ 种动物栖息地标记
- 📊 种群数量柱状图可视化
- ⚠️ 濒危物种特殊标识
- 🕸️ 食物链 Mindmap 展示

## 技术栈
- React 18 + Vite
- globe.gl（Three.js）
- D3.js（食物链图）
- Framer Motion（动画）
- Tailwind CSS

## 部署
自动通过 GitHub Actions 部署到 Cloudflare Pages。

## 添加新动物
编辑 `src/data/animals.json`，按照现有格式添加新条目即可。
