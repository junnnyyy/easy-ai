import { TDSMobileAITProvider } from "@toss/tds-mobile-ait";
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";

import config from "../granite.config.ts";
import App from "./App.tsx";
import { preloadUserKey } from "./hooks/useUserKey";
import "./index.css";

// 첫 화면 렌더링과 동시에 user key 발급을 시작해,
// 사용자가 버튼을 누를 때 로딩 상태에 걸리지 않도록 한다.
preloadUserKey();

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <TDSMobileAITProvider brandPrimaryColor={config.brand.primaryColor}>
      <App />
    </TDSMobileAITProvider>
  </StrictMode>,
);
