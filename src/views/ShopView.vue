<template>
  <div class="min-h-screen bg-bg-secondary">
    <!-- Header -->
    <header
      class="bg-bg-primary/80 backdrop-blur-xl border-b border-border-secondary sticky top-0 z-40"
    >
      <div class="container mx-auto px-4 py-3">
        <div class="flex justify-between items-center">
          <h1
            class="text-xl font-bold text-text-primary select-none cursor-pointer"
            @click="$router.push('/')"
          >
            한입 POS
          </h1>
          <div class="flex items-center space-x-4">
            <button
              @click="themeStore.toggleTheme"
              class="text-text-secondary hover:text-primary transition-colors p-2 rounded-full hover:bg-bg-tertiary"
            >
              <span class="text-xl">
                <svg
                  v-if="themeStore.isDark"
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
                    d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z"
                  />
                </svg>
                <svg
                  v-else
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
                    d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z"
                  />
                </svg>
              </span>
            </button>
            <button
              @click="$router.push('/settings')"
              class="text-text-secondary hover:text-primary transition-colors p-2 rounded-full hover:bg-bg-tertiary"
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
                  d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.096 2.572-1.065z"
                />
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                />
              </svg>
            </button>
          </div>
        </div>
      </div>
    </header>

    <div class="container mx-auto px-4 py-8 flex flex-col lg:flex-row gap-8">
      <!-- Products Grid -->
      <div class="flex-1">
        <div class="flex flex-wrap items-center gap-2 mb-6">
          <button
            @click="selectCategory('')"
            :class="['btn-category', { active: selectedCategory === '' }]"
          >
            전체
          </button>
          <button
            v-for="category in categoryStore.categories"
            :key="category.id"
            @click="selectCategory(category.id)"
            :class="[
              'btn-category',
              { active: selectedCategory === category.id },
            ]"
          >
            {{ category.name }}
          </button>
        </div>
        <div class="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-6">
          <div
            v-for="product in productStore.availableProducts"
            :key="product.id"
            class="bg-bg-primary rounded-xl shadow-soft-hover overflow-hidden group cursor-pointer"
            @click="openProductModal(product)"
          >
            <img
              :src="product.image || product.image_url"
              :alt="product.name"
              class="w-full h-48 object-cover group-hover:scale-105 transition-transform duration-300"
              @error="handleImageError"
            />
            <div class="p-4">
              <h3 class="font-semibold text-text-primary truncate">
                {{ product.name }}
              </h3>
              <p class="text-primary font-bold text-lg">
                ₩{{ Number(product.price || 0).toLocaleString("ko-KR") }}
              </p>
            </div>
          </div>
        </div>
      </div>

      <!-- Desktop Cart Sidebar -->
      <div
        class="w-full lg:w-80 lg:sticky top-24 h-fit bg-bg-primary rounded-2xl shadow-soft p-6"
      >
        <h2 class="text-xl font-semibold text-text-primary mb-4">장바구니</h2>
        <div v-if="cartStore.items.length === 0" class="text-center py-8">
          <p class="text-text-secondary">장바구니가 비어있습니다.</p>
        </div>
        <div v-else>
          <div class="space-y-4">
            <div
              v-for="item in cartStore.items"
              :key="item.id"
              class="flex items-center justify-between"
            >
              <div class="flex-1 min-w-0">
                <p class="font-medium text-text-primary truncate">
                  {{ item.product_name }}
                </p>
                <p class="text-text-secondary text-sm">
                  ₩{{ Number(item.product_price || 0).toLocaleString("ko-KR") }}
                </p>
              </div>
              <div class="flex items-center space-x-2">
                <button
                  @click="handleUpdateQuantity(item.id, item.quantity - 1)"
                  class="btn-quantity"
                >
                  -
                </button>
                <span>{{ item.quantity }}</span>
                <button
                  @click="handleUpdateQuantity(item.id, item.quantity + 1)"
                  class="btn-quantity"
                >
                  +
                </button>
              </div>
            </div>
          </div>
          <div class="border-t border-border-secondary my-6"></div>
          <div class="space-y-2">
            <div class="flex justify-between font-semibold">
              <span>총계</span>
              <span>₩{{ cartStore.subtotal.toLocaleString("ko-KR") }}</span>
            </div>
            <div class="flex justify-between text-sm text-accent">
              <span>Bitcoin</span>
              <span>{{
                bitcoinStore.formatSats(
                  bitcoinStore.krwToSats(cartStore.subtotal),
                )
              }}</span>
            </div>
          </div>
          <button
            @click="$router.push('/payment')"
            class="btn btn-primary w-full mt-6"
          >
            결제하기
          </button>
        </div>
      </div>
    </div>

    <!-- Product Details Modal -->
    <div
      v-if="showProductModal && selectedProduct"
      class="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4"
      @click="closeProductModal"
    >
      <div
        class="bg-bg-primary rounded-2xl p-8 max-w-lg w-full m-4"
        @click.stop
      >
        <img
          :src="selectedProduct.image || selectedProduct.image_url"
          :alt="selectedProduct.name"
          class="w-full h-64 object-cover rounded-xl mb-6"
          @error="handleImageError"
        />
        <h2 class="text-2xl font-bold text-text-primary mb-2">
          {{ selectedProduct.name }}
        </h2>
        <p class="text-primary font-bold text-2xl mb-4">
          ₩{{ Number(selectedProduct.price || 0).toLocaleString("ko-KR") }}
        </p>
        <p class="text-text-secondary mb-6">
          {{ selectedProduct.description || "상품 설명이 없습니다." }}
        </p>
        <button
          @click="
            handleAddToCart(selectedProduct);
            closeProductModal();
          "
          class="btn btn-primary w-full"
        >
          장바구니 담기
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { onMounted, onUnmounted, ref } from "vue";
import { useRouter } from "vue-router";
import { useAuthStore } from "@/stores/auth";
import { useCartStore } from "@/stores/cart";
import { useProductStore } from "@/stores/products";
import { useThemeStore } from "@/stores/theme";
import { useBitcoinStore } from "@/stores/bitcoin";
import { useCategoryStore } from "@/stores/categories";
import type { Product } from "@/services/api";

