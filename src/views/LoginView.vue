<template>
  <div
    class="min-h-screen flex items-center justify-center bg-bg-secondary px-4"
  >
    <div class="bg-bg-primary rounded-2xl shadow-soft p-8 w-full max-w-md">
      <div class="text-center mb-8">
        <h1 class="text-3xl font-bold text-text-primary">로그인</h1>
        <p class="text-text-secondary">환영합니다!</p>
      </div>
      <form @submit.prevent="handleLogin" class="space-y-6">
        <div>
          <label
            for="username"
            class="block text-sm font-medium text-text-secondary mb-1"
            >사용자명</label
          >
          <input
            id="username"
            v-model="username"
            type="text"
            required
            class="form-input"
          />
        </div>
        <div>
          <label
            for="password"
            class="block text-sm font-medium text-text-secondary mb-1"
            >비밀번호</label
          >
          <input
            id="password"
            v-model="password"
            type="password"
            required
            class="form-input"
          />
        </div>
        <div v-if="errorMessage" class="text-error text-sm text-center">
          {{ errorMessage }}
        </div>
        <button
          type="submit"
          :disabled="isSubmitting"
          class="btn btn-primary w-full"
        >
          <span v-if="isSubmitting">로그인 중...</span>
          <span v-else>로그인</span>
        </button>
      </form>
      <div class="mt-6 text-center">
        <p class="text-sm text-text-secondary">
          계정이 없으신가요?
          <router-link to="/register" class="text-primary hover:underline"
            >회원가입</router-link
          >
        </p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from "vue";
import { useRouter } from "vue-router";
import { useAuthStore } from "@/stores/auth";
import { useCartStore } from "@/stores/cart";

const router = useRouter();
const authStore = useAuthStore();

const username = ref("");
const password = ref("");
const errorMessage = ref("");
const isSubmitting = ref(false);

async function handleLogin() {
  if (!username.value.trim() || !password.value) {
    errorMessage.value = "사용자명과 비밀번호를 모두 입력해주세요";
    return;
  }

  isSubmitting.value = true;
  errorMessage.value = "";

  try {
    const result = await authStore.login(username.value.trim(), password.value);

    if (result.success) {
      // Initialize cart after successful login
      const cartStore = useCartStore();
      await cartStore.initialize();

      // Small delay to ensure token is fully set in axios instance
      await new Promise((resolve) => setTimeout(resolve, 100));

      // Redirect based on user role
      if (authStore.isAdmin) {
        router.push("/admin");
      } else {
        router.push("/shop");
      }
    } else {
      errorMessage.value = result.message;
    }
  } catch (error) {
    console.error("로그인 오류:", error);
    errorMessage.value = "로그인 중 오류가 발생했습니다. 다시 시도해주세요.";
  } finally {
    isSubmitting.value = false;
  }
}
</script>
