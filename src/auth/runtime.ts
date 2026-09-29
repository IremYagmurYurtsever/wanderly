import { api } from '../services/api';
import { storage } from '../storage';
import { createAuthController } from './controller';
import { tokenStore } from './tokenStore';

export const authController = createAuthController(api, tokenStore, storage.setUser);
