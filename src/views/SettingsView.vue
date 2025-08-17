<template>
  <div class="min-h-screen bg-bg-secondary">
    <!-- Header -->
    <header
      class="bg-bg-primary shadow-sm border-b border-border-secondary sticky top-0 z-40"
    >
      <div class="container mx-auto px-4 py-3">
        <div class="flex justify-between items-center">
          <div class="flex items-center space-x-4">
            <button
              @click="$router.push('/shop')"
              class="text-text-secondary hover:text-primary transition-colors"
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
            </button>
            <h1 class="text-xl font-bold text-text-primary">설정</h1>
          </div>
          <div class="flex items-center space-x-4">
            <button
              @click="themeStore.toggleTheme"
              class="text-text-secondary hover:text-primary transition-colors p-2 rounded-full hover:bg-bg-tertiary"
              :title="
                themeStore.isDark ? '라이트 모드로 전환' : '다크 모드로 전환'
              "
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
            <span class="text-text-secondary hidden sm:inline"
              >{{ authStore.username }}님</span
            >
          </div>
        </div>
      </div>
    </header>

    <div class="container mx-auto px-4 py-8 max-w-4xl">
      <!-- User Profile Settings -->
      <div class="bg-bg-primary rounded-2xl shadow-soft p-6 mb-8">
        <h2 class="text-xl font-semibold text-text-primary mb-4">
          사용자 설정
        </h2>
        <div class="space-y-4">
          <div>
            <label class="block text-sm font-medium text-text-secondary mb-1"
              >사용자명</label
            >
            <input
              v-model="userForm.username"
              type="text"
              class="w-full form-input"
            />
          </div>
          <div>
            <label class="block text-sm font-medium text-text-secondary mb-1"
              >이메일</label
            >
            <input
              v-model="userForm.email"
              type="email"
              class="w-full form-input"
            />
          </div>
          <div>
            <label class="block text-sm font-medium text-text-secondary mb-1"
              >라이트닝 주소</label
            >
            <input
              v-model="userForm.lightning_address"
              type="text"
              class="w-full form-input font-mono"
            />
          </div>
          <div class="flex justify-end space-x-3">
            <button @click="updateProfile" class="btn btn-primary">저장</button>
          </div>
        </div>
      </div>

      <!-- Products Section -->
      <div class="bg-bg-primary rounded-2xl shadow-soft p-6">
        <div class="flex justify-between items-center mb-4">
          <h2 class="text-xl font-semibold text-text-primary">상품 관리</h2>
          <button @click="openAddModal" class="btn btn-primary">
            + 새 상품 추가
          </button>
        </div>
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <div
            v-for="product in productStore.products"
            :key="product.id"
            class="bg-bg-secondary rounded-xl p-4 flex flex-col justify-between"
          >
            <div>
              <img
                :src="product.image || product.image_url"
                :alt="product.name"
                class="w-full h-40 object-cover rounded-lg mb-4"
                @error="handleImageError"
              />
              <h3 class="font-semibold text-text-primary mb-2">
                {{ product.name }}
              </h3>
              <p class="text-primary font-bold text-lg">
                ₩{{ Number(product.price || 0).toLocaleString("ko-KR") }}
              </p>
            </div>
            <div class="flex space-x-2 mt-4">
              <button
                @click="openEditModal(product)"
                class="btn btn-secondary w-full"
              >
                수정
              </button>
              <button
                @click="openDeleteModal(product)"
                class="btn btn-danger w-full"
              >
                삭제
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Add/Edit Product Modal -->
    <div
      v-if="showProductModal"
      class="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4"
    >
      <div
        class="bg-bg-primary rounded-2xl p-8 max-w-md w-full m-4"
        @click.stop
      >
        <h3 class="text-2xl font-semibold text-text-primary mb-6">
          {{ editingProduct ? "상품 수정" : "새 상품 추가" }}
        </h3>
        <form @submit.prevent="saveProduct" class="space-y-4">
          <div>
            <label class="block text-sm font-medium text-text-secondary mb-1"
              >상품명</label
            >
            <input
              v-model="productForm.name"
              type="text"
              required
              class="w-full form-input"
            />
          </div>
          <div>
            <label class="block text-sm font-medium text-text-secondary mb-1"
              >가격 (₩)</label
            >
            <input
              v-model.number="productForm.price"
              type="number"
              required
              class="w-full form-input"
            />
          </div>
          <div>
            <label class="block text-sm font-medium text-text-secondary mb-1"
              >카테고리</label
            >
            <input
              v-model="productForm.categoryName"
              type="text"
              class="w-full form-input"
            />
          </div>
          <div>
            <label class="block text-sm font-medium text-text-secondary mb-1"
              >이미지 URL</label
            >
            <input
              v-model="productForm.image"
              type="url"
              required
              class="w-full form-input"
            />
          </div>
          <div>
            <label class="block text-sm font-medium text-text-secondary mb-1"
              >또는 이미지 파일 업로드</label
            >
            <input
              @change="handleImageUpload"
              type="file"
              accept="image/*"
              class="w-full form-file-input"
            />
          </div>
          <div class="flex space-x-4 pt-4">
            <button
              type="button"
              @click="closeProductModal"
              class="btn btn-secondary w-full"
            >
              취소
            </button>
            <button
              type="submit"
              :disabled="isSubmitting"
              class="btn btn-primary w-full"
            >
              {{ editingProduct ? "수정" : "추가" }}
            </button>
          </div>
        </form>
      </div>
    </div>

    <!-- Delete Confirmation Modal -->
    <div
      v-if="showDeleteModal"
      class="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4"
    >
      <div
        class="bg-bg-primary rounded-2xl p-8 max-w-sm w-full m-4 text-center"
        @click.stop
      >
        <h3 class="text-2xl font-semibold text-text-primary mb-4">상품 삭제</h3>
        <p class="text-text-secondary mb-6">
          "{{ productToDelete?.name }}"을(를) 정말 삭제하시겠습니까?
        </p>
        <div class="flex space-x-4">
          <button @click="closeDeleteModal" class="btn btn-secondary w-full">
            취소
          </button>
          <button @click="deleteProduct" class="btn btn-danger w-full">
            삭제
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, watch, onMounted, computed } from "vue";
import { useAuthStore } from "@/stores/auth";
import { useProductStore } from "@/stores/products";
import { useCategoryStore } from "@/stores/categories";
import type { Product } from "@/services/api";
import { authAPI } from "@/services/api";

