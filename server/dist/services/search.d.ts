interface SearchFilters {
    type?: string;
    category?: string;
}
export declare function search(query: string, filters?: SearchFilters): Promise<{
    projects: any[];
    users: any[];
    colleges: any[];
}>;
export {};
//# sourceMappingURL=search.d.ts.map