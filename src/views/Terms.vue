<template>
  <div class="min-h-screen bg-bg-secondary px-4 py-8">
    <div class="card p-6 xs:p-8 w-full max-w-3xl mx-auto animate-fade-in">
      <h1 class="text-2xl xs:text-3xl font-bold text-text-primary mb-4">이용약관</h1>
      <p class="text-sm text-text-secondary mb-6">최종 업데이트: 2025-08-17</p>

      <section class="space-y-4 text-text-secondary leading-relaxed">
        <p>
          본 약관은 한입 POS 서비스(이하 “서비스”)의 이용과 관련하여 회사와 이용자 간의 권리, 의무 및 책임사항,
          기타 필요한 사항을 규정합니다. 서비스에 가입하거나 이용하시는 경우 본 약관에 동의한 것으로 간주합니다.
        </p>

        <h2 class="text-lg font-semibold text-text-primary">1. 서비스의 제공</h2>
        <p>회사는 결제 관리, 주문 처리, 상품 관리 등 상점 운영을 위한 온라인 기능을 제공합니다.</p>

        <h2 class="text-lg font-semibold text-text-primary">2. 계정 및 보안</h2>
        <ul class="list-disc list-inside space-y-1">
          <li>이용자는 정확하고 최신의 정보를 제공해야 합니다.</li>
          <li>계정 보안(비밀번호 관리 등)에 대한 책임은 이용자에게 있습니다.</li>
          <li>허가되지 않은 사용이 의심될 경우 즉시 회사에 알려야 합니다.</li>
        </ul>

        <h2 class="text-lg font-semibold text-text-primary">3. 이용자의 의무</h2>
        <ul class="list-disc list-inside space-y-1">
          <li>관련 법령 및 본 약관을 준수해야 합니다.</li>
          <li>타인의 권리를 침해하는 행위를 해서는 안 됩니다.</li>
          <li>서비스를 부정한 목적으로 이용해서는 안 됩니다.</li>
        </ul>

        <h2 class="text-lg font-semibold text-text-primary">4. 결제 및 환불</h2>
        <p>
          결제, 환불, 취소 등의 정책은 각 상점 운영자가 정한 규정에 따르며, 회사는 결제 처리 시스템 제공자일 수 있습니다.
          구체적인 환불 및 취소 기준은 별도의 정책 또는 공지에 따릅니다.
        </p>

        <h2 class="text-lg font-semibold text-text-primary">5. 서비스의 변경 및 중단</h2>
        <p>
          회사는 운영상, 기술상의 필요에 따라 서비스의 전부 또는 일부를 변경, 중단할 수 있으며,
          중요한 변경 사항은 사전에 고지합니다.
        </p>

        <h2 class="text-lg font-semibold text-text-primary">6. 책임의 한계</h2>
        <p>
          회사는 천재지변, 불가항력, 이용자의 귀책사유 등으로 인한 손해에 대해 책임을 지지 않습니다.
          또한 제3자 서비스를 통해 발생한 문제에 대해서는 해당 제공자의 정책이 우선 적용됩니다.
        </p>

        <h2 class="text-lg font-semibold text-text-primary">7. 약관의 개정</h2>
        <p>
          회사는 본 약관을 개정할 수 있으며, 중요한 변경 시 서비스 내 공지 또는 이메일 등으로 고지합니다.
          변경된 약관은 고지된 시행일로부터 효력이 발생합니다.
        </p>

        <h2 class="text-lg font-semibold text-text-primary">8. 준거법 및 분쟁 해결</h2>
        <p>
          본 약관은 대한민국 법률에 따르며, 분쟁이 발생할 경우 관할 법원에 제기합니다.
        </p>

        <h2 class="text-lg font-semibold text-text-primary">9. 문의처</h2>
        <p>약관 관련 문의: onebitebitcoin@proton.me</p>
      </section>

      <div class="mt-8">
        <router-link to="/register" class="text-blue-600 hover:text-blue-500 underline dark:text-blue-400 dark:hover:text-blue-300">회원가입으로 돌아가기</router-link>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
// Static terms page
</script>
