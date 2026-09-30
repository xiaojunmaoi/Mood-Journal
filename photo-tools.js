(() => {
  'use strict';
  const aborted = () => new DOMException('已停止添加照片', 'AbortError');
  function processor(signal, useWorker) {
    let worker;
    try { if (useWorker && typeof Worker === 'function') worker = new Worker('photo-worker.js'); } catch { /* Older WebViews use the yielding page fallback. */ }
    const dispose = () => { worker?.terminate(); worker = null; };
    async function run(file) {
      if (signal?.aborted) throw aborted();
      let photo;
      if (worker) {
        try {
          photo = await new Promise((resolve, reject) => {
            const stop = () => { cleanup(); dispose(); reject(aborted()); };
            const timer = setTimeout(() => { cleanup(); dispose(); reject(new Error('照片处理超时，请重试这张照片。')); }, 60000);
            const cleanup = () => { clearTimeout(timer); signal?.removeEventListener('abort', stop); };
            signal?.addEventListener('abort', stop, { once: true });
            worker.onmessage = ({ data }) => { cleanup(); if (data.fallback) { dispose(); resolve(null); } else if (data.error) reject(new Error(data.error)); else resolve(data.photo); };
            worker.onerror = () => { cleanup(); dispose(); resolve(null); };
            try { worker.postMessage(file); } catch { cleanup(); dispose(); resolve(null); }
          });
        } catch (error) {
          if (error.name === 'AbortError' || !/无法解码/.test(error.message)) throw error;
          // Safari can sometimes decode a photo via <img> that its worker cannot decode.
        }
      }
      if (!photo) { await new Promise(resolve => setTimeout(resolve, 0)); if (signal?.aborted) throw aborted(); photo = await PhotoCodec.normalize(file); }
      if (signal?.aborted) throw aborted();
      return photo;
    }
    return { run, dispose };
  }
  async function processMany(files, { signal, onProgress, useWorker = true } = {}) {
    const results = new Array(files.length), failures = []; let cursor = 0, completed = 0;
    const concurrency = Math.min(files.length, navigator.deviceMemory && navigator.deviceMemory <= 4 ? 1 : 2);
    async function lane() {
      const worker = processor(signal, useWorker);
      try {
        while (cursor < files.length && !signal?.aborted) {
          const index = cursor++;
          try { results[index] = await worker.run(files[index]); }
          catch (error) { if (error.name === 'AbortError') break; failures.push({ index, message: error.message }); }
          completed++; onProgress?.({ index, photo: results[index], completed, total: files.length, results: results.slice() });
        }
      } finally { worker.dispose(); }
    }
    await Promise.all(Array.from({ length: concurrency }, lane));
    return { photos: results.filter(Boolean), failures: failures.sort((a, b) => a.index - b.index), cancelled: Boolean(signal?.aborted) };
  }
  async function normalize(file, options) {
    const result = await processMany([file], options);
    if (result.cancelled) throw aborted();
    if (result.failures.length) throw new Error(result.failures[0].message);
    return result.photos[0];
  }
  window.PhotoTools = { processMany, normalize };
})();