const authStore = useAuthStore();
const productStore = useProductStore();
const categoryStore = useCategoryStore();

// Initialize products and Bitcoin price when component mounts
onMounted(async () => {
  try {
    await Promise.all([
      productStore.initializeForSettings(),
      categoryStore.initialize(),
    ]);
  } catch (error) {
    console.error("데이터 로드 실패:", error);
  }
});

// Modal states
const showProductModal = ref(false);
const showDeleteModal = ref(false);
const editingProduct = ref<Product | null>(null);
const productToDelete = ref<Product | null>(null);
const isSubmitting = ref(false);
const successMessage = ref("");
const showSuccess = ref(false);
// Image load error state for previews
const imageError = ref(false);

// User settings states
const showUserSettings = ref(false);
const isUpdatingProfile = ref(false);

// Product form
const productForm = reactive({
  name: "",
  price: 0,
  category: "",
  categoryName: "",
  image: "",
});

// File upload
const selectedFile = ref<File | null>(null);

// Form errors
const formErrors = reactive({
  name: "",
  price: "",
  category: "",
  image: "",
});

// User form
const userForm = reactive({
  username: "",
  email: "",
  lightning_address: "",
});

// User form errors
const userFormErrors = reactive({
  username: "",
  email: "",
  lightning_address: "",
});

// Helper function to find or create category by name
async function findOrCreateCategory(
  categoryName: string,
): Promise<number | null> {
  if (!categoryName.trim()) {
    return null;
  }

  const trimmedName = categoryName.trim();

  // First, try to find existing category by name
  const existingCategory = categoryStore.categories.find(
    (cat) => cat.name.toLowerCase() === trimmedName.toLowerCase(),
  );

  if (existingCategory) {
    return existingCategory.id;
  }

  // If not found, create a new category
  try {
    const result = await categoryStore.addCategory({
      name: trimmedName,
    });

    if (result.success && result.category) {
      return result.category.id;
    }
  } catch (error) {
    console.error("카테고리 생성 오류:", error);
  }

  return null;
}

