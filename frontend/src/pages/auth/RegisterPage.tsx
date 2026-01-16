import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
  Mail, 
  Lock, 
  Eye, 
  EyeOff, 
  User,
  Building2,
  Phone,
  ArrowRight,
  Check,
  AlertCircle
} from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { Alert } from '../../components/ui/Alert';

interface RegisterFormData {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  theaterId: string;
  password: string;
  confirmPassword: string;
  agreeToTerms: boolean;
}

interface FormErrors {
  firstName?: string;
  lastName?: string;
  email?: string;
  phone?: string;
  theaterId?: string;
  password?: string;
  confirmPassword?: string;
  agreeToTerms?: string;
}

const theaters = [
  { id: '1', name: 'Ãâ€˜ÃÂ¾ÃÂ»Ã‘Å’Ã‘Ë†ÃÂ¾ÃÂ¹ Ã‘â€šÃÂµÃÂ°Ã‘â€šÃ‘â‚¬' },
  { id: '2', name: 'ÃÅ“ÃÂ°Ã‘â‚¬ÃÂ¸ÃÂ¸ÃÂ½Ã‘ÂÃÂºÃÂ¸ÃÂ¹ Ã‘â€šÃÂµÃÂ°Ã‘â€šÃ‘â‚¬' },
  { id: '3', name: 'ÃÅ“ÃÂ¾Ã‘ÂÃÂºÃÂ¾ÃÂ²Ã‘ÂÃÂºÃÂ¸ÃÂ¹ Ã‘â€šÃÂµÃÂ°Ã‘â€šÃ‘â‚¬ ÃÂ¾ÃÂ¿ÃÂµÃ‘â‚¬ÃÂµÃ‘â€šÃ‘â€šÃ‘â€¹' },
  { id: '4', name: 'ÃÂ¢ÃÂµÃÂ°Ã‘â€šÃ‘â‚¬ ÃÂ¸ÃÂ¼. Ãâ€™ÃÂ°Ã‘â€¦Ã‘â€šÃÂ°ÃÂ½ÃÂ³ÃÂ¾ÃÂ²ÃÂ°' },
];

const passwordRequirements = [
  { id: 'length', label: 'ÃÅ“ÃÂ¸ÃÂ½ÃÂ¸ÃÂ¼Ã‘Æ’ÃÂ¼ 8 Ã‘ÂÃÂ¸ÃÂ¼ÃÂ²ÃÂ¾ÃÂ»ÃÂ¾ÃÂ²', test: (p: string) => p.length >= 8 },
  { id: 'uppercase', label: 'Ãâ€”ÃÂ°ÃÂ³ÃÂ»ÃÂ°ÃÂ²ÃÂ½ÃÂ°Ã‘Â ÃÂ±Ã‘Æ’ÃÂºÃÂ²ÃÂ°', test: (p: string) => /[A-ZÃÂ-ÃÂ¯ÃÂ]/.test(p) },
  { id: 'lowercase', label: 'ÃÂ¡Ã‘â€šÃ‘â‚¬ÃÂ¾Ã‘â€¡ÃÂ½ÃÂ°Ã‘Â ÃÂ±Ã‘Æ’ÃÂºÃÂ²ÃÂ°', test: (p: string) => /[a-zÃÂ°-Ã‘ÂÃ‘â€˜]/.test(p) },
  { id: 'number', label: 'ÃÂ¦ÃÂ¸Ã‘â€žÃ‘â‚¬ÃÂ°', test: (p: string) => /\d/.test(p) },
];

