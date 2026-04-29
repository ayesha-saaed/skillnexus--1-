import React from 'react';
import { ChevronUp, ChevronDown } from 'lucide-react';

interface Column<T> {
  header: string;
  key: keyof T;
  render?: (value: any, item: T) => React.ReactNode;
  sortable?: boolean;
  width?: string;
}

interface AdminTableProps<T> {
  data: T[];
  columns: Column<T>[];
  onRowClick?: (item: T) => void;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  onSort?: (key: string) => void;
  actions?: (item: T) => React.ReactNode;
  loading?: boolean;
  emptyMessage?: string;
}

export function AdminTable<T extends { id: string }>({
  data,
  columns,
  onRowClick,
  sortBy,
  sortOrder,
  onSort,
  actions,
  loading,
  emptyMessage = 'No data available'
}: AdminTableProps<T>) {
  return (
    <div className="overflow-x-auto rounded-lg border border-white/10">
      <table className="w-full">
        <thead>
          <tr className="border-b border-white/10 bg-white/2">
            {columns.map((col) => (
              <th key={String(col.key)} className={`px-4 py-3 text-left text-xs font-bold uppercase tracking-widest text-zinc-400 ${col.width || ''}`}>
                <button
                  onClick={() => col.sortable && onSort && onSort(String(col.key))}
                  className={`flex items-center gap-1 ${col.sortable ? 'cursor-pointer hover:text-white' : ''}`}
                >
                  {col.header}
                  {col.sortable && sortBy === String(col.key) && (
                    sortOrder === 'asc' ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />
                  )}
                </button>
              </th>
            ))}
            {actions && <th className="px-4 py-3 text-right text-xs font-bold uppercase tracking-widest text-zinc-400">Actions</th>}
          </tr>
        </thead>
        <tbody>
          {loading ? (
            <tr>
              <td colSpan={columns.length + (actions ? 1 : 0)} className="px-4 py-8 text-center text-zinc-500">
                Loading...
              </td>
            </tr>
          ) : data.length === 0 ? (
            <tr>
              <td colSpan={columns.length + (actions ? 1 : 0)} className="px-4 py-8 text-center text-zinc-500">
                {emptyMessage}
              </td>
            </tr>
          ) : (
            data.map((item) => (
              <tr
                key={item.id}
                onClick={() => onRowClick?.(item)}
                className="border-b border-white/5 hover:bg-white/2 transition-colors cursor-pointer"
              >
                {columns.map((col) => (
                  <td key={String(col.key)} className="px-4 py-3 text-sm text-zinc-300">
                    {col.render ? col.render((item as any)[col.key], item) : String((item as any)[col.key] || '-')}
                  </td>
                ))}
                {actions && <td className="px-4 py-3 text-right">{actions(item)}</td>}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}
