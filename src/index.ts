import type {
  Access,
  CollectionConfig,
  CollectionSlug,
  CollectionAfterChangeHook,
  Config,
  Field,
  FieldAccess,
} from "payload";

import { definePlugin } from "payload";
import { createAssetsCollection, createProductAssetsCollection } from "./collections.js";

declare module "payload" {
  interface RegisteredPlugins {
    "plugin-ecommerce-digital-download": EcommerceDigitalDownloadPluginOptions;
  }
}

export type EcommerceDigitalDownloadPluginOptions = {
  enabled: boolean;
  // todo: these options should be inherited from ecommerce plugin
  access: {
    isAdmin: Access;
    isCustomer?: FieldAccess;
    isDocumentOwner: Access;
  };
  // todo: these slugs should be inherited from ecommerce plugin
  slugs: {
    products: CollectionSlug;
    orders: CollectionSlug;
    customer: CollectionSlug;
  };
  assetsCollectionOverride?: Partial<CollectionConfig>;
  productsAssetsCollectionOverride?: Partial<CollectionConfig>;
  handleFulfillment?: (doc: any) => void;
};

export type FulfillmentType = "automatic" | "manual";

export const ecommerceDigitalDownloadPlugin = definePlugin<EcommerceDigitalDownloadPluginOptions>({
  slug: "plugin-ecommerce-digital-download",
  order: 10,
  plugin({
    config,
    plugins,
    enabled,
    slugs,
    access: accessConfig,
    assetsCollectionOverride,
    productsAssetsCollectionOverride,
    handleFulfillment,
  }) {
    const ecommerceDigitalDownload = plugins["plugin-ecommerce-digital-download"];
    const ecommerce = plugins["plugin-ecommerce"]; // waiting for plugin-ecommerce to be registered

    // todo: access control should be inherited from ecommerce plugin
    // todo: slugs should be inherited from ecommerce plugin

    if (!enabled) {
      return config;
    }

    // if (!ecommerce) {
    //   throw new Error("Ecommerce plugin must be registered before ecommerceDigitalDownloadPlugin");
    // }

    const productCollection = config.collections?.find((c) => c.slug === slugs.products);
    const transactionCollection = config.collections?.find((c) => c.slug === "transactions");

    if (!productCollection || !transactionCollection) {
      throw new Error("Products collection not found in config.collections");
    }

    return {
      ...config,
      async onInit(payload) {
        if (config.onInit) {
          await config.onInit(payload);
        }

        const hasFolder = await payload.db.findOne({
          collection: "payload-folders",
          where: {
            name: { equals: "DigitalDownloadAssets" },
          },
        });

        if (!hasFolder) {
          await payload.create({
            collection: "payload-folders",
            data: {
              name: "DigitalDownloadAssets",
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

          if (collection.slug === "transactions") {
            const fullFillmentHook: CollectionAfterChangeHook = async (args) => {
              const { doc, req, operation } = args;
              if (operation === "update" && doc.status === "succeeded") {
                handleFulfillment && handleFulfillment(doc);
              }
            };

            return {
              ...collection,
              hooks: {
                ...collection.hooks,
                afterChange: [...(collection.hooks?.afterChange || []), fullFillmentHook],
              },
            };
          }

          return collection;
        }) || []),
        createAssetsCollection({ access: accessConfig, override: assetsCollectionOverride }),
        createProductAssetsCollection({ access: accessConfig }),
      ],
    };
  },
});
