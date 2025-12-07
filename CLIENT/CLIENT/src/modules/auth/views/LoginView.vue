<template>
  <div>
    <h2>Login</h2>

    <form @submit.prevent="onSubmit">
      <div>
        <label>Email</label>
        <input v-model="email" type="email" required />
      </div>

      <div>
        <label>Password</label>
        <input v-model="password" type="password" required />
      </div>

      <button type="submit" :disabled="auth.loading">Login</button>
    </form>

    <p v-if="auth.error" style="color: red">{{ auth.error }}</p>
  </div>
</template>

<script setup>
import { ref } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import { useAuthStore } from '../store/useAuthStore';

const auth = useAuthStore();
const router = useRouter();
const route = useRoute();

const email = ref('');
const password = ref('');

async function onSubmit() {
  try {
    await auth.login(email.value, password.value);
    const redirect = route.query.redirect || '/admin';
    router.push(redirect);
  } catch (err) {
    auth.error = err.message;
  }
}
</script>