import { model } from "@medusajs/framework/utils";
import Store from "../../../../modules/store/src/models/store"; // Adjust path
import User from "./user"; // For many-to-many through UserRole

const Role = model
  .define("Role", {
    id: model.id({ prefix: "role" }).primaryKey(),
    name: model.text(), // e.g., "Store Owner", "Product Manager"
    store_id: model.text().nullable(), // Null for system roles, set for store-specific custom roles
    permissions: model.json().nullable(), // Array of permission strings, e.g., ["manage_products", "view_orders"]
    description: model.text().nullable(),
    metadata: model.json().nullable(),
    // If store_id is not null, this defines the store it belongs to (for custom roles)
    store: model.belongsTo(() => Store, {
        foreignKey: "store_id",
        mappedBy: "custom_roles", // Need to add `custom_roles` to Store model if using this
    }).nullable(),
    // Users relationship defined through UserRole
    // users: model.manyToMany(() => User, { pivotTable: "user_role" }) // This creates the join table directly
  })
  .indexes([
    {
      name: "IDX_role_store_id_name_unique", // Role name unique per store, or globally if store_id is null
      on: ["store_id", "name"], // For databases where NULLs are treated as equal in unique constraints, or use partial indexes
      unique: true,
      where: "deleted_at IS NULL" // Consider how to handle uniqueness for system roles (store_id IS NULL)
                                 // vs custom roles (store_id IS NOT NULL).
                                 // Maybe: UNIQUE (name) WHERE store_id IS NULL
                                 // AND UNIQUE (name, store_id) WHERE store_id IS NOT NULL
    },
  ]);

export default Role;
