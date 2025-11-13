<template>
  <div class="min-h-screen bg-bg-secondary px-4 py-8">
    <div class="card p-6 xs:p-8 w-full max-w-3xl mx-auto animate-fade-in">
      <h1 class="text-2xl xs:text-3xl font-bold text-text-primary mb-4">{{ localeStore.t('privacy.title', '개인정보 처리방침') }}</h1>
      <p class="text-sm text-text-secondary mb-6">{{ localeStore.t('privacy.lastUpdated', '최종 업데이트:') }} 2025-08-17</p>

      <section class="space-y-4 text-text-secondary leading-relaxed">
        <p>
          {{ localeStore.t('privacy.intro', '한입 POS(이하 "회사")는 이용자의 개인정보를 소중히 여기며 관련 법령에 따라 안전하게 보호하고 적법하게 처리합니다. 본 방침은 회사가 수집하는 개인정보의 항목, 이용 목적, 보관 기간, 제3자 제공, 안전성 보호조치 등을 설명합니다.') }}
        </p>

        <h2 class="text-lg font-semibold text-text-primary">{{ localeStore.t('privacy.section1.title', '1. 수집하는 개인정보 항목') }}</h2>
        <ul class="list-disc list-inside space-y-1">
          <li>{{ localeStore.t('privacy.section1.item1', '필수: 사용자명, 이메일, 비밀번호, 라이트닝 주소') }}</li>
          <li>{{ localeStore.t('privacy.section1.item2', '선택: 프로필 정보(닉네임, 이미지 등)') }}</li>
          <li>{{ localeStore.t('privacy.section1.item3', '서비스 이용 기록: 접속 로그, 결제/주문 내역, 쿠키') }}</li>
        </ul>

        <h2 class="text-lg font-semibold text-text-primary">{{ localeStore.t('privacy.section2.title', '2. 개인정보의 수집 방법') }}</h2>
        <p>{{ localeStore.t('privacy.section2.content', '회원가입, 서비스 이용 과정, 고객센터 문의, 쿠키/유사 기술을 통해 정보를 수집할 수 있습니다.') }}</p>

        <h2 class="text-lg font-semibold text-text-primary">{{ localeStore.t('privacy.section3.title', '3. 개인정보의 이용 목적') }}</h2>
        <ul class="list-disc list-inside space-y-1">
          <li>{{ localeStore.t('privacy.section3.item1', '회원관리(본인확인, 부정 이용 방지)') }}</li>
          <li>{{ localeStore.t('privacy.section3.item2', '서비스 제공(주문/결제 처리, 고객 지원)') }}</li>
          <li>{{ localeStore.t('privacy.section3.item3', '서비스 개선 및 통계 분석') }}</li>
          <li>{{ localeStore.t('privacy.section3.item4', '법령 준수 및 분쟁 대응') }}</li>
        </ul>

        <h2 class="text-lg font-semibold text-text-primary">{{ localeStore.t('privacy.section4.title', '4. 보유 및 이용 기간') }}</h2>
        <p>
          {{ localeStore.t('privacy.section4.content', '개인정보는 이용 목적 달성 시 지체 없이 파기하며, 관련 법령에 따라 일정 기간 보관이 필요할 경우 해당 기간 동안 안전하게 보관합니다.') }}
        </p>

        <h2 class="text-lg font-semibold text-text-primary">{{ localeStore.t('privacy.section5.title', '5. 제3자 제공 및 처리 위탁') }}</h2>
        <p>
          {{ localeStore.t('privacy.section5.content', '법령에 근거하거나 이용자의 동의가 있는 경우에 한해 제3자에게 제공할 수 있으며, 서비스 운영을 위해 필요한 일부 업무를 외부에 위탁할 수 있습니다. 위탁 시 수탁자를 관리·감독합니다.') }}
        </p>

        <h2 class="text-lg font-semibold text-text-primary">{{ localeStore.t('privacy.section6.title', '6. 이용자의 권리') }}</h2>
        <p>
          {{ localeStore.t('privacy.section6.content', '이용자는 언제든지 자신의 개인정보 열람, 정정, 삭제, 처리정지 요구를 할 수 있으며, 회사는 법령이 정한 범위 내에서 지체 없이 조치합니다.') }}
        </p>

        <h2 class="text-lg font-semibold text-text-primary">{{ localeStore.t('privacy.section7.title', '7. 쿠키의 사용') }}</h2>
        <p>
          {{ localeStore.t('privacy.section7.content', '회사는 로그인 상태 유지 등 편의 제공을 위해 쿠키를 사용할 수 있습니다. 브라우저 설정을 통해 쿠키 저장을 거부할 수 있으나, 이 경우 일부 서비스 이용에 제한이 있을 수 있습니다.') }}
        </p>

        <h2 class="text-lg font-semibold text-text-primary">{{ localeStore.t('privacy.section8.title', '8. 안전성 확보 조치') }}</h2>
        <p>
          {{ localeStore.t('privacy.section8.content', '회사는 개인정보의 안전한 처리를 위하여 접근 통제, 암호화, 접속 기록 보관 등 합리적인 보호 조치를 시행합니다.') }}
        </p>

        <h2 class="text-lg font-semibold text-text-primary">{{ localeStore.t('privacy.section9.title', '9. 문의처') }}</h2>
        <p>{{ localeStore.t('privacy.section9.content', '개인정보 관련 문의: onebitebitcoin@proton.me') }}</p>

        <h2 class="text-lg font-semibold text-text-primary">{{ localeStore.t('privacy.section10.title', '10. 방침의 변경') }}</h2>
        <p>{{ localeStore.t('privacy.section10.content', '법령 또는 서비스의 변경에 따라 본 방침이 수정될 수 있으며, 중요한 변경 시 사전에 공지합니다.') }}</p>
      </section>

      <div class="mt-8">
        <router-link to="/register" class="text-blue-600 hover:text-blue-500 underline dark:text-blue-400 dark:hover:text-blue-300">{{ localeStore.t('privacy.backToRegister', '회원가입으로 돌아가기') }}</router-link>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useLocaleStore } from '@/stores/locale'

const localeStore = useLocaleStore()
</script>
