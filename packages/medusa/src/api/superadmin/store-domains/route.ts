import { MedusaNextFunction, MedusaRequest, MedusaResponse, MiddlewaresConfig, SharedContext } from "@medusajs/framework/types";
// We'll need a StoreDomainModuleService or similar, or extend StoreModuleService
// For now, let's assume methods are added to StoreModuleService or a new StoreDomainService is created and resolvable.
import { StoreModuleService } from "@medusajs/modules-sdk";
import { IsBoolean, IsOptional, IsString, IsEnum } from "class-validator";
import { StoreDomainSslStatus } from "../../../../modules/store/src/models/store-domain"; // Adjust path as needed

// --- DTOs for Store Domain Management ---
export class SuperAdminCreateStoreDomainDto {
  @IsString()
  store_id: string;

  @IsString()
  hostname: string;

  @IsBoolean()
  @IsOptional()
  is_primary?: boolean;
}

export class SuperAdminUpdateStoreDomainDto {
  @IsString()
  @IsOptional()
  hostname?: string;

  @IsBoolean()
  @IsOptional()
  is_primary?: boolean;

  @IsEnum(StoreDomainSslStatus)
  @IsOptional()
  ssl_status?: StoreDomainSslStatus; // Usually updated by an automated process, but SA might override
}

// --- Middleware ---
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
// For these handlers, we'd ideally have a dedicated StoreDomainService.
// If extending StoreModuleService, it needs methods like:
// - addDomainToStore(storeId, domainData): StoreDomain
// - listDomains(filters): StoreDomain[]
// - retrieveDomain(domainId): StoreDomain
// - updateDomain(domainId, updateData): StoreDomain
// - deleteDomain(domainId): void
// - verifyDomainDns(domainId): Promise<{ success: boolean, details: any }>

// GET /superadmin/store-domains - List store domains
export async function GET(req: MedusaRequest, res: MedusaResponse) {
  const storeModuleService = req.scope.resolve<StoreModuleService>("storeModuleService"); // Or StoreDomainService
  const filters = req.query; // e.g., req.filterableFields for ?store_id=xyz

  // Assuming StoreModuleService has a listDomains method
  // @ts-ignore
  const domains = await storeModuleService.listDomains(filters, {}, req.scope);
  res.status(200).json({ domains }); // TODO: Add pagination
}

// POST /superadmin/store-domains - Create a new domain for a store
export async function POST(req: MedusaRequest<SuperAdminCreateStoreDomainDto>, res: MedusaResponse) {
  const storeModuleService = req.scope.resolve<StoreModuleService>("storeModuleService"); // Or StoreDomainService
  const domainData = req.validatedBody as SuperAdminCreateStoreDomainDto;

  // Assuming StoreModuleService has an addDomain method or similar
  // This method would also handle logic like ensuring only one primary domain per store.
  // @ts-ignore
  const newDomain = await storeModuleService.createStoreDomain(domainData, req.scope);
  res.status(201).json({ domain: newDomain });
}

// GET /superadmin/store-domains/:domainId
export async function GET_BY_ID(req: MedusaRequest, res: MedusaResponse) {
  const { domainId } = req.params;
  const storeModuleService = req.scope.resolve<StoreModuleService>("storeModuleService"); // Or StoreDomainService

  // @ts-ignore
  const domain = await storeModuleService.retrieveStoreDomain(domainId, {}, req.scope);
  if (!domain) {
    return res.status(404).json({ message: `StoreDomain with id: ${domainId} not found.` });
  }
  res.status(200).json({ domain });
}

// PUT /superadmin/store-domains/:domainId
export async function PUT_BY_ID(req: MedusaRequest<SuperAdminUpdateStoreDomainDto>, res: MedusaResponse) {
  const { domainId } = req.params;
  const storeModuleService = req.scope.resolve<StoreModuleService>("storeModuleService"); // Or StoreDomainService
  const updateData = req.validatedBody as SuperAdminUpdateStoreDomainDto;

  // @ts-ignore
  const updatedDomain = await storeModuleService.updateStoreDomain(domainId, updateData, req.scope);
  res.status(200).json({ domain: updatedDomain });
}

// DELETE /superadmin/store-domains/:domainId
export async function DELETE_BY_ID(req: MedusaRequest, res: MedusaResponse) {
  const { domainId } = req.params;
  const storeModuleService = req.scope.resolve<StoreModuleService>("storeModuleService"); // Or StoreDomainService

  // @ts-ignore
  await storeModuleService.deleteStoreDomain(domainId, req.scope);
  res.status(200).json({ id: domainId, object: "store_domain", deleted: true });
}

// POST /superadmin/store-domains/:domainId/verify (Conceptual)
export async function POST_VERIFY_DNS(req: MedusaRequest, res: MedusaResponse) {
    const { domainId } = req.params;
    const storeModuleService = req.scope.resolve<StoreModuleService>("storeModuleService"); // Or a dedicated DomainVerificationService

    // This would trigger a background job or an async process to:
    // 1. Fetch the StoreDomain.
    // 2. Perform DNS lookups (e.g., for expected CNAME/A records).
    // 3. Update StoreDomain.verified_at and potentially StoreDomain.ssl_status.
    // @ts-ignore
    const verificationResult = await storeModuleService.verifyDomainDns(domainId, req.scope);

    res.status(202).json({ message: "DNS verification process initiated.", details: verificationResult });
}
