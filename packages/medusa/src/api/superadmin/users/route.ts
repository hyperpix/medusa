import { MedusaNextFunction, MedusaRequest, MedusaResponse, MiddlewaresConfig, SharedContext } from "@medusajs/framework/types";
import { UserModuleService } from "@medusajs/modules-sdk"; // Assuming UserModuleService exists
import { IsEmail, IsOptional, IsString } from "class-validator";

// --- DTOs for User Management by Super Admin ---
export class SuperAdminCreateUserDto {
  @IsEmail()
  email: string;

  @IsString()
  @IsOptional()
  first_name?: string;

  @IsString()
  @IsOptional()
  last_name?: string;

  // Super admin MUST provide store_id to assign user to a store
  @IsString()
  store_id: string;

  // password, actor_type, etc. might be handled by UserService internally or set via other DTO fields
  // For example, actor_type could default to 'admin_user' for users created this way.
}

export class SuperAdminUpdateUserDto {
  @IsEmail()
  @IsOptional()
  email?: string;

  @IsString()
  @IsOptional()
  first_name?: string;

  @IsString()
  @IsOptional()
  last_name?: string;

  @IsString()
  @IsOptional()
  store_id?: string | null; // Allow changing store or making user a superadmin by setting to null (with care)

  // Other fields like actor_type, roles, etc.
}

// --- Middleware (can reuse or adapt from store management) ---
async function requireSuperAdmin(req: MedusaRequest, res: MedusaResponse, next: MedusaNextFunction) {
  const sharedContext = req.scope.resolve("sharedContext") as SharedContext & { isSuperAdmin?: boolean };
  if (!sharedContext.isSuperAdmin) {
    return res.status(403).json({ message: "Forbidden: Super admin access required." });
  }
  next();
}

export const config: MiddlewaresConfig = {
  middlewares: [
    requireSuperAdmin,
  ],
};

// --- Route Handlers ---

// GET /superadmin/users - List users
export async function GET(req: MedusaRequest, res: MedusaResponse) {
  const userModuleService = req.scope.resolve<UserModuleService>("userModuleService");

  // Super admin can list all users.
  // Filters like ?store_id=xyz can be used to list users for a specific store.
  // The UserModuleService.listUsers method needs to handle this:
  // - If called by SA with no store_id filter, list all.
  // - If called by SA with store_id filter, list for that store.
  const filters = req.query; // Simplified: get filters from query (e.g., req.filterableFields)
  const users = await userModuleService.listUsers(filters, {}, req.scope); // Pass req.scope

  res.status(200).json({ users }); // TODO: Add count, offset, limit for pagination
}

// POST /superadmin/users - Create a new user for a specific store
export async function POST(req: MedusaRequest<SuperAdminCreateUserDto>, res: MedusaResponse) {
  const userModuleService = req.scope.resolve<UserModuleService>("userModuleService");
  const userData = req.validatedBody as SuperAdminCreateUserDto;

  // UserModuleService.createUsers should use userData.store_id
  // It also needs to handle password setting/hashing, actor_type, etc.
  const newUser = await userModuleService.createUsers(userData, req.scope); // Pass req.scope

  res.status(201).json({ user: newUser });
}

// GET /superadmin/users/:userId - Get a specific user
export async function GET_BY_ID(req: MedusaRequest, res: MedusaResponse) {
  const { userId } = req.params;
  const userModuleService = req.scope.resolve<UserModuleService>("userModuleService");

  // Super admin can retrieve any user.
  const user = await userModuleService.retrieveUser(userId, {}, req.scope); // Pass req.scope

  if (!user) {
    return res.status(404).json({ message: `User with id: ${userId} not found.` });
  }
  res.status(200).json({ user });
}

// PUT /superadmin/users/:userId - Update a user
export async function PUT_BY_ID(req: MedusaRequest<SuperAdminUpdateUserDto>, res: MedusaResponse) {
  const { userId } = req.params;
  const userModuleService = req.scope.resolve<UserModuleService>("userModuleService");
  const updateData = req.validatedBody as SuperAdminUpdateUserDto;

  // UserModuleService.updateUsers should allow SA to update any user, including their store_id
  const updatedUser = await userModuleService.updateUsers(userId, updateData, req.scope); // Pass req.scope

  res.status(200).json({ user: updatedUser });
}

// DELETE /superadmin/users/:userId - Delete a user
export async function DELETE_BY_ID(req: MedusaRequest, res: MedusaResponse) {
  const { userId } = req.params;
  const userModuleService = req.scope.resolve<UserModuleService>("userModuleService");

  // UserModuleService.deleteUsers should allow SA to delete any user.
  await userModuleService.deleteUsers([userId], req.scope); // Pass req.scope, assuming it takes an array

  res.status(200).json({ id: userId, object: "user", deleted: true });
}
