// components/reports/date-range-picker.tsx

'use client';

import Button from '@/components/ui/button';
import { Calendar } from 'lucide-react';

interface DateRangePickerProps {
  startDate: string;
  endDate: string;
  onStartDateChange: (date: string) => void;
  onEndDateChange: (date: string) => void;
}

export function DateRangePicker({
  startDate,
  endDate,
  onStartDateChange,
  onEndDateChange,
}: DateRangePickerProps) {
  const setToday = () => {
    const today = new Date().toISOString().split('T')[0];
    onStartDateChange(today);
    onEndDateChange(today);
  };

  const setYesterday = () => {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const dateStr = yesterday.toISOString().split('T')[0];
    onStartDateChange(dateStr);
    onEndDateChange(dateStr);
  };

  const setThisWeek = () => {
    const today = new Date();
    const firstDay = new Date(today.setDate(today.getDate() - today.getDay()));
    const lastDay = new Date();
    onStartDateChange(firstDay.toISOString().split('T')[0]);
    onEndDateChange(lastDay.toISOString().split('T')[0]);
  };

  const setThisMonth = () => {
    const today = new Date();
    const firstDay = new Date(today.getFullYear(), today.getMonth(), 1);
    const lastDay = new Date();
    onStartDateChange(firstDay.toISOString().split('T')[0]);
    onEndDateChange(lastDay.toISOString().split('T')[0]);
  };

  const setLastMonth = () => {
    const today = new Date();
    const firstDay = new Date(today.getFullYear(), today.getMonth() - 1, 1);
    const lastDay = new Date(today.getFullYear(), today.getMonth(), 0);
    onStartDateChange(firstDay.toISOString().split('T')[0]);
    onEndDateChange(lastDay.toISOString().split('T')[0]);
  };

  return (
    <div className="space-y-4">
      {/* Quick Filters */}
      <div className="flex flex-wrap gap-2">
        <Button variant="secondary" size="sm" onClick={setToday}>
          Today
        </Button>
        <Button variant="secondary" size="sm" onClick={setYesterday}>
          Yesterday
        </Button>
        <Button variant="secondary" size="sm" onClick={setThisWeek}>
          This Week
        </Button>
        <Button variant="secondary" size="sm" onClick={setThisMonth}>
          This Month
        </Button>
        <Button variant="secondary" size="sm" onClick={setLastMonth}>
          Last Month
        </Button>
      </div>

      {/* Custom Date Range */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-700">Start Date</label>
          <div className="relative">
            <input
              type="date"
              value={startDate}
              onChange={(e) => onStartDateChange(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            <Calendar className="absolute right-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400 pointer-events-none" />
          </div>
        </div>

        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-700">End Date</label>
          <div className="relative">
            <input
              type="date"
              value={endDate}
              onChange={(e) => onEndDateChange(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            <Calendar className="absolute right-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400 pointer-events-none" />
          </div>
        </div>
      </div>
    </div>
  );
}
