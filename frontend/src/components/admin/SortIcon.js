import React from 'react';
import { ArrowUpDown, ArrowUp, ArrowDown } from 'lucide-react';

/**
 * مكون أيقونة الترتيب
 * يعرض الأيقونة المناسبة بناءً على حالة الترتيب الحالية
 */
const SortIcon = ({ column, sortColumn, sortDirection }) => {
  if (sortColumn !== column) {
    return <ArrowUpDown className="w-4 h-4 text-gray-400" />;
  }
  return sortDirection === 'asc' ? 
    <ArrowUp className="w-4 h-4 text-emerald-600" /> : 
    <ArrowDown className="w-4 h-4 text-emerald-600" />;
};

export default SortIcon;
