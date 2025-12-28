<template>
  <div class="auth">
    <section class="authCard">
      <header class="authHeader">
        <div class="authLogo">🏓</div>
        <div>
          <h1 class="authTitle">Create account</h1>
          <p class="authSubtitle">Creează un cont nou pentru Padel Manager.</p>
        </div>
      </header>

      <div v-if="error" class="authAlert">
        <div class="authAlertTitle">Register failed</div>
        <div class="authAlertMsg">{{ error }}</div>
      </div>

      <form class="authForm" @submit.prevent="onSubmit">
        <label class="authField">
          <div class="authLabel">Name</div>
          <input
            v-model.trim="displayName"
            class="authInput"
            type="text"
            autocomplete="name"
            placeholder="Ex: Vlad Vorniceanu"
            :disabled="loading"
          />
        </label>

        <label class="authField">
          <div class="authLabel">Email</div>
          <input
            v-model.trim="email"
            class="authInput"
            type="email"
            autocomplete="email"
            placeholder="you@example.com"
            :disabled="loading"
          />
        </label>

        <label class="authField">
          <div class="authLabel">Password</div>
          <input
            v-model="password"
            class="authInput"
            type="password"
            autocomplete="new-password"
            placeholder="Min 6 characters"
            :disabled="loading"
          />
        </label>

        <label class="authField">
          <div class="authLabel">Confirm password</div>
          <input
            v-model="confirmPassword"
            class="authInput"
            type="password"
            autocomplete="new-password"
            placeholder="Repeat password"
            :disabled="loading"
          />
        </label>

        <button class="authBtn primary" type="submit" :disabled="loading">
          {{ loading ? 'Creating…' : 'Create account' }}
        </button>

        <button class="authBtn secondary" type="button" @click="goLogin" :disabled="loading">
          I already have an account
        </button>
      </form>

      <footer class="authFooter">
        Prin crearea contului accepți regulile aplicației (placeholder).
      </footer>
    </section>
  </div>
</template>

<script setup>
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import { useAuthStore } from '../store/useAuthStore';

const router = useRouter();
const authStore = useAuthStore();

const displayName = ref('');
const email = ref('');
const password = ref('');
const confirmPassword = ref('');

const loading = ref(false);
const error = ref(null);

function goLogin() {
  router.push({ name: 'login' });
}

async function onSubmit() {
  error.value = null;

  if (!displayName.value || displayName.value.trim().length < 2) {
    error.value = 'Please enter your name (min 2 characters).';
    return;
  }
  if (!email.value) {
    error.value = 'Please enter email.';
    return;
  }
  if (!password.value || password.value.length < 6) {
    error.value = 'Password must have at least 6 characters.';
    return;
  }
  if (password.value !== confirmPassword.value) {
    error.value = 'Passwords do not match.';
    return;
  }

  loading.value = true;
  try {
    await authStore.register(email.value, password.value, displayName.value);
    await router.replace({ name: 'locations-list' });
  } catch (e) {
    console.error(e);
    error.value = authStore.error || e?.message || 'Register failed.';
  } finally {
    loading.value = false;
  }
}
</script>

<style scoped src="../../../style.css"></style>