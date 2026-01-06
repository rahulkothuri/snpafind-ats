/**
 * Bulk Import Service
 *
 * Handles bulk candidate import from CSV/Excel files.
 * Candidates are placed in the Queue stage and sent application form invitations.
 *
 * Requirements: Bulk candidate import, Queue stage placement, email invitations
 */
import prisma from '../lib/prisma.js';
import ExcelJS from 'exceljs';
import { ValidationError, NotFoundError } from '../middleware/errorHandler.js';
import { stageHistoryService } from './stageHistory.service.js';
import { emailService } from './email.service.js';
/**
 * Parse CSV content into candidate records
 * Expected columns: name, email, phone, location, experienceYears, currentCompany, skills
 */
export function parseCSV(content) {
    const lines = content.trim().split('\n');
    if (lines.length < 2) {
        throw new ValidationError({ file: ['CSV file must have a header row and at least one data row'] });
    }
    // Parse header row - handle potential BOM and whitespace
    const headerLine = lines[0].replace(/^\uFEFF/, '').trim();
    const headers = headerLine.split(',').map(h => h.trim().toLowerCase());
    // Validate required columns
    if (!headers.includes('name') || !headers.includes('email')) {
        throw new ValidationError({
            file: ['CSV must contain "name" and "email" columns']
        });
    }
    const candidates = [];
    const errors = [];
    for (let i = 1; i < lines.length; i++) {
        const line = lines[i].trim();
        if (!line)
            continue; // Skip empty lines
        // Basic CSV parsing (handles simple cases, not quoted commas)
        const values = parseCSVLine(line);
        const record = {};
        headers.forEach((header, index) => {
            record[header] = values[index]?.trim() || '';
        });
        // Validate required fields
        if (!record.name || !record.email) {
            errors.push(`Row ${i + 1}: Missing required field (name or email)`);
            continue;
        }
        // Validate email format
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(record.email)) {
            errors.push(`Row ${i + 1}: Invalid email format "${record.email}"`);
            continue;
        }
        candidates.push({
            name: record.name,
            email: record.email.toLowerCase(),
            phone: record.phone || undefined,
            location: record.location || undefined,
            experienceYears: record.experienceyears ? parseFloat(record.experienceyears) : undefined,
            currentCompany: record.currentcompany || record.company || undefined,
            skills: record.skills ? record.skills.split(';').map(s => s.trim()).filter(Boolean) : undefined,
        });
    }
    if (errors.length > 0 && candidates.length === 0) {
        throw new ValidationError({ file: errors });
    }
    return candidates;
}
/**
 * Parse a single CSV line handling quoted values
 */
function parseCSVLine(line) {
    const result = [];
    let current = '';
    let inQuotes = false;
    for (let i = 0; i < line.length; i++) {
        const char = line[i];
        if (char === '"') {
            if (inQuotes && line[i + 1] === '"') {
                current += '"';
                i++; // Skip escaped quote
            }
            else {
                inQuotes = !inQuotes;
            }
        }
        else if (char === ',' && !inQuotes) {
            result.push(current);
            current = '';
        }
        else {
            current += char;
        }
    }
    result.push(current); // Push last value
    return result;
}
/**
 * Parse Excel file into candidate records
 */
