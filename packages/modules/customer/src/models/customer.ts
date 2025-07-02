import { model } from "@medusajs/framework/utils"
import { Store } from "@medusajs/modules-sdk"
import CustomerAddress from "./address"
import CustomerGroup from "./customer-group"
import CustomerGroupCustomer from "./customer-group-customer"

const Customer = model
  .define("Customer", {
    id: model.id({ prefix: "cus" }).primaryKey(),
    store_id: model.text(),
    company_name: model.text().searchable().nullable(),
    first_name: model.text().searchable().nullable(),
    last_name: model.text().searchable().nullable(),
    email: model.text().searchable().nullable(),
    phone: model.text().searchable().nullable(),
    has_account: model.boolean().default(false),
    metadata: model.json().nullable(),
    created_by: model.text().nullable(),
    groups: model.manyToMany(() => CustomerGroup, {
      mappedBy: "customers",
      pivotEntity: () => CustomerGroupCustomer,
    }),
    addresses: model.hasMany(() => CustomerAddress, {
      mappedBy: "customer",
    }),
    store: model.belongsTo(() => Store, {
      foreignKey: "store_id",
      mappedBy: "customers", // Assuming 'customers' will be defined on Store if bidirectional needed
    }),
  })
  .cascades({
    delete: ["addresses"],
    detach: ["groups"],
  })
  .indexes([
    {
      name: "IDX_customer_store_id",
      on: ["store_id"],
    },
    {
      name: "IDX_customer_email_store_id_has_account_unique", // email + has_account should be unique per store
      on: ["email", "store_id", "has_account"],
      unique: true,
      where: "deleted_at IS NULL AND email IS NOT NULL", // Ensure email is not null for the constraint
    },
  ])

export default Customer
