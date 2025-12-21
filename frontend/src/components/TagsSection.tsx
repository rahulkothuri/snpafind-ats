/**
 * CandidateTagsSection Component - Requirements 7.1, 7.2
 * 
 * Features:
 * - Display existing tags as colored badges
 * - Add tag input with autocomplete from existing tags
 * - Remove tags with click
 * - Support for creating new tags
 */

import { useState, useEffect, useRef, useCallback } from 'react';

// Tag color palette for visual variety
const TAG_COLORS = [
  { bg: 'bg-[#dbeafe]', text: 'text-[#1e40af]', hover: 'hover:bg-[#bfdbfe]' },
  { bg: 'bg-[#dcfce7]', text: 'text-[#166534]', hover: 'hover:bg-[#bbf7d0]' },
  { bg: 'bg-[#fef3c7]', text: 'text-[#92400e]', hover: 'hover:bg-[#fde68a]' },
  { bg: 'bg-[#fce7f3]', text: 'text-[#9d174d]', hover: 'hover:bg-[#fbcfe8]' },
  { bg: 'bg-[#e0e7ff]', text: 'text-[#4338ca]', hover: 'hover:bg-[#c7d2fe]' },
  { bg: 'bg-[#ccfbf1]', text: 'text-[#0f766e]', hover: 'hover:bg-[#99f6e4]' },
  { bg: 'bg-[#fee2e2]', text: 'text-[#991b1b]', hover: 'hover:bg-[#fecaca]' },
  { bg: 'bg-[#f3e8ff]', text: 'text-[#7c3aed]', hover: 'hover:bg-[#e9d5ff]' },
];

// Get consistent color for a tag based on its name
function getTagColor(tag: string): typeof TAG_COLORS[0] {
  const hash = tag.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
  return TAG_COLORS[hash % TAG_COLORS.length];
}

export interface CandidateTagsSectionProps {
  /** Array of current tags */
  tags: string[];
  /** Array of all available tags for autocomplete */
  availableTags: string[];
  /** Callback when a tag is added */
  onAddTag: (tag: string) => Promise<void>;
  /** Callback when a tag is removed */
  onRemoveTag: (tag: string) => Promise<void>;
  /** Whether the component is in a loading state */
  isLoading?: boolean;
  /** Title for the section */
  title?: string;
}

