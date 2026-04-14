import type { Access, CollectionSlug, Config, Field, FieldAccess } from "payload";

import { createAssetsCollection, createProductAssetsCollection } from "./collections.js";

export interface PluginTypes {
  /**
   * Enable or disable plugin
   */
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
}

export type FulfillmentType = "automatic" | "manual";

export const ecommerceDigitalDownloadPlugin =
  (pluginConfig: PluginTypes) =>
  (incomingConfig: Config): Config => {
    if (pluginConfig.enabled === false) {
      return incomingConfig;
    }

    if (!incomingConfig.collections) {
      incomingConfig.collections = [];
    }

    const accessConfig = pluginConfig.access;

    const productCollection = incomingConfig.collections?.find(
      (c) => c.slug === pluginConfig.slugs.products,
    );

    if (!productCollection) {
      throw new Error("Products collection not found in config.collections");
    }

    return {
      ...incomingConfig,
      async onInit(payload) {
        if (incomingConfig.onInit) await incomingConfig.onInit(payload);

        const hasFolder = await payload.db.findOne({
          collection: "payload-folders",
          where: {
            name: { equals: pluginConfig.folderName },
          },
        });

        if (!hasFolder) {
          await payload.create({
            collection: "payload-folders",
            data: {
              name: pluginConfig.folderName,
              folderType: ["digital-download-assets"],
            },
          });
        }
      },
      collections: [
        ...(incomingConfig.collections?.map((collection) => {
          if (collection.slug === pluginConfig.slugs.products) {
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
  };
