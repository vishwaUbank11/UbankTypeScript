// src/interfaces/user.interface.ts

export interface User {
    id: number;
    email?: string;
    role?: string;
    user: string;
    settle_currency?: string;
    wallet?: number;
    name?: string;
    parent_id?: number;
    account_type: number;
    mode_of_solution?: string;
    refund?: number;
    // aur fields add kar sakte ho
  }
  
  import { Request } from 'express';
  
  export interface AuthenticatedRequest extends Request {
    user?: User;
  }
  