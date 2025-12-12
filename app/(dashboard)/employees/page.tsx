// app/(dashboard)/employees/page.tsx

'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/use-auth';
import { getEmployees } from '@/lib/supabase/employees';
import { Profile } from '@/types';
import Button from '@/components/ui/button';
import Input from '@/components/ui/input';
import Badge from '@/components/ui/badge';
import Spinner from '@/components/ui/spinner';
import EmptyState from '@/components/ui/empty-state';
import { AddEmployeeModal } from '@/components/employees/add-employee-modal';
import { EditEmployeeModal } from '@/components/employees/edit-employee-modal';
import { Users, Plus, Search, Shield, User, Crown } from 'lucide-react';
import { formatRelativeTime } from '@/lib/utils';

export default function EmployeesPage() {
  const router = useRouter();
  const { profile } = useAuth();
  const [employees, setEmployees] = useState<Profile[]>([]);
  const [filteredEmployees, setFilteredEmployees] = useState<Profile[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState<Profile | null>(null);
  const [filterStatus, setFilterStatus] = useState<'all' | 'active' | 'inactive'>('active');

  // Only owners can manage employees
  const isOwner = profile?.role === 'owner';

  useEffect(() => {
    loadEmployees();
  }, [profile]);

  useEffect(() => {
    filterEmployees();
  }, [employees, searchQuery, filterStatus]);

  const loadEmployees = async () => {
    if (!profile?.shop_id) return;

    setIsLoading(true);
    try {
      const data = await getEmployees(profile.shop_id);
      setEmployees(data);
    } catch (error) {
      console.error('Error loading employees:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const filterEmployees = () => {
    let filtered = employees;

    // Status filter
    if (filterStatus === 'active') {
      filtered = filtered.filter((e) => e.is_active);
    } else if (filterStatus === 'inactive') {
      filtered = filtered.filter((e) => !e.is_active);
    }

    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (e) =>
          e.name.toLowerCase().includes(query) ||
          e.phone?.toLowerCase().includes(query) ||
          e.role.toLowerCase().includes(query)
      );
    }

    setFilteredEmployees(filtered);
  };

  const getRoleIcon = (role: string) => {
    if (role === 'owner') return Crown;
    if (role === 'supervisor') return Shield;
    return User;
  };

  const getRoleBadgeColor = (role: string) => {
    if (role === 'owner') return 'bg-purple-100 text-purple-800';
    if (role === 'supervisor') return 'bg-emerald-100 text-emerald-800';
    return 'bg-gray-100 text-gray-800';
  };

  if (!isOwner) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <Users className="h-12 w-12 text-gray-400 mx-auto mb-3" />
          <h3 className="text-lg font-medium text-gray-900 mb-1">Owner Access Required</h3>
          <p className="text-sm text-gray-500">
            Only the shop owner can manage employees.
          </p>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Spinner size="lg" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-xl font-bold text-gray-900">Employees</h1>
              <p className="text-sm text-gray-500">
                Manage your staff and permissions
              </p>
            </div>
            <Button onClick={() => setShowAddModal(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Add Employee
            </Button>
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Search and Filters */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-6">
          <div className="flex flex-col sm:flex-row gap-4">
            {/* Search */}
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                <Input
                  type="text"
                  placeholder="Search by name, phone, or role..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            {/* Status Filter */}
            <div className="flex gap-2">
              <button
                onClick={() => setFilterStatus('all')}
                className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
                  filterStatus === 'all'
                    ? 'bg-emerald-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                All
              </button>
              <button
                onClick={() => setFilterStatus('active')}
                className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
                  filterStatus === 'active'
                    ? 'bg-emerald-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Active
              </button>
              <button
                onClick={() => setFilterStatus('inactive')}
                className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
                  filterStatus === 'inactive'
                    ? 'bg-emerald-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Inactive
              </button>
            </div>
          </div>
        </div>

        {/* Employee List */}
        {filteredEmployees.length === 0 ? (
          <EmptyState
            icon={Users}
            title={
              searchQuery
                ? 'No employees found'
                : employees.length === 0
                ? 'No employees yet'
                : 'No employees match filters'
            }
            description={
              searchQuery
                ? 'Try adjusting your search'
                : employees.length === 0
                ? 'Add your first employee to get started'
                : 'Try different filters'
            }
            action={
              employees.length === 0 ? (
                <Button onClick={() => setShowAddModal(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Employee
                </Button>
              ) : undefined
            }
          />
        ) : (
          <div className="grid gap-4">
            {filteredEmployees.map((employee) => {
              const RoleIcon = getRoleIcon(employee.role);
              return (
                <div
                  key={employee.id}
                  className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 hover:shadow-md transition-shadow cursor-pointer"
                  onClick={() => setSelectedEmployee(employee)}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-3 flex-1">
                      {/* Avatar */}
                      <div className="h-12 w-12 rounded-full bg-gray-100 flex items-center justify-center flex-shrink-0">
                        <RoleIcon className="h-6 w-6 text-gray-600" />
                      </div>

                      {/* Info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-medium text-gray-900">{employee.name}</h3>
                          <Badge className={getRoleBadgeColor(employee.role)}>
                            {employee.role}
                          </Badge>
                          {!employee.is_active && (
                            <Badge className="bg-red-100 text-red-800">Inactive</Badge>
                          )}
                          {employee.pin_code && (
                            <Badge className="bg-green-100 text-green-800">PIN Set</Badge>
                          )}
                        </div>

                        {employee.phone && (
                          <p className="text-sm text-gray-600 mb-1">{employee.phone}</p>
                        )}

                        <div className="flex items-center gap-4 text-xs text-gray-500">
                          {employee.last_login_at && (
                            <span>Last login: {formatRelativeTime(employee.last_login_at)}</span>
                          )}
                          <span>Added {formatRelativeTime(employee.created_at)}</span>
                        </div>

                        {/* Supervisor Permissions */}
                        {employee.role === 'supervisor' && (
                          <div className="flex flex-wrap gap-2 mt-2">
                            {employee.can_change_prices && (
                              <Badge className="bg-emerald-50 text-emerald-700 text-xs">
                                Change Prices
                              </Badge>
                            )}
                            {employee.can_process_returns && (
                              <Badge className="bg-emerald-50 text-emerald-700 text-xs">
                                Process Returns
                              </Badge>
                            )}
                            {employee.can_void_transactions && (
                              <Badge className="bg-emerald-50 text-emerald-700 text-xs">
                                Void Transactions
                              </Badge>
                            )}
                            {employee.discount_limit_percent && (
                              <Badge className="bg-emerald-50 text-emerald-700 text-xs">
                                Discount up to {employee.discount_limit_percent}%
                              </Badge>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Add Employee Modal */}
      <AddEmployeeModal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        onSuccess={() => {
          setShowAddModal(false);
          loadEmployees();
        }}
      />

      {/* Edit Employee Modal */}
      {selectedEmployee && (
        <EditEmployeeModal
          isOpen={!!selectedEmployee}
          onClose={() => setSelectedEmployee(null)}
          employee={selectedEmployee}
          onSuccess={() => {
            setSelectedEmployee(null);
            loadEmployees();
          }}
        />
      )}
    </div>
  );
}
