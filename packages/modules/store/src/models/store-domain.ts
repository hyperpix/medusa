import { model } from "@medusajs/framework/utils";
import Store from "./store"; // Assuming Store model is in the same directory

export enum StoreDomainSslStatus {
  PENDING_VERIFICATION = "pending_verification",
  ACTIVE = "active",
  ERROR = "error",
  DISABLED = "disabled",
}

const StoreDomain = model
  .define("StoreDomain", {
    id: model.id({ prefix: "sdom" }).primaryKey(),
    store_id: model.text(), // Foreign key to Store
    hostname: model.text().unique(), // Must be globally unique
    is_primary: model.boolean().default(false),
    ssl_status: model.enum(StoreDomainSslStatus).default(StoreDomainSslStatus.PENDING_VERIFICATION),
    verified_at: model.dateTime().nullable(),
    metadata: model.json().nullable(),
    store: model.belongsTo(() => Store, {
      foreignKey: "store_id",
      mappedBy: "custom_domains", // Will need to add `custom_domains` to Store model
    }),
  })
  .indexes([
    {
      name: "IDX_store_domain_store_id",
      on: ["store_id"],
    },
    // Unique constraint for (store_id, is_primary) to ensure only one primary domain per store.
    // This is tricky if is_primary can be true for only one.
    // A better approach for one primary is often handled at application logic or a unique partial index.
    // For now, let's rely on application logic to enforce single primary.
    // A partial unique index could be: CREATE UNIQUE INDEX "IDX_store_domain_store_id_is_primary_unique" ON "store_domain" ("store_id") WHERE "is_primary" = TRUE;
    // This is not directly definable in the simple model definition here.
  ]);

export default StoreDomain;
