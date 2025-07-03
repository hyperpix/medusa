import { model } from "@medusajs/framework/utils";
import Store from "../../../../modules/store/src/models/store"; // Adjust path to Store model
import Plan from "./plan";

export enum StoreSubscriptionStatus {
  TRIALING = "trialing",
  ACTIVE = "active",
  PAST_DUE = "past_due", // Payment failed
  CANCELED = "canceled",   // Canceled by user, will end at period end
  INCOMPLETE = "incomplete", // Initial payment failed or requires action
  ENDED = "ended",         // Subscription period finished and not renewed
}

const StoreSubscription = model
  .define("StoreSubscription", {
    id: model.id({ prefix: "sub" }).primaryKey(),
    store_id: model.text().unique(), // Each store has one current subscription
    plan_id: model.text(),
    status: model.enum(StoreSubscriptionStatus).default(StoreSubscriptionStatus.TRIALING),
    current_period_starts_at: model.dateTime().nullable(),
    current_period_ends_at: model.dateTime().nullable(),
    trial_ends_at: model.dateTime().nullable(),
    canceled_at: model.dateTime().nullable(), // When cancellation was requested
    ended_at: model.dateTime().nullable(), // When it actually ended
    payment_provider_id: model.text().nullable(), // e.g., Stripe Subscription ID
    metadata: model.json().nullable(),
    store: model.belongsTo(() => Store, {
      foreignKey: "store_id",
      mappedBy: "subscription", // Will need to add `subscription` to Store model (one-to-one)
    }),
    plan: model.belongsTo(() => Plan, {
      foreignKey: "plan_id",
      // No mappedBy needed if Plan doesn't need to list subscriptions directly often
    }),
  })
  .indexes([
    {
      name: "IDX_store_subscription_store_id", // Already unique by model.text().unique()
      on: ["store_id"],
    },
    {
      name: "IDX_store_subscription_plan_id",
      on: ["plan_id"],
    },
    {
      name: "IDX_store_subscription_status",
      on: ["status"],
    }
  ]);

export default StoreSubscription;
