import { MedusaNextFunction, MedusaRequest, MedusaResponse, MiddlewaresConfig } from "@medusajs/framework/types";
import { StoreModuleService } from "@medusajs/modules-sdk"; // Assuming StoreModuleService exists and is correctly typed/exported
import { IsOptional, IsString } from "class-validator";
import { SharedContext } from "@medusajs/framework/types"; // Or specific context type

// --- DTOs for Store Management ---
export class SuperAdminCreateStoreDto {
  @IsString()
  name: string;

  // Add other relevant fields for creating a store, e.g.,
  // default_currency_code, admin_email (to create an initial admin user for this store)
  @IsString()
  @IsOptional()
  default_currency_code?: string; // Example
}

export class SuperAdminUpdateStoreDto {
  @IsString()
  @IsOptional()
  name?: string;

  @IsString()
  @IsOptional()
  default_currency_code?: string;
  // other updatable fields
}

// --- Route Handlers ---

// Middleware to check for Super Admin
async function requireSuperAdmin(req: MedusaRequest, res: MedusaResponse, next: MedusaNextFunction) {
  const sharedContext = req.scope.resolve("sharedContext") as SharedContext & { isSuperAdmin?: boolean };
  if (!sharedContext.isSuperAdmin) {
    return res.status(403).json({ message: "Forbidden: Super admin access required." });
  }
  next();
}

export const config: MiddlewaresConfig = {
  middlewares: [
    // Authentication middleware should run before this, ensuring req.user and thus sharedContext.isSuperAdmin is populated
    // For example, if you have a global auth middleware or one specific to /superadmin path
    // authenticate("*", ["session", "bearer"]), // Example if using framework's authenticate
    requireSuperAdmin,
  ],
};

// GET /superadmin/stores - List all stores
export async function GET(req: MedusaRequest, res: MedusaResponse) {
  const storeModuleService = req.scope.resolve<StoreModuleService>("storeModuleService");
  // Super admin can list all stores, so no store_id filter from context is applied here by default.
  // The service method itself should handle this (e.g. list without store_id filter if context isSuperAdmin)

  // TODO: Add pagination, filtering, fields selection from req.query if needed
  const stores = await storeModuleService.list({}, {}, req.scope); // Pass req.scope for context

  res.status(200).json({ stores });
}

// POST /superadmin/stores - Create a new store
export async function POST(req: MedusaRequest<SuperAdminCreateStoreDto>, res: MedusaResponse) {
  const storeModuleService = req.scope.resolve<StoreModuleService>("storeModuleService");

  // The DTO (req.validatedBody) comes from validation middleware (not shown here, but assumed)
  const storeData = req.validatedBody as SuperAdminCreateStoreDto;

  // The create method in StoreModuleService might need to handle creating
  // an initial admin user for this new store if admin_email is provided.
  const newStore = await storeModuleService.create(storeData, req.scope); // Pass req.scope

  res.status(201).json({ store: newStore });
}

// GET /superadmin/stores/:id - Get a specific store
export async function GET_BY_ID(req: MedusaRequest, res: MedusaResponse) {
  const { id } = req.params;
  const storeModuleService = req.scope.resolve<StoreModuleService>("storeModuleService");

  // Super admin can retrieve any store by ID.
  const store = await storeModuleService.retrieve(id, {}, req.scope); // Pass req.scope

  if (!store) {
    return res.status(404).json({ message: `Store with id: ${id} not found.` });
  }
  res.status(200).json({ store });
}

// PUT /superadmin/stores/:id - Update a store
export async function PUT_BY_ID(req: MedusaRequest<SuperAdminUpdateStoreDto>, res: MedusaResponse) {
  const { id } = req.params;
  const storeModuleService = req.scope.resolve<StoreModuleService>("storeModuleService");
  const updateData = req.validatedBody as SuperAdminUpdateStoreDto;

  // The update method should ensure super admin context allows updating any store.
  const updatedStore = await storeModuleService.update(id, updateData, req.scope); // Pass req.scope

  res.status(200).json({ store: updatedStore });
}

// DELETE /superadmin/stores/:id - Delete a store
export async function DELETE_BY_ID(req: MedusaRequest, res: MedusaResponse) {
  const { id } = req.params;
  const storeModuleService = req.scope.resolve<StoreModuleService>("storeModuleService");

  // The delete method should ensure super admin context allows deleting any store.
  // Consider soft delete vs hard delete.
  await storeModuleService.delete(id, req.scope); // Pass req.scope

  res.status(200).json({ id, object: "store", deleted: true });
}
