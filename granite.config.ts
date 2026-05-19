import { defineConfig } from "@apps-in-toss/web-framework/config";

export default defineConfig({
  appName: "easy-ai",
  brand: {
    displayName: "쉬운 AI", // 화면에 노출될 앱의 한글 이름으로 바꿔주세요.
    primaryColor: "#FF8A65", // 화면에 노출될 앱의 기본 색상으로 바꿔주세요.
    icon: "https://static.toss.im/appsintoss/33837/c8c801f8-1fa9-4c45-a9d2-8948eb5e9d76.png", // 화면에 노출될 앱의 아이콘 이미지 주소로 바꿔주세요.
  },
  web: {
    host: "localhost",
    port: 5173,
    commands: {
      dev: "vite dev",
      build: "vite build",
    },
  },
  permissions: [],
  outdir: "dist",
});
