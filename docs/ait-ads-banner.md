---
url: >-
  https://developers-apps-in-toss.toss.im/bedrock/reference/framework/광고/BannerAd.md
---
# 인앱 광고 2.0 ver2 (배너 광고 - WebView)

Webview에서 배너 광고를 표시할 수 있는 광고 라이브러리예요.
:::tip 테스트용 배너 광고 ID

* 배너 광고 - 리스트형 : `ait-ad-test-banner-id`
* 배너 광고 - 피드형 : `ait-ad-test-native-image-id`
  :::

## 지원 버전

배너 광고 API는 토스 앱 버전에 따라 다르게 동작해요 :

| 토스 앱 버전     | 지원 여부 | 설명                    |
| ---------------- | --------- | ----------------------- |
| **5.241.0 이상** | 지원      | 배너 광고 사용 가능     |
| **5.241.0 미만** | 미지원    | 배너 광고 API 사용 불가 |

> `isSupported()` 메서드를 사용하여 현재 환경에서 배너 광고를 사용할 수 있는지 확인할 수 있어요.

::: tip 5.241.0 미만 버전 예외 처리
토스앱 5.241.0 미만에서는 빈 화면이 노출될 수 있으니 반드시 예외 처리를 해주세요.\
[토스앱 버전 가져오기](/bedrock/reference/framework/환경%20확인/getTossAppVersion.html) 기능을 사용해 예외 처리를 해주세요.
:::

***

## API 개요

* `TossAds.initialize` — 배너 광고 SDK를 초기화해요. 광고를 표시하기 전에 반드시 한 번 호출해야 해요.
* `TossAds.attachBanner` — 특정 DOM 요소에 배너 광고를 부착해요. 스타일 프리셋(theme, tone, variant)이 적용되며, 반환된 객체의 `destroy()` 메서드로 배너를 제거할 수 있어요.
* `TossAds.destroyAll` — 초기화된 모든 배너 슬롯을 제거해요.

각 API는 `isSupported()` 프로퍼티를 통해 현재 환경에서 해당 기능 사용 가능 여부를 확인할 수 있어요.

***

## 이벤트 플로우

```
TossAds.initialize 호출
↓
onInitialized 콜백 (초기화 완료)
↓
TossAds.attachBanner 호출
↓
onAdRendered 이벤트 (광고 렌더링 완료)
↓
onAdViewable 이벤트 (광고가 화면에 노출됨)
↓
onAdImpression 이벤트 (광고 노출 기록됨)
↓
onAdClicked 이벤트 (선택적 - 사용자 클릭 시)
```

:::tip 언제 배너가 갱신(refresh) 되나요?

배너 광고는 다음 두 가지 조건 중 하나가 발생하면 SDK가 자동으로 갱신돼요.

* 광고가 렌더링된 후 10초 이상 경과한 경우
* 화면의 visibility 가 false → true 로 변경된 경우 (예: 광고 클릭 후 돌아오거나 앱이 백그라운드에서 포어그라운드로 복귀될 때)
  :::

***

## 배너 광고 SDK 초기화(`initialize`)

배너 광고 SDK를 초기화해요. 초기화 과정은 비동기로 진행되며, 완료 여부는 콜백으로 전달돼요.\
광고를 사용하기 전에 반드시 한 번 초기화해야 하고, 앱의 최상위 컴포넌트에서 한 번만 호출하는 것을 권장해요.

### 시그니처

```tsx
TossAds.initialize(options: TossAdsInitializeOptions): void;
```

### 파라미터

#### TossAdsInitializeOptions

```tsx
interface TossAdsInitializeOptions {
  callbacks?: {
    onInitialized?: () => void; // SDK 초기화 성공 시 호출
    onInitializationFailed?: (error: Error) => void; // SDK 초기화 실패 시 호출
  };
}
```

### 프로퍼티

### 예제

:::code-group

```tsx[React]
import { TossAds } from '@apps-in-toss/web-framework';
import { useEffect, useState } from 'react';

function App() {
  const [isInitialized, setIsInitialized] = useState(false);

  useEffect(() => {
    // 지원 여부 확인
    if (!TossAds.initialize.isSupported()) {
      console.warn('배너 광고 기능을 사용할 수 없습니다.');
      return;
    }

    // SDK 초기화
    TossAds.initialize({
      callbacks: {
        onInitialized: () => {
          console.log('SDK 초기화 완료');
          setIsInitialized(true);
        },
        onInitializationFailed: (error) => {
          console.error('SDK 초기화 실패:', error);
        },
      },
    });
  }, []);

  return <div>{isInitialized ? '광고 준비 완료' : '광고 준비 중...'}</div>;
}
```

