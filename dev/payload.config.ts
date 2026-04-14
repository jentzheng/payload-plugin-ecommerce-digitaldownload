import { sqliteAdapter } from "@payloadcms/db-sqlite";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { buildConfig, CollectionSlug } from "payload";
import { ecommercePlugin } from "@payloadcms/plugin-ecommerce";
import { ecommerceDigitalDownloadPlugin } from "payload-plugin-ecommerce-digitaldownload";

const filename = fileURLToPath(import.meta.url);
const dirname = path.dirname(filename);

if (!process.env.ROOT_DIR) {
  process.env.ROOT_DIR = dirname;
}

export default buildConfig({
  secret: process.env.PAYLOAD_SECRET || "",
  admin: {
    importMap: {
      baseDir: path.resolve(dirname),
    },
  },
  typescript: {
    outputFile: path.resolve(dirname, "payload-types.ts"),
  },
  db: sqliteAdapter({
    client: {
      url: process.env.DATABASE_URL || "",
    },
  }),
  plugins: [
    ecommercePlugin({
      access: {
        isAdmin: () => {
          return true;
        },
        adminOnlyFieldAccess: () => {
          return true;
        },
        adminOrPublishedStatus: () => {
          return true;
        },
        isDocumentOwner: () => {
          return true;
        },
      },
      customers: {
        slug: "users",
      },
      products: true,
      carts: true,
      orders: true,
      transactions: true,
      addresses: true,
      inventory: true,
      payments: {
        paymentMethods: [],
      },
    }),
    ecommerceDigitalDownloadPlugin({
      enabled: true,
      access: {
        isAdmin: () => {
          return true;
        },
        isCustomer: () => {
          return true;
        },
        isDocumentOwner: () => {
          return true;
        },
      },
      folderName: "DigitalDownloadAssets",
      slugs: {
        products: "products",
        orders: "orders",
        customer: "users",
      },
    }),
  ],
});
