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
          <h1 class="text-xl font-bold text-text-primary">관리자 패널</h1>
          <div class="w-24"></div>
          <!-- Spacer -->
        </div>
      </div>
    </header>

    <div class="container mx-auto px-4 py-8 max-w-7xl">
      <div class="bg-bg-primary rounded-2xl shadow-soft p-6">
        <h2 class="text-xl font-semibold text-text-primary mb-4">
          사용자 목록
        </h2>
        <div class="overflow-x-auto">
          <table class="w-full text-left">
            <thead>
              <tr class="border-b border-border-secondary">
                <th class="p-4">사용자명</th>
                <th class="p-4">이메일</th>
                <th class="p-4">가입일</th>
                <th class="p-4">상품 수</th>
                <th class="p-4"></th>
              </tr>
            </thead>
            <tbody>
              <tr
                v-for="user in users"
                :key="user.id"
                class="border-b border-border-secondary hover:bg-bg-secondary transition-colors"
              >
                <td class="p-4 font-medium">{{ user.username }}</td>
                <td class="p-4 text-text-secondary">{{ user.email }}</td>
                <td class="p-4 text-text-secondary">
                  {{ formatDate(user.created_at) }}
                </td>
                <td class="p-4 text-text-secondary">
                  {{ user.product_count }}
                </td>
                <td class="p-4 text-right">
                  <button
                    @click="viewUserDetail(user)"
                    class="btn btn-secondary"
                  >
                    상세보기
                  </button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>

    <!-- User Detail Modal -->
    <div
      v-if="showUserDetail && selectedUser"
      class="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4"
      @click="closeUserDetail"
    >
      <div
        class="bg-bg-primary rounded-2xl p-8 max-w-2xl w-full m-4"
        @click.stop
      >
        <h2 class="text-2xl font-bold text-text-primary mb-4">
          {{ selectedUser.username }}님의 정보
        </h2>
        <div class="space-y-4">
          <div>
            <h3 class="font-semibold text-text-primary mb-2">기본 정보</h3>
            <div class="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span class="text-text-secondary">이메일:</span>
                {{ selectedUser.email }}
              </div>
              <div>
                <span class="text-text-secondary">가입일:</span>
                {{ formatDate(selectedUser.created_at) }}
              </div>
              <div>
                <span class="text-text-secondary">관리자:</span>
                {{ selectedUser.is_kiosk_admin ? "예" : "아니오" }}
              </div>
            </div>
          </div>
          <div>
            <h3 class="font-semibold text-text-primary mb-2">라이트닝 주소</h3>
            <p class="font-mono text-sm text-text-secondary">
              {{ selectedUser.lightning_address || "설정되지 않음" }}
            </p>
          </div>
          <div>
            <h3 class="font-semibold text-text-primary mb-2">
              등록 상품 ({{ userProducts.length }}개)
            </h3>
            <div
              class="grid grid-cols-2 md:grid-cols-3 gap-4 max-h-64 overflow-y-auto"
            >
              <div
                v-for="product in userProducts"
                :key="product.id"
                class="bg-bg-secondary rounded-lg p-3"
              >
                <img
                  :src="product.image_url"
                  :alt="product.name"
                  class="w-full h-24 object-cover rounded-md mb-2"
                  @error="handleImageError"
                />
                <p class="font-medium text-sm truncate">{{ product.name }}</p>
                <p class="text-primary text-sm font-semibold">
                  ₩{{ Number(product.price).toLocaleString("ko-KR") }}
                </p>
              </div>
            </div>
          </div>
        </div>
        <div class="flex justify-end space-x-4 mt-6">
          <button @click="deleteUser(selectedUser)" class="btn btn-danger">
            사용자 삭제
          </button>
          <button @click="closeUserDetail" class="btn btn-secondary">
            닫기
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from "vue";
import { useRouter } from "vue-router";
import { useAuthStore } from "@/stores/auth";
import { adminAPI, type User, type Product } from "@/services/api";

const router = useRouter();
const authStore = useAuthStore();