const router = useRouter();
const authStore = useAuthStore();
const cartStore = useCartStore();
const productStore = useProductStore();
const themeStore = useThemeStore();
const bitcoinStore = useBitcoinStore();
const categoryStore = useCategoryStore();

// Mobile UI state
const showMobileCart = ref(false);
const showMobileMenu = ref(false);

// Product modal state
const showProductModal = ref(false);
const selectedProduct = ref<Product | null>(null);

// Direct input modal state
const showDirectInputModal = ref(false);
const directInputAmount = ref<number | null>(null);
const directInputDescription = ref("");
const isAddingDirectInput = ref(false);

// Category filtering
const selectedCategory = ref("");

// Admin mode toggle for showing/hiding settings
const showAdminControls = ref(false);

// Long press functionality
const longPressTimer = ref<number | null>(null);
const longPressDuration = 1000; // 1 second

// Initialize data when component mounts
onMounted(async () => {
  // Initialize cart if user is logged in
  if (authStore.isLoggedIn) {
    await cartStore.initialize();
  }

  // Initialize Bitcoin price data
  await bitcoinStore.initialize();

  // Initialize categories (only those used in user's products)
  await categoryStore.fetchUserProductCategories();

  // Initialize products store for shopping (load all available products)
  await productStore.initialize();

  // Start auto-refresh for Bitcoin price
  bitcoinStore.startAutoRefresh();
});

// Long press handlers for admin controls
function startLongPress(event: Event) {
  event.preventDefault();
  longPressTimer.value = window.setTimeout(() => {
    showAdminControls.value = !showAdminControls.value;
  }, longPressDuration);
}

function endLongPress() {
  if (longPressTimer.value) {
    clearTimeout(longPressTimer.value);
    longPressTimer.value = null;
  }
}

// Handle adding product to cart
async function handleAddToCart(product: Product) {
  if (!authStore.isLoggedIn) {
    alert("로그인이 필요합니다");
    return;
  }

  try {
    const result = await cartStore.addItem(product);
    if (!result.success) {
      alert(result.message || "장바구니 추가에 실패했습니다");
    }
  } catch (error) {
    console.error("장바구니 추가 오류:", error);
    alert("장바구니 추가 중 오류가 발생했습니다");
  }
}

