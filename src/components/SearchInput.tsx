import React from "react";

interface SearchInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  showResultsCount?: boolean;
  resultsCount?: number;
  size?: "sm" | "md" | "lg";
}

const SearchInput: React.FC<SearchInputProps> = ({
  value,
  onChange,
  placeholder = "Search",
  className = "",
  showResultsCount = false,
  resultsCount = 0,
  size = "md"
}) => {
  const sizeClasses = {
    sm: "w-12 sm:w-44",
    md: "w-12 sm:w-52", 
    lg: "w-12 sm:w-64"
  };

  return (
    <div className="relative group">
      {/* Search Icon */}
      <div className="absolute inset-y-0 left-0 flex items-center justify-center pl-4 pointer-events-none z-10">
        <span className="iconify lucide--search h-5 w-5 text-base-content/50"></span>
      </div>
      
      {/* Search Input - Integrated Design */}
      <input
        type="text"
        className={`input table-search-input ${sizeClasses[size]} pl-12 pr-11 bg-base-200 text-base-content border border-base-300 focus:border-base-300 focus:bg-base-200 transition-all duration-200 rounded-xl placeholder:text-base-content/50 hover:border-primary/50 text-sm focus:outline-none sm:placeholder:text-base-content/50 placeholder:text-transparent ${className}`}
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
      
      {/* Clear Button */}
      {value && (
        <button
          className="absolute inset-y-0 right-0 flex items-center justify-center pr-3 text-base-content/40 hover:text-error transition-colors duration-200 z-10"
          onClick={() => onChange("")}
        >
          <span className="iconify lucide--x h-4 w-4"></span>
        </button>
      )}
      
      {/* Search Results Counter */}
      {showResultsCount && value && (
        <div className="absolute -bottom-8 left-1/2 transform -translate-x-1/2 z-20">
          <span className="text-xs text-primary/60 bg-base-100 px-2 py-1 rounded-full border border-primary/20 shadow-sm">
            {resultsCount} result{resultsCount !== 1 ? 's' : ''}
          </span>
        </div>
      )}
    </div>
  );
};

export default SearchInput; 