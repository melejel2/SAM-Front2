import { useState, useEffect } from 'react';
import apiRequest from '@/api/api';
import { useAuth } from '@/contexts/auth';
import { Unit, findBestUnitMatch } from '../utils/unitMatcher';

const useBOQUnits = () => {
    const [units, setUnits] = useState<Unit[]>([]);
    const [loading, setLoading] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);

    const { getToken } = useAuth();

    const loadUnits = async () => {
        setLoading(true);
        setError(null);

        try {
            const token = getToken();
            const data = await apiRequest({
                endpoint: 'Unit/GetUnits',
                method: 'GET',
                token: token ?? '',
            });

            if (data && Array.isArray(data)) {
                setUnits(data);
            } else {
                setUnits([]);
            }
        } catch (err) {
            console.error('Error loading units:', err);
            setError('Failed to load units');
            setUnits([]);
        } finally {
            setLoading(false);
        }
    };

    // Smart match a unit string to available units
    const matchUnit = (unitString: string): Unit | null => {
        return findBestUnitMatch(unitString, units);
    };

    // Get unit by ID
    const getUnitById = (id: number): Unit | null => {
        return units.find(unit => unit.id === id) || null;
    };

    // Get units as options for dropdown
    const getUnitOptions = () => {
        return units.map(unit => ({
            value: unit.id,
            label: unit.name,
            unit: unit
        }));
    };

    // Auto-load units when hook is initialized
    useEffect(() => {
        loadUnits();
    }, []);

    return {
        units,
        loading,
        error,
        loadUnits,
        matchUnit,
        getUnitById,
        getUnitOptions,
    };
};

export default useBOQUnits;