// Reset form
function resetForm() {
  productForm.name = "";
  productForm.price = 0;
  productForm.category = "";
  productForm.categoryName = "";
  productForm.image = "";
  selectedFile.value = null;
  imageError.value = false;
  clearErrors();
}

// Clear form errors
function clearErrors() {
  formErrors.name = "";
  formErrors.price = "";
  formErrors.category = "";
  formErrors.image = "";
}

// Reset user profile form from auth store
function resetUserForm() {
  const u = authStore.user;
  userForm.username = u?.username || "";
  userForm.email = u?.email || "";
  userForm.lightning_address = u?.lightning_address || "";
  clearUserErrors();
}

// Clear user form validation errors
function clearUserErrors() {
  userFormErrors.username = "";
  userFormErrors.email = "";
  userFormErrors.lightning_address = "";
}

// Validate form
function validateForm(): boolean {
  clearErrors();
  let isValid = true;

  // Validate name
  if (!productForm.name.trim()) {
    formErrors.name = "상품명을 입력해주세요";
    isValid = false;
  } else if (productForm.name.trim().length < 2) {
    formErrors.name = "상품명은 2글자 이상이어야 합니다";
    isValid = false;
  }

  // Validate price
  if (productForm.price <= 0) {
    formErrors.price = "가격은 0보다 커야 합니다";
    isValid = false;
  } else if (productForm.price > 999999) {
    formErrors.price = "가격은 ₩999,999를 초과할 수 없습니다";
    isValid = false;
  }

  // Validate image
  if (!productForm.image.trim()) {
    formErrors.image = "이미지 URL을 입력하거나 파일을 업로드해주세요";
    isValid = false;
  }

  return isValid;
}

// Watch for image URL changes to reset error state
watch(
  () => productForm.image,
  () => {
    imageError.value = false;
  },
);

// Open modals
function openAddModal() {
  editingProduct.value = null;
  resetForm();
  showProductModal.value = true;
}

function openEditModal(product: Product) {
  editingProduct.value = product;
  productForm.name = product.name;
  productForm.price = product.price;
  productForm.category = product.category || "";
  // Set the category name based on the category ID
  productForm.categoryName = product.category_name || "";
  productForm.image = product.image || product.image_url || "";
  showProductModal.value = true;
}

function openDeleteModal(product: Product) {
  productToDelete.value = product;
  showDeleteModal.value = true;
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
    "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KICA8cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjZjNmNGY2Ci8+CiAgPHRleHQgeD0iNTAlIiB5PSI1MCUiIGZvbnQtZmFtaWx5PSJBcmlhbCwgc2Fucy1zZXJpZiIgZm9udC1zaXplPSIxNiIgZmlsbD0iIzZiNzI4MCIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZHk9Ii4zZW0iPuydtOuvuOyngCDsl4bsnYw8L3RleHQ+Cjwvc3ZnPgo=";
}

// Close modals
function closeProductModal() {
  showProductModal.value = false;
  resetForm();
  editingProduct.value = null;
}

function closeDeleteModal() {
  showDeleteModal.value = false;
  productToDelete.value = null;
}

// Handle image upload
function handleImageUpload(event: Event) {
  const file = (event.target as HTMLInputElement).files?.[0];
  if (file) {
    // Check file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      formErrors.image =
        "이미지 파일이 너무 큽니다. 최대 10MB까지 업로드 가능합니다.";
      return;
    }

    // Check file type
    const allowedTypes = [
      "image/jpeg",
      "image/jpg",
      "image/png",
      "image/gif",
      "image/webp",
    ];
    if (!allowedTypes.includes(file.type)) {
      formErrors.image =
        "지원되지 않는 이미지 형식입니다. JPEG, PNG, GIF, WebP만 지원합니다.";
      return;
    }

    // Store the file and create a preview URL
    selectedFile.value = file;
    const reader = new FileReader();
    reader.onload = (e) => {
      productForm.image = e.target?.result as string;
      // Clear any previous error
      formErrors.image = "";
      imageError.value = false;
    };
    reader.onerror = () => {
      formErrors.image = "이미지 파일을 읽는 중 오류가 발생했습니다.";
    };
    reader.readAsDataURL(file);
  }
}

