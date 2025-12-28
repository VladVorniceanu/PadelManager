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
          <AdminOverviewView />
        </section>

        <!-- Users management -->
        <section v-else-if="activeTab === 'users'" class="admin-section">
          <AdminUsersView />
        </section>

        <!-- Locations management -->
        <section v-else-if="activeTab === 'locations'" class="admin-section">
          <AdminLocationsView />
        </section>

        <!-- Tournaments management (placeholder) -->
        <section v-else-if="activeTab === 'tournaments'" class="admin-section">
          <AdminTournamentsView />
        </section>
      </main>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue';
import AdminUsersView from '../components/AdminUsersView.vue';
import AdminLocationsView from '../components/AdminLocationsView.vue';
import AdminTournamentsView from '../components/AdminTournamentsView.vue';
import AdminOverviewView from '../components/AdminOverviewView.vue';

const activeTab = ref('overview');

const tabs = [
  { id: 'overview', label: 'Overview' },
  { id: 'users', label: 'Users' },
  { id: 'locations', label: 'Locations' },
  { id: 'tournaments', label: 'Tournaments' },
];
</script>

<style src="../styles/AdminDashboardStyle.css"></style>