<!--
 * @Author: lcc
 * @Date: 2024-06-10 15:51:11
 * @LastEditTime: 2024-06-10 17:53:24
 * @LastEditors: lcc
 * @Description: 定义button的一些样式，因为tailwindcss的样式全局导入导致，很多都被初始化了,但又不喜欢用tailwindcss
-->
<script setup lang="ts">

</script>
<template>
    <button class="m-button-container" v-bind="$attrs">
        <slot></slot>
    </button>
</template>
<style lang="scss">
.m-button-container{
    display: inline-block;
    border: 1px solid #c3c3c3;
    padding: 4px 6px;
    &:hover{
        background-color: #b2c3c5;
        color: #ffffff;
    }
    &:focus{
        outline: none;
    }
}
.m-button-container + .m-button-container{
    margin-left: 12px;
}
</style>