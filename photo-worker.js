importScripts('photo-codec.js');
self.onmessage = async ({ data }) => {
  if (typeof OffscreenCanvas !== 'function' || typeof createImageBitmap !== 'function') { self.postMessage({ fallback: true }); return; }
  try { self.postMessage({ photo: await PhotoCodec.normalize(data) }); }
  catch (error) { self.postMessage({ error: error.message }); }
};