export function CandidateTagsSection({
  tags,
  availableTags,
  onAddTag,
  onRemoveTag,
  isLoading = false,
  title = 'Tags',
}: CandidateTagsSectionProps) {
  const [inputValue, setInputValue] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [addingTag, setAddingTag] = useState(false);
  const [removingTag, setRemovingTag] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const suggestionsRef = useRef<HTMLDivElement>(null);

  // Filter suggestions based on input
  const filteredSuggestions = availableTags.filter(
    (tag) =>
      tag.toLowerCase().includes(inputValue.toLowerCase()) &&
      !tags.includes(tag)
  );

  // Handle click outside to close suggestions
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        suggestionsRef.current &&
        !suggestionsRef.current.contains(event.target as Node) &&
        inputRef.current &&
        !inputRef.current.contains(event.target as Node)
      ) {
        setShowSuggestions(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Handle adding a tag
  const handleAddTag = useCallback(async (tag: string) => {
    const trimmedTag = tag.trim();
    if (!trimmedTag || addingTag) return;
    
    // Check if tag already exists
    if (tags.includes(trimmedTag)) {
      setError('Tag already exists');
      return;
    }

    setAddingTag(true);
    setError(null);
    try {
      await onAddTag(trimmedTag);
      setInputValue('');
      setShowSuggestions(false);
    } catch (err) {
      console.error('Error adding tag:', err);
      setError('Failed to add tag');
    } finally {
      setAddingTag(false);
    }
  }, [tags, addingTag, onAddTag]);

  // Handle removing a tag
  const handleRemoveTag = async (tag: string) => {
    if (removingTag) return;
    
    setRemovingTag(tag);
    setError(null);
    try {
      await onRemoveTag(tag);
    } catch (err) {
      console.error('Error removing tag:', err);
      setError('Failed to remove tag');
    } finally {
      setRemovingTag(null);
    }
  };

  // Handle input key events
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      if (inputValue.trim()) {
        handleAddTag(inputValue);
      }
    } else if (e.key === 'Escape') {
      setShowSuggestions(false);
      inputRef.current?.blur();
    }
  };

  // Handle suggestion click
  const handleSuggestionClick = (tag: string) => {
    handleAddTag(tag);
  };

  if (isLoading) {
    return (
      <div className="bg-white rounded-lg border border-[#e2e8f0] shadow-sm p-4">
        <div className="animate-pulse">
          <div className="h-4 bg-[#e2e8f0] rounded w-16 mb-3"></div>
          <div className="flex flex-wrap gap-2">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-6 bg-[#f1f5f9] rounded-full w-16"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg border border-[#e2e8f0] shadow-sm p-4">
      <h3 className="text-sm font-semibold text-[#111827] mb-3">{title}</h3>
      
      {/* Tags Display */}
      <div className="flex flex-wrap gap-2 mb-3">
        {tags.length === 0 ? (
          <p className="text-sm text-[#94a3b8]">No tags added yet</p>
        ) : (
          tags.map((tag) => {
            const color = getTagColor(tag);
            const isRemoving = removingTag === tag;
            
            return (
              <span
                key={tag}
                className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium transition-colors ${color.bg} ${color.text} ${isRemoving ? 'opacity-50' : ''}`}
              >
                {tag}
                <button
                  onClick={() => handleRemoveTag(tag)}
                  disabled={isRemoving}
                  className={`ml-0.5 p-0.5 rounded-full ${color.hover} transition-colors focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-[#0b6cf0]`}
                  title={`Remove ${tag}`}
                >
                  {isRemoving ? (
                    <svg className="w-3 h-3 animate-spin" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                  ) : (
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  )}
                </button>
              </span>
            );
          })
        )}
      </div>

      {/* Add Tag Input */}
      <div className="relative">
        <div className="flex items-center gap-2">
          <div className="relative flex-1">
            <input
              ref={inputRef}
              type="text"
              value={inputValue}
              onChange={(e) => {
                setInputValue(e.target.value);
                setShowSuggestions(true);
                setError(null);
              }}
              onFocus={() => setShowSuggestions(true)}
              onKeyDown={handleKeyDown}
              placeholder="Add a tag..."
              className="w-full px-3 py-2 text-sm border border-[#e2e8f0] rounded-lg focus:outline-none focus:border-[#0b6cf0] focus:ring-2 focus:ring-[#0b6cf0]/20"
              disabled={addingTag}
            />
            
            {/* Autocomplete Suggestions */}
            {showSuggestions && inputValue && filteredSuggestions.length > 0 && (
              <div
                ref={suggestionsRef}
                className="absolute z-10 w-full mt-1 bg-white border border-[#e2e8f0] rounded-lg shadow-lg max-h-48 overflow-y-auto"
              >
                {filteredSuggestions.map((suggestion) => {
                  const color = getTagColor(suggestion);
                  return (
                    <button
                      key={suggestion}
                      onClick={() => handleSuggestionClick(suggestion)}
                      className="w-full px-3 py-2 text-left text-sm hover:bg-[#f8fafc] flex items-center gap-2 transition-colors"
                    >
                      <span className={`px-2 py-0.5 rounded-full text-xs ${color.bg} ${color.text}`}>
                        {suggestion}
                      </span>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
          
          <button
            onClick={() => handleAddTag(inputValue)}
            disabled={!inputValue.trim() || addingTag}
            className="px-3 py-2 text-sm font-medium text-white bg-[#0b6cf0] rounded-lg hover:bg-[#0956c4] disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-1"
          >
            {addingTag ? (
              <>
                <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                Adding...
              </>
            ) : (
              <>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                Add
              </>
            )}
          </button>
        </div>
        
        {/* Hint text */}
        <p className="text-xs text-[#94a3b8] mt-1">
          Press Enter to add a tag, or select from suggestions
        </p>
      </div>

      {/* Error Message */}
      {error && (
        <div className="mt-2 p-2 bg-[#fef2f2] border border-[#fecaca] rounded-lg">
          <p className="text-xs text-[#dc2626] flex items-center gap-1">
            <svg className="w-3 h-3 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            {error}
          </p>
        </div>
      )}
    </div>
  );
}

export default CandidateTagsSection;
