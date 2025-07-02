import { model } from "@medusajs/framework/utils"
import { Store } from "@medusajs/modules-sdk"

const ApiKey = model
  .define("ApiKey", {
    id: model.id({ prefix: "apk" }).primaryKey(),
    store_id: model.text(),
    token: model.text(),
    salt: model.text(),
    redacted: model.text().searchable(),
    title: model.text().searchable(),
    type: model.enum(["publishable", "secret"]),
    last_used_at: model.dateTime().nullable(),
    created_by: model.text(),
    revoked_by: model.text().nullable(),
    revoked_at: model.dateTime().nullable(),
    store: model.belongsTo(() => Store, {
      foreignKey: "store_id",
      mappedBy: "api_keys", // Assuming 'api_keys' will be on Store if bidirectional
    }),
  })
  .indexes([
    {
      name: "IDX_apikey_store_id",
      on: ["store_id"],
    },
    {
      name: "IDX_apikey_token_unique", // Token should remain globally unique
      on: ["token"],
      unique: true,
    },
    {
      name: "IDX_apikey_type",
      on: ["type"],
    },
  ])

export default ApiKey
