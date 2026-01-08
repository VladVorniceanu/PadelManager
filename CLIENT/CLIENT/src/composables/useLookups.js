import { computed } from 'vue';
import { storeToRefs } from 'pinia';
import { useLocationsStore } from '@/modules/locations/store/useLocationsStore';
import { useUsersStore } from '@/stores/useUsersStore';

function safeId(id) {
  return id == null ? '' : String(id);
}

export function useLookups() {
  const locationsStore = useLocationsStore();
  const usersStore = useUsersStore();

  const { items: locations } = storeToRefs(locationsStore);
  const { items: users } = storeToRefs(usersStore);

  const locationById = computed(() => {
    const map = new Map();
    for (const l of locations.value || []) {
        const key = safeId(l?.id);
        if (key) map.set(key, l);
    }
    return map;
  });

  const userById = computed(() => {
    const map = new Map();
    for (const u of users.value || []) {
        const key = safeId(u?.id);
        if (key) map.set(key, u);
    }
    return map;
  });

  function locationNameById(id) {
    const key = safeId(id);
    if (!key) return 'Location';

    const loc = locationById.value.get(key);
    if (!loc) return `Location ${key.slice(0, 6)}`;

    return `${loc.name || '—'}${loc.city ? `, ${loc.city}` : ''}`;
  }

  function userDisplayNameById(id, { meUid = '' } = {}) {
    const key = safeId(id);
    if (!key) return '—';
    if (meUid && key === safeId(meUid)) return 'Me';

    const u = userById.value.get(key);
    if (!u) return `User ${key.slice(0, 6)}`;

    return u.displayName || u.name || u.email || `User ${key.slice(0, 6)}`;
  }

  async function warmupLookups() {
    await Promise.allSettled([
      (locationsStore.loadLocationsOnce?.() ?? locationsStore.loadLocations?.()),
      (usersStore.loadUsersOnce?.() ?? usersStore.loadUsers?.()),
    ]);
  }

  return {
    locations,
    users,
    warmupLookups,
    locationNameById,
    userDisplayNameById,
    locationsStore,
    usersStore,
  };
}