```tsx[ReactNative]
import React, { useEffect, useState } from 'react';
import { View, Text, Alert } from 'react-native';
import { TossAds } from '@apps-in-toss/framework';

export default function App() {
  const [isInitialized, setIsInitialized] = useState(false);

  useEffect(() => {
    // 지원 여부 확인
    if (!TossAds.initialize.isSupported()) {
      console.warn('배너 광고 기능을 사용할 수 없습니다.');
      return;
    }

    // SDK 초기화
    TossAds.initialize({
      callbacks: {
        onInitialized: () => {
          console.log('SDK 초기화 완료');
          setIsInitialized(true);
        },
        onInitializationFailed: (error) => {
          console.error('SDK 초기화 실패:', error);
          // 네이티브 환경에서는 Alert를 띄워 사용자/개발자에게 알릴 수 있어요
          Alert.alert('배너 광고 초기화 실패', String(error?.message ?? error));
        },
      },
    });
  }, []);

  return (
    <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
      <Text>{isInitialized ? '광고 준비 완료' : '광고 준비 중...'}</Text>
    </View>
  );
}
```

:::

***

## 배너 광고 부착(`attachBanner`)

특정 DOM 요소에 배너 광고를 부착해요. 스타일 프리셋(theme, tone, variant)이 적용되며, 반환된 객체의 `destroy()` 메서드로 배너를 제거할 수 있어요.

`TossAds.initialize`를 먼저 호출하여 SDK를 초기화한 후에 사용해야해요.

:::tip 광고 부착 가이드

* 광고를 부착하는 엘리먼트 내부는 비워둬야 해요.
* 컨테이너의 `width`는 항상 화면 너비와 동일해야 해요 (`100%`).
* 고정형으로 사용할 경우 `height: 96px` 권장해요
  :::

### 시그니처

```tsx
TossAds.attachBanner(
  adGroupId: string,
  target: string | HTMLElement,
  options?: TossAdsAttachBannerOptions
): TossAdsAttachBannerResult;
```

### 파라미터

#### TossAdsAttachBannerOptions

```tsx
interface TossAdsAttachBannerOptions {
  theme?: 'auto' | 'light' | 'dark'; // 테마 (기본값: 'auto')
  tone?: 'blackAndWhite' | 'grey'; // 배경 색상 톤 (기본값: 'blackAndWhite')
  variant?: 'card' | 'expanded'; // 배너 형태 (기본값: 'expanded')
  callbacks?: TossAdsBannerSlotCallbacks;
}
```

#### TossAdsAttachBannerResult

```tsx
interface TossAdsAttachBannerResult {
  destroy: () => void;
}
```

`TossAds.attachBanner` 함수의 반환 타입이에요.

* `destroy()`: 부착된 배너를 제거해요. 컴포넌트 언마운트 시 메모리 누수를 방지하기 위해 호출해야 호출을 권장해요.

#### TossAdsBannerSlotCallbacks

```tsx
interface TossAdsBannerSlotCallbacks {
  onAdRendered?: (payload: TossAdsBannerSlotEventPayload) => void;
  onAdViewable?: (payload: TossAdsBannerSlotEventPayload) => void;
  onAdClicked?: (payload: TossAdsBannerSlotEventPayload) => void;
  onAdImpression?: (payload: TossAdsBannerSlotEventPayload) => void;
  onAdFailedToRender?: (payload: TossAdsBannerSlotErrorPayload) => void;
  onNoFill?: (payload: { slotId: string; adGroupId: string; adMetadata: {} }) => void;
}
```

배너 광고 이벤트 콜백이에요.

* `onAdRendered`: 광고가 렌더링되었어요.
* `onAdViewable`: 광고가 화면에 노출되었어요.
* `onAdImpression`: 광고 노출이 기록되었어요. (수익 발생 시점)
* `onAdClicked`: 사용자가 광고를 클릭했어요.
* `onAdFailedToRender`: 광고 렌더링에 실패했어요.
* `onNoFill`: 표시할 광고가 없어요.

#### TossAdsBannerSlotEventPayload

```tsx
interface TossAdsBannerSlotEventPayload {
  slotId: string;
  adGroupId: string;
  adMetadata: {
    creativeId: string;
    requestId: string;
  };
}
```

배너 광고 이벤트 페이로드예요.

* `slotId`: 생성된 슬롯 ID
* `adGroupId`: 광고 그룹 ID
* `adMetadata`: 광고 메타데이터 (creativeId, requestId)

#### TossAdsBannerSlotErrorPayload

