import React, { useState, useEffect } from 'react';
import { Edit2, Trash2, Search, Shield, User } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { AdminTable } from './AdminTable';
import { AdminModal } from './AdminModal';
import { AdminSelect } from './AdminSelect';
import { useToast } from './useToast';

interface UserProfile {
  id: string;
  name: string;
  email: string;
  role: string;
  level: number;
  points: number;
  created_at: string;
}

export function UserManagement() {
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterRole, setFilterRole] = useState<string>('all');
  const { toasts, showToast } = useToast();

  const [formData, setFormData] = useState({
    role: ''
  });

  const roleOptions = [
    { value: 'student', label: 'Student' },
    { value: 'admin', label: 'Admin' },
    { value: 'moderator', label: 'Moderator' }
  ];

  useEffect(() => {
    fetchUsers();
  }, []);

  async function fetchUsers() {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setUsers(data || []);
    } catch (err: any) {
      showToast(err.message || 'Failed to fetch users', 'error');
    } finally {
      setLoading(false);
    }
  }

  async function handleRoleUpdate() {
    if (!editingId || !formData.role) return;

    try {
      setLoading(true);
      const { error } = await supabase
        .from('profiles')
        .update({ role: formData.role })
        .eq('id', editingId);

      if (error) throw error;
      showToast('User role updated successfully', 'success');
      setIsModalOpen(false);
      fetchUsers();
    } catch (err: any) {
      showToast(err.message || 'Failed to update user role', 'error');
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete(id: string) {
    try {
      setLoading(true);
      const { error } = await supabase.from('profiles').delete().eq('id', id);
      if (error) throw error;
      showToast('User deleted successfully', 'success');
      setIsDeleteConfirmOpen(false);
      fetchUsers();
    } catch (err: any) {
      showToast(err.message || 'Failed to delete user', 'error');
    } finally {
      setLoading(false);
    }
  }

  function openRoleModal(user: UserProfile) {
    setFormData({ role: user.role });
    setEditingId(user.id);
    setIsModalOpen(true);
  }

  const filteredUsers = users.filter((u) => {
    const matchesSearch =
      u.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRole = filterRole === 'all' || u.role === filterRole;
    return matchesSearch && matchesRole;
  });

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white/2 border border-white/10 rounded-lg p-4">
          <div className="flex items-center gap-2 text-blue-400 mb-2">
            <User className="w-4 h-4" />
            <span className="text-xs font-bold uppercase tracking-widest">Total Users</span>
          </div>
          <p className="text-2xl font-black text-white">{users.length}</p>
        </div>
        <div className="bg-white/2 border border-white/10 rounded-lg p-4">
          <div className="flex items-center gap-2 text-green-400 mb-2">
            <Shield className="w-4 h-4" />
            <span className="text-xs font-bold uppercase tracking-widest">Admins</span>
          </div>
          <p className="text-2xl font-black text-white">{users.filter((u) => u.role === 'admin').length}</p>
        </div>
        <div className="bg-white/2 border border-white/10 rounded-lg p-4">
          <div className="flex items-center gap-2 text-purple-400 mb-2">
            <User className="w-4 h-4" />
            <span className="text-xs font-bold uppercase tracking-widest">Students</span>
          </div>
          <p className="text-2xl font-black text-white">{users.filter((u) => u.role === 'student').length}</p>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div className="flex-1 max-w-md">
          <div className="relative">
            <Search className="absolute left-3 top-3 w-4 h-4 text-zinc-500" />
            <input
              type="text"
              placeholder="Search users..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-white/5 border border-white/10 rounded-lg text-sm text-white placeholder-zinc-600 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
            />
          </div>
        </div>

        <select
          value={filterRole}
          onChange={(e) => setFilterRole(e.target.value)}
          className="px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50"
        >
          <option value="all">All Roles</option>
          <option value="admin">Admin</option>
          <option value="moderator">Moderator</option>
          <option value="student">Student</option>
        </select>
      </div>

      <AdminTable<UserProfile>
        data={filteredUsers}
        columns={[
          {
            header: 'Name',
            key: 'name',
            sortable: true,
            render: (value, user) => (
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-blue-600/20 flex items-center justify-center text-xs font-bold text-blue-300">
                  {value.charAt(0).toUpperCase()}
                </div>
                <div>
                  <p className="text-sm font-medium">{value}</p>
                  <p className="text-xs text-zinc-500">{user.email}</p>
                </div>
              </div>
            )
          },
          {
            header: 'Role',
            key: 'role',
            render: (value) => (
              <span
                className={`px-2 py-1 rounded-full text-xs font-medium ${
                  value === 'admin'
                    ? 'bg-red-600/20 text-red-300'
                    : value === 'moderator'
                      ? 'bg-orange-600/20 text-orange-300'
                      : 'bg-blue-600/20 text-blue-300'
                }`}
              >
                {value.charAt(0).toUpperCase() + value.slice(1)}
              </span>
            )
          },
          {
            header: 'Level',
            key: 'level',
            render: (value) => <span className="text-sm">{value}</span>
          },
          {
            header: 'Points',
            key: 'points',
            render: (value) => <span className="text-sm font-medium">{value}</span>
          },
          {
            header: 'Joined',
            key: 'created_at',
            render: (value) => new Date(value).toLocaleDateString()
          }
        ]}
        actions={(user) => (
          <div className="flex gap-2 justify-end">
            <button
              onClick={() => openRoleModal(user)}
              className="p-2 hover:bg-white/5 rounded transition-colors"
              title="Change Role"
            >
              <Edit2 className="w-4 h-4 text-blue-400" />
            </button>
            <button
              onClick={() => {
                setEditingId(user.id);
                setIsDeleteConfirmOpen(true);
              }}
              className="p-2 hover:bg-white/5 rounded transition-colors"
              title="Delete User"
            >
              <Trash2 className="w-4 h-4 text-red-400" />
            </button>
          </div>
        )}
        loading={loading}
        emptyMessage="No users found"
      />

      <AdminModal
        isOpen={isModalOpen}
        title="Change User Role"
        onClose={() => setIsModalOpen(false)}
        onSubmit={handleRoleUpdate}
        submitText="Update Role"
        loading={loading}
      >
        <AdminSelect
          label="Role"
          value={formData.role}
          onChange={(value) => setFormData({ role: value })}
          options={roleOptions}
          required
        />
      </AdminModal>

      <AdminModal
        isOpen={isDeleteConfirmOpen}
        title="Delete User"
        onClose={() => setIsDeleteConfirmOpen(false)}
        onSubmit={() => editingId && handleDelete(editingId)}
        submitText="Delete"
        submitVariant="danger"
        loading={loading}
      >
        <p className="text-zinc-300 text-sm">
          Are you sure you want to delete this user? This action cannot be undone and will remove all user data.
        </p>
      </AdminModal>
    </div>
  );
}
