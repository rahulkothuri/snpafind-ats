/**
 * Bulk Import Service
 *
 * Handles bulk candidate import from CSV/Excel files.
 * Candidates are placed in the Queue stage and sent application form invitations.
 *
 * Requirements: Bulk candidate import, Queue stage placement, email invitations
 */
/**
 * Bulk import candidate data from file
 */
export interface BulkImportCandidate {
    name: string;
    email: string;
    phone?: string;
    location?: string;
    experienceYears?: number;
    currentCompany?: string;
    skills?: string[];
}
/**
 * Individual import failure details
 */
export interface BulkImportFailure {
    email: string;
    name?: string;
    error: string;
}
/**
 * Bulk import result
 */
export interface BulkImportResult {
    success: boolean;
    importedCount: number;
    skippedCount: number;
    failedCount: number;
    failures?: BulkImportFailure[];
    invitationsSent: number;
    invitationsFailed: number;
}
/**
 * Parse CSV content into candidate records
 * Expected columns: name, email, phone, location, experienceYears, currentCompany, skills
 */
export declare function parseCSV(content: string): BulkImportCandidate[];
/**
 * Parse Excel file into candidate records
 */
export declare function parseExcel(buffer: Buffer | ArrayBuffer): Promise<BulkImportCandidate[]>;
export declare const bulkImportService: {
    /**
     * Import candidates from parsed data
     * Creates/updates candidates, places them in Queue stage, sends invitation emails
     */
    importCandidates(jobId: string, companyId: string, candidates: BulkImportCandidate[], userId: string, sendEmails?: boolean): Promise<BulkImportResult>;
    /**
     * Import a single candidate
     */
    importSingleCandidate(params: {
        candidateData: BulkImportCandidate;
        jobId: string;
        companyId: string;
        queueStageId: string;
        queueStageName: string;
        userId: string;
        jobTitle: string;
        companyName: string;
        sendEmail: boolean;
    }): Promise<{
        imported: boolean;
        emailSent: boolean;
    }>;
};
export default bulkImportService;
//# sourceMappingURL=bulkImport.service.d.ts.map