"use client"

import * as React from "react"
import { Check, ChevronsUpDown, Plus } from "lucide-react"
import { cn } from "@/lib/utils"

export type DropdownOption = {
  value: string
  label: string
  meta?: string
  productId?: string
}

interface InputDropdownProps {
  options: DropdownOption[]
  value: string
  onChange: (value: string) => void
  onOptionSelect?: (option: DropdownOption) => void
  onAddCustomClick?: () => void
  onInputChange?: (value: string) => void
  onLoadMore?: () => void
  hasMore?: boolean
  isLoadingMore?: boolean
  isLoading?: boolean
  placeholder?: string
  className?: string
  allowCustomValue?: boolean
  inputRef?: React.RefObject<HTMLInputElement>
}

export function InputDropdown({
  options,
  value,
  onChange,
  onOptionSelect,
  onAddCustomClick,
  onInputChange,
  onLoadMore,
  hasMore = false,
  isLoadingMore = false,
  isLoading = false,
  placeholder = "Select or type ingredient",
  className,
  allowCustomValue = true,
  inputRef: externalInputRef,
}: InputDropdownProps) {
  const [isOpen, setIsOpen] = React.useState(false)
  const [inputValue, setInputValue] = React.useState(value || "")
  const [filteredOptions, setFilteredOptions] = React.useState(options)
  const containerRef = React.useRef<HTMLDivElement>(null)
  const internalInputRef = React.useRef<HTMLInputElement>(null)
  const inputRef = externalInputRef || internalInputRef
  
  // Update inputValue when value prop changes
  React.useEffect(() => {
    // Ensure the input field is updated whenever the value prop changes
    setInputValue(value || "")
    
    // If value is empty, also close the dropdown to reset the UI state
    if (!value) {
      setIsOpen(false)
    }
  }, [value])
  
  // Filter options when input changes
  React.useEffect(() => {
    if (inputValue.trim() === "") {
      setFilteredOptions(options)
    } else {
      const filtered = options.filter(option => 
        option.label.toLowerCase().includes(inputValue.toLowerCase())
      )
      setFilteredOptions(filtered)
    }
  }, [inputValue, options])
  
  // Handle scroll event to implement infinite scrolling with improved detection
  const handleScroll = React.useCallback((e: React.UIEvent<HTMLDivElement>) => {
    if (!onLoadMore || !hasMore || isLoadingMore) return;
    
    const { scrollTop, scrollHeight, clientHeight } = e.currentTarget;
    
    // Calculate scroll percentage (0 to 1)
    const scrollPercentage = scrollTop / (scrollHeight - clientHeight);
    
    // Load more when user has scrolled past 80% of the content
    // This triggers loading before they hit the absolute bottom for better UX
    if (scrollPercentage > 0.8) {
      console.log('📜 Scroll threshold reached (80%), loading more items');
      onLoadMore();
    }
  }, [onLoadMore, hasMore, isLoadingMore]);
  
  // Use Intersection Observer as a backup detection method
  const observerRef = React.useRef<HTMLDivElement>(null);
  
  React.useEffect(() => {
    if (!observerRef.current || !onLoadMore || !hasMore || isLoadingMore) return;
    
    const observer = new IntersectionObserver(
      (entries) => {
        // If the sentinel element is visible and we have more items to load
        if (entries[0].isIntersecting && hasMore && !isLoadingMore) {
          console.log('👁️ Intersection observer triggered, loading more items');
          onLoadMore();
        }
      },
      { threshold: 0.1 } // Trigger when 10% of the element is visible
    );
    
    observer.observe(observerRef.current);
    
    return () => {
      observer.disconnect();
    };
  }, [onLoadMore, hasMore, isLoadingMore]);
  
  // Handle input change
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value
    setInputValue(newValue)
    
    if (allowCustomValue) {
      onChange(newValue)
    }
    
    // Call onInputChange if provided
    if (onInputChange) {
      onInputChange(newValue)
    }
    
    if (!isOpen) {
      setIsOpen(true)
    }
  }
  
  // Handle option selection
  const handleOptionSelect = (option: DropdownOption) => {
    onChange(option.value)
    setInputValue(option.label)
    setIsOpen(false)
    
    // Call the onOptionSelect callback if provided
    if (onOptionSelect) {
      onOptionSelect(option)
      
      // Clear the input value after selection if the component is being used
      // for adding items to a list (like tags, badges, etc.)
      if (allowCustomValue) {
        // Use a small timeout to ensure the value is processed before clearing
        setTimeout(() => {
          setInputValue("")
          onChange("")
        }, 10)
      }
    }
  }
  
  // Handle custom value addition
  const handleAddCustomValue = () => {
    const currentValue = inputValue
    onChange(currentValue)
    setIsOpen(false)
    
    // Call the onOptionSelect callback if provided with a custom option
    if (onOptionSelect) {
      onOptionSelect({
        value: currentValue,
        label: currentValue
      })
      
      // Clear the input value after adding a custom value
      setTimeout(() => {
        setInputValue("")
        onChange("")
      }, 10)
    }
  }
  
  // Handle click outside to close dropdown
  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }
    
    document.addEventListener("mousedown", handleClickOutside)
    return () => {
      document.removeEventListener("mousedown", handleClickOutside)
    }
  }, [])
  
  // Check if input value is not in filtered options
  const isCustomValue = inputValue && filteredOptions.length === 0

  return (
    <div className="relative w-full" ref={containerRef}>
      <div className="relative">
        <input
          ref={inputRef}
          type="text"
          value={inputValue}
          onChange={handleInputChange}
          onFocus={() => setIsOpen(true)}
          placeholder={placeholder}
          className={cn(
            "flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
            className
          )}
        />
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          className="absolute inset-y-0 right-0 flex items-center px-2"
        >
          <ChevronsUpDown className="h-4 w-4 opacity-50" />
        </button>
      </div>
      
      {isOpen && (
        <div className="absolute z-[100] mt-1 w-full rounded-md border border-input bg-background shadow-md flex flex-col">
          {/* Scrollable options area */}
          <div className="max-h-60 overflow-auto p-1 flex-1" onScroll={handleScroll}>
            {isLoading ? (
              <div className="flex items-center justify-center py-4">
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent mr-2"></div>
                <span className="text-sm text-muted-foreground">Loading options...</span>
              </div>
            ) : filteredOptions.length > 0 ? (
              <>
                {filteredOptions.map((option, index) => (
                  <div
                    key={`${option.value}_${index}`}
                    onClick={() => handleOptionSelect(option)}
                    className={cn(
                      "flex cursor-pointer select-none items-center rounded-sm px-3 py-2 text-sm outline-none",
                      option.value === value
                        ? "bg-accent text-accent-foreground font-medium"
                        : "hover:bg-accent/50 hover:text-accent-foreground"
                    )}
                  >
                    <span className="flex-grow">{option.label}</span>
                    {option.meta && (
                      <span className="text-xs px-1.5 py-0.5 bg-muted rounded-sm text-muted-foreground">
                        {option.meta}
                      </span>
                    )}
                    {option.value === value && <Check className="h-4 w-4 ml-2" />}
                  </div>
                ))}
                
                {/* Infinite scroll loading indicator with observer reference */}
                {hasMore && (
                  <div 
                    ref={observerRef}
                    className="flex cursor-pointer select-none items-center justify-center rounded-sm px-3 py-2 text-sm outline-none border-t mt-1 pt-2 hover:bg-accent/50 text-muted-foreground"
                    onClick={() => onLoadMore && onLoadMore()}
                  >
                    {isLoadingMore ? (
                      <div className="flex items-center gap-2">
                        <div className="h-3 w-3 animate-spin rounded-full border-2 border-primary border-t-transparent"></div>
                        <span>Loading more...</span>
                      </div>
                    ) : (
                      <span>Scroll for more options</span>
                    )}
                  </div>
                )}
              </>
            ) : (
              <div className="px-3 py-2 text-sm text-muted-foreground">
                No options found
              </div>
            )}
          </div>
          
          {/* Sticky "Add" button at bottom */}
          {isCustomValue && allowCustomValue && (
            <div
              onClick={onAddCustomClick || handleAddCustomValue}
              className="sticky bottom-0 flex cursor-pointer select-none items-center rounded-sm px-3 py-2 text-sm outline-none border-t bg-background hover:bg-accent/50 hover:text-accent-foreground text-primary"
            >
              <Plus className="h-4 w-4 mr-2" />
              <span>Add "{inputValue}"</span>
            </div>
          )}
        </div>
      )}
    </div>
  )
}