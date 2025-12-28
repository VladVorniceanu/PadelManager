<template>
  <div v-if="open" class="sd-backdrop" @click="$emit('close')"></div>

  <aside class="sd-drawer" :class="{ open }">
    <div class="sd-header">
      <div class="sd-userLine">
        <div class="sd-avatar">👤</div>
        <div>
          <div class="sd-name">{{ displayName }}</div>
          <div class="sd-email">{{ email }}</div>
        </div>
      </div>

      <button class="sd-closeBtn" @click="$emit('close')" aria-label="Close menu">✕</button>
    </div>

    <nav class="sd-nav">
      <button class="sd-item" @click="goProfile">Profil</button>
      <button class="sd-item" @click="goLocations">Locations</button>
      <button class="sd-item" @click="goTournaments">Tournaments</button>
      <button class="sd-item" @click="goFriendly">Friendly Matches</button>

      <button v-if="isAdmin" class="sd-item" @click="goAdmin">Admin Dashboard</button>

      <!-- logout last, pinned bottom -->
      <button class="sd-item sd-danger sd-logout" @click="logout">Logout</button>
    </nav>
  </aside>
</template>

<script setup>
import { computed } from 'vue';
import { useRouter } from 'vue-router';
import { useAuthStore } from '../../modules/auth/store/useAuthStore';

defineProps({ open: Boolean });
const emit = defineEmits(['close']);

const router = useRouter();
const authStore = useAuthStore();

const displayName = computed(() => authStore.firebaseUser?.displayName || authStore.profile?.displayName || 'User');
const email = computed(() => authStore.firebaseUser?.email || '');
const isAdmin = computed(() => authStore.profile?.role === 'admin');

async function goProfile() { emit('close'); await router.push({ name: 'profile' }); }
async function goLocations() { emit('close'); await router.push({ name: 'locations-list' }); }
async function goTournaments() { emit('close'); await router.push({ name: 'tournaments-list' }); }
async function goFriendly() { emit('close'); await router.push({ name: 'friendly-list' }); }
async function goAdmin() { emit('close'); await router.push({ name: 'admin' }); }

async function logout() {
  emit('close');
  try { await authStore.logout(); }
  finally { await router.push({ name: 'login' }); }
}
</script>