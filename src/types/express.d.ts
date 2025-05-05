import { UserType } from '../ControllerMerchant/userInterface' // Update with correct path to your user type

declare global {
    namespace Express {
      interface Request {
        user?: User;
      }
    }
  }