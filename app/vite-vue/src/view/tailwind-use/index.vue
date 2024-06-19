<script lang="ts" setup>
const tailwindClass =
  'm-4 rounded-md bg-red-500 px-4 py-2 text-white ring-green-500 hover:bg-red-600 focus:ring-2 active:bg-red-400 sm:bg-indigo-500 sm:hover:bg-indigo-600 sm:active:bg-indigo-400';
</script>
<template>
  <m-layout>
    <template #summary>
      <div>
        <ul>
          <li>不太好用，破坏性太强了，需要查对应类名</li>
          <li>需要watch脚本运行输出css,(可能工程化没配置完)</li>
          <li>当然也有好处，可以少些样式，通过预设的类名完成样式</li>
          <li>
            一个好用的tailwind 速查表
            <a class="!underline" href="https://tailwind.muzhifan.top" target="_blank">
              https://tailwind.muzhifan.top
            </a>
          </li>
          <li>
            在线调试编辑器
            <a class="!underline" href="https://play.tailwindcss.com/">
              https://play.tailwindcss.com/
            </a>
          </li>
        </ul>
      </div>
    </template>
    <template #content>
      <button :class="tailwindClass">Click me</button>
    </template>
  </m-layout>
</template>
