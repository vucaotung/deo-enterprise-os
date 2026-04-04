import { format, parseISO } from 'date-fns';
import { vi } from 'date-fns/locale';

export const formatDate = (date: string | Date): string => {
  try {
    const d = typeof date === 'string' ? parseISO(date) : date;
    return format(d, 'dd/MM/yyyy HH:mm', { locale: vi });
  } catch {
    return date.toString();
  }
};

export const formatDateOnly = (date: string | Date): string => {
  try {
    const d = typeof date === 'string' ? parseISO(date) : date;
    return format(d, 'dd/MM/yyyy', { locale: vi });
  } catch {
    return date.toString();
  }
};

export const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
  }).format(amount);
};

export const formatTimeAgo = (date: string | Date): string => {
  try {
    const d = typeof date === 'string' ? parseISO(date) : date;
    const now = new Date();
    const diff = now.getTime() - d.getTime();
    const seconds = Math.floor(diff / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (seconds < 60) {
      return 'Vừa xong';
    } else if (minutes < 60) {
      return `${minutes}m`;
    } else if (hours < 24) {
      return `${hours}h`;
    } else if (days < 7) {
      return `${days}d`;
    } else {
      return format(d, 'dd/MM/yyyy', { locale: vi });
    }
  } catch {
    return '';
  }
};

export const cn = (...classes: (string | undefined | null | boolean)[]): string => {
  return classes.filter(Boolean).join(' ');
};

export const getPriorityColor = (priority: string): string => {
  switch (priority) {
    case 'critical':
      return 'bg-red-100 text-red-800';
    case 'high':
      return 'bg-orange-100 text-orange-800';
    case 'medium':
      return 'bg-yellow-100 text-yellow-800';
    case 'low':
      return 'bg-green-100 text-green-800';
    default:
      return 'bg-slate-100 text-slate-800';
  }
};

export const getStatusColor = (status: string): string => {
  switch (status) {
    case 'DONE':
    case 'WON':
    case 'completed':
      return 'bg-green-100 text-green-800';
    case 'IN_PROGRESS':
    case 'CONTACTED':
    case 'QUALIFIED':
      return 'bg-blue-100 text-blue-800';
    case 'BLOCKED':
      return 'bg-yellow-100 text-yellow-800';
    case 'IN_REVIEW':
    case 'PROPOSAL':
      return 'bg-purple-100 text-purple-800';
    case 'TODO':
    case 'NEW':
      return 'bg-slate-100 text-slate-800';
    case 'LOST':
      return 'bg-red-100 text-red-800';
    default:
      return 'bg-slate-100 text-slate-800';
  }
};

export const getStatusLabel = (status: string): string => {
  const labels: Record<string, string> = {
    'TODO': 'Chưa làm',
    'IN_PROGRESS': 'Đang làm',
    'BLOCKED': 'Bị chặn',
    'IN_REVIEW': 'Đang duyệt',
    'DONE': 'Hoàn thành',
    'NEW': 'Mới',
    'CONTACTED': 'Đã liên hệ',
    'QUALIFIED': 'Hợp lệ',
    'PROPOSAL': 'Đề xuất',
    'WON': 'Thắng',
    'LOST': 'Mất',
  };
  return labels[status] || status;
};
