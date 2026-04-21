import { type CollectionConfig } from "payload";
import { isPurchased } from "./access/index.js";
import type { EcommerceDigitalDownloadPluginOptions } from "./index.js";

export const createAssetsCollection = ({
  access,
  override,
}: {
  access: EcommerceDigitalDownloadPluginOptions["access"];
  override?: EcommerceDigitalDownloadPluginOptions["assetsCollectionOverride"];
}): CollectionConfig => {
  return {
    slug: "digital-download-assets",
    labels: { singular: "Digital Asset", plural: "Digital Assets" },
    enableQueryPresets: true,

    access: {
      create: access.isAdmin,
      delete: access.isAdmin,
      read: (args) => access.isAdmin(args) || isPurchased(args),
      update: access.isAdmin,
    },
    admin: {
      useAsTitle: "filename",
      group: "Ecommerce - Digital Downloads",
      description: "Digital files for products and variants.",
      defaultColumns: ["filename", "filesize", "mimeType", "productAssets", "updatedAt"],
    },
    folders: true,
    upload: {
      mimeTypes: ["application/pdf", "image/*", "audio/*", "video/*", "application/zip"],
    },
    fields: [
      {
        name: "prefix",
        type: "text",
        admin: {
          readOnly: true,
        },
      },
      {
        type: "join",
        name: "productAssets",
        collection: "digital-download-product-assets",
        on: "assets",
      },
    ],
    hooks: {
      beforeOperation: [
        async ({ req, operation, args }) => {
          if (operation === "create" || (operation === "update" && req.file)) {
            const folder = await req.payload.find({
              collection: "payload-folders",
              where: {
                name: { equals: "DigitalDownloadAssets" },
              },
              req,
            });
            args.data.folder = folder?.docs[0]?.id;
            args.data.prefix = folder?.docs[0]?.name;
          }
          return args;
        },
      ],
    },
    ...override,
  };
};

export const createProductAssetsCollection = ({
  access,
  override,
}: {
  access: EcommerceDigitalDownloadPluginOptions["access"];
  override?: EcommerceDigitalDownloadPluginOptions["productsAssetsCollectionOverride"];
}): CollectionConfig => ({
  slug: "digital-download-product-assets",
  labels: { singular: "Product Asset", plural: "Product Assets" },
  enableQueryPresets: true,
  access: {
    create: access.isAdmin,
    delete: access.isAdmin,
    read: access.isAdmin,
    update: access.isAdmin,
  },
  admin: {
    group: "Ecommerce - Digital Downloads",
    useAsTitle: "id",
    description:
      "Map products/variants to digital files. Variant mappings override product-level mappings.",
    defaultColumns: ["product", "variant", "fulfillmentType", "assets"],
  },
  fields: [
    {
      name: "product",
      type: "relationship",
      relationTo: "products",
      required: true,
      index: true,
    },
    {
      name: "variant",
      type: "relationship",
      relationTo: "variants",
      index: true,
      filterOptions: ({ siblingData }) => {
        const productID = (siblingData as { product?: number | null })?.product;

        if (!productID) {
          return true;
        }

        return {
          product: { equals: productID },
        };
      },
    },
    {
      name: "fulfillmentType",
      type: "select",
      required: true,
      defaultValue: "automatic",
      options: [
        { label: "Automatically send files", value: "automatic" },
        { label: "Manually send files", value: "manual" },
      ],
    },
    {
      name: "assets",
      type: "upload",
      relationTo: "digital-download-assets",
      hasMany: true,
      required: true,
      index: true,
      admin: {
        description: "Upload a new file or select an existing digital file.",
      },
    },
  ],
  ...override,
});
