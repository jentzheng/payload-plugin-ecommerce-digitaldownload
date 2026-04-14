import type {
  DigitalDownloadAssetMin,
  DigitalDownloadProductAssetMin,
  OrderWithDigitalDownloads,
} from "./types.js";

export function getDigitalDownloadFromOrder(order: OrderWithDigitalDownloads) {
  return order.items?.reduce<
    {
      title: string;
      assetId: number | string;
      filename: string;
      filesize: number;
      url: string;
    }[]
  >((acc, item) => {
    if (typeof item.product !== "object" || item.product === null) {
      return acc;
    }

    const product = item.product;
    const variant =
      typeof item.variant === "object" && item.variant !== null ? item.variant : undefined;
    const title = variant?.title || product.title;

    const productAssets = product.digitalDownloadAssets?.docs?.filter(
      (doc) => typeof doc === "object" && doc !== null,
    );

    productAssets?.forEach((productAsset) => {
      const assetVariant =
        typeof productAsset.variant === "object" && productAsset.variant !== null
          ? productAsset.variant
          : undefined;

      const assetProduct =
        typeof productAsset.product === "object" && productAsset.product !== null
          ? productAsset.product
          : undefined;

      const matchesCurrentItem = variant
        ? assetVariant?.id === variant.id
        : !assetVariant && assetProduct?.id === product.id;

      if (!matchesCurrentItem) {
        return;
      }

      productAsset.assets.forEach((asset) => {
        if (typeof asset !== "object" || asset === null || !asset.url) {
          return;
        }

        acc.push({
          assetId: asset.id,
          title,
          filename: asset.filename || `Asset ${asset.id}`,
          filesize: asset.filesize ?? 0,
          url: asset.url,
        });
      });
    });

    return acc;
  }, []);
}
