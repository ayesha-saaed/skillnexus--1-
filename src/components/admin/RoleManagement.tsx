import React, { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, Search } from 'lucide-react';
import { supabase, getAccessToken } from '../../lib/supabase';
import { normalizeText, isDuplicateDbError } from '../../lib/utils';
import { AdminTable } from './AdminTable';
import { AdminModal } from './AdminModal';
import { AdminInput } from './AdminInput';
import { AdminSelect } from './AdminSelect';
import { useToast } from './useToast';

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

export function RoleManagement() {
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
  const { showToast } = useToast();
  const [selectedRoleToDelete, setSelectedRoleToDelete] = useState<string | null>(null);

  useEffect(() => {
    void fetchRoles();
  }, []);
useEffect(() => {
  const fetchRoles = async () => {
    const { data, error } = await supabase
      .from('job_roles')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (error) {
      console.error('Error fetching roles:', error);
    } else {
      setRoles(data);  // Set the fetched job roles to state
    }
  };

  fetchRoles();
}, []);
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
    if (!formData.title.trim()) newErrors.title = 'Role title is required';
    if (formData.title.trim().length < 3) newErrors.title = 'Role title must be at least 3 characters';
    if (!formData.domain.trim()) newErrors.domain = 'Domain / category is required';
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
{roles.length > 0 && (
  <table>
    <thead>
      <tr>
        <th>Role Name</th>
        <th>Domain</th>
        <th>Required Skills</th>
        <th>Difficulty</th>
      </tr>
    </thead>
    <tbody>
      {roles.map((role) => (
        <tr key={role.id}>
          <td>{role.role_name}</td>
          <td>{role.domain}</td>
          <td>{role.required_skills.join(', ')}</td>
          <td>{role.difficulty}</td>
        </tr>
      ))}
    </tbody>
  </table>
)}
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
        />
        <AdminInput
          label="Domain / Category"
          value={formData.domain}
          onChange={(value) => setFormData({ ...formData, domain: value })}
          placeholder="e.g. Cloud/DevOps"
          error={errors.domain}
          required
        />
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
