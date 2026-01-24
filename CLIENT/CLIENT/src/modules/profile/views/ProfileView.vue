<template>
  <section class="page">
    <header class="pageHeader">
      <div>
        <h1 class="pageTitle">My Profile</h1>
        <p class="pageSubtitle">Personal statistics and insights about your matches.</p>
      </div>
    </header>

    <section class="personalDataSection">
      <div class="sectionHeader">
        <div>
          <h3 class="sectionTitle">Personal Information</h3>
          <p class="sectionHint">Keep your preferences updated for better match suggestions.</p>
        </div>

        <div class="sectionActions">
          <UiButton
            v-if="!editing"
            variant="subtle"
            type="button"
            @click="startEdit"
          >
            Edit
          </UiButton>

          <template v-else>
            <UiButton variant="subtle" type="button" :disabled="savingPersonalData" @click="cancelEdit">
              Cancel
            </UiButton>
            <UiButton type="button" :disabled="savingPersonalData" @click="savePersonalData">
              {{ savingPersonalData ? 'Saving…' : 'Save changes' }}
            </UiButton>
          </template>
        </div>
      </div>
      
      <UiStateCard v-if="loading" variant="loading" :lines="5" />
      <UiStateCard v-else-if="error" variant="error" title="Error" :message="error">
        <template #action>
          <UiButton @click="load">Retry</UiButton>
        </template>
      </UiStateCard>
      
      <UiCard v-else class="personalWideCard">
        <div class="personalSplit">
          <!-- LEFT -->
          <div class="personalCol">
            <div class="profilePicRow">
              <div class="profilePic__container">
                <img
                  v-if="currentProfile.profilePicUrl"
                  :src="currentProfile.profilePicUrl"
                  :alt="currentProfile.displayName"
                  class="profilePic__image"
                />
                <div v-else class="profilePic__placeholder">
                  <span>No photo</span>
                </div>
              </div>

              <div class="profilePicMeta">
                <div class="profileMetadataValue">{{ currentProfile.displayName || '—' }}</div>
                <div class="profileEmail">{{ currentProfile.email || '—' }}</div>

                <UiButton
                  v-if="editing"
                  variant="subtle"
                  type="button"
                  @click="triggerProfilePicUpload"
                  style="margin-top: 10px;"
                >
                  {{ currentProfile.profilePicUrl ? 'Change' : 'Upload' }} photo
                </UiButton>

                <input
                  ref="profilePicInput"
                  type="file"
                  accept="image/*"
                  style="display: none;"
                  @change="handleProfilePicChange"
                />
              </div>
            </div>
            <div class="field">
              <div class="statCard__label">Playing level</div>
              <div v-if="!editing" class="profileMetadataValue">{{ labelLevel(currentProfile.playingLevel) }}</div>
              <UiSelect v-else v-model="draftProfile.playingLevel">
                <option value="">Select level</option>
                <option value="beginner">Beginner</option>
                <option value="intermediate">Intermediate</option>
                <option value="advanced">Advanced</option>
                <option value="professional">Professional</option>
              </UiSelect>
            </div>
          </div>

          <div class="personalDivider" aria-hidden="true"></div>

          <!-- RIGHT -->
          <div class="personalCol">
            <div class="fieldGrid">
              <div class="field">
                <div class="statCard__label">Preferred side</div>
                  <div v-if="!editing" class="profileMetadataValue">{{ labelSide(currentProfile.preferredSide) }}</div>
                  <UiSelect v-else v-model="draftProfile.preferredSide">
                    <option value="">Select a side</option>
                    <option value="forehand">Forehand</option>
                    <option value="backhand">Backhand</option>
                    <option value="both">Both</option>
                  </UiSelect>
                </div>
              <div class="field">
                <div class="statCard__label">Preferred position</div>
                <div v-if="!editing" class="profileMetadataValue">{{ labelPosition(currentProfile.preferredPosition) }}</div>
                <UiSelect v-else v-model="draftProfile.preferredPosition">
                  <option value="">Select position</option>
                  <option value="net">Net</option>
                  <option value="baseline">Baseline</option>
                  <option value="flexible">Flexible</option>
                </UiSelect>
              </div>

              <div class="field">
                <div class="statCard__label">Preferred time</div>
                <div v-if="!editing" class="profileMetadataValue">{{ labelTime(currentProfile.preferredTime) }}</div>
                <UiSelect v-else v-model="draftProfile.preferredTime">
                  <option value="">Select time</option>
                  <option value="morning">Morning (6–12)</option>
                  <option value="afternoon">Afternoon (12–18)</option>
                  <option value="evening">Evening (18–23)</option>
                  <option value="flexible">Flexible</option>
                </UiSelect>
              </div>
            </div>
          </div>
        </div>
      </UiCard>
    </section>

    <div class="sectionHeader">
      <div>
        <h3 class="sectionTitle">Your padel stats</h3>
        <p class="sectionHint">Take a glance at some key statistics about your padel games.</p>
      </div>

      <div class="sectionActions">
        <UiButton variant="subtle"  :disabled="loading" @click="load">
          {{ loading ? 'Refreshing…' : 'Refresh' }}
        </UiButton>
      </div>
    </div>

    <!-- <UiStateCard v-else-if="error" variant="error" title="Error" :message="error">
      <template #action>
        <UiButton @click="load">Retry</UiButton>
      </template>
    </UiStateCard> -->

    <div v-if="loading" class="statsGrid">
      <!-- Primary stats -->
      <UiStateCard class="statCard" variant="loading" :lines="3"/>
      <UiStateCard class="statCard" variant="loading" :lines="3"/>
      <UiStateCard class="statCard" variant="loading" :lines="3"/>
      <UiStateCard class="statCard" variant="loading" :lines="3"/>

      <!-- Secondary stats -->
      <UiStateCard class="statCard statCard--wide" variant="loading" :lines="3"/>
      <UiStateCard class="statCard statCard--wide" variant="loading" :lines="3"/>
      <UiStateCard class="statCard statCard--wide" variant="loading" :lines="3"/>
    </div>

    <div v-else-if="error">
      <UiStateCard variant="error" title="There has been an error while calculating statistics:" :message="error">
        <template #action>
          <UiButton @click="load">Retry</UiButton>
        </template>
      </UiStateCard>
    </div>

    <div v-else class="statsGrid">
      <!-- Primary stats -->
      <UiCard class="statCard">
        <div class="statCard__label">Games played</div>
        <div class="statCard__value">{{ stats.gamesPlayed }}</div>
        <div class="statCard__meta">Total matches you have participated in.</div>
      </UiCard>

      <UiCard class="statCard">
        <div class="statCard__label">Wins</div>
        <div class="statCard__value">{{ stats.wins }}</div>
        <div class="statCard__meta">Only finalised matches.</div>
      </UiCard>

      <UiCard class="statCard">
        <div class="statCard__label">Losses</div>
        <div class="statCard__value">{{ stats.losses }}</div>
        <div class="statCard__meta">Only finalised matches.</div>
      </UiCard>

      <UiCard class="statCard">
        <div class="statCard__label">Win rate</div>
        <div class="statCard__value">{{ winRate }}</div>
        <div class="statCard__meta">Wins / (Wins + Losses).</div>
      </UiCard>

      <!-- Secondary stats -->
      <UiCard class="statCard statCard--wide">
        <div class="statCard__label">Most frequent teammate</div>
        <div class="statCard__value statCard__value--sm">
          {{ formatTopUser(stats.mostFrequentTeammate) }}
        </div>
        <div class="statCard__meta">Based on matches where you were on the same team.</div>
      </UiCard>

      <UiCard class="statCard statCard--wide">
        <div class="statCard__label">Most frequent opponent</div>
        <div class="statCard__value statCard__value--sm">
          {{ formatTopUser(stats.mostFrequentOpponent) }}
        </div>
        <div class="statCard__meta">Based on matches where you were on opposing teams.</div>
      </UiCard>

      <UiCard class="statCard statCard--wide">
        <div class="statCard__label">Most played location</div>
        <div class="statCard__value statCard__value--sm">
          {{ formatTopLocation(stats.mostPlayedLocation) }}
        </div>
        <div class="statCard__meta">Location where you played the most.</div>
      </UiCard>
    </div>
  </section>
