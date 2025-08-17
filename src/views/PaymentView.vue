<template>
  <div class="min-h-screen bg-bg-secondary">
    <!-- Header -->
    <header
      class="bg-bg-primary/80 backdrop-blur-xl border-b border-border-secondary sticky top-0 z-40"
    >
      <div class="container mx-auto px-4 py-3">
        <div class="flex justify-between items-center">
          <button
            @click="$router.push('/shop')"
            class="flex items-center space-x-2 text-text-secondary hover:text-primary transition-colors"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              class="h-6 w-6"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M15 19l-7-7 7-7"
              />
            </svg>
            <span>상점으로 돌아가기</span>
          </button>
          <h1 class="text-xl font-bold text-text-primary">결제</h1>
          <div class="w-24"></div>
          <!-- Spacer -->
        </div>
      </div>
    </header>

    <div class="container mx-auto px-4 py-8 max-w-4xl">
      <div class="grid grid-cols-1 md:grid-cols-2 gap-8">
        <!-- Order Summary -->
        <div class="bg-bg-primary rounded-2xl shadow-soft p-6">
          <h2 class="text-xl font-semibold text-text-primary mb-4">
            주문 내역
          </h2>
          <div class="space-y-3 mb-6">
            <div
              v-for="item in cartStore.items"
              :key="item.id"
              class="flex justify-between items-center"
            >
              <div>
                <p class="font-medium text-text-primary">
                  {{ item.product_name }}
                </p>
                <p class="text-sm text-text-secondary">
                  {{ item.quantity }} × ₩{{
                    Number(item.product_price || 0).toLocaleString("ko-KR")
                  }}
                </p>
              </div>
              <p class="font-medium text-text-primary">
                ₩{{ Number(item.total_price || 0).toLocaleString("ko-KR") }}
              </p>
            </div>
          </div>
          <div class="border-t border-border-secondary my-6"></div>
          <div class="space-y-2">
            <div class="flex justify-between text-text-secondary">
              <span>소계</span>
              <span>₩{{ cartStore.subtotal.toLocaleString("ko-KR") }}</span>
            </div>
            <div
              v-if="cartStore.discount > 0"
              class="flex justify-between text-success"
            >
              <span>할인 ({{ cartStore.discount }}%)</span>
              <span
                >-₩{{
                  (
                    (cartStore.subtotal * cartStore.discount) /
                    100
                  ).toLocaleString("ko-KR")
                }}</span
              >
            </div>
            <div
              class="flex justify-between text-xl font-bold text-text-primary pt-2 border-t border-border-secondary mt-2"
            >
              <span>총액</span>
              <span>₩{{ cartStore.total.toLocaleString("ko-KR") }}</span>
            </div>
          </div>
        </div>

        <!-- Payment Methods -->
        <div class="bg-bg-primary rounded-2xl shadow-soft p-6">
          <h2 class="text-xl font-semibold text-text-primary mb-4">
            결제 방법
          </h2>
          <div class="space-y-4">
            <label
              class="payment-option"
              :class="{ active: paymentMethod === 'lightning' }"
            >
              <input
                v-model="paymentMethod"
                type="radio"
                value="lightning"
                class="sr-only"
              />
              <span class="text-2xl">⚡</span>
              <div class="flex-1">
                <p class="font-semibold">라이트닝 네트워크</p>
                <p class="text-sm text-text-secondary">빠른 비트코인 결제</p>
              </div>
            </label>
            <label class="payment-option disabled">
              <input type="radio" value="ecash" disabled class="sr-only" />
              <span class="text-2xl">💰</span>
              <div class="flex-1">
                <p class="font-semibold">e-cash 결제</p>
                <p class="text-sm text-text-secondary">
                  익명 결제 (곧 출시 예정)
                </p>
              </div>
            </label>
          </div>
          <button
            @click="handlePayment"
            :disabled="!paymentMethod || isGeneratingInvoice"
            class="btn btn-primary w-full mt-6"
          >
            <span v-if="isGeneratingInvoice">인보이스 생성 중...</span>
            <span v-else
              >₩{{ cartStore.total.toLocaleString("ko-KR") }} 결제하기</span
            >
          </button>
        </div>
      </div>
    </div>

    <!-- QR Code Modal -->
    <div
      v-if="showQRCode"
      class="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4"
      @click="closeQRCode"
    >
      <div
        class="bg-bg-primary rounded-2xl p-8 max-w-md w-full m-4 text-center"
        @click.stop
      >
        <h3 class="text-xl font-semibold text-text-primary mb-4">
          {{ getPaymentModalTitle() }}
        </h3>
        <div
          class="bg-white p-4 rounded-lg border-2 border-border-secondary mb-4 inline-block"
        >
          <canvas ref="qrCanvas" v-show="!isGeneratingInvoice"></canvas>
          <div
            v-if="isGeneratingInvoice"
            class="w-64 h-64 flex items-center justify-center"
          >
            <div
              class="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"
            ></div>
          </div>
        </div>
        <p class="text-text-secondary mb-6">
          {{ isGeneratingInvoice ? getLoadingMessage() : getQRScanMessage() }}
        </p>
        <div class="flex space-x-4">
          <button @click="closeQRCode" class="btn btn-secondary w-full">
            취소
          </button>
          <button @click="completePayment" class="btn btn-primary w-full">
            결제 완료
          </button>
        </div>
      </div>
    </div>

    <!-- Success Modal -->
    <div
      v-if="showSuccess"
      class="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4"
    >
      <div
        class="bg-bg-primary rounded-2xl p-8 max-w-sm w-full m-4 text-center"
        @click.stop
      >
        <div class="text-6xl mb-4">✅</div>
        <h3 class="text-2xl font-semibold text-text-primary mb-2">
          결제 성공!
        </h3>
        <p class="text-text-secondary mb-6">구매해 주셔서 감사합니다.</p>
        <button @click="returnToShop" class="btn btn-primary w-full">
          쇼핑 계속하기
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, nextTick } from "vue";
import { useRouter } from "vue-router";
import { useAuthStore } from "@/stores/auth";
import { useCartStore } from "@/stores/cart";
import { useBitcoinStore } from "@/stores/bitcoin";
import { bitcoinService } from "@/services/bitcoin";
import QRCode from "qrcode";

