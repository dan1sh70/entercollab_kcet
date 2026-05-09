import { Request, Response, NextFunction } from 'express';
export interface AuthRequest extends Request {
    user?: {
        id: number;
        name: string;
        email: string;
        isAdmin: boolean;
        accountType: string;
        profilePhotoPath: string | null;
        university: string | null;
        major: string | null;
        managedCollegeId: number | null;
    };
}
export declare function authMiddleware(req: AuthRequest, res: Response, next: NextFunction): void;
export declare function optionalAuth(req: AuthRequest, _res: Response, next: NextFunction): void;
export declare function adminMiddleware(req: AuthRequest, res: Response, next: NextFunction): void;
export declare function institutionMiddleware(req: AuthRequest, res: Response, next: NextFunction): void;
//# sourceMappingURL=auth.d.ts.map