</template>

<script setup>
import { computed, onMounted, ref } from 'vue';
import UiButton from '@/components/ui/UiButton.vue';
import UiStateCard from '@/components/ui/UiStateCard.vue';
import UiCard from '@/components/ui/UiCard.vue';
import UiInput from '@/components/ui/UiInput.vue';
import UiSelect from '@/components/ui/UiSelect.vue';

import { fetchProfile, updateUserProfile } from '@/api/usersApi';
import { fetchMyStats } from '@/api/statsApi';
import { auth } from '../../../services/firebase';
import { useLookups } from '@/composables/useLookups';

const { userDisplayNameById, warmupLookups, locationNameById } = useLookups();

const loading = ref(true);
const error = ref(null);

const savingPersonalData = ref(false);
const editing = ref(false);

const profilePicInput = ref(null);
const userId = auth.currentUser?.uid || '';

const stats = ref({
  gamesPlayed: 0,
  wins: 0,
  losses: 0,
  mostFrequentTeammate: null,
  mostFrequentOpponent: null,
  mostPlayedLocation: null,
});

const profileData = ref({
  profilePicUrl: '',
  displayName: '',
  email: '',
  preferredSide: '',
  playingLevel: '',
  preferredPosition: '',
  preferredTime: '',
});

const draftProfile = ref({ ...profileData.value });

