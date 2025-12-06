<template>
  <div class="admin-layout">
    <aside class="sidebar">
      <nav>
        <ul>
          <li><router-link to="/admin">Dashboard</router-link></li>
          <li><router-link to="/admin/locations">Locations</router-link></li>
          <li><router-link to="/tournaments">Tournaments</router-link></li>
          <li><router-link to="/friendly">Friendly Matches</router-link></li>
          <li><router-link to="/profile">Profile</router-link></li>
        </ul>
      </nav>
    </aside>

    <div class="admin-main">
      <header class="admin-header">
        <h2>Admin</h2>
      </header>
      <main class="admin-content">
        <router-view />
      </main>
    </div>
  </div>
</template>

<script setup>
</script>

<style scoped>
.admin-layout {
  display: grid;
  grid-template-columns: 220px 1fr;
  min-height: 100vh;
}

.sidebar {
  border-right: 1px solid #e5e5e5;
  padding: 1rem;
}

.sidebar ul {
  list-style: none;
  padding: 0;
}

.sidebar li + li {
  margin-top: 0.5rem;
}

.admin-main {
  display: flex;
  flex-direction: column;
}

.admin-header {
  padding: 1rem;
  border-bottom: 1px solid #e5e5e5;
}

.admin-content {
  padding: 1rem;
}
</style>