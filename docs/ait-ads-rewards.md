---
url: >-
  https://developers-apps-in-toss.toss.im/bedrock/reference/framework/광고/IntegratedAd.md
---

# 인앱 광고 2.0 ver2 (전면형/보상형 광고)

인앱 광고 2.0 ver2는 **토스 애즈(Toss Ads)** 와 **구글 애드몹(Google AdMob)** 을 통합해 환경에 따라 **가장 적합한 광고를 자동으로 선택·노출하는 통합 광고 솔루션**이에요.\
파트너사는 하나의 SDK만 연동하면 되고, 어떤 네트워크를 사용할지는 환경에 맞춰 SDK가 자동으로 선택해요.\
광고 노출 성공률을 높여 보다 안정적인 수익을 기대할 수 있어요.

**전면형(Interstitial)** 과 **보상형(Rewarded)** 광고 모두 동일 API(`loadFullScreenAd`, `showFullScreenAd`)를 사용하며, 광고 타입은 **광고 그룹 ID(`adGroupId`)** 를 기준으로 자동 결정돼요.

## 지원 버전

통합 광고 API는 토스 앱 버전에 따라 다르게 동작해요 :

| 토스 앱 버전               | 지원 기능          | 설명                         |
| -------------------------- | ------------------ | ---------------------------- |
| **5.247.0 이상**           | 인앱 광고 2.0 ver2 | 토스 애즈 + AdMob            |
| **5.227.0 ~ 5.247.0 미만** | 인앱 광고 2.0      | AdMob 단독 지원              |
| **5.227.0 미만**           | 미지원             | 인앱 광고 2.0 ver2 사용 불가 |

> `isSupported()` 메서드로 현재 환경에서 인앱 광고 2.0 ver2를 사용할 수 있는지 확인할 수 있어요.

***

## API 개요

* `loadFullScreenAd(params: LoadFullScreenAdParams): () => void` — 광고를 미리 로드해요. 반환값으로 콜백 등록 해제 함수(noop 형태)를 제공해요.
* `showFullScreenAd(params: ShowFullScreenAdParams): () => void` — 로드된 광고를 화면에 표시해요. 마찬가지로 해제 함수를 반환해요.

각 API는 `isSupported()` 프로퍼티를 통해 현재 환경에서 해당 기능 사용 가능 여부를 확인할 수 있어요.

***

## 광고 불러오기 (`loadFullScreenAd`)

```typescript
function loadFullScreenAd(params: LoadFullScreenAdParams): () => void;
```

광고를 미리 로드해요. 광고를 표시하기 전에 반드시 호출해야 해요.

::: tip 안정적으로 운영하려면 이렇게 구현해 주세요

* 페이지(또는 화면) 단위로 광고를 미리 로드해 주세요.
* 광고는 반드시 **`load → show → (다음 load)`** 순서로 호출해 주세요.
* `loadFullScreenAd` 호출 후 **이벤트를 받은 뒤** `showFullScreenAd`를 호출해야 해요.
* 같은 `adGroupId` 기준으로는 한 번에 하나의 광고만 미리 로드할 수 있어요.
* 여러 `adGroupId`를 사용할 때는 각 `adGroupId`별로 하나씩 미리 로드해 둘 수 있어요.
* 광고를 표시한 뒤에는 다음 광고를 미리 로드해 두는 패턴(`load → show → load → show`)을 권장해요.
  :::

::: tip iOS에서 로드되지 않나요?
iOS에서 광고가 로드되지 않는 경우 **앱 추적 모드(App Tracking Transparency)** 설정을 확인해 주세요.\
앱 추적이 허용되지 않은 상태에서는 일부 광고 로드가 정상 동작하지 않을 수 있어요.
:::

### 파라미터

### 프로퍼티

#### `isSupported`

```typescript
loadFullScreenAd.isSupported(): boolean
```

현재 환경에서 인앱 광고 2.0 ver2 광고를 사용할 수 있는지 확인해요.

### 예제

:::code-group

