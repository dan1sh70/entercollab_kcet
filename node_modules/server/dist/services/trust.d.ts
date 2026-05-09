export declare function awardPoints(userId: number, action: string, referenceType?: string, referenceId?: number): Promise<void>;
export declare function endorse(endorserId: number, endorsedId: number, skill: string, comment?: string, projectId?: number): Promise<{
    id: number;
    createdAt: Date;
    updatedAt: Date;
    comment: string | null;
    projectId: number | null;
    skill: string;
    endorserId: number;
    endorsedId: number;
}>;
//# sourceMappingURL=trust.d.ts.map