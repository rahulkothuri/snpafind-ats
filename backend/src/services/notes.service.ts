import prisma from '../lib/prisma.js';
import { NotFoundError, ValidationError } from '../middleware/errorHandler.js';

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

export const notesService = {
  /**
   * Create a new note for a candidate
   * Requirements: 6.1, 6.2
   */
  async createNote(data: CreateNoteData): Promise<CandidateNote> {
    // Validate required fields
    if (!data.content || data.content.trim() === '') {
      throw new ValidationError({ content: ['Note content is required'] });
    }

    // Verify candidate exists
    const candidate = await prisma.candidate.findUnique({
      where: { id: data.candidateId },
    });

    if (!candidate) {
      throw new NotFoundError('Candidate');
    }

    // Verify author exists
    const author = await prisma.user.findUnique({
      where: { id: data.createdBy },
    });

    if (!author) {
      throw new NotFoundError('User');
    }

    // Create the note with author tracking (Requirements 6.2)
    const note = await prisma.candidateNote.create({
      data: {
        candidateId: data.candidateId,
        content: data.content.trim(),
        createdBy: data.createdBy,
      },
      include: {
        author: {
          select: { name: true },
        },
      },
    });

    // Create activity record for note addition
    await prisma.candidateActivity.create({
      data: {
        candidateId: data.candidateId,
        activityType: 'note_added',
        description: `Note added by ${author.name}`,
        metadata: {
          noteId: note.id,
          authorId: data.createdBy,
          authorName: author.name,
        },
      },
    });

    return {
      id: note.id,
      candidateId: note.candidateId,
      content: note.content,
      createdBy: note.createdBy,
      authorName: note.author.name,
      createdAt: note.createdAt,
      updatedAt: note.updatedAt,
    };
  },

  /**
   * Get all notes for a candidate in reverse chronological order
   * Requirements: 6.1, 6.3
   */
  async getNotes(candidateId: string): Promise<CandidateNote[]> {
    // Verify candidate exists
    const candidate = await prisma.candidate.findUnique({
      where: { id: candidateId },
    });

    if (!candidate) {
      throw new NotFoundError('Candidate');
    }

    // Get notes in reverse chronological order (Requirements 6.3)
    const notes = await prisma.candidateNote.findMany({
      where: { candidateId },
      orderBy: { createdAt: 'desc' },
      include: {
        author: {
          select: { name: true },
        },
      },
    });

    return notes.map((note: {
      id: string;
      candidateId: string;
      content: string;
      createdBy: string;
      createdAt: Date;
      updatedAt: Date;
      author: { name: string };
    }) => ({
      id: note.id,
      candidateId: note.candidateId,
      content: note.content,
      createdBy: note.createdBy,
      authorName: note.author.name,
      createdAt: note.createdAt,
      updatedAt: note.updatedAt,
    }));
  },

  /**
   * Get a single note by ID
   */
  async getNoteById(noteId: string): Promise<CandidateNote> {
    const note = await prisma.candidateNote.findUnique({
      where: { id: noteId },
      include: {
        author: {
          select: { name: true },
        },
      },
    });

    if (!note) {
      throw new NotFoundError('Note');
    }

    return {
      id: note.id,
      candidateId: note.candidateId,
      content: note.content,
      createdBy: note.createdBy,
      authorName: note.author.name,
      createdAt: note.createdAt,
      updatedAt: note.updatedAt,
    };
  },

  /**
   * Delete a note
   * Requirements: 6.1
   */
  async deleteNote(noteId: string, userId: string): Promise<void> {
    const note = await prisma.candidateNote.findUnique({
      where: { id: noteId },
      include: {
        author: {
          select: { name: true },
        },
      },
    });

    if (!note) {
      throw new NotFoundError('Note');
    }

    // Delete the note
    await prisma.candidateNote.delete({
      where: { id: noteId },
    });

    // Get the user who deleted the note
    const deletingUser = await prisma.user.findUnique({
      where: { id: userId },
      select: { name: true },
    });

    // Create activity record for note deletion
    await prisma.candidateActivity.create({
      data: {
        candidateId: note.candidateId,
        activityType: 'note_added', // Using note_added as there's no note_deleted type
        description: `Note deleted by ${deletingUser?.name || 'Unknown'}`,
        metadata: {
          noteId: note.id,
          deletedBy: userId,
          deletedByName: deletingUser?.name,
          action: 'deleted',
        },
      },
    });
  },
};

export default notesService;