// Handle updating cart item quantity
async function handleUpdateQuantity(itemId: number, newQuantity: number) {
  if (newQuantity <= 0) {
    // Remove item if quantity is 0 or less
    const result = await cartStore.removeItem(itemId);
    if (!result.success) {
      alert(result.message || "아이템 제거에 실패했습니다");
    }
  } else {
    // Update quantity
    const result = await cartStore.updateItem(itemId, newQuantity);
    if (!result.success) {
      alert(result.message || "수량 변경에 실패했습니다");
    }
  }
}

// Handle image loading error
function handleImageError(event: Event) {
  const img = event.target as HTMLImageElement;

  // Log the failed URL for debugging
  console.warn("이미지 로드 실패:", img.src);

  // Prevent infinite error loops by checking if we've already handled this error
  if (img.dataset.errorHandled === "true") {
    return;
  }

  // Mark as handled to prevent infinite loops
  img.dataset.errorHandled = "true";

  // Remove the error handler to prevent further errors
  img.onerror = null;

  // Use a data URL as fallback to avoid network requests
  img.src =
    "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KICA8cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjZjNmNGY2Ii8+CiAgPHRleHQgeD0iNTAlIiB5PSI1MCUiIGZvbnQtZmFtaWx5PSJBcmlhbCwgc2Fucy1zZXJpZiIgZm9udC1zaXplPSIxNiIgZmlsbD0iIzZiNzI4MCIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZHk9Ii4zZW0iPuydtOuvuOyngCDsl4bsnYw8L3RleHQ+Cjwvc3ZnPgo=";
}

// Handle logout
async function handleLogout() {
  try {
    await authStore.logout();
    await router.push("/login");
  } catch (error) {
    console.error("로그아웃 오류:", error);
    // Even if logout fails, redirect to login
    await router.push("/login");
  }
}

// Handle product details modal
function openProductModal(product: Product) {
  selectedProduct.value = product;
  showProductModal.value = true;

  // Add escape key listener
  document.addEventListener("keydown", handleEscapeKey);
}

function closeProductModal() {
  showProductModal.value = false;
  selectedProduct.value = null;

  // Remove escape key listener
  document.removeEventListener("keydown", handleEscapeKey);
}

function handleEscapeKey(event: KeyboardEvent) {
  if (event.key === "Escape") {
    closeProductModal();
  }
}

// Handle category selection
async function selectCategory(categoryId: string | number) {
  try {
    selectedCategory.value = categoryId;
    // Re-fetch available products with the selected category
    const filterCategoryId = categoryId || undefined;
    await productStore.fetchAvailableProducts(filterCategoryId);
  } catch (error) {
    console.error("카테고리별 상품 필터링 오류:", error);
  }
}

// Handle direct input modal
function openDirectInputModal() {
  showDirectInputModal.value = true;
  directInputAmount.value = null;
  directInputDescription.value = "";

  // Add escape key listener
  document.addEventListener("keydown", handleDirectInputEscape);
}

function closeDirectInputModal() {
  showDirectInputModal.value = false;
  directInputAmount.value = null;
  directInputDescription.value = "";
  isAddingDirectInput.value = false;

  // Remove escape key listener
  document.removeEventListener("keydown", handleDirectInputEscape);
}

function handleDirectInputEscape(event: KeyboardEvent) {
  if (event.key === "Escape") {
    closeDirectInputModal();
  }
}

// Handle direct input submission
async function handleDirectInput() {
  if (!directInputAmount.value || directInputAmount.value <= 0) {
    alert("올바른 금액을 입력해주세요");
    return;
  }

  isAddingDirectInput.value = true;

  try {
    // Create a custom item name
    const itemName = directInputDescription.value.trim() || "직접 입력 항목";

    // Create a custom item object for the cart
    const customItem = {
      name: itemName,
      price: directInputAmount.value,
      description: directInputDescription.value.trim(),
    };

    const result = await cartStore.addCustomItem(customItem);
    if (result.success) {
      closeDirectInputModal();
    } else {
      alert(result.message || "장바구니 추가에 실패했습니다");
    }
  } catch (error) {
    console.error("직접 입력 장바구니 추가 오류:", error);
    alert("장바구니 추가 중 오류가 발생했습니다");
  } finally {
    isAddingDirectInput.value = false;
  }
}
</script>