export const RegisterPage: React.FC = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState<1 | 2>(1);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState<RegisterFormData>({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    theaterId: '',
    password: '',
    confirmPassword: '',
    agreeToTerms: false,
  });
  const [errors, setErrors] = useState<FormErrors>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    const checked = (e.target as HTMLInputElement).checked;
    
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));

    // ÃÅ¾Ã‘â€¡ÃÂ¸Ã‘â€°ÃÂ°ÃÂµÃÂ¼ ÃÂ¾Ã‘Ë†ÃÂ¸ÃÂ±ÃÂºÃ‘Æ’ ÃÂ¿Ã‘â‚¬ÃÂ¸ ÃÂ¸ÃÂ·ÃÂ¼ÃÂµÃÂ½ÃÂµÃÂ½ÃÂ¸ÃÂ¸
    if (errors[name as keyof FormErrors]) {
      setErrors(prev => ({ ...prev, [name]: undefined }));
    }
  };

  const handleBlur = (field: string) => {
    setTouched(prev => ({ ...prev, [field]: true }));
    validateField(field);
  };

  const validateField = (field: string) => {
    const newErrors: FormErrors = { ...errors };

    switch (field) {
      case 'firstName':
        if (!formData.firstName.trim()) {
          newErrors.firstName = 'Ãâ€™ÃÂ²ÃÂµÃÂ´ÃÂ¸Ã‘â€šÃÂµ ÃÂ¸ÃÂ¼Ã‘Â';
        } else {
          delete newErrors.firstName;
        }
        break;
      case 'lastName':
        if (!formData.lastName.trim()) {
          newErrors.lastName = 'Ãâ€™ÃÂ²ÃÂµÃÂ´ÃÂ¸Ã‘â€šÃÂµ Ã‘â€žÃÂ°ÃÂ¼ÃÂ¸ÃÂ»ÃÂ¸Ã‘Å½';
        } else {
          delete newErrors.lastName;
        }
        break;
      case 'email':
        if (!formData.email) {
          newErrors.email = 'Ãâ€™ÃÂ²ÃÂµÃÂ´ÃÂ¸Ã‘â€šÃÂµ email';
        } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
          newErrors.email = 'ÃÂÃÂµÃÂºÃÂ¾Ã‘â‚¬Ã‘â‚¬ÃÂµÃÂºÃ‘â€šÃÂ½Ã‘â€¹ÃÂ¹ email';
        } else {
          delete newErrors.email;
        }
        break;
      case 'phone':
        if (formData.phone && !/^\+?[0-9]{10,15}$/.test(formData.phone.replace(/\s/g, ''))) {
          newErrors.phone = 'ÃÂÃÂµÃÂºÃÂ¾Ã‘â‚¬Ã‘â‚¬ÃÂµÃÂºÃ‘â€šÃÂ½Ã‘â€¹ÃÂ¹ ÃÂ½ÃÂ¾ÃÂ¼ÃÂµÃ‘â‚¬ Ã‘â€šÃÂµÃÂ»ÃÂµÃ‘â€žÃÂ¾ÃÂ½ÃÂ°';
        } else {
          delete newErrors.phone;
        }
        break;
      case 'theaterId':
        if (!formData.theaterId) {
          newErrors.theaterId = 'Ãâ€™Ã‘â€¹ÃÂ±ÃÂµÃ‘â‚¬ÃÂ¸Ã‘â€šÃÂµ Ã‘â€šÃÂµÃÂ°Ã‘â€šÃ‘â‚¬';
        } else {
          delete newErrors.theaterId;
        }
        break;
      case 'password':
        if (!formData.password) {
          newErrors.password = 'Ãâ€™ÃÂ²ÃÂµÃÂ´ÃÂ¸Ã‘â€šÃÂµ ÃÂ¿ÃÂ°Ã‘â‚¬ÃÂ¾ÃÂ»Ã‘Å’';
        } else if (!passwordRequirements.every(req => req.test(formData.password))) {
          newErrors.password = 'ÃÅ¸ÃÂ°Ã‘â‚¬ÃÂ¾ÃÂ»Ã‘Å’ ÃÂ½ÃÂµ Ã‘ÂÃÂ¾ÃÂ¾Ã‘â€šÃÂ²ÃÂµÃ‘â€šÃ‘ÂÃ‘â€šÃÂ²Ã‘Æ’ÃÂµÃ‘â€š Ã‘â€šÃ‘â‚¬ÃÂµÃÂ±ÃÂ¾ÃÂ²ÃÂ°ÃÂ½ÃÂ¸Ã‘ÂÃÂ¼';
        } else {
          delete newErrors.password;
        }
        break;
      case 'confirmPassword':
        if (!formData.confirmPassword) {
          newErrors.confirmPassword = 'ÃÅ¸ÃÂ¾ÃÂ´Ã‘â€šÃÂ²ÃÂµÃ‘â‚¬ÃÂ´ÃÂ¸Ã‘â€šÃÂµ ÃÂ¿ÃÂ°Ã‘â‚¬ÃÂ¾ÃÂ»Ã‘Å’';
        } else if (formData.password !== formData.confirmPassword) {
          newErrors.confirmPassword = 'ÃÅ¸ÃÂ°Ã‘â‚¬ÃÂ¾ÃÂ»ÃÂ¸ ÃÂ½ÃÂµ Ã‘ÂÃÂ¾ÃÂ²ÃÂ¿ÃÂ°ÃÂ´ÃÂ°Ã‘Å½Ã‘â€š';
        } else {
          delete newErrors.confirmPassword;
        }
        break;
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const validateStep1 = (): boolean => {
    const newErrors: FormErrors = {};

    if (!formData.firstName.trim()) newErrors.firstName = 'Ãâ€™ÃÂ²ÃÂµÃÂ´ÃÂ¸Ã‘â€šÃÂµ ÃÂ¸ÃÂ¼Ã‘Â';
    if (!formData.lastName.trim()) newErrors.lastName = 'Ãâ€™ÃÂ²ÃÂµÃÂ´ÃÂ¸Ã‘â€šÃÂµ Ã‘â€žÃÂ°ÃÂ¼ÃÂ¸ÃÂ»ÃÂ¸Ã‘Å½';
    if (!formData.email) {
      newErrors.email = 'Ãâ€™ÃÂ²ÃÂµÃÂ´ÃÂ¸Ã‘â€šÃÂµ email';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'ÃÂÃÂµÃÂºÃÂ¾Ã‘â‚¬Ã‘â‚¬ÃÂµÃÂºÃ‘â€šÃÂ½Ã‘â€¹ÃÂ¹ email';
    }
    if (formData.phone && !/^\+?[0-9]{10,15}$/.test(formData.phone.replace(/\s/g, ''))) {
      newErrors.phone = 'ÃÂÃÂµÃÂºÃÂ¾Ã‘â‚¬Ã‘â‚¬ÃÂµÃÂºÃ‘â€šÃÂ½Ã‘â€¹ÃÂ¹ ÃÂ½ÃÂ¾ÃÂ¼ÃÂµÃ‘â‚¬ Ã‘â€šÃÂµÃÂ»ÃÂµÃ‘â€žÃÂ¾ÃÂ½ÃÂ°';
    }
    if (!formData.theaterId) newErrors.theaterId = 'Ãâ€™Ã‘â€¹ÃÂ±ÃÂµÃ‘â‚¬ÃÂ¸Ã‘â€šÃÂµ Ã‘â€šÃÂµÃÂ°Ã‘â€šÃ‘â‚¬';

    setErrors(newErrors);
    setTouched({
      firstName: true,
      lastName: true,
      email: true,
      phone: true,
      theaterId: true,
    });

    return Object.keys(newErrors).length === 0;
  };

  const validateStep2 = (): boolean => {
    const newErrors: FormErrors = {};

    if (!formData.password) {
      newErrors.password = 'Ãâ€™ÃÂ²ÃÂµÃÂ´ÃÂ¸Ã‘â€šÃÂµ ÃÂ¿ÃÂ°Ã‘â‚¬ÃÂ¾ÃÂ»Ã‘Å’';
    } else if (!passwordRequirements.every(req => req.test(formData.password))) {
      newErrors.password = 'ÃÅ¸ÃÂ°Ã‘â‚¬ÃÂ¾ÃÂ»Ã‘Å’ ÃÂ½ÃÂµ Ã‘ÂÃÂ¾ÃÂ¾Ã‘â€šÃÂ²ÃÂµÃ‘â€šÃ‘ÂÃ‘â€šÃÂ²Ã‘Æ’ÃÂµÃ‘â€š Ã‘â€šÃ‘â‚¬ÃÂµÃÂ±ÃÂ¾ÃÂ²ÃÂ°ÃÂ½ÃÂ¸Ã‘ÂÃÂ¼';
    }

    if (!formData.confirmPassword) {
      newErrors.confirmPassword = 'ÃÅ¸ÃÂ¾ÃÂ´Ã‘â€šÃÂ²ÃÂµÃ‘â‚¬ÃÂ´ÃÂ¸Ã‘â€šÃÂµ ÃÂ¿ÃÂ°Ã‘â‚¬ÃÂ¾ÃÂ»Ã‘Å’';
    } else if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'ÃÅ¸ÃÂ°Ã‘â‚¬ÃÂ¾ÃÂ»ÃÂ¸ ÃÂ½ÃÂµ Ã‘ÂÃÂ¾ÃÂ²ÃÂ¿ÃÂ°ÃÂ´ÃÂ°Ã‘Å½Ã‘â€š';
    }

    if (!formData.agreeToTerms) {
      newErrors.agreeToTerms = 'ÃÂÃÂµÃÂ¾ÃÂ±Ã‘â€¦ÃÂ¾ÃÂ´ÃÂ¸ÃÂ¼ÃÂ¾ Ã‘ÂÃÂ¾ÃÂ³ÃÂ»ÃÂ°Ã‘ÂÃÂ¸ÃÂµ Ã‘Â Ã‘Æ’Ã‘ÂÃÂ»ÃÂ¾ÃÂ²ÃÂ¸Ã‘ÂÃÂ¼ÃÂ¸';
    }

    setErrors(newErrors);
    setTouched(prev => ({
      ...prev,
      password: true,
      confirmPassword: true,
      agreeToTerms: true,
    }));

    return Object.keys(newErrors).length === 0;
  };

  const handleNextStep = () => {
    if (validateStep1()) {
      setStep(2);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!validateStep2()) return;

    setIsLoading(true);

    try {
      // ÃËœÃÂ¼ÃÂ¸Ã‘â€šÃÂ°Ã‘â€ ÃÂ¸Ã‘Â API ÃÂ·ÃÂ°ÃÂ¿Ã‘â‚¬ÃÂ¾Ã‘ÂÃÂ°
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // ÃÂ£Ã‘ÂÃÂ¿ÃÂµÃ‘Ë†ÃÂ½ÃÂ°Ã‘Â Ã‘â‚¬ÃÂµÃÂ³ÃÂ¸Ã‘ÂÃ‘â€šÃ‘â‚¬ÃÂ°Ã‘â€ ÃÂ¸Ã‘Â
      navigate('/login', { 
        state: { 
          message: 'ÃÂ ÃÂµÃÂ³ÃÂ¸Ã‘ÂÃ‘â€šÃ‘â‚¬ÃÂ°Ã‘â€ ÃÂ¸Ã‘Â Ã‘Æ’Ã‘ÂÃÂ¿ÃÂµÃ‘Ë†ÃÂ½ÃÂ°! Ãâ€™ÃÂ¾ÃÂ¹ÃÂ´ÃÂ¸Ã‘â€šÃÂµ Ã‘Â ÃÂ²ÃÂ°Ã‘Ë†ÃÂ¸ÃÂ¼ÃÂ¸ Ã‘Æ’Ã‘â€¡Ã‘â€˜Ã‘â€šÃÂ½Ã‘â€¹ÃÂ¼ÃÂ¸ ÃÂ´ÃÂ°ÃÂ½ÃÂ½Ã‘â€¹ÃÂ¼ÃÂ¸.' 
        } 
      });
    } catch (err) {
      setError('ÃÅ¾Ã‘Ë†ÃÂ¸ÃÂ±ÃÂºÃÂ° ÃÂ¿Ã‘â‚¬ÃÂ¸ Ã‘â‚¬ÃÂµÃÂ³ÃÂ¸Ã‘ÂÃ‘â€šÃ‘â‚¬ÃÂ°Ã‘â€ ÃÂ¸ÃÂ¸. ÃÅ¸ÃÂ¾ÃÂ¿Ã‘â‚¬ÃÂ¾ÃÂ±Ã‘Æ’ÃÂ¹Ã‘â€šÃÂµ ÃÂ¿ÃÂ¾ÃÂ·ÃÂ¶ÃÂµ.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-theatre-velvet via-theatre-velvet-dark to-theatre-night flex">
      {/* Ãâ€ºÃÂµÃÂ²ÃÂ°Ã‘Â Ã‘â€¡ÃÂ°Ã‘ÂÃ‘â€šÃ‘Å’ Ã¢â‚¬â€ ÃÂ´ÃÂµÃÂºÃÂ¾Ã‘â‚¬ÃÂ°Ã‘â€šÃÂ¸ÃÂ²ÃÂ½ÃÂ°Ã‘Â */}
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden">
        {/* ÃÂ¤ÃÂ¾ÃÂ½ÃÂ¾ÃÂ²Ã‘â€¹ÃÂ¹ ÃÂ¿ÃÂ°Ã‘â€šÃ‘â€šÃÂµÃ‘â‚¬ÃÂ½ */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-20 left-20 w-64 h-64 border border-gold/30 rounded-full" />
          <div className="absolute top-40 left-40 w-96 h-96 border border-gold/20 rounded-full" />
          <div className="absolute bottom-20 right-20 w-48 h-48 border border-gold/30 rounded-full" />
        </div>

        {/* ÃÅ¡ÃÂ¾ÃÂ½Ã‘â€šÃÂµÃÂ½Ã‘â€š */}
        <div className="relative z-10 flex flex-col justify-center px-16">
          <div className="mb-8">
            <div className="w-16 h-16 bg-gradient-to-br from-gold to-gold-dark rounded-xl flex items-center justify-center mb-6 shadow-gold">
              <span className="text-theatre-velvet text-2xl font-bold">T</span>
            </div>
            <h1 className="text-4xl font-bold text-white mb-4">
              Theatre<span className="text-gold">.</span>
            </h1>
            <p className="text-xl text-white/70">
              ÃÅ¸Ã‘â‚¬ÃÂ¸Ã‘ÂÃÂ¾ÃÂµÃÂ´ÃÂ¸ÃÂ½Ã‘ÂÃÂ¹Ã‘â€šÃÂµÃ‘ÂÃ‘Å’ ÃÂº Ã‘ÂÃÂ¾ÃÂ²Ã‘â‚¬ÃÂµÃÂ¼ÃÂµÃÂ½ÃÂ½ÃÂ¾ÃÂ¹<br />
              Ã‘ÂÃÂ¸Ã‘ÂÃ‘â€šÃÂµÃÂ¼ÃÂµ Ã‘Æ’ÃÂ¿Ã‘â‚¬ÃÂ°ÃÂ²ÃÂ»ÃÂµÃÂ½ÃÂ¸Ã‘Â Ã‘â€šÃÂµÃÂ°Ã‘â€šÃ‘â‚¬ÃÂ¾ÃÂ¼
            </p>
          </div>

          {/* ÃÅ¸Ã‘â‚¬ÃÂµÃÂ¸ÃÂ¼Ã‘Æ’Ã‘â€°ÃÂµÃ‘ÂÃ‘â€šÃÂ²ÃÂ° */}
          <div className="space-y-4 mt-8">
            {[
              'ÃÅ¸ÃÂ¾ÃÂ»ÃÂ½Ã‘â€¹ÃÂ¹ ÃÂºÃÂ¾ÃÂ½Ã‘â€šÃ‘â‚¬ÃÂ¾ÃÂ»Ã‘Å’ ÃÂ¸ÃÂ½ÃÂ²ÃÂµÃÂ½Ã‘â€šÃÂ°Ã‘â‚¬Ã‘Â',
              'ÃÂ­ÃÂ»ÃÂµÃÂºÃ‘â€šÃ‘â‚¬ÃÂ¾ÃÂ½ÃÂ½Ã‘â€¹ÃÂ¹ ÃÂ´ÃÂ¾ÃÂºÃ‘Æ’ÃÂ¼ÃÂµÃÂ½Ã‘â€šÃÂ¾ÃÂ¾ÃÂ±ÃÂ¾Ã‘â‚¬ÃÂ¾Ã‘â€š',
              'ÃÂ£ÃÂ¿Ã‘â‚¬ÃÂ°ÃÂ²ÃÂ»ÃÂµÃÂ½ÃÂ¸ÃÂµ Ã‘â‚¬ÃÂµÃÂ¿ÃÂµÃ‘â‚¬Ã‘â€šÃ‘Æ’ÃÂ°Ã‘â‚¬ÃÂ¾ÃÂ¼',
              'ÃÅ¸ÃÂ»ÃÂ°ÃÂ½ÃÂ¸Ã‘â‚¬ÃÂ¾ÃÂ²ÃÂ°ÃÂ½ÃÂ¸ÃÂµ Ã‘â‚¬ÃÂ°Ã‘ÂÃÂ¿ÃÂ¸Ã‘ÂÃÂ°ÃÂ½ÃÂ¸Ã‘Â',
            ].map((item, index) => (
              <div key={index} className="flex items-center gap-3 text-white/80">
                <div className="w-6 h-6 rounded-full bg-gold/20 flex items-center justify-center">
                  <Check className="w-4 h-4 text-gold" />
                </div>
                <span>{item}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Ãâ€ÃÂµÃÂºÃÂ¾Ã‘â‚¬ÃÂ°Ã‘â€šÃÂ¸ÃÂ²ÃÂ½Ã‘â€¹ÃÂµ Ã‘ÂÃÂ»ÃÂµÃÂ¼ÃÂµÃÂ½Ã‘â€šÃ‘â€¹ */}
        <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-theatre-velvet-dark/50 to-transparent" />
      </div>

      {/* ÃÅ¸Ã‘â‚¬ÃÂ°ÃÂ²ÃÂ°Ã‘Â Ã‘â€¡ÃÂ°Ã‘ÂÃ‘â€šÃ‘Å’ Ã¢â‚¬â€ Ã‘â€žÃÂ¾Ã‘â‚¬ÃÂ¼ÃÂ° */}
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="w-full max-w-md">
          {/* Ãâ€ºÃÂ¾ÃÂ³ÃÂ¾Ã‘â€šÃÂ¸ÃÂ¿ ÃÂ´ÃÂ»Ã‘Â ÃÂ¼ÃÂ¾ÃÂ±ÃÂ¸ÃÂ»Ã‘Å’ÃÂ½Ã‘â€¹Ã‘â€¦ */}
          <div className="lg:hidden text-center mb-8">
            <div className="w-14 h-14 bg-gradient-to-br from-gold to-gold-dark rounded-xl flex items-center justify-center mx-auto mb-4 shadow-gold">
              <span className="text-theatre-velvet text-xl font-bold">T</span>
            </div>
            <h1 className="text-2xl font-bold text-white">
              Theatre<span className="text-gold">.</span>
            </h1>
          </div>

          {/* ÃÅ¡ÃÂ°Ã‘â‚¬Ã‘â€šÃÂ¾Ã‘â€¡ÃÂºÃÂ° Ã‘â€žÃÂ¾Ã‘â‚¬ÃÂ¼Ã‘â€¹ */}
          <div className="bg-white/5 backdrop-blur-sm rounded-2xl p-8 border border-white/10">
            {/* Ãâ€”ÃÂ°ÃÂ³ÃÂ¾ÃÂ»ÃÂ¾ÃÂ²ÃÂ¾ÃÂº */}
            <div className="text-center mb-8">
              <h2 className="text-2xl font-bold text-white mb-2">ÃÂ ÃÂµÃÂ³ÃÂ¸Ã‘ÂÃ‘â€šÃ‘â‚¬ÃÂ°Ã‘â€ ÃÂ¸Ã‘Â</h2>
              <p className="text-white/60">
                {step === 1 ? 'ÃÂ¨ÃÂ°ÃÂ³ 1 ÃÂ¸ÃÂ· 2 Ã¢â‚¬â€ ÃÅ¾Ã‘ÂÃÂ½ÃÂ¾ÃÂ²ÃÂ½ÃÂ°Ã‘Â ÃÂ¸ÃÂ½Ã‘â€žÃÂ¾Ã‘â‚¬ÃÂ¼ÃÂ°Ã‘â€ ÃÂ¸Ã‘Â' : 'ÃÂ¨ÃÂ°ÃÂ³ 2 ÃÂ¸ÃÂ· 2 Ã¢â‚¬â€ ÃÂ¡ÃÂ¾ÃÂ·ÃÂ´ÃÂ°ÃÂ½ÃÂ¸ÃÂµ ÃÂ¿ÃÂ°Ã‘â‚¬ÃÂ¾ÃÂ»Ã‘Â'}
              </p>
            </div>

            {/* ÃËœÃÂ½ÃÂ´ÃÂ¸ÃÂºÃÂ°Ã‘â€šÃÂ¾Ã‘â‚¬ Ã‘Ë†ÃÂ°ÃÂ³ÃÂ¾ÃÂ² */}
            <div className="flex items-center gap-2 mb-8">
              <div className={`flex-1 h-1 rounded-full transition-colors ${
                step >= 1 ? 'bg-gold' : 'bg-white/20'
              }`} />
              <div className={`flex-1 h-1 rounded-full transition-colors ${
                step >= 2 ? 'bg-gold' : 'bg-white/20'
              }`} />
            </div>

            {error && (
              <Alert variant="error" className="mb-6">
                {error}
              </Alert>
            )}

            <form onSubmit={handleSubmit} className="space-y-5">
              {step === 1 ? (
                <>
                  {/* ÃËœÃÂ¼Ã‘Â ÃÂ¸ ÃÂ¤ÃÂ°ÃÂ¼ÃÂ¸ÃÂ»ÃÂ¸Ã‘Â */}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-white/80 mb-2">
                        ÃËœÃÂ¼Ã‘Â <span className="text-red-400">*</span>
                      </label>
                      <div className="relative">
                        <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-white/40" />
                        <input
                          type="text"
                          name="firstName"
                          value={formData.firstName}
                          onChange={handleChange}
                          onBlur={() => handleBlur('firstName')}
                          className={`w-full bg-white/10 border rounded-xl pl-10 pr-4 py-3 text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-gold/50 focus:border-gold transition-colors ${
                            touched.firstName && errors.firstName 
                              ? 'border-red-500' 
                              : 'border-white/20'
                          }`}
                          placeholder="ÃËœÃÂ²ÃÂ°ÃÂ½"
                        />
                      </div>
                      {touched.firstName && errors.firstName && (
                        <p className="mt-1 text-sm text-red-400">{errors.firstName}</p>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-white/80 mb-2">
                        ÃÂ¤ÃÂ°ÃÂ¼ÃÂ¸ÃÂ»ÃÂ¸Ã‘Â <span className="text-red-400">*</span>
                      </label>
                      <input
                        type="text"
                        name="lastName"
                        value={formData.lastName}
                        onChange={handleChange}
                        onBlur={() => handleBlur('lastName')}
                        className={`w-full bg-white/10 border rounded-xl px-4 py-3 text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-gold/50 focus:border-gold transition-colors ${
                          touched.lastName && errors.lastName 
                            ? 'border-red-500' 
                            : 'border-white/20'
                        }`}
                        placeholder="ÃÅ¸ÃÂµÃ‘â€šÃ‘â‚¬ÃÂ¾ÃÂ²"
                      />
                      {touched.lastName && errors.lastName && (
                        <p className="mt-1 text-sm text-red-400">{errors.lastName}</p>
                      )}
                    </div>
                  </div>

                  {/* Email */}
                  <div>
                    <label className="block text-sm font-medium text-white/80 mb-2">
                      Email <span className="text-red-400">*</span>
                    </label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-white/40" />
                      <input
                        type="email"
                        name="email"
                        value={formData.email}
                        onChange={handleChange}
                        onBlur={() => handleBlur('email')}
                        className={`w-full bg-white/10 border rounded-xl pl-10 pr-4 py-3 text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-gold/50 focus:border-gold transition-colors ${
                          touched.email && errors.email 
                            ? 'border-red-500' 
                            : 'border-white/20'
                        }`}
                        placeholder="ivan@theatre.ru"
                      />
                    </div>
                    {touched.email && errors.email && (
                      <p className="mt-1 text-sm text-red-400">{errors.email}</p>
                    )}
                  </div>

                  {/* ÃÂ¢ÃÂµÃÂ»ÃÂµÃ‘â€žÃÂ¾ÃÂ½ */}
                  <div>
                    <label className="block text-sm font-medium text-white/80 mb-2">
                      ÃÂ¢ÃÂµÃÂ»ÃÂµÃ‘â€žÃÂ¾ÃÂ½
                    </label>
                    <div className="relative">
                      <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-white/40" />
                      <input
                        type="tel"
                        name="phone"
                        value={formData.phone}
                        onChange={handleChange}
                        onBlur={() => handleBlur('phone')}
                        className={`w-full bg-white/10 border rounded-xl pl-10 pr-4 py-3 text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-gold/50 focus:border-gold transition-colors ${
                          touched.phone && errors.phone 
                            ? 'border-red-500' 
                            : 'border-white/20'
                        }`}
                        placeholder="+7 (999) 123-45-67"
                      />
                    </div>
                    {touched.phone && errors.phone && (
                      <p className="mt-1 text-sm text-red-400">{errors.phone}</p>
                    )}
                  </div>

                  {/* ÃÂ¢ÃÂµÃÂ°Ã‘â€šÃ‘â‚¬ */}
                  <div>
                    <label className="block text-sm font-medium text-white/80 mb-2">
                      ÃÂ¢ÃÂµÃÂ°Ã‘â€šÃ‘â‚¬ <span className="text-red-400">*</span>
                    </label>
                    <div className="relative">
                      <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-white/40" />
                      <select
                        name="theaterId"
                        value={formData.theaterId}
                        onChange={handleChange}
                        onBlur={() => handleBlur('theaterId')}
                        className={`w-full bg-white/10 border rounded-xl pl-10 pr-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-gold/50 focus:border-gold transition-colors appearance-none cursor-pointer ${
                          touched.theaterId && errors.theaterId 
                            ? 'border-red-500' 
                            : 'border-white/20'
                        } ${!formData.theaterId ? 'text-white/40' : ''}`}
                      >
                        <option value="" className="bg-theatre-velvet">Ãâ€™Ã‘â€¹ÃÂ±ÃÂµÃ‘â‚¬ÃÂ¸Ã‘â€šÃÂµ Ã‘â€šÃÂµÃÂ°Ã‘â€šÃ‘â‚¬</option>
                        {theaters.map(theater => (
                          <option key={theater.id} value={theater.id} className="bg-theatre-velvet text-white">
                            {theater.name}
                          </option>
                        ))}
                      </select>
                    </div>
                    {touched.theaterId && errors.theaterId && (
                      <p className="mt-1 text-sm text-red-400">{errors.theaterId}</p>
                    )}
                  </div>

                  <Button
                    type="button"
                    onClick={handleNextStep}
                    className="w-full"
                    size="lg"
                  >
                    Ãâ€ÃÂ°ÃÂ»ÃÂµÃÂµ
                    <ArrowRight className="w-5 h-5 ml-2" />
                  </Button>
                </>
              ) : (
                <>
                  {/* ÃÅ¸ÃÂ°Ã‘â‚¬ÃÂ¾ÃÂ»Ã‘Å’ */}
                  <div>
                    <label className="block text-sm font-medium text-white/80 mb-2">
                      ÃÅ¸ÃÂ°Ã‘â‚¬ÃÂ¾ÃÂ»Ã‘Å’ <span className="text-red-400">*</span>
                    </label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-white/40" />
                      <input
                        type={showPassword ? 'text' : 'password'}
                        name="password"
                        value={formData.password}
                        onChange={handleChange}
                        onBlur={() => handleBlur('password')}
                        className={`w-full bg-white/10 border rounded-xl pl-10 pr-12 py-3 text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-gold/50 focus:border-gold transition-colors ${
                          touched.password && errors.password 
                            ? 'border-red-500' 
                            : 'border-white/20'
                        }`}
                        placeholder="Ãâ€™ÃÂ²ÃÂµÃÂ´ÃÂ¸Ã‘â€šÃÂµ ÃÂ¿ÃÂ°Ã‘â‚¬ÃÂ¾ÃÂ»Ã‘Å’"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-white/40 hover:text-white transition-colors"
                      >
                        {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                      </button>
                    </div>

                    {/* ÃÂ¢Ã‘â‚¬ÃÂµÃÂ±ÃÂ¾ÃÂ²ÃÂ°ÃÂ½ÃÂ¸Ã‘Â ÃÂº ÃÂ¿ÃÂ°Ã‘â‚¬ÃÂ¾ÃÂ»Ã‘Å½ */}
                    <div className="mt-3 grid grid-cols-2 gap-2">
                      {passwordRequirements.map(req => (
                        <div 
                          key={req.id}
                          className={`flex items-center gap-2 text-sm ${
                            req.test(formData.password) ? 'text-green-400' : 'text-white/40'
                          }`}
                        >
                          <div className={`w-4 h-4 rounded-full flex items-center justify-center ${
                            req.test(formData.password) ? 'bg-green-400/20' : 'bg-white/10'
                          }`}>
                            {req.test(formData.password) && <Check className="w-3 h-3" />}
                          </div>
                          {req.label}
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* ÃÅ¸ÃÂ¾ÃÂ´Ã‘â€šÃÂ²ÃÂµÃ‘â‚¬ÃÂ¶ÃÂ´ÃÂµÃÂ½ÃÂ¸ÃÂµ ÃÂ¿ÃÂ°Ã‘â‚¬ÃÂ¾ÃÂ»Ã‘Â */}
                  <div>
                    <label className="block text-sm font-medium text-white/80 mb-2">
                      ÃÅ¸ÃÂ¾ÃÂ´Ã‘â€šÃÂ²ÃÂµÃ‘â‚¬ÃÂ¶ÃÂ´ÃÂµÃÂ½ÃÂ¸ÃÂµ ÃÂ¿ÃÂ°Ã‘â‚¬ÃÂ¾ÃÂ»Ã‘Â <span className="text-red-400">*</span>
                    </label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-white/40" />
                      <input
                        type={showConfirmPassword ? 'text' : 'password'}
                        name="confirmPassword"
                        value={formData.confirmPassword}
                        onChange={handleChange}
                        onBlur={() => handleBlur('confirmPassword')}
                        className={`w-full bg-white/10 border rounded-xl pl-10 pr-12 py-3 text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-gold/50 focus:border-gold transition-colors ${
                          touched.confirmPassword && errors.confirmPassword 
                            ? 'border-red-500' 
                            : 'border-white/20'
                        }`}
                        placeholder="ÃÅ¸ÃÂ¾ÃÂ²Ã‘â€šÃÂ¾Ã‘â‚¬ÃÂ¸Ã‘â€šÃÂµ ÃÂ¿ÃÂ°Ã‘â‚¬ÃÂ¾ÃÂ»Ã‘Å’"
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-white/40 hover:text-white transition-colors"
                      >
                        {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                      </button>
                    </div>
                    {touched.confirmPassword && errors.confirmPassword && (
                      <p className="mt-1 text-sm text-red-400">{errors.confirmPassword}</p>
                    )}
                    {formData.confirmPassword && formData.password === formData.confirmPassword && (
                      <p className="mt-1 text-sm text-green-400 flex items-center gap-1">
                        <Check className="w-4 h-4" /> ÃÅ¸ÃÂ°Ã‘â‚¬ÃÂ¾ÃÂ»ÃÂ¸ Ã‘ÂÃÂ¾ÃÂ²ÃÂ¿ÃÂ°ÃÂ´ÃÂ°Ã‘Å½Ã‘â€š
                      </p>
                    )}
                  </div>

                  {/* ÃÂ¡ÃÂ¾ÃÂ³ÃÂ»ÃÂ°Ã‘ÂÃÂ¸ÃÂµ Ã‘Â Ã‘Æ’Ã‘ÂÃÂ»ÃÂ¾ÃÂ²ÃÂ¸Ã‘ÂÃÂ¼ÃÂ¸ */}
                  <div>
                    <label className="flex items-start gap-3 cursor-pointer">
                      <input
                        type="checkbox"
                        name="agreeToTerms"
                        checked={formData.agreeToTerms}
                        onChange={handleChange}
                        className="mt-1 w-5 h-5 rounded border-white/20 bg-white/10 text-gold focus:ring-gold/50 cursor-pointer"
                      />
                      <span className="text-sm text-white/70">
                        ÃÂ¯ Ã‘ÂÃÂ¾ÃÂ³ÃÂ»ÃÂ°Ã‘ÂÃÂµÃÂ½ Ã‘Â{' '}
                        <a href="/terms" className="text-gold hover:text-gold-light underline">
                          Ã‘Æ’Ã‘ÂÃÂ»ÃÂ¾ÃÂ²ÃÂ¸Ã‘ÂÃÂ¼ÃÂ¸ ÃÂ¸Ã‘ÂÃÂ¿ÃÂ¾ÃÂ»Ã‘Å’ÃÂ·ÃÂ¾ÃÂ²ÃÂ°ÃÂ½ÃÂ¸Ã‘Â
                        </a>
                        {' '}ÃÂ¸{' '}
                        <a href="/privacy" className="text-gold hover:text-gold-light underline">
                          ÃÂ¿ÃÂ¾ÃÂ»ÃÂ¸Ã‘â€šÃÂ¸ÃÂºÃÂ¾ÃÂ¹ ÃÂºÃÂ¾ÃÂ½Ã‘â€žÃÂ¸ÃÂ´ÃÂµÃÂ½Ã‘â€ ÃÂ¸ÃÂ°ÃÂ»Ã‘Å’ÃÂ½ÃÂ¾Ã‘ÂÃ‘â€šÃÂ¸
                        </a>
                      </span>
                    </label>
                    {touched.agreeToTerms && errors.agreeToTerms && (
                      <p className="mt-1 text-sm text-red-400 flex items-center gap-1">
                        <AlertCircle className="w-4 h-4" /> {errors.agreeToTerms}
                      </p>
                    )}
                  </div>

                  {/* ÃÅ¡ÃÂ½ÃÂ¾ÃÂ¿ÃÂºÃÂ¸ */}
                  <div className="flex gap-3">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setStep(1)}
                      className="flex-1 border-white/20 text-white hover:bg-white/10"
                    >
                      ÃÂÃÂ°ÃÂ·ÃÂ°ÃÂ´
                    </Button>
                    <Button
                      type="submit"
                      className="flex-1"
                      size="lg"
                      disabled={isLoading}
                    >
                      {isLoading ? (
                        <>
                          <div className="w-5 h-5 border-2 border-theatre-velvet/30 border-t-theatre-velvet rounded-full animate-spin mr-2" />
                          ÃÂ ÃÂµÃÂ³ÃÂ¸Ã‘ÂÃ‘â€šÃ‘â‚¬ÃÂ°Ã‘â€ ÃÂ¸Ã‘Â...
                        </>
                      ) : (
                        'Ãâ€”ÃÂ°Ã‘â‚¬ÃÂµÃÂ³ÃÂ¸Ã‘ÂÃ‘â€šÃ‘â‚¬ÃÂ¸Ã‘â‚¬ÃÂ¾ÃÂ²ÃÂ°Ã‘â€šÃ‘Å’Ã‘ÂÃ‘Â'
                      )}
                    </Button>
                  </div>
                </>
              )}
            </form>

            {/* ÃÂ¡Ã‘ÂÃ‘â€¹ÃÂ»ÃÂºÃÂ° ÃÂ½ÃÂ° ÃÂ²Ã‘â€¦ÃÂ¾ÃÂ´ */}
            <div className="mt-8 text-center">
              <p className="text-white/60">
                ÃÂ£ÃÂ¶ÃÂµ ÃÂµÃ‘ÂÃ‘â€šÃ‘Å’ ÃÂ°ÃÂºÃÂºÃÂ°Ã‘Æ’ÃÂ½Ã‘â€š?{' '}
                <Link to="/login" className="text-gold hover:text-gold-light font-medium transition-colors">
                  Ãâ€™ÃÂ¾ÃÂ¹Ã‘â€šÃÂ¸
                </Link>
              </p>
            </div>
          </div>

          {/* ÃÅ¡ÃÂ¾ÃÂ¿ÃÂ¸Ã‘â‚¬ÃÂ°ÃÂ¹Ã‘â€š */}
          <p className="text-center text-white/40 text-sm mt-6">
            Ã‚Â© 2025 Theatre. Ãâ€™Ã‘ÂÃÂµ ÃÂ¿Ã‘â‚¬ÃÂ°ÃÂ²ÃÂ° ÃÂ·ÃÂ°Ã‘â€°ÃÂ¸Ã‘â€°ÃÂµÃÂ½Ã‘â€¹.
          </p>
        </div>
      </div>
    </div>
  );
};

export default RegisterPage;
