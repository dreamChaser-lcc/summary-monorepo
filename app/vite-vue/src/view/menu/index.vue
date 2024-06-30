<!--
 * @Author: lcc
 * @Date: 2024-06-02 15:37:03
 * @LastEditTime: 2024-06-25 23:36:44
 * @LastEditors: lcc
 * @Description: 路由菜单
-->
<script lang="ts" setup>
import { routes } from '@/router/index.ts';
import { computed } from 'vue';
import { useRouter } from 'vue-router';

const menus = computed(() => {
  return routes.filter((item) => item.meta?.title);
});

const router = useRouter();

const jumpToMenu = (route) => {
  // push
  router.push(route.path);
};
</script>
<template>
  <div class="router-menu-container">
    <header class="header">路由菜单(↓↓↓点击跳转)</header>
    <div
      v-for="route in menus.reverse()"
      @click="jumpToMenu(route)"
      :key="route.name"
      class="menu-item"
    >
      <div v-if="route?.meta?.title">{{ route?.meta?.title }}</div>
    </div>
  </div>
</template>
<style lang="scss" scoped>
.router-menu-container {
  border-radius: 5px;
  border: 1px solid #c3c3c3;
  min-width: 400px;
  position: relative;
  max-height: 660px;
  overflow: auto;
  .header {
    position: sticky;
    top: 0;
    left: 0;
    border-bottom: 1px solid #c3c3c3;
    background-color: #fff;
    padding: 12px;
    font-size: 18px;
    font-weight: bold;
  }
  .menu-item {
    border-top: 1px solid #c3c3c3;
    padding: 12px;
    cursor: pointer;
    &:hover {
      background-color: #8eccdd;
      color: #fff;
    }
  }
}
</style>