```tsx[React]
import { loadFullScreenAd } from '@apps-in-toss/web-framework';
import { useState, useEffect } from 'react';

function AdComponent() {
  const [isAdLoaded, setIsAdLoaded] = useState(false);

  useEffect(() => {
    // 지원 여부 확인
    if (!loadFullScreenAd.isSupported()) {
      console.warn('광고 기능을 사용할 수 없습니다.');
      return;
    }

    // 광고 로드
    const unregister = loadFullScreenAd({
      options: {
        adGroupId: 'ait.dev.43daa14da3ae487b',
      },
      onEvent: (event) => {
        if (event.type === 'loaded') {
          console.log('광고 로드 완료');
          setIsAdLoaded(true);
        }
      },
      onError: (error) => {
        console.error('광고 로드 실패:', error);
      },
    });

    // 클린업
    return () => unregister();
  }, []);

  return (
    <button disabled={!isAdLoaded}>
      {isAdLoaded ? '광고 보기' : '광고 로딩 중...'}
    </button>
  );
}
```

```tsx[React Native]
import { loadFullScreenAd } from '@apps-in-toss/framework';
import { useEffect, useState } from 'react';
import { Alert, Button, View } from 'react-native';

function AdComponent() {
  const [isAdLoaded, setIsAdLoaded] = useState(false);

  useEffect(() => {
    // 지원 여부 확인
    if (!loadFullScreenAd.isSupported()) {
      Alert.alert('광고 기능을 사용할 수 없습니다.');
      return;
    }

    // 광고 로드
    const unregister = loadFullScreenAd({
      options: {
        adGroupId: 'ait.dev.43daa14da3ae487b',
      },
      onEvent: (event) => {
        if (event.type === 'loaded') {
          Alert.alert('광고 로드 완료');
          setIsAdLoaded(true);
        }
      },
      onError: (error) => {
        Alert.alert('광고 로드 실패', String(error));
      },
    });

    // 클린업
    return () => unregister();
  }, []);

  return (
    <View>
      <Button
        title={isAdLoaded ? '광고 보기' : '광고 로딩 중...'}
        disabled={!isAdLoaded}
      />
    </View>
  );
}
```

:::

### `LoadFullScreenAdParams`

```typescript
interface LoadFullScreenAdParams {
  options: LoadFullScreenAdOptions;
  onEvent: (data: LoadFullScreenAdEvent) => void;
  onError: (err: unknown) => void;
}
```

`loadFullScreenAd`의 파라미터 타입이에요.

### `LoadFullScreenAdOptions`

```typescript
interface LoadFullScreenAdOptions {
  adGroupId: string;
}
```

광고 로드 옵션이에요.

### `LoadFullScreenAdEvent`

```typescript
interface LoadFullScreenAdEvent {
  type: 'loaded';
}
```

광고 로드 이벤트예요. 광고가 성공적으로 로드되면 `loaded` 타입 이벤트가 발생해요.

***

## 광고 보여주기 (`showFullScreenAd`)

```typescript
function showFullScreenAd(params: ShowFullScreenAdParams): () => void;
```

로드된 광고를 화면에 표시해요. `loadFullScreenAd`로 미리 로드한 광고를 사용해주세요.

### 파라미터

### 프로퍼티

#### `isSupported`

```typescript
showFullScreenAd.isSupported(): boolean
```

현재 환경에서 통합 광고를 사용할 수 있는지 확인해요.

### 예제

:::code-group

```tsx[React]
import { loadFullScreenAd, showFullScreenAd } from '@apps-in-toss/web-framework';
import { useState, useEffect } from 'react';

function AdComponent() {
  const AD_GROUP_ID = 'ait.dev.43daa14da3ae487b';
  const [isAdLoaded, setIsAdLoaded] = useState(false);

  useEffect(() => {
    // 컴포넌트 마운트 시 광고 로드
    const unregister = loadFullScreenAd({
      options: { adGroupId: AD_GROUP_ID },
      onEvent: (event) => {
        if (event.type === 'loaded') {
          setIsAdLoaded(true);
        }
      },
      onError: (error) => {
        console.error('광고 로드 실패:', error);
      },
    });

    return () => unregister();
  }, []);

  const handleShowAd = () => {
    showFullScreenAd({
      options: { adGroupId: AD_GROUP_ID },
      onEvent: (event) => {
        switch (event.type) {
          case 'requested':
            console.log('광고 표시 요청됨');
            break;
          case 'show':
            console.log('광고 화면 표시됨');
            break;
          case 'impression':
            console.log('광고 노출 기록됨 (수익 발생)');
            break;
          case 'clicked':
            console.log('광고 클릭됨');
            break;
          case 'dismissed':
            console.log('광고가 닫힘');
            setIsAdLoaded(false);
            // 다음 광고 로드
            loadNextAd();
            break;
          case 'failedToShow':
            console.error('광고 표시 실패');
            break;
          case 'userEarnedReward':
            console.log('리워드 획득:', event.data);
            // 사용자에게 리워드 지급
            grantReward(event.data.unitType, event.data.unitAmount);
            break;
        }
      },
      onError: (error) => {
        console.error('광고 표시 실패:', error);
      },
    });
  };

  const loadNextAd = () => {
    loadFullScreenAd({
      options: { adGroupId: AD_GROUP_ID },
      onEvent: (event) => {
        if (event.type === 'loaded') setIsAdLoaded(true);
      },
      onError: console.error,
    });
  };

  const grantReward = (unitType: string, unitAmount: number) => {
    // 리워드 지급 로직
    console.log(`${unitType} ${unitAmount}개 지급`);
  };

  return (
    <button onClick={handleShowAd} disabled={!isAdLoaded}>
      광고 보기
    </button>
  );
}
```

