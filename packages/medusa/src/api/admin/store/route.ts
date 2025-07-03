import { MedusaNextFunction, MedusaRequest, MedusaResponse, MiddlewaresConfig, SharedContext } from "@medusajs/framework/types";
import { StoreModuleService } from "@medusajs/modules-sdk";
import { IsOptional, IsString } from "class-validator";

// DTO for updating the current merchant's store (subset of what SA can do)
export class MerchantUpdateStoreDto {
  @IsString()
  @IsOptional()
  name?: string;

  // Other fields merchant might update, e.g., currency, email

  @IsString() // Theme ID
  @IsOptional()
  active_theme_id?: string | null;
}

// Predefined list of themes (same as in /admin/themes/route.ts)
// In a real app, this would be shared from a common source (config, service, DB)
const AVAILABLE_THEMES_IDS = ["modern_look", "classic_elegance", "minimalist_chic"];


export const config: MiddlewaresConfig = {
  middlewares: [
    // Standard admin authentication middleware is assumed to run for /admin routes
  ],
};

// GET /admin/store - Get current merchant's store details (including active_theme_id)
export async function GET(req: MedusaRequest, res: MedusaResponse) {
  const storeModuleService = req.scope.resolve<StoreModuleService>("storeModuleService");
  const sharedContext = req.scope.resolve("sharedContext") as SharedContext & { store_id?: string, isSuperAdmin?: boolean };

  if (sharedContext.isSuperAdmin && !sharedContext.store_id) {
    // SA accessing this without a specific store context from query/params doesn't make sense.
    // They should use /superadmin/stores/:id or /superadmin/stores?id=...
    return res.status(400).json({ message: "Super admin must specify a store ID or use superadmin routes." });
  }

  if (!sharedContext.store_id) {
    return res.status(404).json({ message: "Store context not found for merchant." });
  }

  // retrieveStore method in StoreModuleService should handle scoping for non-SAs
  const store = await storeModuleService.retrieveStore(
    sharedContext.store_id,
    { select: ["id", "name", "active_theme_id" /* other fields */ ] },
    sharedContext
  );

  res.status(200).json({ store });
}


// PUT /admin/store - Update current merchant's store (e.g., to set active_theme_id)
export async function PUT(req: MedusaRequest<MerchantUpdateStoreDto>, res: MedusaResponse) {
  const storeModuleService = req.scope.resolve<StoreModuleService>("storeModuleService");
  const sharedContext = req.scope.resolve("sharedContext") as SharedContext & { store_id?: string, isSuperAdmin?: boolean };
  const updateData = req.validatedBody as MerchantUpdateStoreDto;

  if (sharedContext.isSuperAdmin && !sharedContext.store_id) {
     return res.status(400).json({ message: "Super admin must specify a store ID to update via superadmin routes." });
  }

  if (!sharedContext.store_id) {
    return res.status(403).json({ message: "Store context not found. Cannot update store." });
  }

  // Validate active_theme_id if provided
  if (updateData.active_theme_id && !AVAILABLE_THEMES_IDS.includes(updateData.active_theme_id)) {
    return res.status(400).json({
      message: `Invalid theme ID: ${updateData.active_theme_id}. Please choose from available themes.`
    });
  }

  // The StoreModuleService.updateStores (or a more specific updateOwnStore)
  // must ensure that a merchant admin can only update their own store (id === sharedContext.store_id)
  // and cannot change fields they aren't allowed to (like critical system settings).
  // The active_theme_id is a safe field for them to update.
  const updatedStore = await storeModuleService.updateStores( // updateStores should handle single ID update
    sharedContext.store_id,
    updateData,
    sharedContext
  );

  res.status(200).json({ store: updatedStore });
}
