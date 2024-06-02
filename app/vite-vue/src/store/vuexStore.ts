// @ts-nocheck 取消ts检测，真的很麻烦配置

import { createStore } from "vuex";

const moduleA = {
    namespaced: true,
    name: 'moduleA',
    state:{
        name:'lcc',
        loginNum: 0,
    },
    getters:{
        getName(){
            // @ts-ignore
            return "my name is" + this.$store.state.name;
        }
    },
    actions:{
        async reduce(context){
            const { commit } = context;
            // console.log("🚀 ~ increment ~ context:", context)
            const result = await new Promise<number>((resolve)=>{
                setTimeout(()=>{
                    resolve(2);
                },100)
            });
            // console.log('logined',this.state.loginNum)
            commit('reduceMutations', result);
        }
    },
    mutations:{
        increment(state,payload){
            state.loginNum = state.loginNum + payload;
        },
        reduceMutations(state, payload){
            // console.log("🚀 ~ reduceMutations ~ state, payload:", state, payload)
            state.loginNum = state.loginNum - payload;
        }
    }
}

export const vuexStore = createStore({
    modules: {
      moduleA: moduleA,
    }
  })