const router = useRouter();
const authStore = useAuthStore();
const cartStore = useCartStore();
const bitcoinStore = useBitcoinStore();

const paymentMethod = ref("lightning");
const showQRCode = ref(false);
const showSuccess = ref(false);
const qrCanvas = ref<HTMLCanvasElement>();
const isGeneratingInvoice = ref(false);
const activeLightningAddress = ref<string>("");

// Lightning Network configuration
const DEFAULT_LIGHTNING_DOMAIN = "walletofsatoshi.com"; // Default Lightning domain
const FALLBACK_LIGHTNING_ADDRESS = "nsw@getalby.com"; // Fallback if user has no Lightning address
const DEFAULT_MEMO = "Shop Payment";

// Get user's Lightning address or construct it from username
function getUserLightningAddress(): string {
  // First check if user has a custom Lightning address in their profile
  if (authStore.user?.lightning_address) {
    return authStore.user.lightning_address;
  }

  // If not, construct one using their username and default domain
  if (authStore.username) {
    return `${authStore.username}@${DEFAULT_LIGHTNING_DOMAIN}`;
  }

  // Fallback to default Lightning address
  return FALLBACK_LIGHTNING_ADDRESS;
}

// Get fallback Lightning addresses to try if primary fails
function getFallbackLightningAddresses(): string[] {
  const fallbacks = [];

  // If using constructed address, try with different domains
  if (authStore.username && !authStore.user?.lightning_address) {
    fallbacks.push(`${authStore.username}@getalby.com`);
    fallbacks.push(`${authStore.username}@strike.army`);
  }

  // Always include the main fallback
  fallbacks.push(FALLBACK_LIGHTNING_ADDRESS);

  return fallbacks;
}

// Initialize Bitcoin store
bitcoinStore.initialize();

