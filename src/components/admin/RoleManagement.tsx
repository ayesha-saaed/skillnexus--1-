import React, { useState, useEffect, useMemo } from 'react';
import { Plus, Edit2, Trash2, Search } from 'lucide-react';
import { supabase, getAccessToken } from '../../lib/supabase';
import { normalizeText, isDuplicateDbError } from '../../lib/utils';
import { AdminTable } from './AdminTable';
import { AdminModal } from './AdminModal';
import { AdminInput } from './AdminInput';
import { AdminSelect } from './AdminSelect';
import type { ShowToastFn } from './useToast';
import {
  jobRoleTitleError,
  domainLabelError,
  validateCommaSeparatedSkills
} from '../../lib/inputValidation';
import { resourcesForJobRole, countLabel, type ResourceLike } from '../../lib/resourceLinking';
import { LearningResourcesPanel } from './LearningResourcesPanel';

interface JobRole {
  id: string;
  role_name: string;
  required_skills: string[];
  difficulty: string;
  domain: string;
  created_at: string;
}

interface RoleFormState {
  title: string;
  domain: string;
  difficulty: string;
  requiredSkills: string;
}

const difficultyOptions = [
  { value: 'Beginner', label: 'Beginner' },
  { value: 'Intermediate', label: 'Intermediate' },
  { value: 'Advanced', label: 'Advanced' }
];

