import type { LayoutBox } from './types/layout'

/** 画像URLをfetchしてBase64 data URIに変換するキャッシュ */
const imageCache = new Map<string, string>()

/** BlobをBase64 data URIに変換する */
function blobToDataUri(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result as string)
    reader.onerror = reject
    reader.readAsDataURL(blob)
  })
}

/** URLの画像をBase64 data URIとして返す */
export async function fetchAsDataUri(url: string): Promise<string> {
  const cached = imageCache.get(url)
  if (cached) return cached

  try {
    const response = await fetch(url)
    if (!response.ok) return url
    const blob = await response.blob()
    const dataUri = await blobToDataUri(blob)
    imageCache.set(url, dataUri)
    return dataUri
  } catch {
    return url
  }
}

/** LayoutBox内の画像srcを再帰的にdata URIに変換する */
export async function resolveImages(box: LayoutBox): Promise<void> {
  if (box.type === 'image' && box.src && !box.src.startsWith('data:')) {
    box.src = await fetchAsDataUri(box.src)
  }
  for (const child of box.children) {
    await resolveImages(child)
  }
}

/** 画像キャッシュをクリアする */
export function clearImageCache(): void {
  imageCache.clear()
}
