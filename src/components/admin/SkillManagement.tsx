import React, { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, Search, Info } from 'lucide-react';
import { supabase, getAccessToken } from '../../lib/supabase';
import { normalizeText, isDuplicateDbError } from '../../lib/utils';
import { AdminTable } from './AdminTable';
import { AdminModal } from './AdminModal';
import { AdminInput } from './AdminInput';
import { AdminSelect } from './AdminSelect';
import { useToast } from './useToast';

interface Skill {
  id: string;
  name: string;
  description: string;
  domain_id: string | null;
  domain?: { name: string } | null;
  created_at: string;
}

interface Domain {
  id: string;
  name: string;
}

interface LearnerSkillRow {
  id: string;
  skill_name: string;
  proficiency: string;
  updated_at: string;
  user_id: string;
  profiles?: { name: string | null; email: string | null } | null;
}

export function SkillManagement() {
  const [skills, setSkills] = useState<Skill[]>([]);
  const [learnerSkills, setLearnerSkills] = useState<LearnerSkillRow[]>([]);
  const [domains, setDomains] = useState<Domain[]>([]);
  const [loading, setLoading] = useState(true);
  const [learnerLoading, setLearnerLoading] = useState(true);
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
    void Promise.all([fetchSkills(), fetchDomains(), fetchLearnerSkills()]);
  }, []);

  async function fetchLearnerSkills() {
    try {
      setLearnerLoading(true);
      const { data, error } = await supabase
        .from('user_skills')
        .select('id, skill_name, proficiency, updated_at, user_id, profiles(name, email)')
        .order('updated_at', { ascending: false });
      if (error) throw error;
      setLearnerSkills((data as LearnerSkillRow[]) || []);
    } catch (err: any) {
      showToast(
        err.message || 'Failed to load learner skills. Run sql/user_skills_admin_rls.sql in Supabase if you are admin.',
        'error'
      );
    } finally {
      setLearnerLoading(false);
    }
  }

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

  function validateForm(): string | null {
    const newErrors: Record<string, string> = {};
    if (!formData.name.trim()) newErrors.name = 'Skill name is required';
    if (formData.name.trim().length < 2) newErrors.name = 'Name must be at least 2 characters';
    if (!formData.description.trim()) newErrors.description = 'Description is required';
    // domain_id is optional: lets you add catalog skills before any domains exist in the DB
    setErrors(newErrors);
    if (Object.keys(newErrors).length) return Object.values(newErrors)[0];
    return null;
  }

  function skillPayload() {
    const name = formData.name.trim();
    const description = formData.description.trim();
    const domain_id = formData.domain_id.trim() || null;
    return { name, description, domain_id };
  }

  async function handleSave() {
    const v = validateForm();
    if (v) {
      showToast(v, 'error');
      return;
    }

    const normalizedSkillName = normalizeText(formData.name);
    const duplicateSkill = skills.some(
      (skill) => normalizeText(skill.name) === normalizedSkillName && skill.id !== editingId
    );
    if (duplicateSkill) {
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
        domain_id: formData.domain_id.trim() || undefined
      };

      const response = await fetch('/api/admin/skills', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });

      const responseData = await response.json();
      if (!response.ok) {
        throw new Error(responseData?.error?.message || 'Failed to save skill');
      }

      showToast(editingId ? 'Skill updated successfully' : 'Skill created successfully', 'success');
      setIsModalOpen(false);
      resetForm();
      void fetchSkills();
    } catch (err: any) {
      if (isDuplicateDbError(err)) {
        showToast('Already exists', 'error');
      } else {
        const msg = err?.message || err?.error?.message || 'Failed to save skill';
        showToast(
          /row-level security|RLS|policy|not-null|null value in column "domain_id"/i.test(String(msg))
            ? `${msg} (If domain is required in your DB, run: ALTER TABLE public.skills ALTER COLUMN domain_id DROP NOT NULL; or add a domain first.)`
            : msg,
          'error'
        );
      }
      console.error('Skill save error:', err);
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete(id: string) {
    try {
      setLoading(true);
      const token = await getAccessToken();
      if (!token) throw new Error('Unable to authenticate admin session. Please sign in again.');

      const response = await fetch(`/api/admin/skills/${id}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      const responseData = await response.json();
      if (!response.ok) {
        throw new Error(responseData?.error?.message || 'Failed to delete skill');
      }
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
      domain_id: skill.domain_id || ''
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
      <div className="flex gap-2 items-start p-3 rounded-lg border border-blue-500/20 bg-blue-500/5 text-zinc-300 text-xs">
        <Info className="w-4 h-4 text-blue-400 shrink-0 mt-0.5" />
        <p>
          <span className="text-zinc-200 font-medium">My Skills (app)</span> saves to the{' '}
          <code className="text-zinc-400">user_skills</code> table.{' '}
          <span className="text-zinc-200 font-medium">Curated catalog</span> uses the <code className="text-zinc-400">skills</code> table. Domain is
          optional: you can save a skill with &quot;Unassigned&quot; even before the Domains table is filled.
        </p>
      </div>

      <div>
        <h2 className="text-sm font-bold text-white uppercase tracking-widest mb-3">Learner skills (My Skills page)</h2>
        <AdminTable<LearnerSkillRow>
          data={learnerSkills}
          columns={[
            { header: 'Skill', key: 'skill_name', sortable: true },
            { header: 'Level', key: 'proficiency' },
            {
              header: 'User',
              key: 'user_id',
              render: (_v, row) => (
                <div className="text-xs">
                  <div className="text-white">{row.profiles?.name || '—'}</div>
                  <div className="text-zinc-500">{row.profiles?.email || row.user_id.slice(0, 8)}…</div>
                </div>
              )
            },
            {
              header: 'Updated',
              key: 'updated_at',
              render: (value) => new Date(value as string).toLocaleString()
            }
          ]}
          loading={learnerLoading}
          emptyMessage="No learner skills yet, or admin cannot read user_skills (apply RLS SQL)."
        />
      </div>

      <div className="pt-2 border-t border-white/10">
        <h2 className="text-sm font-bold text-white uppercase tracking-widest mb-3">Curated skills catalog</h2>
      </div>

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
            render: (_, skill) => skill.domain?.name || (skill.domain_id ? '—' : 'Unassigned')
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
        {domains.length === 0 && (
          <p className="text-xs text-amber-200/90 bg-amber-500/10 border border-amber-500/20 rounded-lg px-3 py-2">
            No domains loaded yet. Leave Domain as Unassigned, or set up the Domains tab + database first and refresh.
          </p>
        )}
        <AdminSelect
          label="Domain (optional)"
          value={formData.domain_id}
          onChange={(value) => setFormData({ ...formData, domain_id: value })}
          options={domains.map((d) => ({ value: d.id, label: d.name }))}
          placeholder="Unassigned (optional — add domains later)"
          error={errors.domain_id}
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
