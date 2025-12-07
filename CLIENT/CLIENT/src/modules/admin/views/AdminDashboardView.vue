<!-- CLIENT/CLIENT/src/modules/admin/views/AdminDashboardView.vue -->
<template>
  <div class="admin-page">
    <!-- Header pagina admin -->
    <header class="admin-header">
      <div>
        <h2 class="admin-title">Admin console</h2>
        <p class="admin-subtitle">
          Gestionează utilizatorii, locațiile și turneele din Padel Manager.
        </p>
      </div>
      <span class="admin-badge">Admin</span>
    </header>

    <div class="admin-layout">
      <!-- Sidebar cu tab-uri -->
      <nav class="admin-sidebar">
        <button
          v-for="tab in tabs"
          :key="tab.id"
          type="button"
          :class="['sidebar-btn', { active: activeTab === tab.id }]"
          @click="activeTab = tab.id"
        >
          {{ tab.label }}
        </button>
      </nav>

      <!-- Conținut principal -->
      <main class="admin-main">
        <!-- Overview -->
        <section v-if="activeTab === 'overview'" class="admin-section">
          <h3 class="section-title">Overview</h3>
          <p class="section-subtitle">
            Rezumat rapid asupra ecosistemului: jucători, locații, turnee și meciuri.
          </p>

          <div class="overview-grid">
            <article class="overview-card">
              <h4>Total jucători</h4>
              <p class="overview-value">—</p>
              <p class="overview-note">Va fi populat din statistici backend.</p>
            </article>

            <article class="overview-card">
              <h4>Total locații</h4>
              <p class="overview-value">—</p>
              <p class="overview-note">
                Numărul total de cluburi/locații disponibile în sistem.
              </p>
            </article>

            <article class="overview-card">
              <h4>Turnee active</h4>
              <p class="overview-value">—</p>
              <p class="overview-note">
                Turnee aflate în desfășurare sau programate în următoarele zile.
              </p>
            </article>
          </div>
        </section>

        <!-- Users management -->
        <section v-else-if="activeTab === 'users'" class="admin-section">
          <h3 class="section-title">Users management</h3>
          <p class="section-subtitle">
            Promovează utilizatorii la rol de admin sau revino la rol de player.
          </p>
          <AdminUsersView />
        </section>

        <!-- Locations management -->
        <section v-else-if="activeTab === 'locations'" class="admin-section">
          <h3 class="section-title">Locations management</h3>
          <p class="section-subtitle">
            Adaugă și actualizează locații, precum și terenurile de padel asociate.
          </p>
          <AdminLocationsView />
        </section>

        <!-- Tournaments management (placeholder) -->
        <section v-else-if="activeTab === 'tournaments'" class="admin-section">
          <h3 class="section-title">Tournaments management</h3>
          <p class="section-subtitle">
            În curând vei putea crea și administra turneele de padel:
            generare de meciuri, distribuție pe nivele de dificultate și programare pe terenuri.
          </p>

          <div class="tournaments-placeholder">
            <p>
              ✳️ Această secțiune este încă în lucru. Va integra fluxul de
              <strong>creare turneu</strong> și alocarea automată a meciurilor.
            </p>
          </div>
        </section>
      </main>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue';
import AdminUsersView from './AdminUsersView.vue';
import AdminLocationsView from './AdminLocationsView.vue';

const activeTab = ref('overview');

const tabs = [
  { id: 'overview', label: 'Overview' },
  { id: 'users', label: 'Users' },
  { id: 'locations', label: 'Locations' },
  { id: 'tournaments', label: 'Tournaments' },
];
</script>

<style scoped>
.admin-page {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

/* Header sus (titlu + badge Admin) */
.admin-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.5rem;
}

.admin-title {
  font-size: 1.5rem;
  font-weight: 700;
  margin: 0;
}

.admin-subtitle {
  margin: 0.25rem 0 0;
  font-size: 0.95rem;
  color: #6b7280;
}

.admin-badge {
  font-size: 0.8rem;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  padding: 0.25rem 0.6rem;
  border-radius: 999px;
  background: #111827;
  color: #fff;
}

/* Layout principal: sidebar + main */
.admin-layout {
  display: grid;
  grid-template-columns: 220px 1fr;
  gap: 1.5rem;
  min-height: 60vh;
}

/* Sidebar */
.admin-sidebar {
  border-right: 1px solid #e5e7eb;
  padding-right: 1rem;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.sidebar-btn {
  width: 100%;
  text-align: left;
  padding: 0.55rem 0.75rem;
  border-radius: 0.5rem;
  border: none;
  background: transparent;
  cursor: pointer;
  font-size: 0.95rem;
  color: #374151;
  transition: background 0.15s ease, color 0.15s ease, transform 0.05s ease;
}

.sidebar-btn:hover {
  background: #f3f4f6;
}

.sidebar-btn.active {
  background: #111827;
  color: #ffffff;
  transform: translateX(1px);
}

/* Main content */
.admin-main {
  padding-left: 0.5rem;
}

.admin-section {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.section-title {
  margin: 0;
  font-size: 1.2rem;
  font-weight: 600;
}

.section-subtitle {
  margin: 0.25rem 0 0.5rem;
  font-size: 0.9rem;
  color: #6b7280;
}

/* Overview cards */
.overview-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(210px, 1fr));
  gap: 1rem;
  margin-top: 0.5rem;
}

.overview-card {
  border-radius: 0.75rem;
  border: 1px solid #e5e7eb;
  padding: 0.9rem 1rem;
  background: #f9fafb;
}

.overview-card h4 {
  margin: 0 0 0.25rem;
  font-size: 0.95rem;
  font-weight: 600;
}

.overview-value {
  margin: 0.15rem 0;
  font-size: 1.4rem;
  font-weight: 700;
  color: #111827;
}

.overview-note {
  margin: 0;
  font-size: 0.8rem;
  color: #6b7280;
}

/* Placeholder turnee */
.tournaments-placeholder {
  padding: 1rem;
  border-radius: 0.75rem;
  border: 1px dashed #9ca3af;
  background: #f9fafb;
  font-size: 0.9rem;
  color: #4b5563;
}

/* Responsive */
@media (max-width: 900px) {
  .admin-layout {
    grid-template-columns: 1fr;
  }

  .admin-sidebar {
    flex-direction: row;
    border-right: none;
    border-bottom: 1px solid #e5e7eb;
    padding: 0 0 0.75rem;
    overflow-x: auto;
  }

  .sidebar-btn {
    flex: 1 0 auto;
    text-align: center;
  }

  .admin-main {
    padding-left: 0;
    padding-top: 0.75rem;
  }
}
</style>