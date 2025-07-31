// Utility for smart matching units with case insensitivity and multilingual support

export interface Unit {
    id: number;
    name: string;
    created?: string;
}

// Common unit variations and their mappings
const UNIT_MAPPINGS: Record<string, string[]> = {
    // Square meters - various formats
    'm2': ['m²', 'm2', 'M2', 'M²', 'sq m', 'sqm', 'square meter', 'square metre', 'mètre carré', 'mètres carrés'],
    
    // Cubic meters
    'm3': ['m³', 'm3', 'M3', 'M³', 'cu m', 'cum', 'cubic meter', 'cubic metre', 'mètre cube', 'mètres cubes'],
    
    // Linear meters
    'm': ['m', 'M', 'meter', 'metre', 'linear meter', 'linear metre', 'mètre', 'mètres', 'ml', 'ML'],
    
    // Kilograms
    'kg': ['kg', 'KG', 'Kg', 'kilogram', 'kilogramme', 'kilo'],
    
    // Tons
    't': ['t', 'T', 'ton', 'tonne', 'tons', 'tonnes'],
    
    // Pieces/Units
    'pcs': ['pcs', 'PCS', 'piece', 'pieces', 'unit', 'units', 'u', 'U', 'pc', 'PC', 'pièce', 'pièces', 'unité', 'unités'],
    
    // Units (alternative key for pieces)
    'U': ['u', 'U', 'unit', 'units', 'pcs', 'PCS', 'piece', 'pieces', 'pc', 'PC', 'each', 'EA'],
    
    // Liters
    'l': ['l', 'L', 'liter', 'litre', 'litres', 'liters'],
    
    // Hours
    'h': ['h', 'H', 'hour', 'hours', 'hr', 'hrs', 'heure', 'heures'],
    
    // Days
    'day': ['day', 'days', 'jour', 'jours'],
    
    // Each/Item
    'each': ['each', 'item', 'items', 'ea', 'EA', 'chaque', 'article'],
    
    // Centimeters
    'cm': ['cm', 'CM', 'centimeter', 'centimetre', 'centimètre', 'centimètres'],
    
    // Millimeters
    'mm': ['mm', 'MM', 'millimeter', 'millimetre', 'millimètre', 'millimètres']
};

// Normalize text for comparison
const normalizeText = (text: string): string => {
    return text
        .toLowerCase()
        .trim()
        // Replace superscript and subscript numbers
        .replace(/²/g, '2')
        .replace(/³/g, '3')
        .replace(/₂/g, '2')
        .replace(/₃/g, '3')
        // Remove extra spaces
        .replace(/\s+/g, ' ');
};

// Find the best matching unit from the available units list
export const findBestUnitMatch = (inputUnit: string, availableUnits: Unit[]): Unit | null => {
    if (!inputUnit || !availableUnits || availableUnits.length === 0) {
        return null;
    }

    const normalizedInput = normalizeText(inputUnit);
    
    // First, try exact match (case insensitive)
    const exactMatch = availableUnits.find(unit => 
        normalizeText(unit.name) === normalizedInput
    );
    if (exactMatch) return exactMatch;

    // Then try pattern matching using our mappings
    for (const [standardUnit, variations] of Object.entries(UNIT_MAPPINGS)) {
        // Check if input matches any variation
        const inputMatchesVariation = variations.some(variation => 
            normalizeText(variation) === normalizedInput
        );
        
        if (inputMatchesVariation) {
            // Find a unit from available units that matches this standard or any of its variations
            const matchingUnit = availableUnits.find(unit => {
                const normalizedUnitName = normalizeText(unit.name);
                const matchesStandard = normalizedUnitName === standardUnit;
                const matchesVariation = variations.some(variation => normalizeText(variation) === normalizedUnitName);
                
                return matchesStandard || matchesVariation;
            });
            
            if (matchingUnit) return matchingUnit;
        }
    }

    // Finally, try partial matching (contains)
    const partialMatch = availableUnits.find(unit => {
        const normalizedUnitName = normalizeText(unit.name);
        return normalizedUnitName.includes(normalizedInput) || 
               normalizedInput.includes(normalizedUnitName);
    });

    return partialMatch || null;
};

// Get the display value for a unit (prioritize shorter, cleaner versions)
export const getUnitDisplayValue = (unit: Unit): string => {
    const name = unit.name;
    
    // If it's already a clean short form, use it
    if (['m²', 'm³', 'm', 'kg', 't', 'l', 'h', 'cm', 'mm', 'pcs'].includes(name.toLowerCase())) {
        return name;
    }
    
    // Otherwise, try to find a shorter equivalent
    for (const [shortForm, variations] of Object.entries(UNIT_MAPPINGS)) {
        if (variations.some(variation => 
            normalizeText(variation) === normalizeText(name)
        )) {
            // Return the most appropriate short form
            switch (shortForm) {
                case 'm2': return 'm²';
                case 'm3': return 'm³';
                default: return shortForm;
            }
        }
    }
    
    return name; // Return original if no better option found
};

// Validate if a unit string is likely a valid unit
export const isLikelyUnit = (text: string): boolean => {
    if (!text || text.trim().length === 0) return false;
    
    const normalized = normalizeText(text);
    
    // Check against all known variations
    for (const variations of Object.values(UNIT_MAPPINGS)) {
        if (variations.some(variation => normalizeText(variation) === normalized)) {
            return true;
        }
    }
    
    // Additional heuristics for unknown units
    const unitPatterns = [
        /^[a-z]{1,5}$/i,           // Short abbreviations (m, kg, etc.)
        /^[a-z]+[²³₂₃]$/i,         // Units with superscript/subscript
        /^[a-z]+\s*\/\s*[a-z]+$/i, // Compound units (m/s, kg/m³)
    ];
    
    return unitPatterns.some(pattern => pattern.test(normalized));
};