const currentProfile = computed(() => (editing.value ? draftProfile.value : profileData.value));

function startEdit() {
  draftProfile.value = { ...profileData.value };
  editing.value = true;
}
function cancelEdit() {
  editing.value = false;
  draftProfile.value = { ...profileData.value };
}

const winRate = computed(() => {
  const w = Number(stats.value?.wins ?? 0);
  const l = Number(stats.value?.losses ?? 0);
  const total = w + l;
  if (!total) return '—';
  return `${Math.round((w / total) * 100)}%`;
});

function triggerProfilePicUpload() {
  profilePicInput.value?.click();
}

function handleProfilePicChange(event) {
  const file = event?.target?.files?.[0];
  if (!file) return;

  const formData = new FormData();
  formData.append('profilePic', file);

  httpClient.post('/profile/picture', formData)
    .then(() => load())
    .catch((err) => {
      console.error(err);
      error.value = 'Could not upload profile picture.';
    });
}

async function savePersonalData() {
  savingPersonalData.value = true;
  try {
    const payload = {
      profilePicUrl: draftProfile.value.profilePicUrl || '',
      displayName: draftProfile.value.displayName || '',
      preferredSide: draftProfile.value.preferredSide || '',
      playingLevel: draftProfile.value.playingLevel || '',
      preferredPosition: draftProfile.value.preferredPosition || '',
      preferredTime: draftProfile.value.preferredTime || '',
    };

    await updateUserProfile(userId, payload);
    editing.value = false;
    await load();
  } catch (e) {
    console.error(e);
    error.value = e?.response?.data?.message || e?.message || 'Could not save profile data.';
  } finally {
    savingPersonalData.value = false;
  }
}


async function load() {
  loading.value = true;
  error.value = null;

  try {
    // stats
    stats.value = await fetchMyStats();
    // profile
    profileData.value = await fetchProfile(userId);
  } catch (e) {
    console.error(e);
    error.value = e?.response?.data?.message || e?.message || 'Could not load profile.';
  } finally {
    loading.value = false;
  }
}

function normalizeTopKey(v) {
  if (!v) return { key: null, count: 0 };
  if (typeof v === 'string') return { key: v, count: 0 };

  return {
    key: v.key || v.uid || v.id || v.userId || v.locationId || null,
    count: Number(v.count ?? 0) || 0,
  };
}

