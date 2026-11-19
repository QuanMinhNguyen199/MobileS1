// Loaded only when exporting SVG; PNG downloads do not load SVGO.
let svgo;
export async function optimizeSvg(source) {
  try {
    const { optimize } = await (svgo ||= import('./svgo.browser.js').catch(error => {
      svgo = undefined;
      throw error;
    }));
    const { data } = optimize(source, {
      multipass: true,
      floatPrecision: 5,
      plugins: [{
        name: 'preset-default',
        params: { overrides: {
          // Sprite symbols are referenced by consumers outside this file.
          cleanupIds: false,
          removeUselessDefs: false,
          removeHiddenElems: false,
          removeDesc: false,
        } },
      }],
    });
    const encoder = new TextEncoder();
    return encoder.encode(data).length < encoder.encode(source).length ? data : source;
  } catch (error) {
    console.warn('Không tối ưu được SVG; tải bản gốc.', error);
    return source;
  }
}
