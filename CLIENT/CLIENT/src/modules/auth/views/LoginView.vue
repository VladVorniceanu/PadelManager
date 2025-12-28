<template>
  <div class="auth">
    <section class="authCard">
      <header class="authHeader">
        <div class="authLogo">🏓</div>
        <div>
          <h1 class="authTitle">Welcome back</h1>
          <p class="authSubtitle">Loghează-te ca să continui în Padel Manager.</p>
        </div>
      </header>

      <div v-if="error" class="authAlert">
        <div class="authAlertTitle">Login failed</div>
        <div class="authAlertMsg">{{ error }}</div>
      </div>

      <form class="authForm" @submit.prevent="onSubmit">
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
            autocomplete="current-password"
            placeholder="••••••••"
            :disabled="loading"
          />
        </label>

        <button class="authBtn primary" type="submit" :disabled="loading">
          {{ loading ? 'Signing in…' : 'Sign in' }}
        </button>

        <button class="authBtn secondary" type="button" @click="goRegister" :disabled="loading">
          Create an account
        </button>
      </form>

      <footer class="authFooter">
        <span class="muted">Tip:</span> Dacă ești admin, vei fi redirecționat automat către Admin.
      </footer>
    </section>
  </div>
</template>

<script setup>
import { ref } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import { useAuthStore } from '../store/useAuthStore';

const router = useRouter();
const route = useRoute();
const authStore = useAuthStore();

const email = ref('');
const password = ref('');
const loading = ref(false);
const error = ref(null);

function goRegister() {
  router.push({ name: 'register' });
}

async function onSubmit() {
  error.value = null;

  if (!email.value || !password.value) {
    error.value = 'Please enter email and password.';
    return;
  }

  loading.value = true;
  try {
    await authStore.login(email.value, password.value);

    // respect redirect param (from guard)
    const redirect = route.query.redirect ? String(route.query.redirect) : null;
    if (redirect) {
      await router.replace(redirect);
      return;
    }

    // fallback: role-based default
    await router.replace(authStore.isAdmin ? { name: 'admin' } : { name: 'locations-list' });
  } catch (e) {
    console.error(e);
    error.value = authStore.error || e?.message || 'Login failed.';
  } finally {
    loading.value = false;
  }
}
</script>

<style scoped src="../../../style.css"></style>