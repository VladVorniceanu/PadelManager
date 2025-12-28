<template>
  <header class="toolbar">
    <button class="iconBtn" @click="$emit('toggle-drawer')" aria-label="Open menu">
      ☰
    </button>

    <div class="title">
      <slot name="title">PadelManager</slot>
    </div>

    <div class="right">
      <slot name="right"></slot>
    </div>
  </header>
</template>

<style scoped>
.toolbar {
  height: 56px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 12px;
  border-bottom: 1px solid #eee;
  background: white;
  position: static;
}
.iconBtn {
  font-size: 20px;
  border: none;
  background: transparent;
  cursor: pointer;
  padding: 8px;
}
.title { font-weight: 700; }
</style>