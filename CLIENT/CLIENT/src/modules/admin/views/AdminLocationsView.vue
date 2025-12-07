<template>
  <div class="admin-locations">
    <header class="admin-locations__header">
      <h2>Locations management</h2>
      <p class="admin-locations__subtitle">
        Gestionează locațiile de padel și terenurile disponibile pentru rezervări și turnee.
      </p>
    </header>

    <!-- Placeholder listă locații; va fi conectată ulterior la API -->
    <section class="admin-locations__list-wrapper">
      <ul class="admin-locations__list">
        <li class="admin-locations__item">
          <div class="admin-locations__item-main">
            <h3>Padel Arena București</h3>
            <p>3 terenuri disponibile</p>
          </div>
          <div class="admin-locations__item-actions">
            <button type="button" class="admin-locations__action">Editează</button>
            <button type="button" class="admin-locations__action admin-locations__action--secondary">
              Gestionează terenuri
            </button>
          </div>
        </li>
        <li class="admin-locations__item">
          <div class="admin-locations__item-main">
            <h3>Padel Club Cluj</h3>
            <p>4 terenuri disponibile</p>
          </div>
          <div class="admin-locations__item-actions">
            <button type="button" class="admin-locations__action">Editează</button>
            <button type="button" class="admin-locations__action admin-locations__action--secondary">
              Gestionează terenuri
            </button>
          </div>
        </li>
      </ul>
      <p class="admin-locations__hint">
        * Aceste date sunt placeholder. Ulterior vom conecta această listă la backend și vom adăuga formulare
        pentru creare / editare locații și terenuri (courts).
      </p>
    </section>
  </div>
</template>

<script setup>
// Aici vom adăuga ulterior logica reală:
// - fetch lista de locații din API
// - creare / editare / ștergere locații
// - gestionarea terenurilor (courts) dintr-o locație
</script>

<style scoped>
.admin-locations {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.admin-locations__header h2 {
  font-size: 1.5rem;
  font-weight: 600;
  margin-bottom: 0.25rem;
}

.admin-locations__subtitle {
  font-size: 0.95rem;
  color: #4b5563;
}

.admin-locations__list-wrapper {
  margin-top: 1rem;
}

.admin-locations__list {
  list-style: none;
  padding: 0;
  margin: 0;
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.admin-locations__item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.75rem 1rem;
  border-radius: 0.75rem;
  border: 1px solid #e5e7eb;
  background: #f9fafb;
}

.admin-locations__item-main h3 {
  margin: 0 0 0.25rem 0;
  font-size: 1rem;
}

.admin-locations__item-main p {
  margin: 0;
  font-size: 0.85rem;
  color: #4b5563;
}

.admin-locations__item-actions {
  display: flex;
  gap: 0.5rem;
}

.admin-locations__action {
  padding: 0.25rem 0.5rem;
  border-radius: 0.375rem;
  border: none;
  cursor: pointer;
  font-size: 0.8rem;
  background: #111827;
  color: #ffffff;
}

.admin-locations__action--secondary {
  background: #6b7280;
}

.admin-locations__action:hover {
  opacity: 0.9;
}

.admin-locations__hint {
  margin-top: 0.5rem;
  font-size: 0.8rem;
  color: #6b7280;
}
</style>