export declare function logActivity(userId: number, type: string, subjectType?: string, subjectId?: number, metadata?: Record<string, any>): Promise<{
    id: number;
    createdAt: Date;
    updatedAt: Date;
    userId: number;
    type: string;
    subjectType: string | null;
    subjectId: number | null;
    metadata: string | null;
}>;
export declare function getFeedForUser(userId: number, limit?: number): Promise<({
    user: {
        id: number;
        name: string;
        profilePhotoPath: string | null;
    };
} & {
    id: number;
    createdAt: Date;
    updatedAt: Date;
    userId: number;
    type: string;
    subjectType: string | null;
    subjectId: number | null;
    metadata: string | null;
})[]>;
//# sourceMappingURL=feed.d.ts.map