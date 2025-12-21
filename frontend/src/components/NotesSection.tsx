/**
 * CandidateNotesSection Component - Requirements 6.1, 6.2, 6.3
 * 
 * Features:
 * - Display existing notes with author and timestamp
 * - Add new note form
 * - Delete notes
 * - Notes displayed in reverse chronological order
 */

import { useState } from 'react';
import type { CandidateNote } from '../services/candidates.service';

// Helper function to format date with time
function formatDateTime(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export interface CandidateNotesSectionProps {
  /** Array of notes to display */
  notes: CandidateNote[];
  /** Callback when a new note is added */
  onAddNote: (content: string) => Promise<void>;
  /** Callback when a note is deleted */
  onDeleteNote: (noteId: string) => Promise<void>;
  /** Whether the component is in a loading state */
  isLoading?: boolean;
  /** Placeholder text for the note input */
  placeholder?: string;
  /** Title for the section */
  title?: string;
}

export function CandidateNotesSection({
  notes,
  onAddNote,
  onDeleteNote,
  isLoading = false,
  placeholder = 'Write a note about this candidate...',
  title = 'Notes',
}: CandidateNotesSectionProps) {
  const [newNote, setNewNote] = useState('');
  const [savingNote, setSavingNote] = useState(false);
  const [deletingNoteId, setDeletingNoteId] = useState<string | null>(null);

  const handleAddNote = async () => {
    if (!newNote.trim() || savingNote) return;
    
    setSavingNote(true);
    try {
      await onAddNote(newNote.trim());
      setNewNote('');
    } catch (err) {
      console.error('Error adding note:', err);
    } finally {
      setSavingNote(false);
    }
  };

  const handleDeleteNote = async (noteId: string) => {
    if (deletingNoteId) return;
    
    setDeletingNoteId(noteId);
    try {
      await onDeleteNote(noteId);
    } catch (err) {
      console.error('Error deleting note:', err);
    } finally {
      setDeletingNoteId(null);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    // Submit on Ctrl+Enter or Cmd+Enter
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
      e.preventDefault();
      handleAddNote();
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="bg-white rounded-lg border border-[#e2e8f0] shadow-sm p-4">
          <div className="animate-pulse">
            <div className="h-4 bg-[#e2e8f0] rounded w-24 mb-3"></div>
            <div className="h-24 bg-[#f1f5f9] rounded"></div>
          </div>
        </div>
        <div className="space-y-4">
          {[1, 2].map((i) => (
            <div key={i} className="bg-white rounded-lg border border-[#e2e8f0] shadow-sm p-4">
              <div className="animate-pulse">
                <div className="h-4 bg-[#e2e8f0] rounded w-3/4 mb-2"></div>
                <div className="h-3 bg-[#f1f5f9] rounded w-1/3"></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Add Note Form */}
      <div className="bg-white rounded-lg border border-[#e2e8f0] shadow-sm p-4">
        <h3 className="text-sm font-semibold text-[#111827] mb-3">Add {title}</h3>
        <textarea
          value={newNote}
          onChange={(e) => setNewNote(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          className="w-full h-24 px-3 py-2 text-sm border border-[#e2e8f0] rounded-lg focus:outline-none focus:border-[#0b6cf0] focus:ring-2 focus:ring-[#0b6cf0]/20 resize-none"
          disabled={savingNote}
        />
        <div className="flex items-center justify-between mt-3">
          <span className="text-xs text-[#94a3b8]">
            Press Ctrl+Enter to submit
          </span>
          <button
            onClick={handleAddNote}
            disabled={!newNote.trim() || savingNote}
            className="px-4 py-2 text-sm font-medium text-white bg-[#0b6cf0] rounded-lg hover:bg-[#0956c4] disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
          >
            {savingNote ? (
              <>
                <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                Saving...
              </>
            ) : (
              'Add Note'
            )}
          </button>
        </div>
      </div>

      {/* Notes List */}
      {notes.length === 0 ? (
        <EmptyNotesState />
      ) : (
        <div className="space-y-4">
          {notes.map((note) => (
            <NoteCard
              key={note.id}
              note={note}
              onDelete={() => handleDeleteNote(note.id)}
              isDeleting={deletingNoteId === note.id}
            />
          ))}
        </div>
      )}
    </div>
  );
}

// Empty state component
function EmptyNotesState() {
  return (
    <div className="bg-white rounded-lg border border-[#e2e8f0] shadow-sm p-8 text-center">
      <svg 
        className="w-16 h-16 mx-auto text-[#cbd5e1] mb-4" 
        fill="none" 
        stroke="currentColor" 
        viewBox="0 0 24 24"
      >
        <path 
          strokeLinecap="round" 
          strokeLinejoin="round" 
          strokeWidth={2} 
          d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" 
        />
      </svg>
      <p className="text-[#64748b]">No notes yet</p>
      <p className="text-sm text-[#94a3b8] mt-1">Add a note to keep track of important information</p>
    </div>
  );
}

// Individual note card component
interface NoteCardProps {
  note: CandidateNote;
  onDelete: () => void;
  isDeleting: boolean;
}

function NoteCard({ note, onDelete, isDeleting }: NoteCardProps) {
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const handleDeleteClick = () => {
    if (showDeleteConfirm) {
      onDelete();
      setShowDeleteConfirm(false);
    } else {
      setShowDeleteConfirm(true);
    }
  };

  const handleCancelDelete = () => {
    setShowDeleteConfirm(false);
  };

  return (
    <div className="bg-white rounded-lg border border-[#e2e8f0] shadow-sm p-4 group">
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
          <p className="text-sm text-[#374151] whitespace-pre-wrap break-words">
            {note.content}
          </p>
          <div className="flex items-center gap-2 mt-2">
            <span className="text-xs text-[#94a3b8]">
              {note.authorName}
            </span>
            <span className="text-xs text-[#cbd5e1]">•</span>
            <span className="text-xs text-[#94a3b8]">
              {formatDateTime(note.createdAt)}
            </span>
          </div>
        </div>
        
        <div className="flex items-center gap-2 flex-shrink-0">
          {showDeleteConfirm ? (
            <>
              <button
                onClick={handleCancelDelete}
                className="px-2 py-1 text-xs font-medium text-[#64748b] hover:text-[#374151] transition-colors"
                disabled={isDeleting}
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteClick}
                disabled={isDeleting}
                className="px-2 py-1 text-xs font-medium text-white bg-[#dc2626] rounded hover:bg-[#b91c1c] disabled:opacity-50 transition-colors flex items-center gap-1"
              >
                {isDeleting ? (
                  <>
                    <svg className="animate-spin h-3 w-3" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    Deleting...
                  </>
                ) : (
                  'Confirm'
                )}
              </button>
            </>
          ) : (
            <button
              onClick={handleDeleteClick}
              className="p-1.5 text-[#94a3b8] hover:text-[#dc2626] hover:bg-[#fee2e2] rounded transition-colors opacity-0 group-hover:opacity-100"
              title="Delete note"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path 
                  strokeLinecap="round" 
                  strokeLinejoin="round" 
                  strokeWidth={2} 
                  d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" 
                />
              </svg>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

export default CandidateNotesSection;
