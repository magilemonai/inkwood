/**
 * Serialise an SVG element to a PNG and trigger a browser download.
 *
 * Rendering path: clone → XMLSerializer → Blob(image/svg+xml) →
 * HTMLImageElement → <canvas> → Blob(image/png) → <a download>.
 *
 * We render at 2× the SVG's natural size so the PNG is crisp on
 * high-DPI displays and for print / social.
 */

const SCALE = 2;

function inferSize(svg: SVGSVGElement): { w: number; h: number } {
  const wAttr = Number(svg.getAttribute("width"));
  const hAttr = Number(svg.getAttribute("height"));
  if (Number.isFinite(wAttr) && Number.isFinite(hAttr) && wAttr > 0 && hAttr > 0) {
    return { w: wAttr, h: hAttr };
  }
  const vb = svg.viewBox?.baseVal;
  if (vb && vb.width > 0 && vb.height > 0) {
    return { w: vb.width, h: vb.height };
  }
  const rect = svg.getBoundingClientRect();
  return { w: rect.width || 1200, h: rect.height || 800 };
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
}

function canvasToBlob(canvas: HTMLCanvasElement): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (blob) resolve(blob);
      else reject(new Error("Canvas toBlob returned null"));
    }, "image/png");
  });
}

function triggerDownload(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.rel = "noopener";
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  // Give the browser a tick to start the download before revoking.
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export async function downloadSouvenir(svg: SVGSVGElement, filename: string) {
  // Clone so we can safely annotate namespaces without mutating the DOM.
  const clone = svg.cloneNode(true) as SVGSVGElement;
  if (!clone.getAttribute("xmlns")) {
    clone.setAttribute("xmlns", "http://www.w3.org/2000/svg");
  }
  if (!clone.getAttribute("xmlns:xlink")) {
    clone.setAttribute("xmlns:xlink", "http://www.w3.org/1999/xlink");
  }

  const { w, h } = inferSize(clone);
  const svgString = new XMLSerializer().serializeToString(clone);
  const svgBlob = new Blob([svgString], { type: "image/svg+xml;charset=utf-8" });
  const svgUrl = URL.createObjectURL(svgBlob);

  try {
    const img = await loadImage(svgUrl);

    const canvas = document.createElement("canvas");
    canvas.width = w * SCALE;
    canvas.height = h * SCALE;
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("2D canvas context unavailable");
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

    const pngBlob = await canvasToBlob(canvas);
    triggerDownload(pngBlob, filename);
  } finally {
    URL.revokeObjectURL(svgUrl);
  }
}
