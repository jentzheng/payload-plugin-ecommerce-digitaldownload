import type { Access, CollectionSlug, Config, Field, FieldAccess } from "payload";
import { definePlugin } from "payload";

import { createAssetsCollection, createProductAssetsCollection } from "./collections.js";

declare module "payload" {
  interface RegisteredPlugins {
    "plugin-ecommerce-digital-download": EcommerceDigitalDownloadPluginOptions;
  }
}

export type EcommerceDigitalDownloadPluginOptions = {
  enabled: boolean;
  access: {
    isAdmin: Access;
    isCustomer?: FieldAccess;
    isDocumentOwner: Access;
  };
  folderName: string;
  slugs: {
    products: CollectionSlug;
    orders: CollectionSlug;
    customer: CollectionSlug;
  };
  // collections: string[];
  // generateTitle?: (doc: Record<string, unknown>) => string;
};

export type FulfillmentType = "automatic" | "manual";

export const ecommerceDigitalDownloadPlugin = definePlugin<EcommerceDigitalDownloadPluginOptions>({
  slug: "plugin-ecommerce-digital-download",
  order: 10,
  plugin({ config, plugins, enabled, slugs, folderName, access: accessConfig }) {
    const ecommerceDigitalDownload = plugins["plugin-ecommerce-digital-download"];
    const ecommerce = plugins["plugin-ecommerce"]; // waiting for plugin-ecommerce to be registered

    if (!enabled) {
      return config;
    }

    const productCollection = config.collections?.find((c) => c.slug === slugs.products);

    if (!productCollection) {
      throw new Error("Products collection not found in config.collections");
    }

    return {
      ...config,
      async onInit(payload) {
        if (config.onInit) await config.onInit(payload);

        const hasFolder = await payload.db.findOne({
          collection: "payload-folders",
          where: {
            name: { equals: folderName },
          },
        });

        if (!hasFolder) {
          await payload.create({
            collection: "payload-folders",
            data: {
              name: folderName,
              folderType: ["digital-download-assets"],
            },
          });
        }
      },
      collections: [
        ...(config.collections?.map((collection) => {
          if (collection.slug === slugs.products) {
            const tabsField = collection.fields?.find((f) => f.type === "tabs");

            const digitalDownloadFields: Field[] = [
              {
                type: "join",
                name: "digitalDownloadAssets",
                collection: "digital-download-product-assets",
                on: "product",
                maxDepth: 3,
              },
            ];

            if (tabsField) {
              tabsField.tabs.push({
                label: "Digital Download",
                fields: digitalDownloadFields,
              });
            } else {
              collection.fields = [...collection.fields, ...digitalDownloadFields];
            }

            return collection;
          }
          return collection;
        }) || []),
        createAssetsCollection({ access: accessConfig }),
        createProductAssetsCollection({ access: accessConfig }),
      ],
    };
  },
});
