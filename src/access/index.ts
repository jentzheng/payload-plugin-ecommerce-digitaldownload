import type { Access } from "payload";
import type { OrderWithDigitalDownloads } from "../types.js";

export const isPurchased: Access = async ({ req }) => {
  const orderToken = req.searchParams.get("orderToken");
  const assetId = req.searchParams.get("assetId");

  if (!orderToken || !assetId) return false;

  const order = await req.payload
    .find({
      collection: "orders",
      where: {
        accessToken: {
          equals: orderToken,
        },
      },
      depth: 3,
      select: { items: true, transactions: true },
      populate: {
        products: { digitalDownloadAssets: true },
      },
      req,
    })
    .then((result) => result.docs[0] as OrderWithDigitalDownloads | undefined);

  if (!order) return false;

  const hasSuccessfulTransaction =
    order.transactions?.some((transaction) => {
      if (typeof transaction === "object") {
        return transaction.status === "succeeded";
      }
      return false;
    }) ?? false;

  const hasAsset =
    order.items?.some((item) => {
      const product =
        (typeof item === "object" && typeof item.product === "object" && item.product) || null;
      const productAssets = product?.digitalDownloadAssets?.docs;
      return productAssets?.some((productAsset) => {
        return (
          typeof productAsset === "object" &&
          productAsset.assets.some((asset) => {
            return typeof asset === "object" && asset.id.toString() === assetId;
          })
        );
      });
    }) ?? false;

  return hasAsset && hasSuccessfulTransaction;
};
