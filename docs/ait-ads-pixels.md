---
url: 'https://developers-apps-in-toss.toss.im/tosspixel/develop.md'
description: 토스애즈 픽셀 연동 개발 가이드입니다.
---

# 개발하기

::: tip 토스 픽셀은 Web 환경에서만 동작해요
React Native 환경에서는 지원되지 않아요.
:::

## 1. 픽셀 스크립트 설치하기

픽셀을 사용하려면 HTML의 `<head>` 영역에 아래 스크립트를 추가해 주세요.

```html
<script src="https://static.toss.im/lex/v1.js"></script>
```

## 2. 이벤트 연동하기

이벤트가 발생하는 시점에 맞춰 픽셀 이벤트를 호출해야 정확한 데이터 수집이 가능해요.

::: tip 하나의 전환 추적 코드를 사용해 주세요
하나의 전환 추적 코드로 모든 이벤트를 관리할 수 있어요.
:::

| 분류        | 이벤트명                   | 이벤트 라벨    |
| ----------- | -------------------------- | -------------- |
| 결제        | 결제 상품 상세 페이지 조회 | PRODUCT\_VIEW   |
|             | 결제 완료                  | PURCHASE       |
|             | 첫 구매 완료               | FIRST\_PURCHASE |
|             | 구독 완료                  | SUBSCRIBE      |
| 광고        | 인앱 광고 노출             | AD\_IMPRESSION  |
| 로그인      | 토스 로그인 완료           | SIGNIN         |
| 페이지 조회 | 전환 유도 페이지 조회      | PAGE\_VIEW      |
| 커스텀      | 커스텀 이벤트              | -              |

## 3. 이벤트별 연동 방법

### 결제

인앱 결제 또는 토스 페이를 사용하는 경우 결제 데이터를 수집할 수 있어요.

#### 결제 상품 상세 페이지 조회(PRODUCT\_VIEW)

상품 상세 페이지를 조회한 시점에 호출해 주세요.

```html
<script>
  TossPixel('전환 추적 코드').productView({
    product_id: 'P12345',
    product_name: '오가닉 코튼 티셔츠',
    category_id: 'C100',
    category_name: '상의',
    price: 39000,
    currency: 'KRW',
  });
</script>
```

#### 결제 완료(PURCHASE)

결제가 정상적으로 완료된 직후 호출해 주세요.

```html
<script>
  TossPixel('전환 코드').purchase({
    order_id: 'ORDER_20260423_0001',
    revenue: 78000,
    total_quantity: 2,
    currency: 'KRW',
    purchase_type: 'CARD',
    products: [
      {
        product_id: 'P12345',
        product_name: '오가닉 코튼 티셔츠',
        category_id: 'C100',
        category_name: '상의',
        price: 39000,
        quantity: 1,
      },
      {
        product_id: 'P67890',
        product_name: '와이드 데님 팬츠',
        category_id: 'C200',
        category_name: '하의',
        price: 39000,
        quantity: 1,
      },
    ],
    custom_param1: 'member_purchase',
    custom_param2: 'spring_campaign',
  });
</script>
```

#### 첫 구매 완료(FIRST\_PURCHASE)

사용자의 첫 구매가 완료된 시점에 호출해 주세요.

```html
<script>
  TossPixel('전환 코드').firstPurchase({
    order_id: 'ORDER_20260423_0002',
    revenue: 39000,
    total_quantity: 1,
    currency: 'KRW',
    purchase_type: 'CARD',
    products: [
      {
        product_id: 'P12345',
        product_name: '오가닉 코튼 티셔츠',
        category_id: 'C100',
        category_name: '상의',
        price: 39000,
        quantity: 1,
      },
    ],
    custom_param1: 'new_buyer',
  });
</script>
```

#### 구독 완료(SUBSCRIBE)

구독 결제가 시작된 시점에 호출해 주세요.

```html
<script>
  TossPixel('전환 코드').subscribe({
    lead_type: 'Newsletter',
    custom_param1: 'push_opt_in',
    custom_param2: 'app',
  });
</script>
```

***

### 광고

#### 인앱 광고 노출(AD\_IMPRESSION)

광고가 노출되는 시점(예: `show` 함수 호출 직후) 호출해주세요.

```html
<script type="text/javascript">
  new TossPixel('전환 추적 코드').adImpression();
</script>
```

***

### 로그인

#### 토스 로그인 완료(SIGNIN)

토스 로그인이 완료된 시점에 호출해 주세요.

```html
<script>
  TossPixel('전환 코드').signIn({
    custom_param1: 'email',
    custom_param2: 'existing_user',
  });
</script>
```

***

### 페이지 조회

#### 전환유도 페이지 조회(PAGE\_VIEW)

특정 페이지를 방문한 시점에 호출해 주세요.\
전환과 밀접한 페이지를 측정할 때 사용하면 좋아요.

```html
<script>
  TossPixel('전환 코드').pageView({
    custom_param1: 'all_page',
    custom_param2: 'web',
  });
</script>
```

***

### 커스텀 이벤트

표준 이벤트에 해당하지 않는 전환을 추적할 때 사용해요.\
이벤트 이름은 자유롭게 정의할 수 있어요.

```html
<script>
  TossPixel('전환 코드').custom('BUTTON_CLICK', {
    product_id: 'P12345',
    product_name: '오가닉 코튼 티셔츠',
    category_id: 'C100',
    price: 39000,
    currency: 'KRW',
  });
</script>
```

***

### 커스텀 프로퍼티

모든 이벤트(표준 이벤트, 커스텀 이벤트)에 custom\_param1 ~ custom\_param5를 추가할 수 있어요.

표준 파라미터로 표현하기 어려운 추가 정보를 전달할 때 사용해요.\
예를 들어 캠페인 구분값, 프로모션 코드, A/B 테스트 그룹, 유입 경로 등을 담을 수 있어요.

```html
<!-- 표준 이벤트에 커스텀 프로퍼티 추가 -->
<script>
  TossPixel('전환 코드').purchase({
    total_price: 78000,
    currency: 'KRW',
    custom_param1: 'summer_sale',
    custom_param2: 'landing_A',
  });
</script>

<!-- 커스텀 이벤트에 커스텀 프로퍼티 추가 -->
<script>
  new TossPixel('전환 코드').custom('BUTTON_CLICK', {
    product_id: 'P12345',
    custom_param1: 'cta_top',
    custom_param2: 'variant_B',
  });
</script>
```

***

## 자주 묻는 질문