// Check if user is admin
if (!authStore.isAdmin) {
  router.push("/shop");
}

// State
const users = ref<(User & { product_count: number })[]>([]);
const isLoading = ref(false);
const error = ref<string | null>(null);

// User detail modal
const showUserDetail = ref(false);
const selectedUser = ref<User | null>(null);
const userProducts = ref<Product[]>([]);
const isLoadingUserDetail = ref(false);

// Delete user state
const isDeletingUser = ref(false);

// Initialize
onMounted(async () => {
  await fetchUsers();
});

// Fetch users list
async function fetchUsers() {
  isLoading.value = true;
  error.value = null;

  try {
    const result = await adminAPI.getUsersList();
    if (result.success) {
      users.value = result.users;
    } else {
      error.value = result.message || "사용자 목록을 불러오는데 실패했습니다";
    }
  } catch (err: unknown) {
    error.value =
      err.message || "사용자 목록을 불러오는 중 오류가 발생했습니다";
    console.error("사용자 목록 가져오기 오류:", err);
  } finally {
    isLoading.value = false;
  }
}

// View user detail
async function viewUserDetail(user: User & { product_count: number }) {
  selectedUser.value = user;
  showUserDetail.value = true;
  isLoadingUserDetail.value = true;

  try {
    const result = await adminAPI.getUserDetail(user.id);
    if (result.success) {
      userProducts.value = result.products || [];
    } else {
      console.error("사용자 상세 로드 실패:", result.message);
      userProducts.value = [];
    }
  } catch (error: unknown) {
    console.error("사용자 상세 불러오기 오류:", error);
    userProducts.value = [];
  } finally {
    isLoadingUserDetail.value = false;
  }
}

// Close user detail modal
function closeUserDetail() {
  showUserDetail.value = false;
  selectedUser.value = null;
  userProducts.value = [];
}

// Delete user
async function deleteUser(user: User & { product_count: number }) {
  // Prevent self-deletion
  if (user.id === authStore.user?.id) {
    alert("자기 자신을 삭제할 수 없습니다");
    return;
  }

  // Confirmation dialog
  const confirmMessage = `"${user.username}" 사용자를 정말로 삭제하시겠습니까?\n\n이 작업은 되돌릴 수 없으며, 해당 사용자의 모든 상품과 데이터가 함께 삭제됩니다.`;
  if (!confirm(confirmMessage)) {
    return;
  }

  isDeletingUser.value = true;

  try {
    const result = await adminAPI.deleteUser(user.id);
    if (result.success) {
      alert(result.message);
      // Remove user from local list
      users.value = users.value.filter((u) => u.id !== user.id);
      // Close detail modal if it's open for this user
      if (selectedUser.value?.id === user.id) {
        closeUserDetail();
      }
    } else {
      alert(result.message || "사용자 삭제에 실패했습니다");
    }
  } catch (error: unknown) {
    console.error("사용자 삭제 오류:", error);
    alert("사용자 삭제 중 오류가 발생했습니다");
  } finally {
    isDeletingUser.value = false;
  }
}

// Handle image loading error
function handleImageError(event: Event) {
  const img = event.target as HTMLImageElement;

  // Prevent infinite error loops
  if (img.dataset.errorHandled === "true") {
    return;
  }

  img.dataset.errorHandled = "true";
  img.onerror = null;

  // Use fallback image
  img.src =
    "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjQiIGhlaWdodD0iNjQiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CiAgPHJlY3Qgd2lkdGg9IjEwMCUiIGhlaWdodD0iMTAwJSIgZmlsbD0iI2YzZjRmNiIvPgogIDx0ZXh0IHg9IjUwJSIgeT0iNTAlIiBmb250LWZhbWlseT0iQXJpYWwsIHNhbnMtc2VyaWYiIGZvbnQtc2l6ZT0iMTIiIGZpbGw9IiM2YjcyODAiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGR5PSIuM2VtIj7snbTrr7jsp4A8L3RleHQ+Cjwvc3ZnPgo=";
}

// Format date
function formatDate(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString("ko-KR", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}
</script>
