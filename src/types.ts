// ---------------------------------------------------------------------------
// Minimum structural types used by plugin helpers.
// These describe only the fields actually consumed by the plugin's functions.
// The host app's generated Order / Product / Variant types satisfy these
// interfaces via TypeScript's structural subtyping.
// ---------------------------------------------------------------------------

import { TypedCollection } from "payload";

export interface OrderWithDigitalDownloads {
  transactions?: (number | { status: string })[] | null;
  items?:
    | {
        product?: number | null | TypedCollection["products"];
        variant?: number | null | TypedCollection["variants"];
        id?: string | null;
      }[]
    | null;
}
