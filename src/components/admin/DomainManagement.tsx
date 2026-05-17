import React, { useState, useEffect, useMemo } from 'react';
import { Plus, Edit2, Trash2, Search } from 'lucide-react';
import { supabase, getAccessToken } from '../../lib/supabase';
import { normalizeText, isDuplicateDbError } from '../../lib/utils';
import { AdminTable } from './AdminTable';
import { AdminModal } from './AdminModal';
import { AdminInput } from './AdminInput';
import type { ShowToastFn } from './useToast';
import { domainLabelError, resourceDescriptionError } from '../../lib/inputValidation';
import { resourcesForDomain, countLabel, type ResourceLike } from '../../lib/resourceLinking';

interface Domain {
  id: string;
  name: string;
  description: string;
  icon: string;
  color: string;
  image_url: string;
  created_at: string;
}

export function DomainManagement({ showToast }: { showToast: ShowToastFn }) {
  const [domains, setDomains] = useState<Domain[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState<string>('created_at');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    icon: '',
    color: '#3b82f6',
    image_url: ''
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [allResources, setAllResources] = useState<ResourceLike[]>([]);
  const [resourcesLoading, setResourcesLoading] = useState(true);

  useEffect(() => {
    void Promise.all([fetchDomains(), fetchResources()]);
  }, []);

  async function fetchResources() {
    try {
      setResourcesLoading(true);
      const { data, error } = await supabase.from('resources').select('id, title, url, type, difficulty, domain, skills_covered');
      if (error) throw error;
      setAllResources((data || []) as ResourceLike[]);
    } catch (err: any) {
      showToast(err.message || 'Failed to load learning resources', 'error');
    } finally {
      setResourcesLoading(false);
    }
  }

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

  function validateForm(): string | null {
    const newErrors: Record<string, string> = {};
    const nameErr = domainLabelError(formData.name);
    if (nameErr) newErrors.name = nameErr;
    const descErr = resourceDescriptionError(formData.description);
    if (descErr) newErrors.description = descErr;
    setErrors(newErrors);
    if (Object.keys(newErrors).length) {
      return Object.values(newErrors)[0];
    }
    return null;
  }

  async function handleSave() {
    const validationError = validateForm();
    if (validationError) {
      showToast(validationError, 'error');
      return;
    }

    const normalizedName = normalizeText(formData.name);
    const duplicateDomain = domains.some(
      (domain) => normalizeText(domain.name) === normalizedName && domain.id !== editingId
    );
    if (duplicateDomain) {
      showToast('Already exists', 'error');
      return;
    }

    try {
      setLoading(true);
      const token = await getAccessToken();
      if (!token) throw new Error('Unable to authenticate admin session. Please sign in again.');

      const payload = {
        id: editingId || undefined,
        name: formData.name.trim(),
        description: formData.description.trim(),
        icon: formData.icon.trim() || undefined,
        color: formData.color || '#3b82f6',
        image_url: formData.image_url.trim() || undefined
      };

      const response = await fetch('/api/admin/domains', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });

      const responseData = await response.json();
      if (!response.ok) {
        throw new Error(responseData?.error?.message || 'Failed to save domain');
      }

      showToast(editingId ? 'Domain updated successfully' : 'Domain created successfully', 'success');
      setIsModalOpen(false);
      resetForm();
      fetchDomains();
    } catch (err: any) {
      if (isDuplicateDbError(err)) {
        showToast('Already exists', 'error');
      } else {
        const msg = err?.message || err?.error?.message || 'Failed to save domain';
        showToast(
          /row-level security|RLS|policy/i.test(String(msg))
            ? `${msg} (Run sql/domains_table_align_admin.sql in Supabase, or confirm you are admin.)`
            : msg,
          'error'
        );
      }
      console.error('Domain save error:', err);
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete(id: string) {
    try {
      setLoading(true);
      const token = await getAccessToken();
      if (!token) throw new Error('Unable to authenticate admin session. Please sign in again.');

      const response = await fetch(`/api/admin/domains/${id}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      const responseData = await response.json();
      if (!response.ok) {
        throw new Error(responseData?.error?.message || 'Failed to delete domain');
      }
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

  const resourceCountByDomainName = useMemo(() => {
    const counts = new Map<string, number>();
    for (const domain of domains) {
      counts.set(domain.name, resourcesForDomain(allResources, domain.name).length);
    }
    return counts;
  }, [domains, allResources]);

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
            header: 'Learning resources',
            key: 'id',
            render: (_id, item) => (
              <span className="text-xs font-medium text-cyan-400/90">
                {countLabel(resourceCountByDomainName.get(item.name) ?? 0)}
              </span>
            )
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
        wide
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
          validator={domainLabelError}
          onValidated={(err) => setErrors((prev) => ({ ...prev, name: err ?? '' }))}
        />
        <AdminInput
          label="Description"
          type="textarea"
          value={formData.description}
          onChange={(value) => setFormData({ ...formData, description: value })}
          placeholder="Detailed description of this domain..."
          error={errors.description}
          required
          validator={resourceDescriptionError}
          onValidated={(err) => setErrors((prev) => ({ ...prev, description: err ?? '' }))}
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