```tsx[React Native]
import { loadFullScreenAd, showFullScreenAd } from '@apps-in-toss/framework';
import { useEffect, useState } from 'react';
import { Alert, Button, View } from 'react-native';

function AdComponent() {
  const AD_GROUP_ID = 'ait.dev.43daa14da3ae487b';
  const [isAdLoaded, setIsAdLoaded] = useState(false);

  useEffect(() => {
    // 컴포넌트 마운트 시 광고 로드
    const unregister = loadFullScreenAd({
      options: { adGroupId: AD_GROUP_ID },
      onEvent: (event) => {
        if (event.type === 'loaded') {
          setIsAdLoaded(true);
        }
      },
      onError: (error) => {
        Alert.alert('광고 로드 실패', String(error));
      },
    });

    return () => unregister();
  }, []);

  const handleShowAd = () => {
    showFullScreenAd({
      options: { adGroupId: AD_GROUP_ID },
      onEvent: (event) => {
        switch (event.type) {
          case 'requested':
            console.log('광고 표시 요청됨');
            break;
          case 'show':
            console.log('광고 화면 표시됨');
            break;
          case 'impression':
            console.log('광고 노출 기록됨 (수익 발생)');
            break;
          case 'clicked':
            console.log('광고 클릭됨');
            break;
          case 'dismissed':
            setIsAdLoaded(false);
            loadNextAd();
            break;
          case 'failedToShow':
            Alert.alert('광고 표시 실패');
            break;
          case 'userEarnedReward':
            console.log('리워드 획득:', event.data);
            grantReward(event.data.unitType, event.data.unitAmount);
            break;
        }
      },
      onError: (error) => {
        Alert.alert('광고 표시 실패', String(error));
      },
    });
  };

  const loadNextAd = () => {
    loadFullScreenAd({
      options: { adGroupId: AD_GROUP_ID },
      onEvent: (event) => {
        if (event.type === 'loaded') setIsAdLoaded(true);
      },
      onError: (error) => Alert.alert('오류', String(error)),
    });
  };

  const grantReward = (unitType: string, unitAmount: number) => {
    Alert.alert('리워드 획득', `${unitType} ${unitAmount}개가 지급되었습니다.`);
  };

  return (
    <View>
      <Button title="광고 보기" onPress={handleShowAd} disabled={!isAdLoaded} />
    </View>
  );
}
```

:::

### `ShowFullScreenAdParams`

```typescript
interface ShowFullScreenAdParams {
  options: ShowFullScreenAdOptions;
  onEvent: (data: ShowFullScreenAdEvent) => void;
  onError: (err: unknown) => void;
}
```

`showFullScreenAd`의 파라미터 타입이에요.

### `ShowFullScreenAdOptions`

```typescript
interface ShowFullScreenAdOptions {
  adGroupId: string;
}
```

광고 보여주기 옵션이에요.

### `ShowFullScreenAdEvent`

```typescript
type ShowFullScreenAdEvent =
  | { type: 'requested' }
  | { type: 'show' }
  | { type: 'impression' }
  | { type: 'clicked' }
  | { type: 'dismissed' }
  | { type: 'failedToShow' }
  | { type: 'userEarnedReward'; data: { unitType: string; unitAmount: number } };
```

