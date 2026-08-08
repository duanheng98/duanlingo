# DuanLingo

以 React、Firebase、Tailwind CSS 和 Vite 製作的單字學習 app。

## 開發環境

- Node.js 24.11.x（`.nvmrc` 建議版本；亦支援 Node 22.13+ LTS）
- npm 11.6.x

若使用 nvm，可執行 `nvm use` 讀取專案的 `.nvmrc`。

## 指令

```bash
npm ci
npm run dev
```

- `npm run build`：建立 production bundle
- `npm run preview`：預覽 production bundle
- `npm run lint`：執行 ESLint
- `npm test`：以 Vitest 執行一次測試
- `npm run test:watch`：監看檔案並持續執行測試

測試環境使用 jsdom、React Testing Library 與 `@testing-library/jest-dom`；共用初始化位於 `vitest.setup.js`。

Tailwind CSS 由 `@tailwindcss/vite` 在 build 階段產生，不依賴瀏覽器端 CDN。
