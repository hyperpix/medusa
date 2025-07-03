import { model } from "@medusajs/framework/utils"
import StoreCurrency from "./currency"
import StoreDomain from "./store-domain" // Import the new StoreDomain model
import { StoreSubscription } from "../../../../modules/subscription/src/models/store-subscription"; // Adjust path as needed
import Role from "../../../../modules/user/src/models/role"; // Adjust path to Role model

const Store = model
  .define("Store", {
    id: model.id({ prefix: "store" }).primaryKey(),
    name: model.text().default("Medusa Store").searchable(),
    default_sales_channel_id: model.text().nullable(),
    default_region_id: model.text().nullable(),
    default_location_id: model.text().nullable(),
    metadata: model.json().nullable(),
    supported_currencies: model.hasMany(() => StoreCurrency, {
      mappedBy: "store",
    }),
    // New field for theme selection
    active_theme_id: model.text().nullable(),
    custom_domains: model.hasMany(() => StoreDomain, {
      mappedBy: "store",
    }),
    subscription: model.hasOne(() => StoreSubscription, { // Add one-to-one/one-to-many (current sub)
      mappedBy: "store", // Matches store property in StoreSubscription
      foreignKey: "id",
      principalKey: "store_id"
    }).nullable(),
    // If stores can define their own custom roles
    custom_roles: model.hasMany(() => Role, {
      mappedBy: "store", // This assumes Role.store_id links back to Store.id
    }).nullable(), // Nullable as a store might not have custom roles
  })
  .cascades({
    delete: ["supported_currencies", "custom_domains", "subscription", "custom_roles"],
  })

export default Store
