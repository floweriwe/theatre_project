/**
 * Компонент выбора цеха театра.
 */

import { useEffect, useState } from 'react';
import { Select } from '@/components/ui/Select';
import { Building2 } from 'lucide-react';
import api from '@/services/api';

interface Department {
  id: number;
  name: string;
  code: string;
  departmentType: string;
}

interface DepartmentSelectProps {
  value?: number | null;
  onChange: (value: number | null) => void;
  label?: string;
  placeholder?: string;
  error?: string;
  disabled?: boolean;
  required?: boolean;
}

export function DepartmentSelect({
  value,
  onChange,
  label = 'Цех',
  placeholder = 'Выберите цех',
  error,
  disabled,
  required,
}: DepartmentSelectProps) {
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isCancelled = false;

    const fetchDepartments = async () => {
      try {
        const response = await api.get('/departments');
        if (!isCancelled) {
          // Transform snake_case to camelCase
          const data = response.data.map((d: Record<string, unknown>) => ({
            id: d.id as number,
            name: d.name as string,
            code: d.code as string,
            departmentType: d.department_type as string,
          }));
          setDepartments(data);
        }
      } catch (err) {
        console.error('Failed to load departments:', err);
      } finally {
        if (!isCancelled) {
          setLoading(false);
        }
      }
    };

    fetchDepartments();

    return () => {
      isCancelled = true;
    };
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const val = e.target.value;
    onChange(val ? parseInt(val, 10) : null);
  };

  const options = departments.map((d) => ({
    value: String(d.id),
    label: d.name,
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
      leftIcon={<Building2 className="w-4 h-4" />}
      required={required}
    />
  );
}

export default DepartmentSelect;
