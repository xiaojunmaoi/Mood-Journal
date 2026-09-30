/* Shared by the page and the image worker; photos never leave this device. */
((scope) => {
  'use strict';
  async function metadataFree(file) {
    const bytes = new Uint8Array(await file.arrayBuffer()), view = new DataView(bytes.buffer);
    const ascii = (start, length) => String.fromCharCode(...bytes.subarray(start, start + length));
    if (file.type === 'image/jpeg') {
      if (bytes[0] !== 255 || bytes[1] !== 216) return false;
      for (let i = 2; i + 3 < bytes.length;) {
        if (bytes[i] !== 255) return false;
        const marker = bytes[i + 1];
        if (marker === 218 || marker === 217) return true;
        if (marker === 254 || (marker >= 225 && marker <= 239 && marker !== 226)) return false;
        const size = view.getUint16(i + 2);
        if (size < 2 || i + size + 2 > bytes.length) return false;
        if (marker === 226 && ascii(i + 4, 11) !== 'ICC_PROFILE') return false;
        i += size + 2;
      }
    } else if (file.type === 'image/png') {
      const safe = new Set(['IHDR', 'PLTE', 'IDAT', 'IEND', 'tRNS', 'gAMA', 'cHRM', 'sRGB', 'iCCP', 'pHYs', 'sBIT', 'bKGD']);
      for (let i = 8; i + 12 <= bytes.length;) {
        const size = view.getUint32(i), type = ascii(i + 4, 4);
        if (!safe.has(type) || i + size + 12 > bytes.length) return false;
        if (type === 'IEND') return true;
        i += size + 12;
      }
    } else if (file.type === 'image/webp') {
      const safe = new Set(['VP8 ', 'VP8L', 'VP8X', 'ALPH', 'ICCP']);
      for (let i = 12; i + 8 <= bytes.length;) {
        const type = ascii(i, 4), size = view.getUint32(i + 4, true);
        if (!safe.has(type) || i + size + 8 > bytes.length) return false;
        i += 8 + size + (size % 2);
        if (i === bytes.length) return true;
      }
    }
    return false;
  }
  async function normalize(file) {
    const name = String(file.name || '照片').slice(0, 200);
    if (file.size > 20 * 1024 * 1024) throw new Error(`${name} 超过 20 MB，请选择较小的照片。`);
    if (!/^image\/(jpeg|png|webp|heic|heif)$/.test(file.type)) throw new Error(`${name} 暂不支持，请选择 JPG、PNG 或 WebP 照片。`);
    let bitmap, url;
    try {
      try { bitmap = await createImageBitmap(file, { imageOrientation: 'from-image' }); }
      catch {
        if (typeof document === 'undefined') throw new Error('decode');
        url = URL.createObjectURL(file); bitmap = new Image(); bitmap.src = url;
        await bitmap.decode();
      }
    } catch { if (url) URL.revokeObjectURL(url); throw new Error(`${name} 无法解码，请转成 JPG、PNG 或 WebP 后重试。`); }
    let canvas;
    try {
      const width = bitmap.naturalWidth || bitmap.width, height = bitmap.naturalHeight || bitmap.height;
      if (!width || !height || width * height > 50000000) throw new Error(`${name} 尺寸过大，请先缩小后再添加。`);
      const meta = { id: crypto.randomUUID(), width, height, name };
      // Reuse only small metadata-free images. Camera EXIF (including orientation/GPS) is baked out by re-encoding.
      if (Math.max(width, height) <= 1800 && file.size <= 1500000 && /^image\/(jpeg|png|webp)$/.test(file.type) && await metadataFree(file)) return { ...meta, blob: file.slice(0, file.size, file.type) };
      const ratio = Math.min(1, 1800 / Math.max(width, height));
      meta.width = Math.max(1, Math.round(width * ratio)); meta.height = Math.max(1, Math.round(height * ratio));
      canvas = typeof OffscreenCanvas === 'function' ? new OffscreenCanvas(meta.width, meta.height) : Object.assign(document.createElement('canvas'), { width: meta.width, height: meta.height });
      const ctx = canvas.getContext('2d');
      if (!ctx) throw new Error('照片处理暂不可用，请重试。');
      ctx.fillStyle = '#fff'; ctx.fillRect(0, 0, meta.width, meta.height); ctx.drawImage(bitmap, 0, 0, meta.width, meta.height);
      const blob = canvas.convertToBlob ? await canvas.convertToBlob({ type: 'image/jpeg', quality: .82 }) : await new Promise(resolve => canvas.toBlob(resolve, 'image/jpeg', .82));
      if (!blob) throw new Error('照片处理失败，请重试。');
      return { ...meta, blob };
    } finally { bitmap.close?.(); if (url) URL.revokeObjectURL(url); if (canvas) { canvas.width = 1; canvas.height = 1; } }
  }
  scope.PhotoCodec = { normalize };
})(globalThis);
