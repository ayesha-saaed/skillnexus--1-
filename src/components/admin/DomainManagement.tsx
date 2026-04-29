import React, { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, Search } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { AdminTable } from './AdminTable';
import { AdminModal } from './AdminModal';
import { AdminInput } from './AdminInput';
import { useToast } from './useToast';

interface Domain {
  id: string;
  name: string;
  description: string;
  icon: string;
  color: string;
  image_url: string;
  created_at: string;
}

export function DomainManagement() {
  const [domains, setDomains] = useState<Domain[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState<string>('created_at');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const { toasts, showToast } = useToast();

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    icon: '',
    color: '#3b82f6',
    image_url: ''
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    fetchDomains();
  }, []);

  async function fetchDomains() {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('domains')
        .select('*')
        .order(sortBy, { ascending: sortOrder === 'asc' });

      if (error) throw error;
      setDomains(data || []);
    } catch (err: any) {
      showToast(err.message || 'Failed to fetch domains', 'error');
    } finally {
      setLoading(false);
    }
  }

  function validateForm() {
    const newErrors: Record<string, string> = {};
    if (!formData.name.trim()) newErrors.name = 'Domain name is required';
    if (formData.name.length < 3) newErrors.name = 'Name must be at least 3 characters';
    if (!formData.description.trim()) newErrors.description = 'Description is required';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }

  async function handleSave() {
    if (!validateForm()) return;

    try {
      setLoading(true);
      if (editingId) {
        const { error } = await supabase
          .from('domains')
          .update({ ...formData, updated_at: new Date().toISOString() })
          .eq('id', editingId);

        if (error) throw error;
        showToast('Domain updated successfully', 'success');
      } else {
        const { error } = await supabase.from('domains').insert([formData]);
        if (error) throw error;
        showToast('Domain created successfully', 'success');
      }

      setIsModalOpen(false);
      resetForm();
      fetchDomains();
    } catch (err: any) {
      showToast(err.message || 'Failed to save domain', 'error');
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete(id: string) {
    try {
      setLoading(true);
      const { error } = await supabase.from('domains').delete().eq('id', id);
      if (error) throw error;
      showToast('Domain deleted successfully', 'success');
      setIsDeleteConfirmOpen(false);
      fetchDomains();
    } catch (err: any) {
      showToast(err.message || 'Failed to delete domain', 'error');
    } finally {
      setLoading(false);
    }
  }

  function resetForm() {
    setFormData({ name: '', description: '', icon: '', color: '#3b82f6', image_url: '' });
    setErrors({});
    setEditingId(null);
  }

  function openEditModal(domain: Domain) {
    setFormData({
      name: domain.name,
      description: domain.description,
      icon: domain.icon || '',
      color: domain.color || '#3b82f6',
      image_url: domain.image_url || ''
    });
    setEditingId(domain.id);
    setIsModalOpen(true);
  }

  const filteredDomains = domains.filter((d) =>
    d.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    d.description.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div className="flex-1 max-w-md">
          <div className="relative">
            <Search className="absolute left-3 top-3 w-4 h-4 text-zinc-500" />
            <input
              type="text"
              placeholder="Search domains..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-white/5 border border-white/10 rounded-lg text-sm text-white placeholder-zinc-600 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
            />
          </div>
        </div>

        <button
          onClick={() => {
            resetForm();
            setIsModalOpen(true);
          }}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600/20 hover:bg-blue-600/30 border border-blue-500/20 rounded-lg text-sm font-medium text-blue-300 transition-colors"
        >
          <Plus className="w-4 h-4" />
          Add Domain
        </button>
      </div>

      <AdminTable<Domain>
        data={filteredDomains}
        columns={[
          {
            header: 'Name',
            key: 'name',
            sortable: true,
            render: (value, item) => (
              <div className="flex items-center gap-2">
                {item.color && <div className="w-4 h-4 rounded" style={{ backgroundColor: item.color }} />}
                {value}
              </div>
            )
          },
          {
            header: 'Description',
            key: 'description',
            render: (value) => <span className="text-xs text-zinc-400 line-clamp-1">{value}</span>
          },
          {
            header: 'Created',
            key: 'created_at',
            sortable: true,
            render: (value) => new Date(value).toLocaleDateString()
          }
        ]}
        actions={(domain) => (
          <div className="flex gap-2 justify-end">
            <button
              onClick={() => openEditModal(domain)}
              className="p-2 hover:bg-white/5 rounded transition-colors"
              title="Edit"
            >
              <Edit2 className="w-4 h-4 text-blue-400" />
            </button>
            <button
              onClick={() => {
                setEditingId(domain.id);
                setIsDeleteConfirmOpen(true);
              }}
              className="p-2 hover:bg-white/5 rounded transition-colors"
              title="Delete"
            >
              <Trash2 className="w-4 h-4 text-red-400" />
            </button>
          </div>
        )}
        loading={loading}
        emptyMessage="No domains found"
      />

      <AdminModal
        isOpen={isModalOpen}
        title={editingId ? 'Edit Domain' : 'Add New Domain'}
        onClose={() => {
          setIsModalOpen(false);
          resetForm();
        }}
        onSubmit={handleSave}
        loading={loading}
      >
        <AdminInput
          label="Domain Name"
          value={formData.name}
          onChange={(value) => setFormData({ ...formData, name: value })}
          placeholder="e.g., Web Development"
          error={errors.name}
          required
        />
        <AdminInput
          label="Description"
          type="textarea"
          value={formData.description}
          onChange={(value) => setFormData({ ...formData, description: value })}
          placeholder="Detailed description of this domain..."
          error={errors.description}
          required
        />
<div className="space-y-2">
          <label className="block text-sm font-medium text-zinc-300">Color</label>
          <div className="flex gap-2">
            <input
              type="color"
              value={formData.color}
              onChange={(e) => setFormData({ ...formData, color: e.target.value })}
              className="w-12 h-10 rounded-lg cursor-pointer"
            />
            <input
              type="text"
              value={formData.color}
              onChange={(e) => setFormData({ ...formData, color: e.target.value })}
              placeholder="#3b82f6"
              className="flex-1 px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white text-sm"
            />
          </div>
        </div>
      </AdminModal>

      <AdminModal
        isOpen={isDeleteConfirmOpen}
        title="Delete Domain"
        onClose={() => setIsDeleteConfirmOpen(false)}
        onSubmit={() => editingId && handleDelete(editingId)}
        submitText="Delete"
        submitVariant="danger"
        loading={loading}
      >
        <p className="text-zinc-300 text-sm">
          Are you sure you want to delete this domain? This action cannot be undone and will also delete all associated skills.
        </p>
      </AdminModal>
    </div>
  );
}
