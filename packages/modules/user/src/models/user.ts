import { model } from "@medusajs/framework/utils"
import { Store } from "@medusajs/modules-sdk"

export const User = model
  .define("user", {
    id: model.id({ prefix: "user" }).primaryKey(),
    store_id: model.text().nullable(), // Nullable if we want super-admins in the same table
    first_name: model.text().searchable().nullable(),
    last_name: model.text().searchable().nullable(),
    email: model.text().searchable(),
    avatar_url: model.text().nullable(),
    metadata: model.json().nullable(),
    store: model.belongsTo(() => Store, {
      foreignKey: "store_id",
      mappedBy: "users", // Assuming 'users' (merchant admins) will be on Store if bidirectional
    }).nullable(), // Matches store_id being nullable
  })
  .indexes([
    {
      name: "IDX_user_store_id",
      on: ["store_id"],
      // This index should not have `where: "deleted_at IS NULL"` if store_id can be null,
      // or it needs `AND store_id IS NOT NULL` if we only care about actual store users.
      // For now, simple index on store_id.
    },
    {
      name: "IDX_user_email_store_id_unique", // Email unique per store for merchant admins
      unique: true,
      on: ["email", "store_id"],
      // If store_id is NULL (super-admin), email must be globally unique among other super-admins.
      // If store_id is NOT NULL (merchant admin), email must be unique for that store.
      // This single constraint handles both if NULLs are considered distinct in unique constraints by the DB,
      // or PostgreSQL's `NULLS NOT DISTINCT` can be used.
      // A common approach is:
      // 1. Unique constraint on (email, store_id) where store_id IS NOT NULL
      // 2. Unique constraint on (email) where store_id IS NULL
      // For simplicity with MikroORM model defs, this might need service layer validation or a DB trigger.
      // The current definition makes (email, null) combinations need to be unique.
      where: "deleted_at IS NULL",
    },
  ])
