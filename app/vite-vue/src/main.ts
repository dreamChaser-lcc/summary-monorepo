import { createApp } from 'vue'
import './style.css'
import App from './App.vue'
import { router } from '@/router/index';
import { createPinia } from 'pinia';
import { myPiniaPlugin, localStoragePlugin } from '@/store/piniaPlugin';
import { vuexStore } from '@store/vuexStore';
import './tailwindcss/output.css';

const app = createApp(App);
const pinia = createPinia()

app.use(router);
app.use(pinia);
app.use(vuexStore);

pinia.use(myPiniaPlugin);

app.mount('#app');
