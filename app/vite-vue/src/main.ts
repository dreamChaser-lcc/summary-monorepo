import { createApp } from 'vue';
import './style.css';
import App from './App.vue';
import { router } from '@/router/index';
import { createPinia } from 'pinia';
import { myPiniaPlugin, localStoragePlugin } from '@/store/piniaPlugin';
import { vuexStore } from '@store/vuexStore';
import MButton from '@components/m-button/index.vue';
import MLayout from '@components/m-layout/index.vue';
// import { vLazy } from './directive';

import './tailwindcss/output.css';

const app = createApp(App);
const pinia = createPinia();

app.use(router);
app.use(pinia);
app.use(vuexStore);

// app.directive('lazy', vLazy);

app.component('m-button', MButton);
app.component('m-layout', MLayout);
pinia.use(myPiniaPlugin);

app.mount('#app');
