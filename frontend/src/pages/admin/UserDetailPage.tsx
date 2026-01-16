import React, { useState } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Modal } from '../../components/ui/Modal';

/**
 * ÃÂ¢ÃÂ¸ÃÂ¿Ã‘â€¹ Ã‘â‚¬ÃÂ¾ÃÂ»ÃÂµÃÂ¹ ÃÂ¸ Ã‘ÂÃ‘â€šÃÂ°Ã‘â€šÃ‘Æ’Ã‘ÂÃÂ¾ÃÂ²
 */
type UserRole = 'admin' | 'director' | 'tech_director' | 'department_head' | 'accountant' | 'performer';
type UserStatus = 'active' | 'inactive' | 'pending' | 'blocked';

/**
 * ÃËœÃÂ½Ã‘â€šÃÂµÃ‘â‚¬Ã‘â€žÃÂµÃÂ¹Ã‘Â ÃÂ¿ÃÂ¾ÃÂ»Ã‘Å’ÃÂ·ÃÂ¾ÃÂ²ÃÂ°Ã‘â€šÃÂµÃÂ»Ã‘Â
 */
interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: UserRole;
  status: UserStatus;
  department?: string;
  position?: string;
  phone?: string;
  avatar?: string;
  lastLogin?: Date;
  createdAt: Date;
  permissions: string[];
}

/**
 * ÃËœÃÂ½Ã‘â€šÃÂµÃ‘â‚¬Ã‘â€žÃÂµÃÂ¹Ã‘Â ÃÂ·ÃÂ°ÃÂ¿ÃÂ¸Ã‘ÂÃÂ¸ ÃÂ² ÃÂ¶Ã‘Æ’Ã‘â‚¬ÃÂ½ÃÂ°ÃÂ»ÃÂµ ÃÂ°ÃÂºÃ‘â€šÃÂ¸ÃÂ²ÃÂ½ÃÂ¾Ã‘ÂÃ‘â€šÃÂ¸
 */
interface ActivityLog {
  id: string;
  action: string;
  details: string;
  timestamp: Date;
  ip?: string;
}

/**
 * ÃÅ“ÃÂ¾ÃÂºÃÂ¾ÃÂ²Ã‘â€¹ÃÂµ ÃÂ´ÃÂ°ÃÂ½ÃÂ½Ã‘â€¹ÃÂµ ÃÂ¿ÃÂ¾ÃÂ»Ã‘Å’ÃÂ·ÃÂ¾ÃÂ²ÃÂ°Ã‘â€šÃÂµÃÂ»Ã‘Â
 */
const mockUser: User = {
  id: '3',
  email: 'tech@theatre.test',
  firstName: 'ÃÂ¡ÃÂµÃ‘â‚¬ÃÂ³ÃÂµÃÂ¹',
  lastName: 'ÃÅ¡ÃÂ¾ÃÂ·ÃÂ»ÃÂ¾ÃÂ²',
  role: 'tech_director',
  status: 'active',
  department: 'ÃÂ¢ÃÂµÃ‘â€¦ÃÂ½ÃÂ¸Ã‘â€¡ÃÂµÃ‘ÂÃÂºÃÂ¸ÃÂ¹ Ã‘â€ ÃÂµÃ‘â€¦',
  position: 'ÃÂ¢ÃÂµÃ‘â€¦ÃÂ½ÃÂ¸Ã‘â€¡ÃÂµÃ‘ÂÃÂºÃÂ¸ÃÂ¹ ÃÂ´ÃÂ¸Ã‘â‚¬ÃÂµÃÂºÃ‘â€šÃÂ¾Ã‘â‚¬',
  phone: '+7 (999) 345-67-89',
  lastLogin: new Date(Date.now() - 1000 * 60 * 60 * 24),
  createdAt: new Date('2024-03-10'),
  permissions: [
    'inventory:view',
    'inventory:create',
    'inventory:edit',
    'inventory:delete',
    'documents:view',
    'documents:create',
    'performance:view',
    'performance:create',
    'performance:edit',
    'schedule:view',
    'schedule:edit',
  ],
};

/**
 * ÃÅ“ÃÂ¾ÃÂºÃÂ¾ÃÂ²Ã‘â€¹ÃÂµ ÃÂ´ÃÂ°ÃÂ½ÃÂ½Ã‘â€¹ÃÂµ ÃÂ¶Ã‘Æ’Ã‘â‚¬ÃÂ½ÃÂ°ÃÂ»ÃÂ° ÃÂ°ÃÂºÃ‘â€šÃÂ¸ÃÂ²ÃÂ½ÃÂ¾Ã‘ÂÃ‘â€šÃÂ¸
 */
