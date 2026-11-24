import { useEffect, useState } from 'react';
import { API_BASE_URL } from '../components/config';

const useBrandNames = () => {
  const [brandNames, setBrandNames] = useState([]);

  useEffect(() => {
    let active = true;

    const loadBrandNames = async () => {
      const response = await fetch(`${API_BASE_URL}/api/brands`);
      if (!response.ok) {
        throw new Error(`Failed to load brands: ${response.status}`);
      }

      const data = await response.json();
      if (!Array.isArray(data)) {
        throw new Error('Invalid brands response');
      }

      const uniqueNames = new Map();
      data.forEach((brand) => {
        const name = typeof brand.name === 'string' ? brand.name.trim() : '';
        const key = name.toLowerCase();
        if (key && !uniqueNames.has(key)) {
          uniqueNames.set(key, name);
        }
      });

      if (active) {
        setBrandNames([...uniqueNames.values()].sort((a, b) => a.localeCompare(b)));
      }
    };

    loadBrandNames().catch((error) => {
      console.error('Error loading brands:', error);
    });

    return () => {
      active = false;
    };
  }, []);

  return brandNames;
};

export default useBrandNames;