```tsx
interface TossAdsBannerSlotErrorPayload {
  slotId: string;
  adGroupId: string;
  adMetadata: {};
  error: {
    code: number;
    message: string;
    domain?: string;
  };
}
```

`TossAds.attachBanner` 함수의 옵션 타입이에요.

| 옵션        | 타입                          | 기본값            | 설명                                                 |
| ----------- | ----------------------------- | ----------------- | ---------------------------------------------------- |
| `theme`     | `'auto' \| 'light' \| 'dark'` | `'auto'`          | 테마 설정. `auto`는 시스템 다크모드에 따라 자동 전환 |
| `tone`      | `'blackAndWhite' \| 'grey'`   | `'blackAndWhite'` | 배경 색상 톤                                         |
| `variant`   | `'card' \| 'expanded'`        | `'expanded'`      | 배너 형태. `card`는 좌우 패딩 + `border-radius` 적용 |
| `callbacks` | `TossAdsBannerSlotCallbacks`  | -                 | 광고 이벤트 콜백                                     |

### 반환값

`TossAdsAttachBannerResult` 객체를 반환해요. 이 객체의 `destroy()` 메서드를 호출하여 배너를 제거할 수 있어요.

### 프로퍼티

### 예제

```tsx
import { TossAds, TossAdsAttachBannerOptions } from '@apps-in-toss/web-framework';
import { useCallback, useEffect, useRef, useState } from 'react';

function BannerAdComponent({ adGroupId }: { adGroupId: string }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const { isInitialized, attachBanner } = useTossBanner();

  useEffect(() => {
    if (!isInitialized || !containerRef.current) return;

    // 배너 부착
    const attached = attachBanner(adGroupId, containerRef.current, {
      theme: 'auto', // 시스템 설정에 따라 자동 전환
      tone: 'blackAndWhite', // 흰색/검정색 배경
      variant: 'expanded', // 전체 너비 확장 형태
      callbacks: {
        onAdRendered: (payload) => {
          console.log('광고 렌더링 완료:', payload.slotId);
        },
        onAdViewable: (payload) => {
          console.log('광고 노출됨:', payload.slotId);
        },
        onAdImpression: (payload) => {
          console.log('광고 노출 기록됨 (수익 발생):', payload.slotId);
        },
        onAdClicked: (payload) => {
          console.log('광고 클릭됨:', payload.slotId);
        },
        onNoFill: (payload) => {
          console.warn('표시할 광고가 없습니다:', payload.slotId);
        },
        onAdFailedToRender: (payload) => {
          console.error('광고 렌더링 실패:', payload.error.message);
        },
      },
    });

    // 클린업: destroy 호출
    return () => {
      attached?.destroy();
    };
  }, [isInitialized, adGroupId, attachBanner]);

  // 고정형 배너: width 100% + height 96px
  return <div ref={containerRef} style={{ width: '100%', height: '96px' }} />;
}

// 초기화 및 배너 부착을 위한 커스텀 훅
function useTossBanner() {
  const [isInitialized, setIsInitialized] = useState(false);

  useEffect(() => {
    if (isInitialized) return;

    TossAds.initialize({
      callbacks: {
        onInitialized: () => setIsInitialized(true),
        onInitializationFailed: (error) => {
          console.error('Toss Ads SDK initialization failed:', error);
        },
      },
    });
  }, [isInitialized]);

  const attachBanner = useCallback(
    (adGroupId: string, element: HTMLElement, options?: TossAdsAttachBannerOptions) => {
      if (!isInitialized) return;
      return TossAds.attachBanner(adGroupId, element, options);
    },
    [isInitialized],
  );

  return { isInitialized, attachBanner };
}
```

배너 광고 에러 페이로드예요.

***

## 모든 배너 슬롯 제거(`destroyAll`)

초기화된 모든 배너 슬롯을 제거해요.

### 시그니처

```tsx
TossAds.destroyAll(): void;
```

### 프로퍼티

### 예제

```tsx
// 페이지 이동 시 모든 배너 제거
useEffect(() => {
  return () => {
    TossAds.destroyAll();
  };
}, []);
```

***

## 사용 가이드

### 초기화 타이밍

SDK는 앱 시작 시점에 한 번만 초기화하는 것이 좋아요. 다음과 같은 시점에 초기화를 권장해요 :

* 앱 최상위 컴포넌트(App.tsx) 마운트 시
* 광고를 표시할 첫 화면 진입 전

```tsx
// ✅ 좋은 예: 앱 시작 시 초기화
function App() {
  useEffect(() => {
    if (TossAds.initialize.isSupported()) {
      TossAds.initialize({
        callbacks: {
          onInitialized: () => console.log('SDK 준비 완료'),
        },
      });
    }
  }, []);

  return <Router />;
}

// ❌ 나쁜 예: 매번 컴포넌트마다 초기화
function BannerComponent() {
  useEffect(() => {
    TossAds.initialize({
      /* ... */
    }); // 중복 초기화 시도
  }, []);
}
```

