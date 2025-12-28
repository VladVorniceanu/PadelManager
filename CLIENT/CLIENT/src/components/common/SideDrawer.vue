<template>
  <div v-if="open" class="backdrop" @click="$emit('close')"></div>

  <aside class="drawer" :class="{ open }">
    <div class="drawerHeader">
      <div class="userLine">
        <div class="avatar">👤</div>
        <div>
          <div class="name">{{ displayName }}</div>
          <div class="email">{{ email }}</div>
        </div>
      </div>

      <button class="closeBtn" @click="$emit('close')" aria-label="Close menu">✕</button>
    </div>

    <nav class="drawerNav">
      <button class="navItem" @click="goProfile">Profil</button>
      <button class="navItem" @click="goLocations">Locations</button>
      <button class="navItem danger" @click="logout">Logout</button>
      <nav>
        <ul>
          <li><router-link to="/admin">Dashboard</router-link></li>
          <li><router-link to="/admin/locations">Locations</router-link></li>
          <li><router-link to="/tournaments">Tournaments</router-link></li>
          <li><router-link to="/friendly">Friendly Matches</router-link></li>
          <li><router-link to="/profile">Profile</router-link></li>
        </ul>
      </nav>
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

async function goProfile() {
  emit('close');
  await router.push({ name: 'profile' });
}

async function goLocations() {
  emit('close');
  await router.push({ name: 'locations-list' });
}

async function logout() {
  emit('close');
  try {
    await authStore.logout();
  } finally {
    await router.push({ name: 'login' });
  }
}
</script>

<style scoped>
.backdrop {
  position: fixed;
  inset: 0;
  background: rgba(0,0,0,.35);
  z-index: 40;
}
.drawer {
  position: fixed;
  top: 0;
  left: 0;
  width: 280px;
  height: 100%;
  background: white;
  transform: translateX(-100%);
  transition: transform .2s ease;
  z-index: 50;
  border-right: 1px solid #eee;
  display: flex;
  flex-direction: column;
}
.drawer.open { transform: translateX(0); }

.drawerHeader {
  padding: 14px;
  border-bottom: 1px solid #eee;
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
}
.userLine { display: flex; gap: 10px; align-items: center; }
.avatar { font-size: 22px; }
.name { font-weight: 700; }
.email { font-size: 12px; color: #666; }

.closeBtn {
  border: none;
  background: transparent;
  cursor: pointer;
  font-size: 18px;
  padding: 6px;
}
.drawerNav { padding: 10px; display: flex; flex-direction: column; gap: 8px; }
.navItem {
  text-align: left;
  padding: 10px 12px;
  border-radius: 10px;
  border: 1px solid #eee;
  background: #fafafa;
  cursor: pointer;
}
.navItem.danger { background: #fff5f5; border-color: #ffd7d7; }
</style>