async function handlePayment() {
  if (!paymentMethod.value) return;

  if (paymentMethod.value === "cash") {
    await completePayment();
    return;
  }

  // Show QR modal and start loading state
  showQRCode.value = true;
  isGeneratingInvoice.value = true;

  await nextTick(); // 모달 렌더링

  if (qrCanvas.value) {
    // QR 코드 생성
    let qrData = "";

    if (paymentMethod.value === "lightning") {
      // Generate real Lightning invoice using LNURL with fallback support
      try {
        // Ensure bitcoin price is loaded
        if (!bitcoinStore.btcPriceKrw) {
          console.log("💰 비트코인 가격 데이터가 없습니다. 로딩 중...");
          await bitcoinStore.fetchBitcoinPrice();
        }

        const satsAmount = bitcoinStore.krwToSats(cartStore.total);
        const paymentTypeLabel = getPaymentTypeLabel();
        const memo = `${paymentTypeLabel} - ${cartStore.total.toLocaleString("ko-KR")}원`;

        console.log("🚀 라이트닝 인보이스 생성 시작");
        console.log("💰 KRW 금액:", cartStore.total);
        console.log("💰 BTC 가격:", bitcoinStore.btcPriceKrw);
        console.log("💰 변환된 사츠:", satsAmount, "사츠");
        console.log("📝 메모:", memo);

        if (satsAmount <= 0) {
          throw new Error(
            "사츠 변환 실패: 비트코인 가격 데이터를 가져올 수 없습니다",
          );
        }

        // Try primary Lightning address first
        const primaryAddress = getUserLightningAddress();
        console.log("⚡ 기본 라이트닝 주소 시도:", primaryAddress);

        let result = await bitcoinService.getLnurl(
          primaryAddress,
          satsAmount,
          memo,
        );
        let usedAddress = primaryAddress;

        // If primary address fails with wallet not found, try fallbacks
        if (!result.success && result.errorType === "WALLET_NOT_FOUND") {
          const fallbackAddresses = getFallbackLightningAddresses();
          console.log("❌ 기본 주소 실패, 대체 주소 시도:", fallbackAddresses);

          for (const fallbackAddress of fallbackAddresses) {
            console.log("🔄 대체 주소 시도:", fallbackAddress);
            result = await bitcoinService.getLnurl(
              fallbackAddress,
              satsAmount,
              memo,
            );

            if (result.success) {
              console.log(
                "✅ 대체 주소로 인보이스 생성 성공:",
                fallbackAddress,
              );
              usedAddress = fallbackAddress;
              break;
            }

            console.log("❌ 대체 주소 실패:", fallbackAddress, result.error);

            // If this fallback also fails with wallet not found, try next one
            if (result.errorType !== "WALLET_NOT_FOUND") {
              break; // Don't try more fallbacks for other types of errors
            }
          }
        }

        if (result.success && result.invoice) {
          console.log("🎉 라이트닝 인보이스 생성 성공!");
          console.log("📄 인보이스:", result.invoice.substring(0, 50) + "...");
          console.log("📍 사용한 주소:", usedAddress);

          qrData = result.invoice;
          activeLightningAddress.value = usedAddress;

          // Generate QR code immediately after getting invoice
          try {
            console.log("🔲 QR 코드 생성 중...");
            console.log("📱 QR 데이터 길이:", qrData.length);
            console.log(
              "🎯 QR 데이터 미리보기:",
              qrData.substring(0, 100) + "...",
            );

            await QRCode.toCanvas(qrCanvas.value, qrData, {
              width: 300,
              margin: 2,
              color: {
                dark: "#000000",
                light: "#FFFFFF",
              },
            });

            console.log("✅ QR 코드 생성 성공!");
            // Stop loading state after successful QR generation
            isGeneratingInvoice.value = false;
          } catch (qrError) {
            console.error("💥 QR 코드 생성 오류:", qrError);
            isGeneratingInvoice.value = false;
            alert("QR 코드 생성에 실패했습니다.");
            showQRCode.value = false;
            return;
          }
        } else {
          console.log("💥 모든 라이트닝 주소 시도 실패!");
          console.log("🔍 최종 오류 유형:", result.errorType);
          console.log("❌ 최종 오류 메시지:", result.error);

          // Stop loading state on error
          isGeneratingInvoice.value = false;
          activeLightningAddress.value = "";

          // Show user-friendly error message based on error type
          let errorMessage = "Lightning 인보이스 생성에 실패했습니다.";

          switch (result.errorType) {
            case "WALLET_NOT_FOUND":
              errorMessage = `Lightning 지갑을 찾을 수 없습니다.\n주소: ${primaryAddress}\n\n설정에서 올바른 Lightning 주소를 설정하거나\n다른 결제 방법을 선택해주세요.`;
              break;
            case "INVALID_AMOUNT":
              errorMessage = `결제 금액이 Lightning 지갑 한도를 벗어납니다.\n${result.error}\n\n다른 결제 방법을 선택해주세요.`;
              break;
            case "NETWORK_ERROR":
              errorMessage = `네트워크 오류가 발생했습니다.\n${result.error}\n\n잠시 후 다시 시도하거나 다른 결제 방법을 선택해주세요.`;
              break;
            default:
              errorMessage = `${result.error}\n\n다른 결제 방법을 선택해주세요.`;
          }

          alert(errorMessage);
          showQRCode.value = false;
          return;
        }
      } catch (error: unknown) {
        console.error("💥 라이트닝 인보이스 생성 중 예상치 못한 오류:", error);
        // Stop loading state on unexpected error
        isGeneratingInvoice.value = false;
        activeLightningAddress.value = "";
        alert(
          "예상치 못한 오류가 발생했습니다.\n다른 결제 방법을 선택해주세요."
        );
        showQRCode.value = false;
        return;
      }
    } else {
      // Fallback for other payment methods
      qrData = `payment:${Date.now()}:${cartStore.total.toFixed(2)}`;

      try {
        console.log("🔲 QR 코드 생성 중...");
        console.log("📱 QR 데이터 길이:", qrData.length);
        console.log("🎯 QR 데이터 미리보기:", qrData.substring(0, 100) + "...");

        await QRCode.toCanvas(qrCanvas.value, qrData, {
          width: 300,
          margin: 2,
          color: {
            dark: "#000000",
            light: "#FFFFFF",
          },
        });

        console.log("✅ QR 코드 생성 성공!");
        // Stop loading state after successful QR generation
        isGeneratingInvoice.value = false;
      } catch (error: unknown) {
        console.error("💥 QR 코드 생성 오류:", error);
        isGeneratingInvoice.value = false;
        alert("QR 코드 생성에 실패했습니다.");
        showQRCode.value = false;
      }
    }
  }
}