### 컨테이너 사이즈 설정

광고 컨테이너는 반드시 올바른 사이즈로 설정해야 해요.

```tsx
// ✅ 고정형: width 100% + height 96px 권장
<div ref={containerRef} style={{ width: '100%', height: '96px' }} />

// ✅ 인라인: width 100% + height 미지정
<div ref={containerRef} style={{ width: '100%' }} />

// ❌ 잘못된 예: width가 고정값
<div ref={containerRef} style={{ width: '320px', height: '96px' }} />
```

### 메모리 관리

컴포넌트 언마운트 시 배너를 제거해야 메모리 누수를 방지할 수 있어요.

`TossAds.attachBanner`는 `destroy()` 메서드를 포함한 객체를 반환하므로, 클린업 시 이를 호출하면 돼요.

```tsx
useEffect(() => {
  if (!isInitialized || !containerRef.current) return;

  // 배너 부착
  const attached = TossAds.attachBanner(adGroupId, containerRef.current, {
    callbacks: { ... },
  });

  // 클린업: destroy 호출
  return () => {
    attached?.destroy();
  };
}, [isInitialized, adGroupId]);
```

### 에러 처리

항상 `onInitializationFailed`와 `onAdFailedToRender` 콜백을 제공하여 에러에 대비하세요.

```tsx
TossAds.initialize({
  callbacks: {
    onInitialized: () => {
      console.log('초기화 성공');
    },
    onInitializationFailed: (error) => {
      console.error('초기화 실패:', error);
      // 사용자에게 적절한 피드백 제공
    },
  },
});

TossAds.attachBanner(adGroupId, element, {
  callbacks: {
    onAdFailedToRender: (payload) => {
      console.error('광고 렌더링 실패:', payload.error.message);
      // 대체 컨텐츠 표시 또는 재시도
    },
  },
});
```

***

## 재사용 가능한 커스텀 훅

여러 화면에서 배너 광고를 사용할 때 커스텀 훅으로 분리하면 편리해요.

### useTossBanner

SDK 초기화와 배너 부착을 함께 처리하는 훅이에요.

```tsx
import { useCallback, useEffect, useRef, useState } from 'react';
import { TossAds, type TossAdsAttachBannerOptions } from '@apps-in-toss/web-framework';

export function useTossBanner() {
  const [isInitialized, setIsInitialized] = useState(false);

  useEffect(() => {
    if (isInitialized) return;

    TossAds.initialize({
      callbacks: {
        onInitialized: () => setIsInitialized(true),
        onInitializationFailed: (error) => {
          console.error('Toss Ads SDK initialization failed:', error);
        },
      },
    });
  }, [isInitialized]);

  const attachBanner = useCallback(
    (adGroupId: string, element: HTMLElement, options?: TossAdsAttachBannerOptions) => {
      if (!isInitialized) return;
      return TossAds.attachBanner(adGroupId, element, options);
    },
    [isInitialized],
  );

  return { isInitialized, attachBanner };
}
```

### 사용 예시

```tsx
import { useRef, useEffect } from 'react';

function MyPage() {
  const bannerRef = useRef<HTMLDivElement>(null);
  const { isInitialized, attachBanner } = useTossBanner();

  useEffect(() => {
    if (!isInitialized || !bannerRef.current) return;

    const attached = attachBanner('your-ad-group-id', bannerRef.current, {
      theme: 'auto',
      tone: 'blackAndWhite',
      variant: 'expanded',
      callbacks: {
        onAdRendered: (payload) => console.log('광고 렌더링:', payload.slotId),
        onAdImpression: () => console.log('광고 노출'),
      },
    });

    return () => {
      attached?.destroy();
    };
  }, [isInitialized, attachBanner]);

  return (
    <div>
      <h1>내 페이지</h1>
      {/* 고정형 배너: width 100% + height 96px */}
      <div ref={bannerRef} style={{ width: '100%', height: '96px' }} />
    </div>
  );
}
```

> **참고**: `useTossBanner`는 여러 컴포넌트에서 호출해도 안전합니다.
> 이미 초기화된 경우 중복 초기화를 시도하지 않습니다.

***

***

## 자주 묻는 질문

\<FaqAccordion :items='\[
{
q: ""This feature is not supported in the current environment" 에러가 발생해요",
a: \`1. 토스 앱 환경에서 실행 중인지 확인해주세요.
