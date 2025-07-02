import { MedusaNextFunction, MedusaRequest, MedusaResponse, SharedContext } from "@medusajs/framework/types"; // Adjust imports as per actual framework types

// Define a type for the actor/user object expected on the request after authentication
interface AuthenticatedActor {
  id: string;
  store_id?: string | null; // store_id is part of our modified User model
  actor_type?: string; // e.g., 'user', 'admin_user', 'superadmin_user'
  // other properties like email, name, etc., might be present
}

interface AuthenticatedApiKey {
  id: string;
  store_id?: string | null; // store_id is part of our modified ApiKey model
  type?: 'publishable' | 'secret';
}

export async function setTenantContext(
  req: MedusaRequest,
  res: MedusaResponse,
  next: MedusaNextFunction
): Promise<void> {
  // Resolve sharedContext from the request's scope (DI container)
  // The exact way to access/create sharedContext might vary based on Medusa's internal API.
  // This is a common pattern.
  const sharedContext = req.scope.resolve("sharedContext") as SharedContext & {
    userId?: string;
    actorType?: string;
    store_id?: string | null;
    isSuperAdmin?: boolean;
  };

  const authenticatedUser = req.user as AuthenticatedActor | undefined;
  const authenticatedApiKey = req.api_key as AuthenticatedApiKey | undefined; // Assuming api_key is set on req by an ApiKeyAuthMiddleware

  if (authenticatedUser) {
    sharedContext.userId = authenticatedUser.id;
    sharedContext.actorType = authenticatedUser.actor_type || 'user'; // Default or from token

    if (authenticatedUser.store_id) {
      sharedContext.store_id = authenticatedUser.store_id;
      sharedContext.isSuperAdmin = false;
    } else {
      // If store_id is null or undefined on the user object,
      // and the actor_type indicates a super admin, treat as super admin.
      // The definition of "super admin" might also come from a specific role or permission.
      // For now, we assume a null store_id on a user implies super admin if not a regular customer.
      if (sharedContext.actorType === 'superadmin_user' || sharedContext.actorType === 'admin_user' /* and has no store_id */) {
        sharedContext.store_id = null;
        sharedContext.isSuperAdmin = true;
      } else {
        // Regular user/customer without a store_id (if such a case exists and is valid)
        sharedContext.store_id = null;
        sharedContext.isSuperAdmin = false;
      }
    }
  } else if (authenticatedApiKey) {
    sharedContext.actorType = authenticatedApiKey.type === 'secret' ? 'secret_api_key' : 'publishable_api_key';
    if (authenticatedApiKey.store_id) {
      sharedContext.store_id = authenticatedApiKey.store_id;
    } else {
      // API key not tied to a store - might be a global platform API key
      sharedContext.store_id = null;
    }
    sharedContext.isSuperAdmin = false; // API keys are typically not super admins in this context
  }
  // If neither user nor API key, context remains mostly empty (public request)
  // store_id might be determined by other means later (e.g. hostname for storefront)

  return next();
}
