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

      <UiIconButton class="sd-closeBtn" @click="$emit('close')" aria-label="Close menu">✕</UiIconButton>
    </div>

    <nav class="sd-nav">
      <UiButton class="sd-item" @click="goProfile">Profile</UiButton>
      <UiButton class="sd-item" @click="goMatches">Matches</UiButton>
      <UiButton class="sd-item" @click="goTournaments">Tournaments</UiButton>
      <UiButton class="sd-item" @click="goLocations">Locations</UiButton>

      <UiButton v-if="isAdmin" class="sd-item" @click="goAdmin">Admin Dashboard</UiButton>

      <!-- logout last, pinned bottom -->
      <UiButton class="sd-item sd-logout danger" @click="logout">Logout</UiButton>
    </nav>
  </aside>
</template>

<script setup>
import { computed } from 'vue';
import { useRouter } from 'vue-router';
import { useAuthStore } from '../../modules/auth/store/useAuthStore';
import UiButton from '../ui/UiButton.vue';
import UiIconButton from '../ui/UiIconButton.vue';

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
async function goMatches() { emit('close'); await router.push({ name: 'friendly-list' }); }
async function goAdmin() { emit('close'); await router.push({ name: 'admin' }); }

async function logout() {
  emit('close');
  try { await authStore.logout(); }
  finally { await router.push({ name: 'login' }); }
}
</script>