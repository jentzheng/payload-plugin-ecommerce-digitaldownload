// ---------------------------------------------------------------------------
// Minimum structural types used by plugin helpers.
// These describe only the fields actually consumed by the plugin's functions.
// The host app's generated Order / Product / Variant types satisfy these
// interfaces via TypeScript's structural subtyping.
// ---------------------------------------------------------------------------

export interface DigitalDownloadAssetMin {
  id: number | string;
  url?: string | null;
  filename?: string | null;
  filesize?: number | null;
}

export interface DigitalDownloadProductAssetMin {
  variant?: number | null | { id: number | string };
  product?: number | null | { id: number | string };
  assets: (number | DigitalDownloadAssetMin)[];
}

export interface ProductWithDigitalDownloads {
  id: number | string;
  title: string;
  digitalDownloadAssets?: {
    docs?: (number | DigitalDownloadProductAssetMin)[] | null;
  } | null;
}

export interface VariantMin {
  id: number | string;
  title: string;
}

export interface OrderWithDigitalDownloads {
  transactions?: (number | { status: string })[] | null;
  items?:
    | {
        product?: number | null | ProductWithDigitalDownloads;
        variant?: number | null | VariantMin;
        id?: string | null;
      }[]
    | null;
}