const mockActivityLog: ActivityLog[] = [
  {
    id: '1',
    action: 'Ãâ€™Ã‘â€¦ÃÂ¾ÃÂ´ ÃÂ² Ã‘ÂÃÂ¸Ã‘ÂÃ‘â€šÃÂµÃÂ¼Ã‘Æ’',
    details: 'ÃÂ£Ã‘ÂÃÂ¿ÃÂµÃ‘Ë†ÃÂ½ÃÂ°Ã‘Â ÃÂ°ÃÂ²Ã‘â€šÃÂ¾Ã‘â‚¬ÃÂ¸ÃÂ·ÃÂ°Ã‘â€ ÃÂ¸Ã‘Â',
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24),
    ip: '192.168.1.100',
  },
  {
    id: '2',
    action: 'ÃÂ ÃÂµÃÂ´ÃÂ°ÃÂºÃ‘â€šÃÂ¸Ã‘â‚¬ÃÂ¾ÃÂ²ÃÂ°ÃÂ½ÃÂ¸ÃÂµ ÃÂ¸ÃÂ½ÃÂ²ÃÂµÃÂ½Ã‘â€šÃÂ°Ã‘â‚¬Ã‘Â',
    details: 'ÃÅ¾ÃÂ±ÃÂ½ÃÂ¾ÃÂ²ÃÂ»Ã‘â€˜ÃÂ½ Ã‘ÂÃ‘â€šÃÂ°Ã‘â€šÃ‘Æ’Ã‘Â ÃÂ¿Ã‘â‚¬ÃÂµÃÂ´ÃÂ¼ÃÂµÃ‘â€šÃÂ° #INV-2024-0045',
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 25),
  },
  {
    id: '3',
    action: 'ÃÂ¡ÃÂ¾ÃÂ·ÃÂ´ÃÂ°ÃÂ½ÃÂ¸ÃÂµ ÃÂ´ÃÂ¾ÃÂºÃ‘Æ’ÃÂ¼ÃÂµÃÂ½Ã‘â€šÃÂ°',
    details: 'Ãâ€”ÃÂ°ÃÂ³Ã‘â‚¬Ã‘Æ’ÃÂ¶ÃÂµÃÂ½ Ã‘â€šÃÂµÃ‘â€¦ÃÂ½ÃÂ¸Ã‘â€¡ÃÂµÃ‘ÂÃÂºÃÂ¸ÃÂ¹ Ã‘â‚¬ÃÂ°ÃÂ¹ÃÂ´ÃÂµÃ‘â‚¬ ÃÂ´ÃÂ»Ã‘Â "Ãâ€œÃÂ°ÃÂ¼ÃÂ»ÃÂµÃ‘â€š"',
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 48),
  },
  {
    id: '4',
    action: 'ÃËœÃÂ·ÃÂ¼ÃÂµÃÂ½ÃÂµÃÂ½ÃÂ¸ÃÂµ Ã‘â‚¬ÃÂ°Ã‘ÂÃÂ¿ÃÂ¸Ã‘ÂÃÂ°ÃÂ½ÃÂ¸Ã‘Â',
    details: 'ÃÅ¸ÃÂµÃ‘â‚¬ÃÂµÃÂ½ÃÂµÃ‘ÂÃÂµÃÂ½ÃÂ° Ã‘â‚¬ÃÂµÃÂ¿ÃÂµÃ‘â€šÃÂ¸Ã‘â€ ÃÂ¸Ã‘Â "ÃÂ§ÃÂ°ÃÂ¹ÃÂºÃÂ¸"',
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 72),
  },
  {
    id: '5',
    action: 'Ãâ€™Ã‘â€¦ÃÂ¾ÃÂ´ ÃÂ² Ã‘ÂÃÂ¸Ã‘ÂÃ‘â€šÃÂµÃÂ¼Ã‘Æ’',
    details: 'ÃÂ£Ã‘ÂÃÂ¿ÃÂµÃ‘Ë†ÃÂ½ÃÂ°Ã‘Â ÃÂ°ÃÂ²Ã‘â€šÃÂ¾Ã‘â‚¬ÃÂ¸ÃÂ·ÃÂ°Ã‘â€ ÃÂ¸Ã‘Â',
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 96),
    ip: '192.168.1.100',
  },
];

/**
 * ÃÂÃÂ°ÃÂ·ÃÂ²ÃÂ°ÃÂ½ÃÂ¸Ã‘Â Ã‘â‚¬ÃÂ¾ÃÂ»ÃÂµÃÂ¹
 */
const roleLabels: Record<UserRole, string> = {
  admin: 'ÃÂÃÂ´ÃÂ¼ÃÂ¸ÃÂ½ÃÂ¸Ã‘ÂÃ‘â€šÃ‘â‚¬ÃÂ°Ã‘â€šÃÂ¾Ã‘â‚¬',
  director: 'ÃÂ Ã‘Æ’ÃÂºÃÂ¾ÃÂ²ÃÂ¾ÃÂ´ÃÂ¸Ã‘â€šÃÂµÃÂ»Ã‘Å’',
  tech_director: 'ÃÂ¢ÃÂµÃ‘â€¦. ÃÂ´ÃÂ¸Ã‘â‚¬ÃÂµÃÂºÃ‘â€šÃÂ¾Ã‘â‚¬',
  department_head: 'Ãâ€”ÃÂ°ÃÂ². Ã‘â€ ÃÂµÃ‘â€¦ÃÂ¾ÃÂ¼',
  accountant: 'Ãâ€˜Ã‘Æ’Ã‘â€¦ÃÂ³ÃÂ°ÃÂ»Ã‘â€šÃÂµÃ‘â‚¬',
  performer: 'ÃÂÃ‘â‚¬Ã‘â€šÃÂ¸Ã‘ÂÃ‘â€š',
};

/**
 * ÃÂ¦ÃÂ²ÃÂµÃ‘â€šÃÂ° Ã‘â‚¬ÃÂ¾ÃÂ»ÃÂµÃÂ¹
 */
const roleColors: Record<UserRole, string> = {
  admin: 'bg-red-500/20 text-red-400 border-red-500/30',
  director: 'bg-purple-500/20 text-purple-400 border-purple-500/30',
  tech_director: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
  department_head: 'bg-green-500/20 text-green-400 border-green-500/30',
  accountant: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
  performer: 'bg-cyan-500/20 text-cyan-400 border-cyan-500/30',
};

/**
 * ÃÂÃÂ°ÃÂ·ÃÂ²ÃÂ°ÃÂ½ÃÂ¸Ã‘Â Ã‘ÂÃ‘â€šÃÂ°Ã‘â€šÃ‘Æ’Ã‘ÂÃÂ¾ÃÂ²
 */
const statusLabels: Record<UserStatus, string> = {
  active: 'ÃÂÃÂºÃ‘â€šÃÂ¸ÃÂ²ÃÂµÃÂ½',
  inactive: 'ÃÂÃÂµÃÂ°ÃÂºÃ‘â€šÃÂ¸ÃÂ²ÃÂµÃÂ½',
  pending: 'ÃÅ¾ÃÂ¶ÃÂ¸ÃÂ´ÃÂ°ÃÂ½ÃÂ¸ÃÂµ',
  blocked: 'Ãâ€”ÃÂ°ÃÂ±ÃÂ»ÃÂ¾ÃÂºÃÂ¸Ã‘â‚¬ÃÂ¾ÃÂ²ÃÂ°ÃÂ½',
};

/**
 * ÃÂ¦ÃÂ²ÃÂµÃ‘â€šÃÂ° Ã‘ÂÃ‘â€šÃÂ°Ã‘â€šÃ‘Æ’Ã‘ÂÃÂ¾ÃÂ²
 */
const statusColors: Record<UserStatus, string> = {
  active: 'bg-green-500/20 text-green-400',
  inactive: 'bg-slate-500/20 text-slate-400',
  pending: 'bg-amber-500/20 text-amber-400',
  blocked: 'bg-red-500/20 text-red-400',
};

/**
 * Ãâ€œÃ‘â‚¬Ã‘Æ’ÃÂ¿ÃÂ¿Ã‘â€¹ Ã‘â‚¬ÃÂ°ÃÂ·Ã‘â‚¬ÃÂµÃ‘Ë†ÃÂµÃÂ½ÃÂ¸ÃÂ¹
 */