export function RoleManagement({ showToast }: { showToast: ShowToastFn }) {
  const [roles, setRoles] = useState<JobRole[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [formData, setFormData] = useState<RoleFormState>({
    title: '',
    domain: 'General',
    difficulty: 'Intermediate',
    requiredSkills: ''
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [selectedRoleToDelete, setSelectedRoleToDelete] = useState<string | null>(null);
  const [allResources, setAllResources] = useState<ResourceLike[]>([]);
  const [resourcesLoading, setResourcesLoading] = useState(true);
  const [domainOptions, setDomainOptions] = useState<{ value: string; label: string }[]>([]);

  useEffect(() => {
    void Promise.all([fetchRoles(), fetchResources(), fetchDomainNames()]);
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

  async function fetchDomainNames() {
    const { data } = await supabase.from('domains').select('name').order('name');
    const names = (data || []).map((d: { name: string }) => d.name).filter(Boolean);
    setDomainOptions(names.map((name) => ({ value: name, label: name })));
  }

  async function fetchRoles() {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('job_roles')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw error;
      setRoles((data || []) as JobRole[]);
    } catch (err: any) {
      showToast(err.message || 'Failed to load job roles', 'error');
    } finally {
      setLoading(false);
    }
  }

  function validateForm() {
    const newErrors: Record<string, string> = {};
    const titleErr = jobRoleTitleError(formData.title);
    if (titleErr) newErrors.title = titleErr;
    const domainErr = domainLabelError(formData.domain);
    if (domainErr) newErrors.domain = domainErr;
    const skillsCheck = validateCommaSeparatedSkills(formData.requiredSkills);
    if (!skillsCheck.ok) newErrors.requiredSkills = skillsCheck.error;
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }

  function resetForm() {
    setFormData({ title: '', domain: 'General', difficulty: 'Intermediate', requiredSkills: '' });
    setErrors({});
    setEditingId(null);
    setSelectedRoleToDelete(null);
  }

  function openEditModal(role: JobRole) {
    setFormData({
      title: role.role_name,
      domain: role.domain || 'General',
      difficulty: role.difficulty || 'Intermediate',
      requiredSkills: (role.required_skills || []).join(', ')
    });
    setEditingId(role.id);
    setIsModalOpen(true);
  }

  async function handleSave() {
    if (!validateForm()) {
      showToast('Please fix the form errors before continuing.', 'error');
      return;
    }

    const normalizedTitle = normalizeText(formData.title);
    const duplicate = roles.some(
      (role) => normalizeText(role.role_name) === normalizedTitle && role.id !== editingId
    );
    if (duplicate) {
      showToast('A job role with that title already exists.', 'error');
      return;
    }

    try {
      setLoading(true);
      const token = await getAccessToken();
      if (!token) throw new Error('Unable to authenticate admin session. Please sign in again.');

      const requiredSkills = formData.requiredSkills
        .split(',')
        .map((skill) => skill.trim())
        .filter(Boolean);

      const payload = {
        id: editingId || undefined,
        title: formData.title.trim(),
        domain: formData.domain.trim() || 'General',
        difficulty: formData.difficulty,
        requiredSkills
      };

      const response = await fetch('/api/admin/roles', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });

      const responseData = await response.json();
      if (!response.ok) {
        throw new Error(responseData?.error?.message || 'Failed to save role');
      }

      showToast(editingId ? 'Job role updated successfully' : 'Job role created successfully', 'success');
      setIsModalOpen(false);
      resetForm();
      await fetchRoles();
    } catch (err: any) {
      if (isDuplicateDbError(err)) {
        showToast('A job role with that title already exists.', 'error');
      } else {
        showToast(err.message || 'Failed to save job role', 'error');
      }
    } finally {
      setLoading(false);
    }
  }

  async function handleDeleteRole() {
    if (!selectedRoleToDelete) return;
    try {
      setLoading(true);
      const token = await getAccessToken();
      if (!token) throw new Error('Unable to authenticate admin session. Please sign in again.');

      const response = await fetch(`/api/admin/roles/${selectedRoleToDelete}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      const responseData = await response.json();
      if (!response.ok) {
        throw new Error(responseData?.error?.message || 'Failed to delete role');
      }

      showToast('Job role deleted successfully', 'success');
      setIsDeleteConfirmOpen(false);
      resetForm();
      await fetchRoles();
    } catch (err: any) {
      showToast(err.message || 'Failed to delete job role', 'error');
    } finally {
      setLoading(false);
    }
  }

  const previewLinkedResources = useMemo(() => {
    const skills = formData.requiredSkills
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);
    return resourcesForJobRole(allResources, {
      domain: formData.domain,
      required_skills: skills
    });
  }, [allResources, formData.domain, formData.requiredSkills]);

  function linkedCountForRole(role: JobRole): number {
    return resourcesForJobRole(allResources, role).length;
  }

  const filteredRoles = roles.filter((role) =>
    role.role_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    role.domain.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (role.required_skills || []).join(', ').toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div className="flex-1 max-w-xl">
          <div className="relative">
            <Search className="absolute left-3 top-3 w-4 h-4 text-zinc-500" />
            <input
              type="text"
              placeholder="Search job roles..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-3 bg-white/5 border border-white/10 rounded-2xl text-sm text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-colors"
            />
          </div>
        </div>

        <button
          onClick={() => {
            resetForm();
            setIsModalOpen(true);
          }}
          className="inline-flex items-center gap-2 px-5 py-3 bg-blue-600/20 hover:bg-blue-600/30 border border-blue-500/20 rounded-2xl text-sm font-semibold text-white transition-colors"
        >
          <Plus className="w-4 h-4" /> Add Job Role
        </button>
      </div>

      <AdminTable<JobRole>
        data={filteredRoles}
        loading={loading}
        emptyMessage="No job roles found"
        columns={[
          { header: 'Role', key: 'role_name' },
          { header: 'Domain', key: 'domain' },
          { header: 'Difficulty', key: 'difficulty' },
          {
            header: 'Skills',
            key: 'required_skills',
            render: (value: string[]) => (
              <span className="text-xs text-zinc-400">{(value || []).join(', ') || 'None'}</span>
            )
          },
          {
            header: 'Learning resources',
            key: 'id',
            render: (_id, role) => (
              <span className="text-xs font-medium text-cyan-400/90">{countLabel(linkedCountForRole(role))}</span>
            )
          },
          {
            header: 'Created',
            key: 'created_at',
            render: (value: string) => new Date(value).toLocaleDateString()
          }
        ]}
        actions={(role) => (
          <div className="flex items-center justify-end gap-2">
            <button
              onClick={(event) => {
                event.stopPropagation();
                openEditModal(role);
              }}
              className="p-2 rounded-lg hover:bg-white/5 transition-colors"
              title="Edit"
            >
              <Edit2 className="w-4 h-4 text-blue-300" />
            </button>
            <button
              onClick={(event) => {
                event.stopPropagation();
                setSelectedRoleToDelete(role.id);
                setIsDeleteConfirmOpen(true);
              }}
              className="p-2 rounded-lg hover:bg-white/5 transition-colors"
              title="Delete"
            >
              <Trash2 className="w-4 h-4 text-rose-400" />
            </button>
          </div>
        )}
      />

      <AdminModal
        isOpen={isModalOpen}
        wide
        title={editingId ? 'Edit Job Role' : 'Add Job Role'}
        onClose={() => {
          setIsModalOpen(false);
          resetForm();
        }}
        onSubmit={handleSave}
        loading={loading}
        submitText={editingId ? 'Update role' : 'Create role'}
      >
        <AdminInput
          label="Role Title"
          value={formData.title}
          onChange={(value) => setFormData({ ...formData, title: value })}
          placeholder="e.g. Frontend Developer"
          error={errors.title}
          required
          validator={jobRoleTitleError}
          onValidated={(err) => setErrors((prev) => ({ ...prev, title: err ?? '' }))}
        />
        {domainOptions.length > 0 ? (
          <AdminSelect
            label="Domain / Category"
            value={formData.domain}
            onChange={(value) => {
              setFormData({ ...formData, domain: value });
              const err = domainLabelError(value);
              setErrors((prev) => ({ ...prev, domain: err ?? '' }));
            }}
            options={domainOptions}
            error={errors.domain}
            required
          />
        ) : (
          <AdminInput
            label="Domain / Category"
            value={formData.domain}
            onChange={(value) => setFormData({ ...formData, domain: value })}
            placeholder="e.g. Cloud/DevOps"
            error={errors.domain}
            required
            validator={domainLabelError}
            onValidated={(err) => setErrors((prev) => ({ ...prev, domain: err ?? '' }))}
          />
        )}
        <AdminSelect
          label="Difficulty"
          value={formData.difficulty}
          onChange={(value) => setFormData({ ...formData, difficulty: value })}
          options={difficultyOptions}
        />
        <AdminInput
          label="Required Skills"
          value={formData.requiredSkills}
          onChange={(value) => setFormData({ ...formData, requiredSkills: value })}
          placeholder="Comma-separated skills, e.g. HTML, CSS, JavaScript"
          error={errors.requiredSkills}
          validator={(value) => {
            const check = validateCommaSeparatedSkills(value);
            return check.ok ? null : check.error;
          }}
          onValidated={(err) => setErrors((prev) => ({ ...prev, requiredSkills: err ?? '' }))}
        />
        <LearningResourcesPanel
          resources={previewLinkedResources}
          loading={resourcesLoading}
          emptyHint="Add resources in Admin → Resources with the same domain name and overlapping skills to link them here."
        />
      </AdminModal>

      <AdminModal
        isOpen={isDeleteConfirmOpen}
        title="Delete Job Role"
        onClose={() => {
          setIsDeleteConfirmOpen(false);
          setSelectedRoleToDelete(null);
        }}
        onSubmit={handleDeleteRole}
        loading={loading}
        submitText="Delete"
        submitVariant="danger"
      >
        <p className="text-sm text-zinc-400">Are you sure you want to delete this job role? This cannot be undone.</p>
      </AdminModal>
    </div>
  );
}
