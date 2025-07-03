import { model } from "@medusajs/framework/utils";
import User from "./user";
import Role from "./role";

// This is a join table for the many-to-many relationship between User and Role.
// If using `model.manyToMany` directly in User and Role with `pivotTable` specified,
// this explicit model might not be strictly necessary unless we need to add extra fields
// to the relationship itself (e.g., assigned_at).
// For now, defining it explicitly for clarity if we want to manage it via its own service later.

const UserRole = model
  .define("UserRole", {
    id: model.id({ prefix: "usrr" }).primaryKey(), // Optional: could use composite key (user_id, role_id)
    user_id: model.text(),
    role_id: model.text(),
    user: model.belongsTo(() => User, {
        foreignKey: "user_id",
        mappedBy: "user_roles", // Need to add `user_roles` (hasMany UserRole) to User model
    }),
    role: model.belongsTo(() => Role, {
        foreignKey: "role_id",
        mappedBy: "user_roles", // Need to add `user_roles` (hasMany UserRole) to Role model
    }),
  })
  .indexes([
    {
      name: "IDX_user_role_user_id_role_id_unique",
      on: ["user_id", "role_id"],
      unique: true,
      where: "deleted_at IS NULL"
    },
    {
      name: "IDX_user_role_user_id",
      on: ["user_id"]
    },
    {
      name: "IDX_user_role_role_id",
      on: ["role_id"]
    }
  ]);

export default UserRole;