const permissionGroups = [
  {
    name: 'ÃËœÃÂ½ÃÂ²ÃÂµÃÂ½Ã‘â€šÃÂ°Ã‘â‚¬Ã‘Å’',
    permissions: [
      { key: 'inventory:view', label: 'ÃÅ¸Ã‘â‚¬ÃÂ¾Ã‘ÂÃÂ¼ÃÂ¾Ã‘â€šÃ‘â‚¬' },
      { key: 'inventory:create', label: 'ÃÂ¡ÃÂ¾ÃÂ·ÃÂ´ÃÂ°ÃÂ½ÃÂ¸ÃÂµ' },
      { key: 'inventory:edit', label: 'ÃÂ ÃÂµÃÂ´ÃÂ°ÃÂºÃ‘â€šÃÂ¸Ã‘â‚¬ÃÂ¾ÃÂ²ÃÂ°ÃÂ½ÃÂ¸ÃÂµ' },
      { key: 'inventory:delete', label: 'ÃÂ£ÃÂ´ÃÂ°ÃÂ»ÃÂµÃÂ½ÃÂ¸ÃÂµ' },
    ],
  },
  {
    name: 'Ãâ€ÃÂ¾ÃÂºÃ‘Æ’ÃÂ¼ÃÂµÃÂ½Ã‘â€šÃ‘â€¹',
    permissions: [
      { key: 'documents:view', label: 'ÃÅ¸Ã‘â‚¬ÃÂ¾Ã‘ÂÃÂ¼ÃÂ¾Ã‘â€šÃ‘â‚¬' },
      { key: 'documents:create', label: 'ÃÂ¡ÃÂ¾ÃÂ·ÃÂ´ÃÂ°ÃÂ½ÃÂ¸ÃÂµ' },
      { key: 'documents:edit', label: 'ÃÂ ÃÂµÃÂ´ÃÂ°ÃÂºÃ‘â€šÃÂ¸Ã‘â‚¬ÃÂ¾ÃÂ²ÃÂ°ÃÂ½ÃÂ¸ÃÂµ' },
      { key: 'documents:delete', label: 'ÃÂ£ÃÂ´ÃÂ°ÃÂ»ÃÂµÃÂ½ÃÂ¸ÃÂµ' },
    ],
  },
  {
    name: 'ÃÂ¡ÃÂ¿ÃÂµÃÂºÃ‘â€šÃÂ°ÃÂºÃÂ»ÃÂ¸',
    permissions: [
      { key: 'performance:view', label: 'ÃÅ¸Ã‘â‚¬ÃÂ¾Ã‘ÂÃÂ¼ÃÂ¾Ã‘â€šÃ‘â‚¬' },
      { key: 'performance:create', label: 'ÃÂ¡ÃÂ¾ÃÂ·ÃÂ´ÃÂ°ÃÂ½ÃÂ¸ÃÂµ' },
      { key: 'performance:edit', label: 'ÃÂ ÃÂµÃÂ´ÃÂ°ÃÂºÃ‘â€šÃÂ¸Ã‘â‚¬ÃÂ¾ÃÂ²ÃÂ°ÃÂ½ÃÂ¸ÃÂµ' },
    ],
  },
  {
    name: 'ÃÂ ÃÂ°Ã‘ÂÃÂ¿ÃÂ¸Ã‘ÂÃÂ°ÃÂ½ÃÂ¸ÃÂµ',
    permissions: [
      { key: 'schedule:view', label: 'ÃÅ¸Ã‘â‚¬ÃÂ¾Ã‘ÂÃÂ¼ÃÂ¾Ã‘â€šÃ‘â‚¬' },
      { key: 'schedule:edit', label: 'ÃÂ ÃÂµÃÂ´ÃÂ°ÃÂºÃ‘â€šÃÂ¸Ã‘â‚¬ÃÂ¾ÃÂ²ÃÂ°ÃÂ½ÃÂ¸ÃÂµ' },
    ],
  },
  {
    name: 'ÃÅ¸ÃÂ¾ÃÂ»Ã‘Å’ÃÂ·ÃÂ¾ÃÂ²ÃÂ°Ã‘â€šÃÂµÃÂ»ÃÂ¸',
    permissions: [
      { key: 'users:view', label: 'ÃÅ¸Ã‘â‚¬ÃÂ¾Ã‘ÂÃÂ¼ÃÂ¾Ã‘â€šÃ‘â‚¬' },
      { key: 'users:create', label: 'ÃÂ¡ÃÂ¾ÃÂ·ÃÂ´ÃÂ°ÃÂ½ÃÂ¸ÃÂµ' },
      { key: 'users:edit', label: 'ÃÂ ÃÂµÃÂ´ÃÂ°ÃÂºÃ‘â€šÃÂ¸Ã‘â‚¬ÃÂ¾ÃÂ²ÃÂ°ÃÂ½ÃÂ¸ÃÂµ' },
      { key: 'users:delete', label: 'ÃÂ£ÃÂ´ÃÂ°ÃÂ»ÃÂµÃÂ½ÃÂ¸ÃÂµ' },
    ],
  },
];

/**
 * ÃÂ¡Ã‘â€šÃ‘â‚¬ÃÂ°ÃÂ½ÃÂ¸Ã‘â€ ÃÂ° ÃÂ´ÃÂµÃ‘â€šÃÂ°ÃÂ»Ã‘Å’ÃÂ½ÃÂ¾ÃÂ¹ ÃÂ¸ÃÂ½Ã‘â€žÃÂ¾Ã‘â‚¬ÃÂ¼ÃÂ°Ã‘â€ ÃÂ¸ÃÂ¸ ÃÂ¾ ÃÂ¿ÃÂ¾ÃÂ»Ã‘Å’ÃÂ·ÃÂ¾ÃÂ²ÃÂ°Ã‘â€šÃÂµÃÂ»ÃÂµ.
 * ÃÅ¸ÃÂ¾ÃÂ·ÃÂ²ÃÂ¾ÃÂ»Ã‘ÂÃÂµÃ‘â€š ÃÂ¿Ã‘â‚¬ÃÂ¾Ã‘ÂÃÂ¼ÃÂ°Ã‘â€šÃ‘â‚¬ÃÂ¸ÃÂ²ÃÂ°Ã‘â€šÃ‘Å’ ÃÂ¸ Ã‘â‚¬ÃÂµÃÂ´ÃÂ°ÃÂºÃ‘â€šÃÂ¸Ã‘â‚¬ÃÂ¾ÃÂ²ÃÂ°Ã‘â€šÃ‘Å’ ÃÂ´ÃÂ°ÃÂ½ÃÂ½Ã‘â€¹ÃÂµ ÃÂ¿ÃÂ¾ÃÂ»Ã‘Å’ÃÂ·ÃÂ¾ÃÂ²ÃÂ°Ã‘â€šÃÂµÃÂ»Ã‘Â.
 */
