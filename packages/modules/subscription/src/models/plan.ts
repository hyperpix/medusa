import { model } from "@medusajs/framework/utils";

const Plan = model
  .define("Plan", {
    id: model.id({ prefix: "plan" }).primaryKey(),
    name: model.text().searchable(),
    description: model.text().nullable(),
    price: model.number(), // Price in cents
    currency_code: model.text().default("usd"),
    features: model.json().nullable(), // e.g., { "product_limit": 100, "transaction_fee_percent": 2 }
    is_active: model.boolean().default(true), // Whether this plan can be newly assigned
    metadata: model.json().nullable(),
  })
  .indexes([
    {
      name: "IDX_plan_name_unique",
      on: ["name"],
      unique: true, // Plan names should be unique
      where: "deleted_at IS NULL",
    },
    {
      name: "IDX_plan_is_active",
      on: ["is_active"],
    }
  ]);

export default Plan;
