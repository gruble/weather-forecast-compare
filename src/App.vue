<template>
  <div id="app">
    <search/>
    <ForecastPerDay/>
  </div>
</template>

<script setup>
import Search from "./components/Search.vue";
import ForecastPerDay from "./components/ForecastPerDay.vue";
</script>

<style>
#app {
  /* font-family: Avenir, Helvetica, Arial, sans-serif; */
  /* -webkit-font-smoothing: antialiased; */
  /* -moz-osx-font-smoothing: grayscale; */
  /* text-align: center; */
  /* color: #2c3e50; */
  /* margin-top: 60px; */
  gap: 1rem;
  display: flex;
  flex-direction: column;
}
</style>
