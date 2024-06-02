import { defineStore } from "pinia";

// 一、选项式定义
export const useUserInfoStore = defineStore("userInfo", {
  state: () => ({
    name: "lcc",
    age: 18,
    description: "等风来，不如追风去",
    loginNum: 0,
  }),
  getters: {
    double: (state) => state.loginNum * 2,
  },
  actions: {
    increment() {
      this.loginNum++;
    },
    async reduce(){
      const result = await new Promise<number>((resolve)=>{
        setTimeout(()=>{
          resolve(this.loginNum-1);
        },100)
      });
      this.loginNum = result;
    }
  },
});

export const useUserInfo1Store = defineStore("userInfo1", {
  state: () => ({
    name: "lcc",
    age: 18,
    description: "等风来，不如追风去",
    loginNum: 0,
  }),
  getters: {
    double: (state) => state.loginNum * 2,
  },
  actions: {
    increment() {
      this.loginNum++;
    },
    async reduce(){
      const result = await new Promise<number>((resolve)=>{
        setTimeout(()=>{
          resolve(this.loginNum-1);
        },100)
      });
      this.loginNum = result;
    }
  },
});
// 二、组合式定义Store
// export const useCounterStore = defineStore("counter", () => {
//   const count = ref(0);
//   const doubleCount = computed(() => count.value * 2);
//   function increment() {
//     count.value++;
//   }
//   return { count, doubleCount, increment };
// });
