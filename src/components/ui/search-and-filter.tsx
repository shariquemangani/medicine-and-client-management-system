'use client'

import React, { useState, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Search, X, Filter } from 'lucide-react';

interface SearchAndFilterProps {
  searchValue: string;
  onSearchChange: (value: string) => void;
  placeholder?: string;
  showFilters?: boolean;
  onToggleFilters?: () => void;
  activeFiltersCount?: number;
  isSearching?: boolean;
  className?: string;
}

export function SearchAndFilter({
  searchValue,
  onSearchChange,
  placeholder = "Search...",
  showFilters = false,
  onToggleFilters,
  activeFiltersCount = 0,
  isSearching = false,
  className = ""
}: SearchAndFilterProps) {
  const [localSearchValue, setLocalSearchValue] = useState(searchValue);

  // Sync local state with prop changes
  useEffect(() => {
    setLocalSearchValue(searchValue);
  }, [searchValue]);

  const handleSearchChange = (value: string) => {
    setLocalSearchValue(value);
    onSearchChange(value);
  };

  const handleClearSearch = () => {
    setLocalSearchValue('');
    onSearchChange('');
  };

  return (
    <div className={`flex flex-wrap gap-2 items-center ${className}`}>
      <div className="relative flex-1 min-w-[200px]">
        <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
          {isSearching ? (
            <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-primary"></div>
          ) : (
            <Search className="h-4 w-4 text-muted-foreground" />
          )}
        </div>
        <Input
          placeholder={placeholder}
          className="pl-10 pr-10 h-10 rounded-lg bg-muted/30"
          value={localSearchValue}
          onChange={(e) => handleSearchChange(e.target.value)}
        />
        {localSearchValue && (
          <button
            type="button"
            onClick={handleClearSearch}
            className="absolute inset-y-0 right-0 flex items-center pr-3 text-muted-foreground hover:text-foreground transition-colors"
            aria-label="Clear search"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      {onToggleFilters && (
        <Button
          variant="outline"
          size="icon"
          className="h-10 w-10 rounded-md border border-input bg-background relative"
          onClick={onToggleFilters}
          aria-label={showFilters ? 'Hide filters' : 'Show filters'}
        >
          {showFilters ? (
            <X className="h-4 w-4" />
          ) : (
            <>
              <Filter className="h-4 w-4" />
              {activeFiltersCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-primary text-primary-foreground text-xs rounded-full w-4 h-4 flex items-center justify-center">
                  {activeFiltersCount}
                </span>
              )}
            </>
          )}
        </Button>
      )}
    </div>
  );
}
