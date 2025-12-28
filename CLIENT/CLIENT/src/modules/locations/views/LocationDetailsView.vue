<template>
  <div class="backdrop" @click.self="close">
    <div class="modal modal--wide" role="dialog" aria-modal="true">
      <div class="modalHeader">
        <div>
          <div class="modalTitle">{{ loc?.name || 'Location' }}</div>
          <div class="modalSubtitle">
            {{ [loc?.city, loc?.address].filter(Boolean).join(' — ') || '—' }}
          </div>
        </div>

        <button class="iconBtn" @click="close" aria-label="Close">✕</button>
      </div>

      <div v-if="loading" class="modalBody">
        <div class="card">
          <div class="skeletonLine"></div>
          <div class="skeletonLine"></div>
        </div>
      </div>

      <div v-else-if="error" class="modalBody">
        <div class="card error">
          <div class="errorTitle">Eroare</div>
          <div class="errorMsg">{{ error }}</div>
          <button class="btn" @click="load">Retry</button>
        </div>
      </div>

      <div v-else class="modalBody">
        <div class="detailsGrid">
          <!-- Left: details -->
          <section class="detailsCol">
            <div class="detailsCard">
              <div class="detailsLabel">Courts</div>
              <div class="detailsValue">{{ (loc?.courts?.length ?? 0) }}</div>
              <div class="detailsMeta">Numărul de terenuri asociate locației.</div>
            </div>

            <div class="detailsCard">
              <div class="detailsLabel">Address</div>
              <div class="detailsValue detailsValue--sm">
                {{ [loc?.city, loc?.address].filter(Boolean).join(' — ') || '—' }}
              </div>
              <div class="detailsMeta">Folosit pentru navigație și rezervări.</div>
            </div>

            <div v-if="loc?.courts?.length" class="detailsCard">
              <div class="detailsLabel">Courts list</div>
              <div class="courtsList">
                <div v-for="c in loc.courts" :key="c.id" class="courtChip">
                  {{ c.name || 'Court' }} <span class="pill">{{ c.isIndoor ? 'Indoor' : 'Outdoor' }}</span>
                </div>
              </div>
            </div>
          </section>

          <!-- Right: map -->
          <section class="mapCol">
            <div class="mapFrame">
              <iframe
                v-if="mapSrc"
                :src="mapSrc"
                width="100%"
                height="100%"
                style="border:0;"
                loading="lazy"
                referrerpolicy="no-referrer-when-downgrade"
              />
              <div v-else class="mapEmpty">
                No map coordinates yet (add lat/lng on location).
              </div>
            </div>

            <div class="detailsActions">
              <button class="btn" @click="close">Close</button>
              <button class="btn primary" @click="bookMatch">
                Book a match
              </button>
            </div>
          </section>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, onMounted, ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { fetchLocations } from '@/api/locationsApi';

const route = useRoute();
const router = useRouter();

const loading = ref(false);
const error = ref(null);
const loc = ref(null);

const locationId = computed(() => route.params.id);

function close() {
  router.push({ path: '/locations' }).catch(() => {});
}

function getCoords(l) {
  const lat = l?.lat ?? l?.latitude ?? l?.coords?.lat ?? l?.geo?.lat;
  const lng = l?.lng ?? l?.longitude ?? l?.coords?.lng ?? l?.geo?.lng;
  if (typeof lat !== 'number' || typeof lng !== 'number') return null;
  return { lat, lng };
}

const mapSrc = computed(() => {
  const c = getCoords(loc.value);
  if (!c) return '';
  // OpenStreetMap embed
  const bbox = `${c.lng - 0.01},${c.lat - 0.01},${c.lng + 0.01},${c.lat + 0.01}`;
  const marker = `${c.lat},${c.lng}`;
  return `https://www.openstreetmap.org/export/embed.html?bbox=${encodeURIComponent(bbox)}&layer=mapnik&marker=${encodeURIComponent(marker)}`;
});

async function load() {
  loading.value = true;
  error.value = null;
  try {
    // fără API nou: luăm lista existentă și găsim elementul
    const items = (await fetchLocations()) ?? [];
    loc.value = items.find((x) => x.id === locationId.value) || null;

    if (!loc.value) {
      error.value = 'Location not found.';
    }
  } catch (e) {
    console.error(e);
    error.value = e?.response?.data?.message || e?.message || 'Failed to load location';
  } finally {
    loading.value = false;
  }
}

function bookMatch() {
  // Precomplete location for match booking flow
  router.push({
    path: '/matches/create',
    query: { locationId: locationId.value },
  }).catch(() => {});
}

onMounted(load);
</script>

<style scoped>
.modalBody { padding: 16px; }

.detailsGrid {
  display: grid;
  grid-template-columns: 1.1fr 0.9fr;
  gap: 14px;
}
@media (max-width: 900px) {
  .detailsGrid { grid-template-columns: 1fr; }
}

.detailsCol { display: flex; flex-direction: column; gap: 12px; }

.detailsCard {
  border: 1px solid #e5e7eb;
  background: #fff;
  border-radius: 16px;
  padding: 14px;
}

.detailsLabel { color: #6b7280; font-size: 12px; font-weight: 800; }
.detailsValue { font-size: 22px; font-weight: 950; margin-top: 6px; letter-spacing: -0.02em; }
.detailsValue--sm { font-size: 14px; font-weight: 900; }
.detailsMeta { margin-top: 8px; color: #6b7280; font-size: 12px; line-height: 1.4; }

.mapCol { display: flex; flex-direction: column; gap: 12px; }

.mapFrame {
  border: 1px solid #e5e7eb;
  border-radius: 16px;
  overflow: hidden;
  background: #f9fafb;
  height: 420px;
}
@media (max-width: 900px) {
  .mapFrame { height: 320px; }
}

.mapEmpty {
  height: 100%;
  display: grid;
  place-items: center;
  color: #6b7280;
  font-size: 13px;
  padding: 14px;
  text-align: center;
}

.detailsActions { display: flex; justify-content: flex-end; gap: 10px; }

/* make modal almost full page */
.modal--wide {
  width: min(980px, 96vw);
}
</style>