/**
 * Компонент выбора площадки театра.
 */

import { useEffect, useState } from 'react';
import { Select } from '@/components/ui/Select';
import { MapPin } from 'lucide-react';
import api from '@/services/api';

interface Venue {
  id: number;
  name: string;
  code: string;
  venueType: string;
  capacity: number | null;
}

interface VenueSelectProps {
  value?: number | null;
  onChange: (value: number | null) => void;
  label?: string;
  placeholder?: string;
  error?: string;
  disabled?: boolean;
  required?: boolean;
}

export function VenueSelect({
  value,
  onChange,
  label = 'Площадка',
  placeholder = 'Выберите площадку',
  error,
  disabled,
  required,
}: VenueSelectProps) {
  const [venues, setVenues] = useState<Venue[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isCancelled = false;

    const fetchVenues = async () => {
      try {
        const response = await api.get('/venues');
        if (!isCancelled) {
          // Transform snake_case to camelCase
          const data = response.data.map((v: Record<string, unknown>) => ({
            id: v.id as number,
            name: v.name as string,
            code: v.code as string,
            venueType: v.venue_type as string,
            capacity: v.capacity as number | null,
          }));
          setVenues(data);
        }
      } catch (err) {
        console.error('Failed to load venues:', err);
      } finally {
        if (!isCancelled) {
          setLoading(false);
        }
      }
    };

    fetchVenues();

    return () => {
      isCancelled = true;
    };
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const val = e.target.value;
    onChange(val ? parseInt(val, 10) : null);
  };

  const options = venues.map((v) => ({
    value: String(v.id),
    label: v.capacity ? `${v.name} (${v.capacity} мест)` : v.name,
  }));

  return (
    <Select
      label={label}
      placeholder={placeholder}
      value={value ? String(value) : ''}
      onChange={handleChange}
      options={options}
      error={error}
      disabled={disabled || loading}
      leftIcon={<MapPin className="w-4 h-4" />}
      required={required}
    />
  );
}

export default VenueSelect;
