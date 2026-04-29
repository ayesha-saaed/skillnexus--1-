import React, { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, Search } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { AdminTable } from './AdminTable';
import { AdminModal } from './AdminModal';
import { AdminInput } from './AdminInput';
import { AdminSelect } from './AdminSelect';
import { useToast } from './useToast';

interface Skill {
  id: string;
  name: string;
  description: string;
  domain_id: string;
  domain?: { name: string };
  created_at: string;
}

interface Domain {
  id: string;
  name: string;
}

export function SkillManagement() {
  const [skills, setSkills] = useState<Skill[]>([]);
  const [domains, setDomains] = useState<Domain[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const { toasts, showToast } = useToast();

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    domain_id: ''
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    Promise.all([fetchSkills(), fetchDomains()]);
  }, []);

  async function fetchSkills() {
    try {
      const { data, error } = await supabase
        .from('skills')
        .select('*, domain:domain_id(name)')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setSkills(data || []);
    } catch (err: any) {
      showToast(err.message || 'Failed to fetch skills', 'error');
    }
  }

  async function fetchDomains() {
    try {
      const { data, error } = await supabase.from('domains').select('id, name').order('name');
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
    if (!formData.name.trim()) newErrors.name = 'Skill name is required';
    if (formData.name.length < 2) newErrors.name = 'Name must be at least 2 characters';
    if (!formData.description.trim()) newErrors.description = 'Description is required';
    if (!formData.domain_id) newErrors.domain_id = 'Please select a domain';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }

  async function handleSave() {
    if (!validateForm()) return;

    try {
      setLoading(true);
      if (editingId) {
        const { error } = await supabase
          .from('skills')
          .update(formData)
          .eq('id', editingId);

        if (error) throw error;
        showToast('Skill updated successfully', 'success');
      } else {
        const { error } = await supabase.from('skills').insert([formData]);
        if (error) throw error;
        showToast('Skill created successfully', 'success');
      }

      setIsModalOpen(false);
      resetForm();
      fetchSkills();
    } catch (err: any) {
      showToast(err.message || 'Failed to save skill', 'error');
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete(id: string) {
    try {
      setLoading(true);
      const { error } = await supabase.from('skills').delete().eq('id', id);
      if (error) throw error;
      showToast('Skill deleted successfully', 'success');
      setIsDeleteConfirmOpen(false);
      fetchSkills();
    } catch (err: any) {
      showToast(err.message || 'Failed to delete skill', 'error');
    } finally {
      setLoading(false);
    }
  }

  function resetForm() {
    setFormData({ name: '', description: '', domain_id: '' });
    setErrors({});
    setEditingId(null);
  }

  function openEditModal(skill: Skill) {
    setFormData({
      name: skill.name,
      description: skill.description,
      domain_id: skill.domain_id
    });
    setEditingId(skill.id);
    setIsModalOpen(true);
  }

  const filteredSkills = skills.filter((s) =>
    s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    s.description.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div className="flex-1 max-w-md">
          <div className="relative">
            <Search className="absolute left-3 top-3 w-4 h-4 text-zinc-500" />
            <input
              type="text"
              placeholder="Search skills..."
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
          Add Skill
        </button>
      </div>

      <AdminTable<Skill>
        data={filteredSkills}
        columns={[
          { header: 'Skill Name', key: 'name', sortable: true },
          {
            header: 'Domain',
            key: 'domain_id',
            render: (_, skill) => skill.domain?.name || 'Unknown'
          },
          {
            header: 'Description',
            key: 'description',
            render: (value) => <span className="text-xs text-zinc-400 line-clamp-1">{value}</span>
          },
          {
            header: 'Created',
            key: 'created_at',
            render: (value) => new Date(value).toLocaleDateString()
          }
        ]}
        actions={(skill) => (
          <div className="flex gap-2 justify-end">
            <button
              onClick={() => openEditModal(skill)}
              className="p-2 hover:bg-white/5 rounded transition-colors"
              title="Edit"
            >
              <Edit2 className="w-4 h-4 text-blue-400" />
            </button>
            <button
              onClick={() => {
                setEditingId(skill.id);
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
        emptyMessage="No skills found"
      />

      <AdminModal
        isOpen={isModalOpen}
        title={editingId ? 'Edit Skill' : 'Add New Skill'}
        onClose={() => {
          setIsModalOpen(false);
          resetForm();
        }}
        onSubmit={handleSave}
        loading={loading}
      >
        <AdminInput
          label="Skill Name"
          value={formData.name}
          onChange={(value) => setFormData({ ...formData, name: value })}
          placeholder="e.g., React.js, TypeScript"
          error={errors.name}
          required
        />
        <AdminSelect
          label="Domain"
          value={formData.domain_id}
          onChange={(value) => setFormData({ ...formData, domain_id: value })}
          options={domains.map((d) => ({ value: d.id, label: d.name }))}
          placeholder="Select a domain"
          error={errors.domain_id}
          required
        />
        <AdminInput
          label="Description"
          type="textarea"
          value={formData.description}
          onChange={(value) => setFormData({ ...formData, description: value })}
          placeholder="What will students learn?"
          error={errors.description}
          required
        />
      </AdminModal>

      <AdminModal
        isOpen={isDeleteConfirmOpen}
        title="Delete Skill"
        onClose={() => setIsDeleteConfirmOpen(false)}
        onSubmit={() => editingId && handleDelete(editingId)}
        submitText="Delete"
        submitVariant="danger"
        loading={loading}
      >
        <p className="text-zinc-300 text-sm">
          Are you sure you want to delete this skill? This action cannot be undone.
        </p>
      </AdminModal>
    </div>
  );
}