광고 보여주기 이벤트예요.

#### 이벤트 설명

| 이벤트 타입        | 설명                                                                                                                                |
| ------------------ | ----------------------------------------------------------------------------------------------------------------------------------- |
| `requested`        | 광고 표시 요청이 성공했어요.                                                                                                        |
| `show`             | 광고가 화면에 표시되었어요.                                                                                                         |
| `impression`       | 광고 노출이 기록되었어요. (수익 발생 시점)                                                                                          |
| `clicked`          | 사용자가 광고를 클릭했어요.                                                                                                         |
| `dismissed`        | 사용자가 광고를 닫았어요.                                                                                                           |
| `failedToShow`     | 광고 표시에 실패했어요.                                                                                                             |
| `userEarnedReward` | 리워드 광고에서 사용자가 보상을 획득했어요.• `data.unitType`: 리워드 타입 (예: coin, point)• `data.unitAmount`: 리워드 수량 |

***

## 사용 가이드

### 광고 로드 타이밍

광고는 표시하기 전에 미리 로드하는 것을 권장합니다.

* 로드 타이밍 권장 목록
  * 컴포넌트 마운트 시
  * 이전 광고가 닫힌 직후
  * 광고를 표시할 화면으로 전환되기 전

```tsx
// ✅ 좋은 예: 화면 진입 시 미리 로드
useEffect(() => {
  loadFullScreenAd({
    /* ... */
  });
}, []);

// ❌ 나쁜 예: 버튼 클릭 시 로드 (사용자 대기 시간 발생)
const handleClick = () => {
  loadFullScreenAd({
    /* ... */
  }); // 로딩 시간 발생
  showFullScreenAd({
    /* ... */
  });
};
```

### 리워드 광고 처리

`userEarnedReward` 이벤트가 발생했을 때만 리워드를 지급하세요. `dismissed`만으로는 지급하면 안돼요.

```tsx
showFullScreenAd({
  options: { adGroupId: REWARDED_AD_ID },
  onEvent: (event) => {
    if (event.type === 'userEarnedReward') {
      // ✅ 리워드 지급
      grantReward(event.data);
    }

    if (event.type === 'dismissed') {
      // ❌ dismissed만으로는 리워드 지급하지 않음
    }
  },
  onError: console.error,
});
```

### 메모리 관리

컴포넌트 언마운트 시 콜백 등록을 해제하여 메모리 누수를 방지하세요.

```tsx
useEffect(() => {
  const unregister = loadFullScreenAd({
    /* ... */
  });

  return () => {
    unregister(); // 클린업
  };
}, []);
```

### 에러 처리

항상 `onError` 콜백을 제공하여 광고 로드/표시 실패에 대비하세요.

```tsx
loadFullScreenAd({
  options: { adGroupId: AD_GROUP_ID },
  onEvent: (event) => {
    /* ... */
  },
  onError: (error) => {
    console.error('광고 로드 실패:', error);
    // 사용자에게 적절한 피드백 제공 또는 재시도
  },
});
```

***

## 이벤트 플로우

:::code-group

```[전면 광고 (Interstitial)]
loadFullScreenAd 호출
  ↓
loaded 이벤트 발생
  ↓
showFullScreenAd 호출
  ↓
requested 이벤트 발생
  ↓
show 이벤트 발생 (광고 화면 표시)
  ↓
impression 이벤트 발생 (수익 발생)
  ↓
clicked 이벤트 (클릭 시) 또는 dismissed 이벤트 (닫기 시)
```

```[리워드 광고 (Rewarded)]
loadFullScreenAd 호출
  ↓
loaded 이벤트 발생
  ↓
showFullScreenAd 호출
  ↓
requested 이벤트 발생
  ↓
show 이벤트 발생 (광고 화면 표시)
  ↓
impression 이벤트 발생 (수익 발생)
  ↓
[사용자가 광고 시청 완료]
  ↓
userEarnedReward 이벤트 발생 (리워드 지급)
  ↓
dismissed 이벤트 발생 (광고 닫기)
```

:::

## 자주 묻는 질문

\<FaqAccordion :items='\[
{
q: ""This feature is not supported in the current environment" 에러가 발생해요",
a: \`1. 토스 앱 환경에서 실행 중인지 확인해주세요.