// Save product
async function saveProduct() {
  if (!validateForm()) {
    return;
  }

  isSubmitting.value = true;

  try {
    // Handle category: find existing or create new
    const categoryId = await findOrCreateCategory(productForm.categoryName);

    let result;
    if (editingProduct.value) {
      // Update existing product
      result = await productStore.updateProduct(editingProduct.value.id, {
        name: productForm.name.trim(),
        price: productForm.price,
        category: categoryId,
        image_url: productForm.image.trim(),
      });
    } else {
      // Add new product
      if (selectedFile.value) {
        // Use FormData API for file upload
        result = await productStore.addProductWithFile(
          {
            name: productForm.name.trim(),
            price: productForm.price,
            category: categoryId,
            stock_quantity: 100, // Default stock
            is_available: true,
          },
          selectedFile.value,
        );
      } else {
        // Use regular JSON API for URL-based images
        result = await productStore.addProduct({
          name: productForm.name.trim(),
          price: productForm.price,
          category: categoryId,
          image_url: productForm.image.trim(),
        });
      }
    }

    if (result.success) {
      showSuccessMessage(
        editingProduct.value
          ? "상품이 성공적으로 수정되었습니다"
          : "새 상품이 성공적으로 추가되었습니다",
      );
      closeProductModal();
    } else {
      // Handle specific validation errors
      if (result.message && result.message.includes("이미지")) {
        formErrors.image = result.message;
      } else {
        showSuccessMessage(
          result.message || "오류가 발생했습니다. 다시 시도해주세요",
        );
      }
    }
  } catch (error: any) {
    console.error("상품 저장 중 오류가 발생했습니다:", error);

    // Handle different types of errors
    if (error.response?.data?.image_url) {
      formErrors.image = Array.isArray(error.response.data.image_url)
        ? error.response.data.image_url[0]
        : error.response.data.image_url;
    } else if (error.response?.data?.message) {
      showSuccessMessage(error.response.data.message);
    } else {
      showSuccessMessage("오류가 발생했습니다. 다시 시도해주세요");
    }
  } finally {
    isSubmitting.value = false;
  }
}

// Show success message
function showSuccessMessage(message: string, isError = false) {
  successMessage.value = message;
  showSuccess.value = true;

  // Auto hide after 3 seconds
  setTimeout(() => {
    showSuccess.value = false;
  }, 3000);
}

// Delete product
async function deleteProduct() {
  if (productToDelete.value) {
    try {
      const result = await productStore.deleteProduct(productToDelete.value.id);
      if (result.success) {
        showSuccessMessage("상품이 성공적으로 삭제되었습니다");
      } else {
        showSuccessMessage(result.message || "상품 삭제에 실패했습니다");
      }
    } catch (error) {
      console.error("상품 삭제 중 오류:", error);
      showSuccessMessage("상품 삭제 중 오류가 발생했습니다");
    }
    closeDeleteModal();
  }
}

// Initialize user form when user data changes
watch(
  () => authStore.user,
  () => {
    resetUserForm();
  },
  { immediate: true },
);

// Update user profile
async function updateProfile() {
  clearUserErrors();
  isUpdatingProfile.value = true;

  try {
    const result = await authAPI.updateProfile({
      username: userForm.username.trim(),
      email: userForm.email.trim(),
      lightning_address: userForm.lightning_address.trim() || undefined,
    });

    if (result.success && result.user) {
      // Update auth store with new user data
      authStore.updateUser(result.user);
      showSuccessMessage("프로필이 성공적으로 업데이트되었습니다");
      showUserSettings.value = false;
    } else {
      // Handle specific validation errors
      if (result.errors) {
        Object.keys(result.errors).forEach((field) => {
          if (field in userFormErrors) {
            const errors = result.errors[field];
            userFormErrors[field as keyof typeof userFormErrors] =
              Array.isArray(errors) ? errors[0] : errors;
          }
        });
      }

      if (!result.errors || Object.keys(result.errors).length === 0) {
        showSuccessMessage(result.message || "프로필 업데이트에 실패했습니다");
      }
    }
  } catch (error: any) {
    console.error("프로필 업데이트 중 오류:", error);
    showSuccessMessage("프로필 업데이트 중 오류가 발생했습니다");
  } finally {
    isUpdatingProfile.value = false;
  }
}
</script>