export async function parseExcel(buffer) {
    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.load(buffer);
    const worksheet = workbook.worksheets[0];
    if (!worksheet) {
        throw new ValidationError({ file: ['Excel file has no worksheets'] });
    }
    const rows = worksheet.getSheetValues();
    if (rows.length < 3) { // ExcelJS uses 1-indexed, first row is empty
        throw new ValidationError({ file: ['Excel file must have a header row and at least one data row'] });
    }
    // Get headers from first row (index 1 in ExcelJS)
    const headerRow = rows[1];
    if (!headerRow) {
        throw new ValidationError({ file: ['Excel file must have a header row'] });
    }
    const headers = headerRow.map(h => String(h || '').trim().toLowerCase());
    // Validate required columns
    if (!headers.includes('name') || !headers.includes('email')) {
        throw new ValidationError({
            file: ['Excel must contain "name" and "email" columns']
        });
    }
    const candidates = [];
    const errors = [];
    for (let i = 2; i < rows.length; i++) {
        const row = rows[i];
        if (!row || row.every(cell => !cell))
            continue; // Skip empty rows
        const record = {};
        headers.forEach((header, index) => {
            const value = row[index];
            record[header] = value !== null && value !== undefined ? String(value).trim() : '';
        });
        // Validate required fields
        if (!record.name || !record.email) {
            errors.push(`Row ${i}: Missing required field (name or email)`);
            continue;
        }
        // Validate email format
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(record.email)) {
            errors.push(`Row ${i}: Invalid email format "${record.email}"`);
            continue;
        }
        candidates.push({
            name: record.name,
            email: record.email.toLowerCase(),
            phone: record.phone || undefined,
            location: record.location || undefined,
            experienceYears: record.experienceyears ? parseFloat(record.experienceyears) : undefined,
            currentCompany: record.currentcompany || record.company || undefined,
            skills: record.skills ? String(record.skills).split(';').map(s => s.trim()).filter(Boolean) : undefined,
        });
    }
    if (errors.length > 0 && candidates.length === 0) {
        throw new ValidationError({ file: errors });
    }
    return candidates;
}
export const bulkImportService = {
    /**
     * Import candidates from parsed data
     * Creates/updates candidates, places them in Queue stage, sends invitation emails
     */
    async importCandidates(jobId, companyId, candidates, userId, sendEmails = true) {
        // Validate inputs
        if (!candidates || candidates.length === 0) {
            throw new ValidationError({ candidates: ['At least one candidate is required'] });
        }
        // Get job with pipeline stages
        const job = await prisma.job.findUnique({
            where: { id: jobId },
            include: {
                pipelineStages: {
                    orderBy: { position: 'asc' },
                },
                company: {
                    select: { name: true },
                },
            },
        });
        if (!job) {
            throw new NotFoundError('Job');
        }
        if (job.companyId !== companyId) {
            throw new ValidationError({ jobId: ['Job does not belong to this company'] });
        }
        // Find Queue stage (position 0)
        const queueStage = job.pipelineStages.find(s => s.name === 'Queue' || s.position === 0);
        if (!queueStage) {
            throw new ValidationError({ job: ['Job pipeline does not have a Queue stage'] });
        }
        const failures = [];
        let importedCount = 0;
        let skippedCount = 0;
        let invitationsSent = 0;
        let invitationsFailed = 0;
        // Process each candidate
        for (const candidateData of candidates) {
            try {
                const result = await this.importSingleCandidate({
                    candidateData,
                    jobId,
                    companyId,
                    queueStageId: queueStage.id,
                    queueStageName: queueStage.name,
                    userId,
                    jobTitle: job.title,
                    companyName: job.company.name,
                    sendEmail: sendEmails,
                });
                if (result.imported) {
                    importedCount++;
                    if (result.emailSent) {
                        invitationsSent++;
                    }
                    else if (sendEmails) {
                        invitationsFailed++;
                    }
                }
                else {
                    skippedCount++;
                }
            }
            catch (error) {
                failures.push({
                    email: candidateData.email,
                    name: candidateData.name,
                    error: error instanceof Error ? error.message : 'Unknown error',
                });
            }
        }
        return {
            success: failures.length === 0,
            importedCount,
            skippedCount,
            failedCount: failures.length,
            failures: failures.length > 0 ? failures : undefined,
            invitationsSent,
            invitationsFailed,
        };
    },
    /**
     * Import a single candidate
     */
    async importSingleCandidate(params) {
        const { candidateData, jobId, companyId, queueStageId, queueStageName, userId, jobTitle, companyName, sendEmail } = params;
        // Check if candidate with this email already exists
        let candidate = await prisma.candidate.findUnique({
            where: { email: candidateData.email },
        });
        let isNewCandidate = false;
        if (candidate) {
            // Update existing candidate
            candidate = await prisma.candidate.update({
                where: { id: candidate.id },
                data: {
                    name: candidateData.name,
                    phone: candidateData.phone || candidate.phone,
                    location: candidateData.location || candidate.location,
                    experienceYears: candidateData.experienceYears ?? candidate.experienceYears,
                    currentCompany: candidateData.currentCompany || candidate.currentCompany,
                    skills: candidateData.skills || candidate.skills,
                },
            });
        }
        else {
            // Create new candidate
            isNewCandidate = true;
            candidate = await prisma.candidate.create({
                data: {
                    companyId,
                    name: candidateData.name,
                    email: candidateData.email,
                    phone: candidateData.phone,
                    location: candidateData.location || 'Not specified',
                    experienceYears: candidateData.experienceYears || 0,
                    currentCompany: candidateData.currentCompany,
                    source: 'Bulk Import',
                    skills: candidateData.skills || [],
                },
            });
        }
        // Check if candidate already has a JobCandidate entry for this job
        const existingJobCandidate = await prisma.jobCandidate.findUnique({
            where: {
                jobId_candidateId: {
                    jobId,
                    candidateId: candidate.id,
                },
            },
        });
        if (existingJobCandidate) {
            // Candidate already in pipeline for this job - skip
            return { imported: false, emailSent: false };
        }
        // Create JobCandidate and place in Queue stage (using transaction)
        await prisma.$transaction(async (tx) => {
            // Create job candidate association
            const jobCandidate = await tx.jobCandidate.create({
                data: {
                    jobId,
                    candidateId: candidate.id,
                    currentStageId: queueStageId,
                },
            });
            // Create stage history entry
            await stageHistoryService.createStageEntry({
                jobCandidateId: jobCandidate.id,
                stageId: queueStageId,
                stageName: queueStageName,
                comment: 'Added via bulk import',
                movedBy: userId,
            }, tx);
            // Create activity record
            await tx.candidateActivity.create({
                data: {
                    candidateId: candidate.id,
                    jobCandidateId: jobCandidate.id,
                    activityType: 'stage_change',
                    description: 'Added via bulk import to Queue stage',
                    metadata: {
                        bulkImport: true,
                        importedBy: userId,
                    },
                },
            });
        });
        // Send application form invitation email
        let emailSent = false;
        if (sendEmail) {
            try {
                const result = await emailService.sendApplicationFormInvitation({
                    candidateEmail: candidate.email,
                    candidateName: candidate.name,
                    jobId,
                    jobTitle,
                    companyName,
                });
                emailSent = result.success;
            }
            catch (error) {
                console.error('Failed to send invitation email:', error);
            }
        }
        return { imported: true, emailSent };
    },
};
export default bulkImportService;
//# sourceMappingURL=bulkImport.service.js.map