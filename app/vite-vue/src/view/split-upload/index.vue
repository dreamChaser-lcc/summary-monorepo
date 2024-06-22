<!--
 * @Author: lcc
 * @Date: 2024-06-10 19:38:45
 * @LastEditTime: 2024-06-22 23:35:08
 * @LastEditors: lcc
 * @Description: 分片上传文件，暂时没有做断点续传
-->

<script lang="ts" setup>
import MLayout from '@components/m-layout/index.vue';
import { onMounted, ref } from 'vue';
// import limit from './components/limit-sample';
// console.log(limit);
import pLimit from 'p-limit';

const imgFile = ref<File>();
const chunkListRef = ref<any[]>([]);
const resDataRef = ref<any>({});
const uploadInputRef = ref<HTMLInputElement>();
onMounted(() => {});

// worker开启线程
const worker = new Worker(new URL('./components/worker-md5/worker.js', import.meta.url));
worker.onmessage = ({ data: chunkList }) => {
  chunkListRef.value = chunkList;
};

const onFileChange = (event: Event) => {
  console.log('🚀 ~ onFileChange ~ event:', event);
  const target = event.target as any;
  const file = target.files[0];
  imgFile.value = file;
  renderImgFile('#upload-img-id', file);
  worker.postMessage({ file: file, chunkSize: 100 * 1024 });
  resDataRef.value = {};
};

/**执行web worker中的分片任务 */
const handleSplitFile = () => {
  if (!imgFile.value) {
    return window.alert('请先上传文件');
  }
  worker.postMessage({ file: imgFile.value });
};

const renderImgFile = (renderId, file) => {
  // 创建一个新的 FileReader 对象
  const reader = new FileReader();
  // 读取合并后的 Blob 对象
  reader.onload = function (event: any) {
    // const img = new Image();
    // img.setAttribute('style', 'width:200px;height:200px;object-fit:contain');
    // img.onload = function () {
    //   // 图片加载完成后，可以将其显示在页面上或进行其他操作
    //   document.body.appendChild(img);
    // };
    // // 将合并后的 Blob 对象转换为 Data URL
    // const dataURL = event.target.result;
    // // 设置 Image 对象的 src 为合并后的图片 Data URL
    // img.src = dataURL;
    // document.body.appendChild(img);
    document.querySelector(renderId || '#merge-img-id')?.setAttribute('src', event.target.result);
  };
  // 读取合并后的 Blob 对象
  reader.readAsDataURL(file);
};

const clearInput = () => {
  if (!uploadInputRef.value) return;
  uploadInputRef.value.value = '';
  imgFile.value = undefined;
};

// 合并分片 验证是否切割正确
const mergeFile = () => {
  const blobList = chunkListRef.value.map((item) => item.chunk);
  if (!blobList.length) {
    return window.alert('请先上传文件');
  }
  // 创建一个新的 Blob 对象用于存储合并后的文件内容
  const mergedBlob = new Blob(blobList, { type: 'image/jpg' });
  renderImgFile('#merge-img-id', mergedBlob);
};

/**分片上传请求 */
const fetchUploadSlice = () => {
  const chunks = chunkListRef.value;
  const promiseFunc = async (item) => {
    const formData = new FormData();
    formData.append('fileSlice', item.chunk);
    formData.append('md5', item.md5);
    formData.append('fileName', item.fileName);
    formData.append('suffix', item.suffix);
    formData.append('chunkIndex', String(item.chunkIndex));
    formData.append('total', String(chunks.length));

    await fetch('/api/utils/uploadFileSlice', {
      method: 'POST',
      // body: JSON.stringify({ a: 1 }),
      body: formData, // 将 FormData 对象作为请求体
    }).then(async (response) => {
      const res = await response.json();
      console.log('🚀 ~ promiseFunc ~ res:', res);
      resDataRef.value = res;
    });
  };
  const limit = pLimit(1);
  const promiseList = chunks.map((item) => {
    return limit(() => promiseFunc(item));
  });
  Promise.all(promiseList);
};
</script>
<template>
  <m-layout>
    <template #summary>
      <ul>
        <li>web worker 多线程</li>
      </ul>
    </template>
    <template #content>
      <input
        type="file"
        ref="uploadInputRef"
        @change="onFileChange"
        id="fileElem"
        multiple
        accept="image/*"
        class="visually-hidden"
      />
      <label for="fileElem">
        <m-button style="pointer-events: none; margin-right: 12px">选择文件(图片)</m-button>
      </label>
      <m-button @click="clearInput">删除文件</m-button>
      <m-button @click="fetchUploadSlice">上传分片请求</m-button>
      <m-button @click="handleSplitFile">文件拆分(图片)</m-button>
      <m-button @click="mergeFile">文件合并(图片)</m-button>
      <div v-show="imgFile">
        <div>当前上传文件: {{ imgFile?.name }}</div>
        <div v-show="resDataRef?.result?.process">
          上传进度：{{ `${resDataRef?.result?.process} / ${resDataRef?.result?.total}` }}
        </div>
        <div v-show="resDataRef?.result?.url">最终资源路径：{{ `${resDataRef?.result?.url}` }}</div>
      </div>
      <div class="file-area">
        <div class="upload-img-area">
          上传的图片:
          <img id="upload-img-id" src="" alt="上传后展示图片占位区" />
        </div>
        <div class="merge-img-area">
          合并的图片:
          <img id="merge-img-id" src="" alt="合并后展示图片占位区" />
        </div>
      </div>
    </template>
  </m-layout>
</template>
<style lang="scss" scoped>
.visually-hidden {
  position: absolute !important;
  height: 1px;
  width: 1px;
  overflow: hidden;
  clip: rect(1px, 1px, 1px, 1px);

  &:is(:focus, :focus-within) + label {
    outline: thin dotted;
  }
}
.file-area {
  margin-top: 24px;
  display: flex;

  & > div + div {
    margin-left: 12px;
  }

  .merge-img-area {
    display: inline-block;
    height: 250px;
    border: 1px solid #c3c3c3;
    border-radius: 6px;
    padding: 12px;
    // #merge-img-id[src=''] {
    //   display: none;
    // }
    #merge-img-id {
      margin-top: 12px;
      display: inline;
      max-width: 200px;
      max-height: 200px;
      object-fit: contain;
    }
  }

  .upload-img-area {
    display: inline-block;
    height: 250px;
    border: 1px solid #c3c3c3;
    border-radius: 6px;
    padding: 12px;
    // #merge-img-id[src=''] {
    //   display: none;
    // }
    #upload-img-id {
      margin-top: 12px;
      display: inline;
      max-width: 200px;
      max-height: 200px;
      object-fit: contain;
    }
  }
}
</style>