export const UserDetailPage: React.FC = () => {
  const { id: _id } = useParams<{ id: string }>();
  useNavigate(); // Keep hook for future use
  const [user, setUser] = useState<User>(mockUser);
  const [isEditing, setIsEditing] = useState(false);
  const [editedUser, setEditedUser] = useState<User>(mockUser);
  const [activeTab, setActiveTab] = useState<'info' | 'permissions' | 'activity'>('info');
  const [isBlockModalOpen, setIsBlockModalOpen] = useState(false);
  const [isResetPasswordModalOpen, setIsResetPasswordModalOpen] = useState(false);

  // ÃÂ¤ÃÂ¾Ã‘â‚¬ÃÂ¼ÃÂ°Ã‘â€šÃÂ¸Ã‘â‚¬ÃÂ¾ÃÂ²ÃÂ°ÃÂ½ÃÂ¸ÃÂµ ÃÂ´ÃÂ°Ã‘â€šÃ‘â€¹
  const formatDate = (date: Date): string => {
    return date.toLocaleDateString('ru-RU', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
  };

  // ÃÂ¤ÃÂ¾Ã‘â‚¬ÃÂ¼ÃÂ°Ã‘â€šÃÂ¸Ã‘â‚¬ÃÂ¾ÃÂ²ÃÂ°ÃÂ½ÃÂ¸ÃÂµ ÃÂ²Ã‘â‚¬ÃÂµÃÂ¼ÃÂµÃÂ½ÃÂ¸
  const formatDateTime = (date: Date): string => {
    return date.toLocaleString('ru-RU', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  // ÃÅ¸ÃÂ¾ÃÂ»Ã‘Æ’Ã‘â€¡ÃÂµÃÂ½ÃÂ¸ÃÂµ ÃÂ¸ÃÂ½ÃÂ¸Ã‘â€ ÃÂ¸ÃÂ°ÃÂ»ÃÂ¾ÃÂ²
  const getInitials = (firstName: string, lastName: string): string => {
    return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
  };

  // ÃÂ¡ÃÂ¾Ã‘â€¦Ã‘â‚¬ÃÂ°ÃÂ½ÃÂµÃÂ½ÃÂ¸ÃÂµ ÃÂ¸ÃÂ·ÃÂ¼ÃÂµÃÂ½ÃÂµÃÂ½ÃÂ¸ÃÂ¹
  const handleSave = () => {
    setUser(editedUser);
    setIsEditing(false);
  };

  // ÃÅ¾Ã‘â€šÃÂ¼ÃÂµÃÂ½ÃÂ° Ã‘â‚¬ÃÂµÃÂ´ÃÂ°ÃÂºÃ‘â€šÃÂ¸Ã‘â‚¬ÃÂ¾ÃÂ²ÃÂ°ÃÂ½ÃÂ¸Ã‘Â
  const handleCancel = () => {
    setEditedUser(user);
    setIsEditing(false);
  };

  // Ãâ€˜ÃÂ»ÃÂ¾ÃÂºÃÂ¸Ã‘â‚¬ÃÂ¾ÃÂ²ÃÂºÃÂ°/Ã‘â‚¬ÃÂ°ÃÂ·ÃÂ±ÃÂ»ÃÂ¾ÃÂºÃÂ¸Ã‘â‚¬ÃÂ¾ÃÂ²ÃÂºÃÂ°
  const handleToggleBlock = () => {
    const newStatus: UserStatus = user.status === 'blocked' ? 'active' : 'blocked';
    setUser({ ...user, status: newStatus });
    setIsBlockModalOpen(false);
  };

  // ÃÂ¡ÃÂ±Ã‘â‚¬ÃÂ¾Ã‘Â ÃÂ¿ÃÂ°Ã‘â‚¬ÃÂ¾ÃÂ»Ã‘Â
  const handleResetPassword = () => {
    // ÃËœÃÂ¼ÃÂ¸Ã‘â€šÃÂ°Ã‘â€ ÃÂ¸Ã‘Â ÃÂ¾Ã‘â€šÃÂ¿Ã‘â‚¬ÃÂ°ÃÂ²ÃÂºÃÂ¸ ÃÂ¿ÃÂ¸Ã‘ÂÃ‘Å’ÃÂ¼ÃÂ°
    console.log('ÃÅ¸ÃÂ¸Ã‘ÂÃ‘Å’ÃÂ¼ÃÂ¾ ÃÂ´ÃÂ»Ã‘Â Ã‘ÂÃÂ±Ã‘â‚¬ÃÂ¾Ã‘ÂÃÂ° ÃÂ¿ÃÂ°Ã‘â‚¬ÃÂ¾ÃÂ»Ã‘Â ÃÂ¾Ã‘â€šÃÂ¿Ã‘â‚¬ÃÂ°ÃÂ²ÃÂ»ÃÂµÃÂ½ÃÂ¾');
    setIsResetPasswordModalOpen(false);
  };

  // ÃÅ¸ÃÂµÃ‘â‚¬ÃÂµÃÂºÃÂ»Ã‘Å½Ã‘â€¡ÃÂµÃÂ½ÃÂ¸ÃÂµ Ã‘â‚¬ÃÂ°ÃÂ·Ã‘â‚¬ÃÂµÃ‘Ë†ÃÂµÃÂ½ÃÂ¸Ã‘Â
  const togglePermission = (permissionKey: string) => {
    setEditedUser((prev) => ({
      ...prev,
      permissions: prev.permissions.includes(permissionKey)
        ? prev.permissions.filter((p) => p !== permissionKey)
        : [...prev.permissions, permissionKey],
    }));
  };

  return (
    <div className="space-y-6">
      {/* ÃÂ¥ÃÂ»ÃÂµÃÂ±ÃÂ½Ã‘â€¹ÃÂµ ÃÂºÃ‘â‚¬ÃÂ¾Ã‘Ë†ÃÂºÃÂ¸ */}
      <nav className="flex items-center gap-2 text-sm">
        <Link to="/admin/users" className="text-slate-400 hover:text-white transition-colors">
          ÃÅ¸ÃÂ¾ÃÂ»Ã‘Å’ÃÂ·ÃÂ¾ÃÂ²ÃÂ°Ã‘â€šÃÂµÃÂ»ÃÂ¸
        </Link>
        <svg className="w-4 h-4 text-slate-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
        </svg>
        <span className="text-white">
          {user.firstName} {user.lastName}
        </span>
      </nav>

      {/* ÃÂ¨ÃÂ°ÃÂ¿ÃÂºÃÂ° ÃÂ¿Ã‘â‚¬ÃÂ¾Ã‘â€žÃÂ¸ÃÂ»Ã‘Â */}
      <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl overflow-hidden">
        {/* Ãâ€ÃÂµÃÂºÃÂ¾Ã‘â‚¬ÃÂ°Ã‘â€šÃÂ¸ÃÂ²ÃÂ½Ã‘â€¹ÃÂ¹ Ã‘â€žÃÂ¾ÃÂ½ */}
        <div className="h-24 bg-gradient-to-r from-amber-500/20 via-purple-500/20 to-blue-500/20" />

        <div className="px-6 pb-6">
          <div className="flex flex-col md:flex-row md:items-end gap-4 -mt-12">
            {/* ÃÂÃÂ²ÃÂ°Ã‘â€šÃÂ°Ã‘â‚¬ */}
            <div className="w-24 h-24 rounded-xl bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center text-white text-2xl font-bold border-4 border-slate-800">
              {getInitials(user.firstName, user.lastName)}
            </div>

            {/* ÃËœÃÂ½Ã‘â€žÃÂ¾Ã‘â‚¬ÃÂ¼ÃÂ°Ã‘â€ ÃÂ¸Ã‘Â */}
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-1">
                <h1 className="text-2xl font-bold text-white">
                  {user.firstName} {user.lastName}
                </h1>
                <span className={`px-2.5 py-1 text-xs font-medium rounded-lg ${statusColors[user.status]}`}>
                  {statusLabels[user.status]}
                </span>
              </div>
              <p className="text-slate-400">{user.email}</p>
              <div className="flex items-center gap-3 mt-2">
                <span className={`px-2.5 py-1 text-xs font-medium rounded-lg border ${roleColors[user.role]}`}>
                  {roleLabels[user.role]}
                </span>
                {user.department && (
                  <span className="text-sm text-slate-400">Ã¢â‚¬Â¢ {user.department}</span>
                )}
              </div>
            </div>

            {/* Ãâ€ÃÂµÃÂ¹Ã‘ÂÃ‘â€šÃÂ²ÃÂ¸Ã‘Â */}
            <div className="flex gap-2">
              {!isEditing ? (
                <>
                  <Button variant="outline" onClick={() => setIsEditing(true)}>
                    <svg className="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                    </svg>
                    ÃÂ ÃÂµÃÂ´ÃÂ°ÃÂºÃ‘â€šÃÂ¸Ã‘â‚¬ÃÂ¾ÃÂ²ÃÂ°Ã‘â€šÃ‘Å’
                  </Button>
                  <Button
                    variant="ghost"
                    onClick={() => setIsBlockModalOpen(true)}
                    className={user.status === 'blocked' ? 'text-green-400 hover:text-green-300' : 'text-red-400 hover:text-red-300'}
                  >
                    {user.status === 'blocked' ? 'ÃÂ ÃÂ°ÃÂ·ÃÂ±ÃÂ»ÃÂ¾ÃÂºÃÂ¸Ã‘â‚¬ÃÂ¾ÃÂ²ÃÂ°Ã‘â€šÃ‘Å’' : 'Ãâ€”ÃÂ°ÃÂ±ÃÂ»ÃÂ¾ÃÂºÃÂ¸Ã‘â‚¬ÃÂ¾ÃÂ²ÃÂ°Ã‘â€šÃ‘Å’'}
                  </Button>
                </>
              ) : (
                <>
                  <Button variant="ghost" onClick={handleCancel}>
                    ÃÅ¾Ã‘â€šÃÂ¼ÃÂµÃÂ½ÃÂ°
                  </Button>
                  <Button onClick={handleSave}>
                    ÃÂ¡ÃÂ¾Ã‘â€¦Ã‘â‚¬ÃÂ°ÃÂ½ÃÂ¸Ã‘â€šÃ‘Å’
                  </Button>
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ÃÂ¢ÃÂ°ÃÂ±Ã‘â€¹ */}
      <div className="border-b border-slate-700/50">
        <nav className="flex gap-1">
          {[
            { key: 'info', label: 'ÃËœÃÂ½Ã‘â€žÃÂ¾Ã‘â‚¬ÃÂ¼ÃÂ°Ã‘â€ ÃÂ¸Ã‘Â', icon: 'M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z' },
            { key: 'permissions', label: 'ÃÂ ÃÂ°ÃÂ·Ã‘â‚¬ÃÂµÃ‘Ë†ÃÂµÃÂ½ÃÂ¸Ã‘Â', icon: 'M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z' },
            { key: 'activity', label: 'ÃÂÃÂºÃ‘â€šÃÂ¸ÃÂ²ÃÂ½ÃÂ¾Ã‘ÂÃ‘â€šÃ‘Å’', icon: 'M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z' },
          ].map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key as typeof activeTab)}
              className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
                activeTab === tab.key
                  ? 'text-amber-400 border-amber-400'
                  : 'text-slate-400 border-transparent hover:text-white'
              }`}
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={tab.icon} />
              </svg>
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {/* ÃÅ¡ÃÂ¾ÃÂ½Ã‘â€šÃÂµÃÂ½Ã‘â€š Ã‘â€šÃÂ°ÃÂ±ÃÂ¾ÃÂ² */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* ÃÅ¾Ã‘ÂÃÂ½ÃÂ¾ÃÂ²ÃÂ½ÃÂ¾ÃÂ¹ ÃÂºÃÂ¾ÃÂ½Ã‘â€šÃÂµÃÂ½Ã‘â€š */}
        <div className="lg:col-span-2 space-y-6">
          {activeTab === 'info' && (
            <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-6">
              <h2 className="text-lg font-semibold text-white mb-4">ÃÅ¡ÃÂ¾ÃÂ½Ã‘â€šÃÂ°ÃÂºÃ‘â€šÃÂ½ÃÂ°Ã‘Â ÃÂ¸ÃÂ½Ã‘â€žÃÂ¾Ã‘â‚¬ÃÂ¼ÃÂ°Ã‘â€ ÃÂ¸Ã‘Â</h2>
              
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-400 mb-1">
                      ÃËœÃÂ¼Ã‘Â
                    </label>
                    {isEditing ? (
                      <Input
                        value={editedUser.firstName}
                        onChange={(e) => setEditedUser({ ...editedUser, firstName: e.target.value })}
                      />
                    ) : (
                      <p className="text-white">{user.firstName}</p>
                    )}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-400 mb-1">
                      ÃÂ¤ÃÂ°ÃÂ¼ÃÂ¸ÃÂ»ÃÂ¸Ã‘Â
                    </label>
                    {isEditing ? (
                      <Input
                        value={editedUser.lastName}
                        onChange={(e) => setEditedUser({ ...editedUser, lastName: e.target.value })}
                      />
                    ) : (
                      <p className="text-white">{user.lastName}</p>
                    )}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-400 mb-1">
                    Email
                  </label>
                  {isEditing ? (
                    <Input
                      type="email"
                      value={editedUser.email}
                      onChange={(e) => setEditedUser({ ...editedUser, email: e.target.value })}
                    />
                  ) : (
                    <p className="text-white">{user.email}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-400 mb-1">
                    ÃÂ¢ÃÂµÃÂ»ÃÂµÃ‘â€žÃÂ¾ÃÂ½
                  </label>
                  {isEditing ? (
                    <Input
                      value={editedUser.phone || ''}
                      onChange={(e) => setEditedUser({ ...editedUser, phone: e.target.value })}
                      placeholder="+7 (___) ___-__-__"
                    />
                  ) : (
                    <p className="text-white">{user.phone || 'Ã¢â‚¬â€'}</p>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-400 mb-1">
                      ÃÅ¾Ã‘â€šÃÂ´ÃÂµÃÂ»
                    </label>
                    {isEditing ? (
                      <Input
                        value={editedUser.department || ''}
                        onChange={(e) => setEditedUser({ ...editedUser, department: e.target.value })}
                      />
                    ) : (
                      <p className="text-white">{user.department || 'Ã¢â‚¬â€'}</p>
                    )}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-400 mb-1">
                      Ãâ€ÃÂ¾ÃÂ»ÃÂ¶ÃÂ½ÃÂ¾Ã‘ÂÃ‘â€šÃ‘Å’
                    </label>
                    {isEditing ? (
                      <Input
                        value={editedUser.position || ''}
                        onChange={(e) => setEditedUser({ ...editedUser, position: e.target.value })}
                      />
                    ) : (
                      <p className="text-white">{user.position || 'Ã¢â‚¬â€'}</p>
                    )}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-400 mb-1">
                    ÃÂ ÃÂ¾ÃÂ»Ã‘Å’
                  </label>
                  {isEditing ? (
                    <select
                      value={editedUser.role}
                      onChange={(e) => setEditedUser({ ...editedUser, role: e.target.value as UserRole })}
                      className="w-full px-4 py-2 bg-slate-700/50 border border-slate-600/50 rounded-lg text-white focus:outline-none focus:border-amber-500/50"
                    >
                      {Object.entries(roleLabels).map(([value, label]) => (
                        <option key={value} value={value}>
                          {label}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <span className={`inline-flex px-2.5 py-1 text-xs font-medium rounded-lg border ${roleColors[user.role]}`}>
                      {roleLabels[user.role]}
                    </span>
                  )}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'permissions' && (
            <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-6">
              <h2 className="text-lg font-semibold text-white mb-4">ÃÅ¸Ã‘â‚¬ÃÂ°ÃÂ²ÃÂ° ÃÂ´ÃÂ¾Ã‘ÂÃ‘â€šÃ‘Æ’ÃÂ¿ÃÂ°</h2>
              
              <div className="space-y-6">
                {permissionGroups.map((group) => (
                  <div key={group.name}>
                    <h3 className="text-sm font-medium text-slate-300 mb-3">{group.name}</h3>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                      {group.permissions.map((permission) => {
                        const hasPermission = (isEditing ? editedUser : user).permissions.includes(permission.key);
                        return (
                          <button
                            key={permission.key}
                            onClick={() => isEditing && togglePermission(permission.key)}
                            disabled={!isEditing}
                            className={`px-3 py-2 text-sm rounded-lg border transition-colors ${
                              hasPermission
                                ? 'bg-green-500/10 border-green-500/30 text-green-400'
                                : 'bg-slate-700/30 border-slate-600/30 text-slate-500'
                            } ${isEditing ? 'cursor-pointer hover:opacity-80' : 'cursor-default'}`}
                          >
                            <span className="flex items-center gap-2">
                              {hasPermission ? (
                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                </svg>
                              ) : (
                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                              )}
                              {permission.label}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'activity' && (
            <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-6">
              <h2 className="text-lg font-semibold text-white mb-4">Ãâ€“Ã‘Æ’Ã‘â‚¬ÃÂ½ÃÂ°ÃÂ» ÃÂ°ÃÂºÃ‘â€šÃÂ¸ÃÂ²ÃÂ½ÃÂ¾Ã‘ÂÃ‘â€šÃÂ¸</h2>
              
              <div className="space-y-4">
                {mockActivityLog.map((log, index) => (
                  <div
                    key={log.id}
                    className={`relative pl-6 pb-4 ${
                      index < mockActivityLog.length - 1 ? 'border-l border-slate-700/50' : ''
                    }`}
                  >
                    {/* ÃÂ¢ÃÂ¾Ã‘â€¡ÃÂºÃÂ° ÃÂ½ÃÂ° Ã‘â€šÃÂ°ÃÂ¹ÃÂ¼ÃÂ»ÃÂ°ÃÂ¹ÃÂ½ÃÂµ */}
                    <div className="absolute left-0 top-0 -translate-x-1/2 w-3 h-3 rounded-full bg-slate-700 border-2 border-slate-600" />
                    
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="text-white font-medium">{log.action}</p>
                        <p className="text-sm text-slate-400 mt-0.5">{log.details}</p>
                        {log.ip && (
                          <p className="text-xs text-slate-500 mt-1">IP: {log.ip}</p>
                        )}
                      </div>
                      <span className="text-xs text-slate-500 flex-shrink-0">
                        {formatDateTime(log.timestamp)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>

              <button className="w-full mt-4 py-2 text-sm text-amber-400 hover:text-amber-300 transition-colors">
                Ãâ€”ÃÂ°ÃÂ³Ã‘â‚¬Ã‘Æ’ÃÂ·ÃÂ¸Ã‘â€šÃ‘Å’ ÃÂµÃ‘â€°Ã‘â€˜
              </button>
            </div>
          )}
        </div>

        {/* Ãâ€˜ÃÂ¾ÃÂºÃÂ¾ÃÂ²ÃÂ°Ã‘Â ÃÂ¿ÃÂ°ÃÂ½ÃÂµÃÂ»Ã‘Å’ */}
        <div className="space-y-6">
          {/* Ãâ€˜Ã‘â€¹Ã‘ÂÃ‘â€šÃ‘â‚¬Ã‘â€¹ÃÂµ ÃÂ´ÃÂµÃÂ¹Ã‘ÂÃ‘â€šÃÂ²ÃÂ¸Ã‘Â */}
          <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-6">
            <h3 className="text-sm font-medium text-slate-400 mb-4">Ãâ€˜Ã‘â€¹Ã‘ÂÃ‘â€šÃ‘â‚¬Ã‘â€¹ÃÂµ ÃÂ´ÃÂµÃÂ¹Ã‘ÂÃ‘â€šÃÂ²ÃÂ¸Ã‘Â</h3>
            <div className="space-y-2">
              <button
                onClick={() => setIsResetPasswordModalOpen(true)}
                className="w-full flex items-center gap-3 px-3 py-2 text-left text-sm text-slate-300 hover:text-white hover:bg-slate-700/50 rounded-lg transition-colors"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
                </svg>
                ÃÂ¡ÃÂ±Ã‘â‚¬ÃÂ¾Ã‘ÂÃÂ¸Ã‘â€šÃ‘Å’ ÃÂ¿ÃÂ°Ã‘â‚¬ÃÂ¾ÃÂ»Ã‘Å’
              </button>
              <button className="w-full flex items-center gap-3 px-3 py-2 text-left text-sm text-slate-300 hover:text-white hover:bg-slate-700/50 rounded-lg transition-colors">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
                ÃÅ¾Ã‘â€šÃÂ¿Ã‘â‚¬ÃÂ°ÃÂ²ÃÂ¸Ã‘â€šÃ‘Å’ Ã‘ÂÃÂ¾ÃÂ¾ÃÂ±Ã‘â€°ÃÂµÃÂ½ÃÂ¸ÃÂµ
              </button>
              <button className="w-full flex items-center gap-3 px-3 py-2 text-left text-sm text-slate-300 hover:text-white hover:bg-slate-700/50 rounded-lg transition-colors">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                ÃÂ­ÃÂºÃ‘ÂÃÂ¿ÃÂ¾Ã‘â‚¬Ã‘â€š ÃÂ´ÃÂ°ÃÂ½ÃÂ½Ã‘â€¹Ã‘â€¦
              </button>
            </div>
          </div>

          {/* ÃËœÃÂ½Ã‘â€žÃÂ¾Ã‘â‚¬ÃÂ¼ÃÂ°Ã‘â€ ÃÂ¸Ã‘Â ÃÂ¾ Ã‘ÂÃÂ¸Ã‘ÂÃ‘â€šÃÂµÃÂ¼ÃÂµ */}
          <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-6">
            <h3 className="text-sm font-medium text-slate-400 mb-4">ÃÂ¡ÃÂ¸Ã‘ÂÃ‘â€šÃÂµÃÂ¼ÃÂ½ÃÂ°Ã‘Â ÃÂ¸ÃÂ½Ã‘â€žÃÂ¾Ã‘â‚¬ÃÂ¼ÃÂ°Ã‘â€ ÃÂ¸Ã‘Â</h3>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-sm text-slate-400">ID ÃÂ¿ÃÂ¾ÃÂ»Ã‘Å’ÃÂ·ÃÂ¾ÃÂ²ÃÂ°Ã‘â€šÃÂµÃÂ»Ã‘Â</span>
                <span className="text-sm text-white font-mono">{user.id}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-slate-400">Ãâ€ÃÂ°Ã‘â€šÃÂ° Ã‘â‚¬ÃÂµÃÂ³ÃÂ¸Ã‘ÂÃ‘â€šÃ‘â‚¬ÃÂ°Ã‘â€ ÃÂ¸ÃÂ¸</span>
                <span className="text-sm text-white">{formatDate(user.createdAt)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-slate-400">ÃÅ¸ÃÂ¾Ã‘ÂÃÂ»ÃÂµÃÂ´ÃÂ½ÃÂ¸ÃÂ¹ ÃÂ²Ã‘â€¦ÃÂ¾ÃÂ´</span>
                <span className="text-sm text-white">
                  {user.lastLogin ? formatDateTime(user.lastLogin) : 'ÃÂÃÂ¸ÃÂºÃÂ¾ÃÂ³ÃÂ´ÃÂ°'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-slate-400">2FA</span>
                <span className="text-sm text-red-400">ÃÅ¾Ã‘â€šÃÂºÃÂ»Ã‘Å½Ã‘â€¡ÃÂµÃÂ½ÃÂ°</span>
              </div>
            </div>
          </div>

          {/* ÃÂÃÂºÃ‘â€šÃÂ¸ÃÂ²ÃÂ½Ã‘â€¹ÃÂµ Ã‘ÂÃÂµÃ‘ÂÃ‘ÂÃÂ¸ÃÂ¸ */}
          <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-6">
            <h3 className="text-sm font-medium text-slate-400 mb-4">ÃÂÃÂºÃ‘â€šÃÂ¸ÃÂ²ÃÂ½Ã‘â€¹ÃÂµ Ã‘ÂÃÂµÃ‘ÂÃ‘ÂÃÂ¸ÃÂ¸</h3>
            <div className="space-y-3">
              <div className="flex items-center gap-3 p-3 bg-slate-700/30 rounded-lg">
                <div className="w-8 h-8 rounded-lg bg-green-500/10 flex items-center justify-center">
                  <svg className="w-4 h-4 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-white">Windows Ã‚Â· Chrome</p>
                  <p className="text-xs text-slate-400">ÃÅ“ÃÂ¾Ã‘ÂÃÂºÃÂ²ÃÂ° Ã‚Â· ÃÂ¡ÃÂµÃÂ¹Ã‘â€¡ÃÂ°Ã‘Â ÃÂ¾ÃÂ½ÃÂ»ÃÂ°ÃÂ¹ÃÂ½</p>
                </div>
                <div className="w-2 h-2 rounded-full bg-green-400" />
              </div>
            </div>
            <button className="w-full mt-3 py-2 text-sm text-red-400 hover:text-red-300 transition-colors">
              Ãâ€”ÃÂ°ÃÂ²ÃÂµÃ‘â‚¬Ã‘Ë†ÃÂ¸Ã‘â€šÃ‘Å’ ÃÂ²Ã‘ÂÃÂµ Ã‘ÂÃÂµÃ‘ÂÃ‘ÂÃÂ¸ÃÂ¸
            </button>
          </div>
        </div>
      </div>

      {/* ÃÅ“ÃÂ¾ÃÂ´ÃÂ°ÃÂ»Ã‘Å’ÃÂ½ÃÂ¾ÃÂµ ÃÂ¾ÃÂºÃÂ½ÃÂ¾ ÃÂ±ÃÂ»ÃÂ¾ÃÂºÃÂ¸Ã‘â‚¬ÃÂ¾ÃÂ²ÃÂºÃÂ¸ */}
      <Modal
        isOpen={isBlockModalOpen}
        onClose={() => setIsBlockModalOpen(false)}
        title={user.status === 'blocked' ? 'ÃÂ ÃÂ°ÃÂ·ÃÂ±ÃÂ»ÃÂ¾ÃÂºÃÂ¸Ã‘â‚¬ÃÂ¾ÃÂ²ÃÂ°Ã‘â€šÃ‘Å’ ÃÂ¿ÃÂ¾ÃÂ»Ã‘Å’ÃÂ·ÃÂ¾ÃÂ²ÃÂ°Ã‘â€šÃÂµÃÂ»Ã‘Â' : 'Ãâ€”ÃÂ°ÃÂ±ÃÂ»ÃÂ¾ÃÂºÃÂ¸Ã‘â‚¬ÃÂ¾ÃÂ²ÃÂ°Ã‘â€šÃ‘Å’ ÃÂ¿ÃÂ¾ÃÂ»Ã‘Å’ÃÂ·ÃÂ¾ÃÂ²ÃÂ°Ã‘â€šÃÂµÃÂ»Ã‘Â'}
      >
        <div className="space-y-4">
          <p className="text-slate-300">
            {user.status === 'blocked'
              ? `Ãâ€™Ã‘â€¹ Ã‘Æ’ÃÂ²ÃÂµÃ‘â‚¬ÃÂµÃÂ½Ã‘â€¹, Ã‘â€¡Ã‘â€šÃÂ¾ Ã‘â€¦ÃÂ¾Ã‘â€šÃÂ¸Ã‘â€šÃÂµ Ã‘â‚¬ÃÂ°ÃÂ·ÃÂ±ÃÂ»ÃÂ¾ÃÂºÃÂ¸Ã‘â‚¬ÃÂ¾ÃÂ²ÃÂ°Ã‘â€šÃ‘Å’ ÃÂ¿ÃÂ¾ÃÂ»Ã‘Å’ÃÂ·ÃÂ¾ÃÂ²ÃÂ°Ã‘â€šÃÂµÃÂ»Ã‘Â ${user.firstName} ${user.lastName}?`
              : `Ãâ€™Ã‘â€¹ Ã‘Æ’ÃÂ²ÃÂµÃ‘â‚¬ÃÂµÃÂ½Ã‘â€¹, Ã‘â€¡Ã‘â€šÃÂ¾ Ã‘â€¦ÃÂ¾Ã‘â€šÃÂ¸Ã‘â€šÃÂµ ÃÂ·ÃÂ°ÃÂ±ÃÂ»ÃÂ¾ÃÂºÃÂ¸Ã‘â‚¬ÃÂ¾ÃÂ²ÃÂ°Ã‘â€šÃ‘Å’ ÃÂ¿ÃÂ¾ÃÂ»Ã‘Å’ÃÂ·ÃÂ¾ÃÂ²ÃÂ°Ã‘â€šÃÂµÃÂ»Ã‘Â ${user.firstName} ${user.lastName}? ÃÅ¾ÃÂ½ ÃÂ½ÃÂµ Ã‘ÂÃÂ¼ÃÂ¾ÃÂ¶ÃÂµÃ‘â€š ÃÂ²ÃÂ¾ÃÂ¹Ã‘â€šÃÂ¸ ÃÂ² Ã‘ÂÃÂ¸Ã‘ÂÃ‘â€šÃÂµÃÂ¼Ã‘Æ’.`}
          </p>
          <div className="flex justify-end gap-3">
            <Button variant="ghost" onClick={() => setIsBlockModalOpen(false)}>
              ÃÅ¾Ã‘â€šÃÂ¼ÃÂµÃÂ½ÃÂ°
            </Button>
            <Button
              variant={user.status === 'blocked' ? 'primary' : 'danger'}
              onClick={handleToggleBlock}
            >
              {user.status === 'blocked' ? 'ÃÂ ÃÂ°ÃÂ·ÃÂ±ÃÂ»ÃÂ¾ÃÂºÃÂ¸Ã‘â‚¬ÃÂ¾ÃÂ²ÃÂ°Ã‘â€šÃ‘Å’' : 'Ãâ€”ÃÂ°ÃÂ±ÃÂ»ÃÂ¾ÃÂºÃÂ¸Ã‘â‚¬ÃÂ¾ÃÂ²ÃÂ°Ã‘â€šÃ‘Å’'}
            </Button>
          </div>
        </div>
      </Modal>

      {/* ÃÅ“ÃÂ¾ÃÂ´ÃÂ°ÃÂ»Ã‘Å’ÃÂ½ÃÂ¾ÃÂµ ÃÂ¾ÃÂºÃÂ½ÃÂ¾ Ã‘ÂÃÂ±Ã‘â‚¬ÃÂ¾Ã‘ÂÃÂ° ÃÂ¿ÃÂ°Ã‘â‚¬ÃÂ¾ÃÂ»Ã‘Â */}
      <Modal
        isOpen={isResetPasswordModalOpen}
        onClose={() => setIsResetPasswordModalOpen(false)}
        title="ÃÂ¡ÃÂ±Ã‘â‚¬ÃÂ¾Ã‘Â ÃÂ¿ÃÂ°Ã‘â‚¬ÃÂ¾ÃÂ»Ã‘Â"
      >
        <div className="space-y-4">
          <p className="text-slate-300">
            ÃÅ¸ÃÂ¾ÃÂ»Ã‘Å’ÃÂ·ÃÂ¾ÃÂ²ÃÂ°Ã‘â€šÃÂµÃÂ»Ã‘Å½ {user.firstName} {user.lastName} ÃÂ±Ã‘Æ’ÃÂ´ÃÂµÃ‘â€š ÃÂ¾Ã‘â€šÃÂ¿Ã‘â‚¬ÃÂ°ÃÂ²ÃÂ»ÃÂµÃÂ½ÃÂ¾ ÃÂ¿ÃÂ¸Ã‘ÂÃ‘Å’ÃÂ¼ÃÂ¾ 
            Ã‘ÂÃÂ¾ Ã‘ÂÃ‘ÂÃ‘â€¹ÃÂ»ÃÂºÃÂ¾ÃÂ¹ ÃÂ´ÃÂ»Ã‘Â Ã‘Æ’Ã‘ÂÃ‘â€šÃÂ°ÃÂ½ÃÂ¾ÃÂ²ÃÂºÃÂ¸ ÃÂ½ÃÂ¾ÃÂ²ÃÂ¾ÃÂ³ÃÂ¾ ÃÂ¿ÃÂ°Ã‘â‚¬ÃÂ¾ÃÂ»Ã‘Â ÃÂ½ÃÂ° ÃÂ°ÃÂ´Ã‘â‚¬ÃÂµÃ‘Â:
          </p>
          <p className="text-amber-400 font-medium">{user.email}</p>
          <div className="flex justify-end gap-3">
            <Button variant="ghost" onClick={() => setIsResetPasswordModalOpen(false)}>
              ÃÅ¾Ã‘â€šÃÂ¼ÃÂµÃÂ½ÃÂ°
            </Button>
            <Button onClick={handleResetPassword}>
              ÃÅ¾Ã‘â€šÃÂ¿Ã‘â‚¬ÃÂ°ÃÂ²ÃÂ¸Ã‘â€šÃ‘Å’
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default UserDetailPage;
