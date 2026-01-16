/**
 * Zod Validation Schemas — Theatre Management System
 *
 * Centralized validation schemas for forms across the application.
 */

import { z } from 'zod';

// ============================================================================
// Common Field Schemas
// ============================================================================

/** Required string with minimum length */
export const requiredString = (fieldName: string, minLength = 1) =>
  z.string().min(minLength, { message: `${fieldName} обязательно для заполнения` });

/** Optional string that can be empty or null */
export const optionalString = z.string().optional().nullable();

/** Positive number */
export const positiveNumber = z.number().positive({ message: 'Значение должно быть положительным' });

/** Non-negative number (0 or positive) */
export const nonNegativeNumber = z.number().min(0, { message: 'Значение не может быть отрицательным' });

/** Email validation */
export const email = z.string().email({ message: 'Некорректный email адрес' });

/** Password validation */
export const password = z
  .string()
  .min(8, { message: 'Пароль должен содержать минимум 8 символов' })
  .regex(/[A-Z]/, { message: 'Пароль должен содержать хотя бы одну заглавную букву' })
  .regex(/[0-9]/, { message: 'Пароль должен содержать хотя бы одну цифру' });

/** Date string in ISO format */
export const dateString = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, {
  message: 'Некорректный формат даты (YYYY-MM-DD)',
});

/** Time string in HH:MM format */
export const timeString = z.string().regex(/^\d{2}:\d{2}$/, {
  message: 'Некорректный формат времени (HH:MM)',
});

// ============================================================================
// Auth Schemas
// ============================================================================

export const loginSchema = z.object({
  email: email,
  password: z.string().min(1, { message: 'Пароль обязателен' }),
});

export const registerSchema = z.object({
  email: email,
  password: password,
  confirmPassword: z.string(),
  firstName: requiredString('Имя', 2),
  lastName: requiredString('Фамилия', 2),
}).refine((data) => data.password === data.confirmPassword, {
  message: 'Пароли не совпадают',
  path: ['confirmPassword'],
});

export const forgotPasswordSchema = z.object({
  email: email,
});

export const resetPasswordSchema = z.object({
  password: password,
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: 'Пароли не совпадают',
  path: ['confirmPassword'],
});

// ============================================================================
// Inventory Schemas
// ============================================================================

export const inventoryItemSchema = z.object({
  name: requiredString('Название', 2),
  inventoryNumber: requiredString('Инвентарный номер', 1),
  description: optionalString,
  categoryId: z.number().positive().optional().nullable(),
  locationId: z.number().positive().optional().nullable(),
  status: z.enum(['in_stock', 'reserved', 'in_use', 'repair', 'written_off']),
  quantity: nonNegativeNumber.default(1),
  purchasePrice: nonNegativeNumber.optional().nullable(),
  currentValue: nonNegativeNumber.optional().nullable(),
  purchaseDate: dateString.optional().nullable(),
  warrantyUntil: dateString.optional().nullable(),
  dimensions: optionalString,
  weight: nonNegativeNumber.optional().nullable(),
  condition: z.enum(['excellent', 'good', 'fair', 'poor', 'needs_repair']).optional().nullable(),
});

export const inventoryCategorySchema = z.object({
  name: requiredString('Название категории', 2),
  description: optionalString,
  parentId: z.number().positive().optional().nullable(),
});

export const storageLocationSchema = z.object({
  name: requiredString('Название', 2),
  description: optionalString,
  building: optionalString,
  floor: optionalString,
  room: optionalString,
});

// ============================================================================
// Performance Schemas
// ============================================================================

export const performanceSchema = z.object({
  title: requiredString('Название', 2),
  description: optionalString,
  author: optionalString,
  director: optionalString,
  duration: positiveNumber.optional().nullable(),
  premiereDate: dateString.optional().nullable(),
  status: z.enum(['in_repertoire', 'preparation', 'paused', 'archived']),
});

export const performanceSectionSchema = z.object({
  title: requiredString('Название раздела', 2),
  content: optionalString,
  sectionType: z.enum(['general', 'technical', 'artistic', 'administrative']),
  orderIndex: nonNegativeNumber.default(0),
});

// ============================================================================
// Schedule Schemas
// ============================================================================

export const scheduleEventSchema = z.object({
  title: requiredString('Название', 2),
  description: optionalString,
  eventType: z.enum([
    'performance',
    'rehearsal',
    'tech_rehearsal',
    'dress_rehearsal',
    'meeting',
    'maintenance',
    'other',
  ]),
  eventDate: dateString,
  startTime: timeString,
  endTime: timeString.optional().nullable(),
  venueId: z.number().positive().optional().nullable(),
  performanceId: z.number().positive().optional().nullable(),
}).refine(
  (data) => {
    if (data.endTime) {
      return data.startTime < data.endTime;
    }
    return true;
  },
  {
    message: 'Время окончания должно быть позже времени начала',
    path: ['endTime'],
  }
);

// ============================================================================
// Document Schemas
// ============================================================================

export const documentSchema = z.object({
  title: requiredString('Название', 2),
  description: optionalString,
  category: z.enum(['contract', 'script', 'technical', 'administrative', 'financial', 'other']),
  departmentId: z.number().positive().optional().nullable(),
  isPublic: z.boolean().default(false),
});

// ============================================================================
// Type Exports
// ============================================================================

export type LoginFormData = z.infer<typeof loginSchema>;
export type RegisterFormData = z.infer<typeof registerSchema>;
export type ForgotPasswordFormData = z.infer<typeof forgotPasswordSchema>;
export type ResetPasswordFormData = z.infer<typeof resetPasswordSchema>;
export type InventoryItemFormData = z.infer<typeof inventoryItemSchema>;
export type InventoryCategoryFormData = z.infer<typeof inventoryCategorySchema>;
export type StorageLocationFormData = z.infer<typeof storageLocationSchema>;
export type PerformanceFormData = z.infer<typeof performanceSchema>;
export type PerformanceSectionFormData = z.infer<typeof performanceSectionSchema>;
export type ScheduleEventFormData = z.infer<typeof scheduleEventSchema>;
export type DocumentFormData = z.infer<typeof documentSchema>;
