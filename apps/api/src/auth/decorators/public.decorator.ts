import { SetMetadata } from '@nestjs/common';
import { IS_PUBLIC_KEY } from '../jwt-auth.guard';

/**
 * Marks a route as public (bypasses JWT authentication)
 */
export const Public = () => SetMetadata(IS_PUBLIC_KEY, true);
