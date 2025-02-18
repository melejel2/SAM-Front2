import { useState, useMemo, ReactElement, useEffect } from "react";
import { Input, InputProps } from "../Input";

interface AutoCompleteProps extends InputProps {
  options: Array<{ [key: string]: any }>; // Accepts any object as an option
  searchKey?: string; // Key used for filtering and display
  onOptionSelect?: (selectedOption: { [key: string]: any }) => void;
  selectedOptionId?: number; // Expected to be an ID (number or string)
  optionValueKey: string; // The key representing the unique identifier (e.g., 'id', 'itemId', 'code')
}

const AutoComplete = ({
  options,
  searchKey = "label",
  onOptionSelect,
  placeholder = "Type to search...",
  selectedOptionId,
  optionValueKey,
}: AutoCompleteProps): ReactElement => {
  const [inputValue, setInputValue] = useState("");
  const [showDropdown, setShowDropdown] = useState(false);

  const filteredOptions = useMemo(() => {
    return options.filter((option) =>
      (option[searchKey] || "").toLowerCase().includes(inputValue.toLowerCase())
    );
  }, [inputValue, options, searchKey]);

  const handleInputChange = (e: any) => {
    const value = e.target.value.trim();
    setInputValue(value);
    setShowDropdown(value.length > 0);
  };

  const handleOptionClick = (option: any) => {
    setInputValue(option[searchKey]); // Set input value to selected option's label
    setShowDropdown(false);
    if (onOptionSelect) onOptionSelect(option); // Trigger callback with the selected option
  };

  // Set default selected value if `selectedOptionId` is provided
  useEffect(() => {
    if (selectedOptionId !== undefined) {
      const selectedItem = options.find(
        (option) => parseInt(option[optionValueKey]) === selectedOptionId
      );
      if (selectedItem) {
        setInputValue(selectedItem[searchKey]);
      }
    }
  }, [selectedOptionId, options, optionValueKey, searchKey]);

  return (
    <div className="relative">
      <Input
        value={inputValue}
        onChange={handleInputChange}
        placeholder={placeholder}
        size="sm"
        className="border-none focus:outline-none"
      />
      {showDropdown && (
        <ul className="absolute z-10 bg-white border border-gray-300 rounded-md shadow-md max-h-60 overflow-auto w-full">
          {filteredOptions.length === 0 ? (
            <li className="p-2 bg-base-100">No options found</li>
          ) : (
            filteredOptions.map((option: any, index: number) => (
              <li
                key={option[optionValueKey] || index}
                onClick={() => handleOptionClick(option)}
                className="cursor-pointer px-4 py-2 hover:bg-base-200 bg-base-100"
              >
                {option[searchKey]}
              </li>
            ))
          )}
        </ul>
      )}
    </div>
  );
};

export default AutoComplete;