function formatTopUser(v) {
  const { key, count } = normalizeTopKey(v);
  if (!key) return '—';

  const label = userDisplayNameById?.(key) || `User ${String(key).slice(0, 6)}`;
  if (!count) return label;

  return count === 1 ? `${label} — ${count} match` : `${label} — ${count} matches`;
}

function formatTopLocation(v) {
  const { key, count } = normalizeTopKey(v);
  if (!key) return '—';

  const label = locationNameById?.(key) || `Location ${String(key).slice(0, 6)}`;
  if (!count) return label;

  return count === 1 ? `${label} — ${count} match` : `${label} — ${count} matches`;
}

/** label helpers */
function labelSide(v) {
  if (!v) return '—';
  return v === 'forehand' ? 'Forehand' : v === 'backhand' ? 'Backhand' : v === 'both' ? 'Both' : v;
}
function labelLevel(v) {
  if (!v) return '—';
  return v.charAt(0).toUpperCase() + v.slice(1);
}
function labelPosition(v) {
  if (!v) return '—';
  return v === 'net' ? 'Net' : v === 'baseline' ? 'Baseline' : v === 'flexible' ? 'Flexible' : v;
}
function labelTime(v) {
  if (!v) return '—';
  return v === 'morning' ? 'Morning' : v === 'afternoon' ? 'Afternoon' : v === 'evening' ? 'Evening' : 'Flexible';
}

onMounted(async () => {
  await warmupLookups();
  await load();
});
</script>


<style scoped>
.statsDebug { grid-column: 1 / -1; }
.statsGrid{
  display:grid;
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
  gap:14px;
  margin-top:20px;
}
.statCard{
  padding:16px;
}
.statCard--wide{ grid-column: span 2; }
.statCard__label{
  font-size:13px;
  color: var(--ui-muted);
  font-weight:600;
}
.statCard__value{
  font-size:32px;
  font-weight:900;
  margin-top:6px;
}
.statCard__value--sm{ font-size:18px; }
.statCard__meta{
  margin-top:8px;
  font-size:12px;
  color: var(--ui-muted);
}
.sectionHeader{
  display:flex;
  align-items:flex-start;
  justify-content:space-between;
  gap:12px;
  margin-bottom:10px;
}
.sectionHint{ margin:6px 0 0; color: var(--ui-muted); font-size: 13px; }

.personalWideCard{ padding: 16px; }
.personalSplit{
  display:grid;
  grid-template-columns: 1fr 1px 1fr;
  gap:16px;
  align-items:start;
}
.personalDivider{
  width:1px;
  background: var(--ui-border);
  align-self: stretch;
}

.personalCol{ display:flex; flex-direction:column; gap:14px; }

.profilePicRow{
  display:grid;
  grid-template-columns: 92px 1fr;
  gap:14px;
  align-items:center;
}
.profilePic__container{
  width:92px; height:92px;
  border-radius: 18px;
  overflow:hidden;
  border: 1px solid var(--ui-border);
  background: var(--ui-surface-muted);
  display:grid; place-items:center;
}
.profilePic__image{ width:100%; height:100%; object-fit:cover; }
.profilePic__placeholder{ color: var(--ui-muted); font-size: 12px; }
.profileMetadataLabel{ color: var(--ui-muted); font-size: 14px; }
.profileMetadataValue{ font-weight: 750; font-size: 16px; }
.profileEmail{ color: var(--ui-muted); font-size: 13px; }

.fieldGrid{
  display:grid;
  grid-template-columns: 1fr;
  gap:12px;
}
.fieldLabel{ font-size: 12px; color: var(--ui-muted); margin-bottom: 6px; }
.fieldValue{ font-size: 14px; color: var(--ui-text); }

@media (max-width: 900px){
  .personalSplit{ grid-template-columns: 1fr; }
  .personalDivider{ display:none; }
}

</style>