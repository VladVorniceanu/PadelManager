import { createApp } from 'vue';
import { createPinia } from 'pinia';

import App from './App.vue';
import router from './router';

import './style.css';
import { useAuthStore } from './modules/auth/store/useAuthStore';

const app = createApp(App);
const pinia = createPinia();

app.use(pinia);
app.use(router);

const authStore = useAuthStore(pinia);

authStore.init().then(() => {
  app.mount('#app');
});