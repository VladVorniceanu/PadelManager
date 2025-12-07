<template>
  <div>
    <h2>Register</h2>

    <form @submit.prevent="onSubmit">
      <div>
        <label>Email</label>
        <input v-model="email" type="email" required />
      </div>

      <div>
        <label>Password</label>
        <input v-model="password" type="password" required minlength="6" />
      </div>

      <button type="submit" :disabled="auth.loading">Create account</button>
    </form>

    <p v-if="auth.error" style="color: red">{{ auth.error }}</p>
  </div>
</template>

<script setup>
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import { useAuthStore } from '../store/useAuthStore';

const auth = useAuthStore();
const router = useRouter();

const email = ref('');
const password = ref('');

async function onSubmit() {
  try {
    await auth.register(email.value, password.value);
    router.push('/profile');
  } catch (err) {
    auth.error = err.message;
  }
}
</script>