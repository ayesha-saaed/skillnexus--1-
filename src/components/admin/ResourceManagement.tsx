import React, { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, Search, ExternalLink } from 'lucide-react';
import { supabase, getAccessToken } from '../../lib/supabase';
import { normalizeText, isDuplicateDbError } from '../../lib/utils';
import { AdminTable } from './AdminTable';
import { AdminModal } from './AdminModal';
import { AdminInput } from './AdminInput';
import { AdminSelect } from './AdminSelect';
import type { ShowToastFn } from './useToast';
import type { ResourceRow } from '../../types/database';
import {
  resourceTitleError,
  resourceDescriptionError,
  domainLabelError,
  isValidHttpUrl,
  isPlaceholderResourceUrl,
  isValidResourceType,
  isValidResourceDifficulty,
  validateCommaSeparatedSkills
} from '../../lib/inputValidation';

interface Resource extends ResourceRow {}

interface Skill {
  id: string;
  name: string;
}

interface Domain {
  id: string;
  name: string;
}

export function ResourceManagement({ showToast }: { showToast: ShowToastFn }) {
  const [resources, setResources] = useState<Resource[]>([]);
  const [skills, setSkills] = useState<Skill[]>([]);
  const [domains, setDomains] = useState<Domain[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    url: '',
    type: 'Course',
    difficulty: 'Beginner',
    duration: '',
    domain: '',
    skills_covered: [] as string[],
    skillsCoveredInput: ''
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const resourceTypes = [
    { value: 'Course', label: '📚 Course' },
    { value: 'Video', label: '🎥 Video' },
    { value: 'Article', label: '📄 Article' },
    { value: 'Practice Platform', label: '🎯 Practice Platform' }
  ];

  const difficultyLevels = [
    { value: 'Beginner', label: 'Beginner' },
    { value: 'Intermediate', label: 'Intermediate' },
    { value: 'Advanced', label: 'Advanced' },
    { value: 'Expert', label: 'Expert' }
  ];

  useEffect(() => {
    Promise.all([fetchResources(), fetchSkills(), fetchDomains()]);
  }, []);

  async function fetchResources() {
    try {
      const token = await getAccessToken();
      if (token) {
        const response = await fetch('/api/admin/resources', {
          headers: { Authorization: `Bearer ${token}` }
        });
        const body = await response.json().catch(() => ({}));
        if (response.ok && Array.isArray(body.resources)) {
          setResources(body.resources as Resource[]);
          return;
        }
        if (!response.ok) {
          console.warn(body?.error?.message || `Admin resources API failed (${response.status})`);
        }
      }

      const { data, error } = await supabase
        .from('resources')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setResources((data || []) as Resource[]);
    } catch (err: any) {
      showToast(err.message || 'Failed to fetch resources', 'error');
    }
  }

  async function fetchSkills() {
    try {
      const { data, error } = await supabase.from('skills').select('id, name').order('name');
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
    } finally {
      setLoading(false);
    }
  }

  function validateForm() {
    const newErrors: Record<string, string> = {};
    const titleErr = resourceTitleError(formData.title);
    if (titleErr) newErrors.title = titleErr;
    const descErr = resourceDescriptionError(formData.description);
    if (descErr) newErrors.description = descErr;
    const domainErr = domainLabelError(formData.domain);
    if (domainErr) newErrors.domain = domainErr;
    if (!formData.url.trim()) newErrors.url = 'URL is required';
    else if (!isValidHttpUrl(formData.url)) {
      newErrors.url = 'Enter a valid http:// or https:// URL (max 2048 characters).';
    } else if (isPlaceholderResourceUrl(formData.url)) {
      newErrors.url =
        'Use a real course link (YouTube, Coursera, MDN, freeCodeCamp, etc.). skillnexus.dev/learn/… placeholders are not valid.';
    }
    if (!isValidResourceType(formData.type)) {
      newErrors.type = 'Choose a valid resource type.';
    }
    if (!isValidResourceDifficulty(formData.difficulty)) {
      newErrors.difficulty = 'Choose Beginner, Intermediate, or Advanced.';
    }
    const skillsCheck = validateCommaSeparatedSkills(formData.skillsCoveredInput);
    if (!skillsCheck.ok) newErrors.skillsCoveredInput = skillsCheck.error;
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }

  async function handleSave() {
    if (!validateForm()) {
      showToast('Please fix the highlighted fields before saving.', 'error');
      return;
    }

    const normalizedUrl = normalizeText(formData.url);
    const duplicateResource = resources.some(
      (resource) => normalizeText(resource.url) === normalizedUrl && resource.id !== editingId
    );
    if (duplicateResource) {
      showToast('Already exists', 'error');
      return;
    }

    try {
      setLoading(true);
      const token = await getAccessToken();
      if (!token) throw new Error('Unable to authenticate admin session. Please sign in again.');

      const skillsParsed = validateCommaSeparatedSkills(formData.skillsCoveredInput);
      const dataToSave = {
        id: editingId || undefined,
        title: formData.title.trim(),
        description: formData.description.trim(),
        url: formData.url.trim(),
        type: formData.type,
        difficulty: formData.difficulty,
        duration: formData.duration.trim(),
        domain: formData.domain || 'Full Stack',
        skills_covered: skillsParsed.ok ? skillsParsed.skills : []
      };

      const response = await fetch('/api/admin/resources', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(dataToSave)
      });

      const responseData = await response.json().catch(() => ({}));
      if (!response.ok) {
        const apiMsg = responseData?.error?.message || `API error (${response.status})`;
        if (response.status === 403) {
          throw new Error(
            `${apiMsg} — Your account needs role = admin in Supabase (Table Editor → profiles) and sql/admin_rls_complete.sql applied.`
          );
        }
        // Fallback: direct Supabase write when API unavailable but RLS allows admin
        const row = {
          title: dataToSave.title,
          description: dataToSave.description,
          url: dataToSave.url,
          type: dataToSave.type,
          difficulty: dataToSave.difficulty,
          duration: dataToSave.duration || null,
          domain: dataToSave.domain,
          skills_covered: dataToSave.skills_covered
        };
        if (editingId) {
          const { error } = await supabase.from('resources').update(row).eq('id', editingId);
          if (error) throw new Error(`${apiMsg} — ${error.message}`);
        } else {
          const { error } = await supabase.from('resources').insert(row);
          if (error) throw new Error(`${apiMsg} — ${error.message}`);
        }
        showToast(
          editingId ? 'Resource updated (direct database)' : 'Resource created (direct database)',
          'success'
        );
        setIsModalOpen(false);
        resetForm();
        fetchResources();
        return;
      }

      showToast(editingId ? 'Resource updated successfully' : 'Resource created successfully', 'success');
      setIsModalOpen(false);
      resetForm();
      fetchResources();
    } catch (err: any) {
      if (isDuplicateDbError(err)) {
        showToast('Already exists', 'error');
      } else {
        showToast(err.message || 'Failed to save resource', 'error');
      }
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete(id: string) {
    try {
      setLoading(true);
      const token = await getAccessToken();
      if (!token) throw new Error('Unable to authenticate admin session. Please sign in again.');

      const response = await fetch(`/api/admin/resources/${id}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      const responseData = await response.json();
      if (!response.ok) {
        throw new Error(responseData?.error?.message || 'Failed to delete resource');
      }

      showToast('Resource deleted successfully', 'success');
      setIsDeleteConfirmOpen(false);
      fetchResources();
    } catch (err: any) {
      showToast(err.message || 'Failed to delete resource', 'error');
    } finally {
      setLoading(false);
    }
  }

  function resetForm() {
    setFormData({
      title: '',
      description: '',
      url: '',
      type: 'Course',
      difficulty: 'Beginner',
      duration: '',
      domain: '',
      skills_covered: [],
      skillsCoveredInput: ''
    });
    setErrors({});
    setEditingId(null);
  }

  function openEditModal(resource: Resource) {
    setFormData({
      title: resource.title,
      description: resource.description,
      url: resource.url,
      type: resource.type,
      difficulty: resource.difficulty,
      duration: resource.duration,
      domain: resource.domain || '',
      skills_covered: resource.skills_covered || [],
      skillsCoveredInput: (resource.skills_covered || []).join(', ')
    });
    setEditingId(resource.id);
    setIsModalOpen(true);
  }

  const filteredResources = resources.filter((r) => {
    const q = searchTerm.trim().toLowerCase();
    if (!q) return true;
    const haystack = [
      r.title,
      r.description,
      r.domain,
      r.type,
      r.difficulty,
      r.url,
      ...(r.skills_covered || [])
    ]
      .filter(Boolean)
      .join(' ')
      .toLowerCase();
    return haystack.includes(q);
  });

  return (
    <div className="space-y-6">
      <div className="rounded-xl border border-white/10 bg-white/5 px-4 py-3">
        <p className="text-sm text-zinc-400">
          Showing <span className="font-bold text-white">{filteredResources.length}</span> of{' '}
          <span className="font-bold text-white">{resources.length}</span> learning resources
        </p>
      </div>
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div className="flex-1 max-w-md">
          <div className="relative">
            <Search className="absolute left-3 top-3 w-4 h-4 text-zinc-500" />
            <input
              type="text"
              placeholder="Search resources..."
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
          Add Resource
        </button>
      </div>

      <AdminTable<Resource>
        data={filteredResources}
        columns={[
          { header: 'Title', key: 'title', sortable: true },
          {
            header: 'Type',
            key: 'type',
            render: (value) => <span className="px-2 py-1 bg-white/5 rounded text-xs">{value}</span>
          },
          {
            header: 'Difficulty',
            key: 'difficulty',
            render: (value) => (
              <span
                className={`px-2 py-1 rounded text-xs ${
                  value === 'Beginner'
                    ? 'bg-green-600/20 text-green-300'
                    : value === 'Intermediate'
                      ? 'bg-blue-600/20 text-blue-300'
                      : value === 'Advanced'
                        ? 'bg-orange-600/20 text-orange-300'
                        : 'bg-red-600/20 text-red-300'
                }`}
              >
                {value}
              </span>
            )
          },
          {
            header: 'URL',
            key: 'url',
            render: (value) => (
              <a href={value} target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:text-blue-300 inline-flex items-center gap-1">
                <ExternalLink className="w-3 h-3" />
              </a>
            )
          },
          {
            header: 'Domain',
            key: 'domain',
            render: (value) => value || 'N/A'
          },
          {
            header: 'Skills',
            key: 'skills_covered',
            render: (value: string[]) => (
              <span className="text-xs text-zinc-400 line-clamp-2 max-w-[200px]">
                {(value || []).length ? (value || []).join(', ') : '—'}
              </span>
            )
          },
          {
            header: 'Added',
            key: 'created_at',
            render: (value: string) => (value ? new Date(value).toLocaleDateString() : '—')
          }
        ]}
        actions={(resource) => (
          <div className="flex gap-2 justify-end">
            <button
              onClick={() => openEditModal(resource)}
              className="p-2 hover:bg-white/5 rounded transition-colors"
              title="Edit"
            >
              <Edit2 className="w-4 h-4 text-blue-400" />
            </button>
            <button
              onClick={() => {
                setEditingId(resource.id);
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
        emptyMessage="No resources found"
      />

      <AdminModal
        isOpen={isModalOpen}
        title={editingId ? 'Edit Resource' : 'Add New Resource'}
        onClose={() => {
          setIsModalOpen(false);
          resetForm();
        }}
        onSubmit={handleSave}
        loading={loading}
      >
        <AdminInput
          label="Title"
          value={formData.title}
          onChange={(value) => setFormData({ ...formData, title: value })}
          placeholder="e.g., React Fundamentals"
          error={errors.title}
          required
          validator={resourceTitleError}
          onValidated={(err) => setErrors((prev) => ({ ...prev, title: err ?? '' }))}
        />
        <AdminInput
          label="Description"
          type="textarea"
          value={formData.description}
          onChange={(value) => setFormData({ ...formData, description: value })}
          placeholder="Brief description of the resource..."
          error={errors.description}
          required
          validator={resourceDescriptionError}
          onValidated={(err) => setErrors((prev) => ({ ...prev, description: err ?? '' }))}
        />
        <AdminInput
          label="URL"
          type="url"
          value={formData.url}
          onChange={(value) => setFormData({ ...formData, url: value })}
          placeholder="https://example.com/course"
          error={errors.url}
          required
          validator={(value) => {
            const t = value.trim();
            if (!t) return 'URL is required';
            if (!isValidHttpUrl(t)) return 'Enter a valid http:// or https:// URL (max 2048 characters).';
            if (isPlaceholderResourceUrl(t)) {
              return 'Use a real course link (YouTube, Coursera, MDN, freeCodeCamp, etc.). skillnexus.dev/learn/… placeholders are not valid.';
            }
            return null;
          }}
          onValidated={(err) => setErrors((prev) => ({ ...prev, url: err ?? '' }))}
        />
        <AdminSelect
          label="Resource Type"
          value={formData.type}
          onChange={(value) => setFormData({ ...formData, type: value })}
          options={resourceTypes}
          required
        />
        <AdminSelect
          label="Difficulty Level"
          value={formData.difficulty}
          onChange={(value) => setFormData({ ...formData, difficulty: value })}
          options={difficultyLevels}
          required
        />
        <AdminSelect
          label="Domain"
          value={formData.domain}
          onChange={(value) => {
            setFormData({ ...formData, domain: value });
            const err = domainLabelError(value);
            setErrors((prev) => ({ ...prev, domain: err ?? '' }));
          }}
          options={domains.map((d) => ({ value: d.name, label: d.name }))}
          placeholder="Select a domain"
          error={errors.domain}
          required
        />
        <AdminInput
          label="Estimated Duration"
          value={formData.duration}
          onChange={(value) => setFormData({ ...formData, duration: value })}
          placeholder="e.g., 4 weeks, 20 hours"
        />
        <AdminInput
          label="Skills covered (comma-separated)"
          value={formData.skillsCoveredInput}
          onChange={(value) => setFormData({ ...formData, skillsCoveredInput: value })}
          placeholder="e.g. React, TypeScript, HTML"
          error={errors.skillsCoveredInput}
          validator={(value) => {
            const check = validateCommaSeparatedSkills(value);
            return check.ok ? null : check.error;
          }}
          onValidated={(err) => setErrors((prev) => ({ ...prev, skillsCoveredInput: err ?? '' }))}
        />
      </AdminModal>

      <AdminModal
        isOpen={isDeleteConfirmOpen}
        title="Delete Resource"
        onClose={() => setIsDeleteConfirmOpen(false)}
        onSubmit={() => editingId && handleDelete(editingId)}
        submitText="Delete"
        submitVariant="danger"
        loading={loading}
      >
        <p className="text-zinc-300 text-sm">
          Are you sure you want to delete this resource? This action cannot be undone.
        </p>
      </AdminModal>
    </div>
  );
}
