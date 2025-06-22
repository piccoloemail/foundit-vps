'use client';

import { useState } from 'react';
import { SearchFilters } from '@/hooks/useSearch';

interface SearchFiltersProps {
  filters: SearchFilters;
  onUpdateFilter: (key: keyof SearchFilters, value: any) => void;
  onClearFilters: () => void;
  onExecuteSearch: () => void;
  isSearching: boolean;
  availableTypes: string[];
  availableCategories: string[];
  availableTags: string[];
  hasActiveFilters: boolean;
}

const TYPE_ICONS: Record<string, string> = {
  link: '🔗',
  text: '📝',
  video: '📺',
  image: '📸',
  document: '📄',
  note: '💡',
};

export default function SearchFilters({
  filters,
  onUpdateFilter,
  onClearFilters,
  onExecuteSearch,
  isSearching,
  availableTypes,
  availableCategories,
  availableTags,
  hasActiveFilters,
}: SearchFiltersProps) {
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [tagInput, setTagInput] = useState('');

  const handleAddTag = (tag: string) => {
    if (tag && !filters.tags.includes(tag)) {
      onUpdateFilter('tags', [...filters.tags, tag]);
    }
    setTagInput('');
  };

  const handleRemoveTag = (tagToRemove: string) => {
    onUpdateFilter('tags', filters.tags.filter(tag => tag !== tagToRemove));
  };

  const handleTagInputKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleAddTag(tagInput.trim());
    }
  };

  return (
    <div className="search-filters">
      {/* Main Search Bar */}
      <div className="search-bar">
        <div className="search-input-wrapper">
          <span className="search-icon">🔍</span>
          <input
            type="text"
            placeholder="Search your memories... (Press Enter or click search)"
            className="search-input"
            value={filters.query}
            onChange={(e) => onUpdateFilter('query', e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && onExecuteSearch()}
          />
        </div>

        {/* Search Button */}
        <button 
          className="search-button"
          onClick={onExecuteSearch}
          disabled={isSearching || !filters.query.trim()}
          title={isSearching ? 'Searching...' : 'Search'}
        >
          {isSearching ? '⏳' : '🔍'}
        </button>

        {/* Search Mode Switch - Moved to the right of search button */}
        <select
          className="search-mode-select"
          value={filters.searchMode}
          onChange={(e) => onUpdateFilter('searchMode', e.target.value)}
          title="Search mode"
        >
          <option value="auto">🤖 Auto</option>
          <option value="literal">⚡ Literal</option>
          <option value="semantic">🧠 AI</option>
        </select>

        {/* Quick Filters */}
        <select
          className="filter-select"
          value={filters.type}
          onChange={(e) => onUpdateFilter('type', e.target.value)}
        >
          <option value="all">All Types</option>
          {availableTypes.map(type => (
            <option key={type} value={type}>
              {type === 'link' ? '🌐' : TYPE_ICONS[type]} {type === 'link' ? 'Website' : type.charAt(0).toUpperCase() + type.slice(1)}
            </option>
          ))}
        </select>

        <select
          className="filter-select"
          value={filters.category}
          onChange={(e) => onUpdateFilter('category', e.target.value)}
        >
          <option value="all">All Categories</option>
          {availableCategories.map(category => (
            <option key={category} value={category}>{category}</option>
          ))}
        </select>

        {/* Advanced Filters Toggle */}
        <button
          className="filter-button"
          onClick={() => setShowAdvanced(!showAdvanced)}
          title="Advanced filters"
        >
          ⚙️
        </button>

        {/* Clear Filters */}
        {hasActiveFilters && (
          <button
            className="clear-filters-button"
            onClick={onClearFilters}
            title="Clear all filters"
          >
            ✕ Clear
          </button>
        )}
      </div>

      {/* Advanced Filters Panel */}
      {showAdvanced && (
        <div className="advanced-filters">
          <div className="filter-group">
            <label>Date Range:</label>
            <select
              value={filters.dateRange}
              onChange={(e) => onUpdateFilter('dateRange', e.target.value as any)}
            >
              <option value="all">All Time</option>
              <option value="today">Today</option>
              <option value="week">Last Week</option>
              <option value="month">Last Month</option>
              <option value="year">Last Year</option>
            </select>
          </div>

          <div className="filter-group">
            <label>Tags:</label>
            <div className="tags-filter">
              <div className="tag-input-wrapper">
                <input
                  type="text"
                  placeholder="Add tag to filter..."
                  value={tagInput}
                  onChange={(e) => setTagInput(e.target.value)}
                  onKeyDown={handleTagInputKeyPress}
                  list="available-tags"
                />
                <datalist id="available-tags">
                  {availableTags.map(tag => (
                    <option key={tag} value={tag} />
                  ))}
                </datalist>
                <button
                  type="button"
                  onClick={() => handleAddTag(tagInput.trim())}
                  disabled={!tagInput.trim()}
                >
                  Add
                </button>
              </div>
              {filters.tags.length > 0 && (
                <div className="selected-tags">
                  {filters.tags.map(tag => (
                    <span key={tag} className="selected-tag">
                      {tag}
                      <button onClick={() => handleRemoveTag(tag)}>×</button>
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="filter-group">
            <label>Quick Tag Filters:</label>
            <div className="quick-tags">
              {availableTags.slice(0, 10).map(tag => (
                <button
                  key={tag}
                  className={`quick-tag ${filters.tags.includes(tag) ? 'active' : ''}`}
                  onClick={() => {
                    if (filters.tags.includes(tag)) {
                      handleRemoveTag(tag);
                    } else {
                      handleAddTag(tag);
                    }
                  }}
                >
                  {tag}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}