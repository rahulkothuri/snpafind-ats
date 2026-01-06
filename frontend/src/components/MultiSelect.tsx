import { useState, useRef, useEffect, useCallback } from 'react';

/**
 * MultiSelect Component - Requirement 1.1
 * 
 * A searchable multi-select dropdown with tag display for selected items.
 * Used for skills selection and location multi-select in job forms.
 * 
 * Features:
 * - allowCustom: allows typing custom values and pressing Enter to add them
 * - Fixed overflow issues with proper z-index and container handling
 */

export interface MultiSelectOption {
  value: string;
  label: string;
}

export interface MultiSelectProps {
  id?: string;
  options: MultiSelectOption[];
  value: string[];
  onChange: (value: string[]) => void;
  placeholder?: string;
  searchPlaceholder?: string;
  disabled?: boolean;
  error?: boolean;
  maxDisplayTags?: number;
  allowCustom?: boolean; // New prop: allow adding custom values
  customPlaceholder?: string; // Placeholder when allowCustom is true
}

export function MultiSelect({
  id,
  options,
  value,
  onChange,
  placeholder = 'Select items...',
  searchPlaceholder = 'Search...',
  disabled = false,
  error = false,
  maxDisplayTags = 5,
  allowCustom = false,
  customPlaceholder = 'Type and press Enter to add...',
}: MultiSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLUListElement>(null);

  // Filter options based on search term and exclude already selected
  const filteredOptions = options.filter(
    (option) =>
      option.label.toLowerCase().includes(searchTerm.toLowerCase()) &&
      !value.includes(option.value)
  );

  // Get selected option labels for display (handle both predefined and custom values)
  const getOptionLabel = (val: string) => {
    const option = options.find((opt) => opt.value === val);
    return option ? option.label : val; // Show custom value as-is if not in options
  };

  // Determine if the current search term is a new custom value
  const canAddCustomValue = allowCustom &&
    searchTerm.trim() !== '' &&
    !value.includes(searchTerm.trim()) &&
    !options.some(opt => opt.value.toLowerCase() === searchTerm.trim().toLowerCase());

  // Handle click outside to close dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        setSearchTerm('');
        setHighlightedIndex(-1);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Scroll highlighted option into view
  useEffect(() => {
    if (highlightedIndex >= 0 && listRef.current) {
      const highlightedElement = listRef.current.children[highlightedIndex] as HTMLElement;
      if (highlightedElement) {
        highlightedElement.scrollIntoView({ block: 'nearest' });
      }
    }
  }, [highlightedIndex]);

  // Add custom value
  const handleAddCustom = () => {
    const customValue = searchTerm.trim();
    if (customValue && !value.includes(customValue)) {
      onChange([...value, customValue]);
      setSearchTerm('');
      setHighlightedIndex(-1);
      inputRef.current?.focus();
    }
  };

  // Handle keyboard navigation
  const handleKeyDown = useCallback(
    (event: React.KeyboardEvent) => {
      if (disabled) return;

      switch (event.key) {
        case 'ArrowDown':
          event.preventDefault();
          if (!isOpen) {
            setIsOpen(true);
          } else {
            setHighlightedIndex((prev) =>
              prev < filteredOptions.length - 1 ? prev + 1 : prev
            );
          }
          break;
        case 'ArrowUp':
          event.preventDefault();
          setHighlightedIndex((prev) => (prev > 0 ? prev - 1 : 0));
          break;
        case 'Enter':
          event.preventDefault();
          if (isOpen && highlightedIndex >= 0 && filteredOptions[highlightedIndex]) {
            handleSelect(filteredOptions[highlightedIndex].value);
          } else if (canAddCustomValue) {
            // Add custom value when pressing Enter
            handleAddCustom();
          } else if (!isOpen) {
            setIsOpen(true);
          }
          break;
        case 'Escape':
          setIsOpen(false);
          setSearchTerm('');
          setHighlightedIndex(-1);
          break;
        case 'Backspace':
          if (searchTerm === '' && value.length > 0) {
            // Remove last selected item
            onChange(value.slice(0, -1));
          }
          break;
      }
    },
    [disabled, isOpen, highlightedIndex, filteredOptions, searchTerm, value, onChange, canAddCustomValue]
  );

  const handleSelect = (optionValue: string) => {
    onChange([...value, optionValue]);
    setSearchTerm('');
    setHighlightedIndex(-1);
    inputRef.current?.focus();
  };

  const handleRemove = (optionValue: string) => {
    onChange(value.filter((v) => v !== optionValue));
  };

  const handleContainerClick = () => {
    if (!disabled) {
      setIsOpen(true);
      inputRef.current?.focus();
    }
  };

  // Determine the placeholder text
  const getPlaceholder = () => {
    if (value.length === 0) {
      return allowCustom ? customPlaceholder : placeholder;
    }
    return allowCustom ? 'Add more...' : searchPlaceholder;
  };

  return (
    <div ref={containerRef} className="relative">
      {/* Selected tags and search input container */}
      <div
        onClick={handleContainerClick}
        className={`
          min-h-[42px] px-3 py-2 border rounded-lg bg-white
          flex flex-wrap items-center gap-1.5 cursor-text overflow-visible
          ${error ? 'border-red-500' : 'border-[#e2e8f0]'}
          ${disabled ? 'bg-gray-100 cursor-not-allowed' : 'hover:border-[#0b6cf0]'}
          ${isOpen ? 'ring-2 ring-[#0b6cf0] border-transparent' : ''}
        `}
      >
        {/* Selected tags */}
        {value.slice(0, maxDisplayTags).map((val) => (
          <span
            key={val}
            className="inline-flex items-center gap-1 px-2 py-0.5 bg-[#e8f4fd] text-[#0b6cf0] text-sm rounded-md whitespace-nowrap"
          >
            {getOptionLabel(val)}
            {!disabled && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  handleRemove(val);
                }}
                className="hover:text-[#0a5ed4] focus:outline-none"
                aria-label={`Remove ${getOptionLabel(val)}`}
              >
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            )}
          </span>
        ))}

        {/* Show count if more items selected than maxDisplayTags */}
        {value.length > maxDisplayTags && (
          <span className="text-sm text-[#64748b]">
            +{value.length - maxDisplayTags} more
          </span>
        )}

        {/* Search input */}
        <input
          ref={inputRef}
          id={id}
          type="text"
          value={searchTerm}
          onChange={(e) => {
            setSearchTerm(e.target.value);
            setHighlightedIndex(0);
            if (!isOpen) setIsOpen(true);
          }}
          onKeyDown={handleKeyDown}
          onFocus={() => !disabled && setIsOpen(true)}
          placeholder={getPlaceholder()}
          disabled={disabled}
          className="flex-1 min-w-[120px] outline-none text-sm text-[#111827] placeholder-[#9ca3af] bg-transparent disabled:cursor-not-allowed"
          autoComplete="off"
        />

        {/* Dropdown arrow */}
        <svg
          className={`w-4 h-4 text-[#64748b] transition-transform flex-shrink-0 ${isOpen ? 'rotate-180' : ''}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </div>

      {/* Dropdown options */}
      {isOpen && !disabled && (
        <ul
          ref={listRef}
          className="absolute z-[100] w-full mt-1 max-h-60 overflow-auto bg-white border border-[#e2e8f0] rounded-lg shadow-lg"
          role="listbox"
        >
          {/* Custom value option - show at top when user can add */}
          {canAddCustomValue && (
            <li
              onClick={handleAddCustom}
              className="px-3 py-2 text-sm cursor-pointer bg-green-50 text-green-700 hover:bg-green-100 border-b border-green-100 flex items-center gap-2"
              role="option"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Add "{searchTerm.trim()}"
            </li>
          )}

          {filteredOptions.length === 0 && !canAddCustomValue ? (
            <li className="px-3 py-2 text-sm text-[#64748b]">
              {searchTerm ? (allowCustom ? 'Press Enter to add custom value' : 'No matching options') : 'No options available'}
            </li>
          ) : (
            filteredOptions.map((option, index) => (
              <li
                key={option.value}
                onClick={() => handleSelect(option.value)}
                onMouseEnter={() => setHighlightedIndex(index)}
                className={`
                  px-3 py-2 text-sm cursor-pointer
                  ${highlightedIndex === index ? 'bg-[#e8f4fd] text-[#0b6cf0]' : 'text-[#111827] hover:bg-gray-50'}
                `}
                role="option"
                aria-selected={highlightedIndex === index}
              >
                {option.label}
              </li>
            ))
          )}
        </ul>
      )}
    </div>
  );
}

export default MultiSelect;