function closeQRCode() {
  showQRCode.value = false;
  isGeneratingInvoice.value = false;
  activeLightningAddress.value = "";
}

async function completePayment() {
  showQRCode.value = false;
  isGeneratingInvoice.value = false;
  activeLightningAddress.value = "";

  try {
    const result = await cartStore.createOrder(paymentMethod.value);
    if (result.success) {
      showSuccess.value = true;
    } else {
      alert(result.message || "주문 생성에 실패했습니다");
    }
  } catch (error: unknown) {
    console.error("결제 완료 처리 오류:", error);
    alert("결제 처리 중 오류가 발생했습니다");
  }
}

function returnToShop() {
  showSuccess.value = false;
  router.push("/shop");
}

// Payment method helper functions
function getPaymentModalTitle(): string {
  switch (paymentMethod.value) {
    case "lightning":
      return "라이트닝 인보이스";
    case "ecash":
      return "e-cash 결제";
    case "usdt":
      return "USDT 결제";
    default:
      return "결제 QR 코드";
  }
}

function getLoadingMessage(): string {
  switch (paymentMethod.value) {
    case "lightning":
      return "잠시만 기다려주세요. 라이트닝 인보이스를 생성하고 있습니다...";
    case "ecash":
      return "잠시만 기다려주세요. e-cash 인보이스를 생성하고 있습니다...";
    case "usdt":
      return "잠시만 기다려주세요. USDT 인보이스를 생성하고 있습니다...";
    default:
      return "QR 코드를 생성하고 있습니다...";
  }
}

function getQRScanMessage(): string {
  switch (paymentMethod.value) {
    case "lightning":
      return "라이트닝 지갑으로 QR 코드를 스캔하세요";
    case "ecash":
      return "e-cash 지갑으로 QR 코드를 스캔하세요 (라이트닝 네트워크 기반)";
    case "usdt":
      return "USDT 지갑으로 QR 코드를 스캔하세요 (라이트닝 네트워크 기반)";
    default:
      return "결제를 완료하려면 QR 코드를 스캔하세요";
  }
}

function getPaymentTypeLabel(): string {
  switch (paymentMethod.value) {
    case "lightning":
      return "Lightning Payment";
    case "ecash":
      return "e-cash Payment";
    case "usdt":
      return "USDT Payment";
    default:
      return DEFAULT_MEMO;
  }
}
</script>
