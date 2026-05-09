export declare function callOpenAI(messages: {
    role: string;
    content: string;
}[], temperature?: number): Promise<string>;
export declare function chat(message: string, history?: {
    user: string;
    ai: string;
}[], context?: string): Promise<string>;
export declare function summarize(text: string): Promise<string>;
export declare function extractTasks(discussion: string): Promise<any[]>;
//# sourceMappingURL=ai.d.ts.map