/**
 * Candidate Note interface
 * Requirements: 6.1, 6.2, 6.3
 */
export interface CandidateNote {
    id: string;
    candidateId: string;
    content: string;
    createdBy: string;
    authorName: string;
    createdAt: Date;
    updatedAt: Date;
}
export interface CreateNoteData {
    candidateId: string;
    content: string;
    createdBy: string;
}
export declare const notesService: {
    /**
     * Create a new note for a candidate
     * Requirements: 6.1, 6.2
     */
    createNote(data: CreateNoteData): Promise<CandidateNote>;
    /**
     * Get all notes for a candidate in reverse chronological order
     * Requirements: 6.1, 6.3
     */
    getNotes(candidateId: string): Promise<CandidateNote[]>;
    /**
     * Get a single note by ID
     */
    getNoteById(noteId: string): Promise<CandidateNote>;
    /**
     * Delete a note
     * Requirements: 6.1
     */
    deleteNote(noteId: string, userId: string): Promise<void>;
};
export default notesService;
//# sourceMappingURL=notes.service.d.ts.map