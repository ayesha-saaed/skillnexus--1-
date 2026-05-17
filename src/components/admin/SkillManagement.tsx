import React, { useState, useEffect, useMemo } from 'react';
import { Plus, Edit2, Trash2, Search } from 'lucide-react';
import { supabase, getAccessToken } from '../../lib/supabase';
import { AdminTable } from './AdminTable';
import { AdminModal } from './AdminModal';
import type { ShowToastFn } from './useToast';
import { resourcesForSkill, countLabel, type ResourceLike } from '../../lib/resourceLinking';
import { SkillCatalogFormModal, type SkillFormValues } from './SkillCatalogFormModal';

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

interface UserSkillRow {
  id: string;
  skill_name: string;
  proficiency: string;
  updated_at: string;
  user_id: string;
  profiles?: { name: string | null; email: string | null } | null;
}

const emptyForm: SkillFormValues = { name: '', description: '', domain_id: '' };

export function SkillManagement({ showToast }: { showToast: ShowToastFn }) {
  const [skills, setSkills] = useState<Skill[]>([]);
  const [userSkills, setUserSkills] = useState<UserSkillRow[]>([]);
  const [domains, setDomains] = useState<Domain[]>([]);
  const [loading, setLoading] = useState(true);
  const [userSkillsLoading, setUserSkillsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [modalInitial, setModalInitial] = useState<SkillFormValues>(emptyForm);
  const [searchTerm, setSearchTerm] = useState('');
  const [allResources, setAllResources] = useState<ResourceLike[]>([]);
  const [resourcesLoading, setResourcesLoading] = useState(true);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    void Promise.all([fetchSkills(), fetchDomains(), fetchUserSkills(), fetchResources()]);
  }, []);

  async function fetchResources() {
    try {
      setResourcesLoading(true);
      const token = await getAccessToken();
      if (token) {
        const response = await fetch('/api/admin/resources', {
          headers: { Authorization: `Bearer ${token}` }
        });
        const body = await response.json().catch(() => ({}));
        if (response.ok && Array.isArray(body.resources)) {
          setAllResources(body.resources as ResourceLike[]);
          return;
        }
      }
      const { data, error } = await supabase
        .from('resources')
        .select('id, title, url, type, difficulty, domain, skills_covered');
      if (error) throw error;
      setAllResources((data || []) as ResourceLike[]);
    } catch (err: any) {
      showToast(err.message || 'Failed to load learning resources', 'error');
    } finally {
      setResourcesLoading(false);
    }
  }

  async function fetchUserSkills() {
    try {
      setUserSkillsLoading(true);
      const { data, error } = await supabase
        .from('user_skills')
        .select('id, skill_name, proficiency, updated_at, user_id, profiles(name, email)')
        .order('updated_at', { ascending: false });
      if (error) throw error;
      const normalizedData = (data || []).map((row: any): UserSkillRow => ({
        id: row.id,
        skill_name: row.skill_name,
        proficiency: row.proficiency,
        updated_at: row.updated_at,
        user_id: row.user_id,
        profiles: Array.isArray(row.profiles) ? row.profiles[0] : row.profiles || null
      }));
      setUserSkills(normalizedData);
    } catch (err: any) {
      showToast(
        err.message || 'Failed to load user skills. Run sql/user_skills_admin_rls.sql in Supabase if you are admin.',
        'error'
      );
    } finally {
      setUserSkillsLoading(false);
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
    } finally {
      setLoading(false);
    }
  }

  async function fetchDomains() {
    try {
      const { data, error } = await supabase.from('domains').select('id, name').order('name');
      if (error) throw error;
      setDomains(data || []);
    } catch (err: any) {
      showToast(err.message || 'Failed to fetch domains', 'error');
    }
  }

  async function handleDelete(id: string) {
    try {
      setDeleting(true);
      const token = await getAccessToken();
      if (!token) throw new Error('Unable to authenticate admin session. Please sign in again.');

      const response = await fetch(`/api/admin/skills/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });
      const responseData = await response.json();
      if (!response.ok) {
        throw new Error(responseData?.error?.message || 'Failed to delete skill');
      }
      showToast('Skill deleted successfully', 'success');
      setIsDeleteConfirmOpen(false);
      setEditingId(null);
      void fetchSkills();
    } catch (err: any) {
      showToast(err.message || 'Failed to delete skill', 'error');
    } finally {
      setDeleting(false);
    }
  }

  function openCreateModal() {
    setModalInitial(emptyForm);
    setEditingId(null);
    setIsModalOpen(true);
  }

  function openEditModal(skill: Skill) {
    setModalInitial({
      name: skill.name,
      description: skill.description,
      domain_id: skill.domain_id || ''
    });
    setEditingId(skill.id);
    setIsModalOpen(true);
  }

  const filteredSkills = useMemo(
    () =>
      skills.filter(
        (s) =>
          s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          s.description.toLowerCase().includes(searchTerm.toLowerCase())
      ),
    [skills, searchTerm]
  );

  const resourceCountBySkillId = useMemo(() => {
    const counts = new Map<string, number>();
    for (const skill of skills) {
      counts.set(skill.id, resourcesForSkill(allResources, skill.name).length);
    }
    return counts;
  }, [skills, allResources]);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-sm font-bold text-white uppercase tracking-widest mb-3">User skills (My Skills page)</h2>
        <AdminTable<UserSkillRow>
          data={userSkills}
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
          loading={userSkillsLoading}
          emptyMessage="No user skills yet, or admin cannot read user_skills (apply RLS SQL)."
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
          onClick={openCreateModal}
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
            header: 'Learning resources',
            key: 'id',
            render: (_id, skill) => (
              <span className="text-xs font-medium text-cyan-400/90">
                {countLabel(resourceCountBySkillId.get(skill.id) ?? 0)}
              </span>
            )
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

      {isModalOpen && (
        <SkillCatalogFormModal
          key={editingId ?? 'new'}
          isOpen
          editingId={editingId}
          initialValues={modalInitial}
          domains={domains}
          allResources={allResources}
          resourcesLoading={resourcesLoading}
          catalogSkills={skills}
          onClose={() => {
            setIsModalOpen(false);
            setEditingId(null);
          }}
          onSaved={() => void fetchSkills()}
          showToast={showToast}
        />
      )}

      <AdminModal
        isOpen={isDeleteConfirmOpen}
        title="Delete Skill"
        onClose={() => setIsDeleteConfirmOpen(false)}
        onSubmit={() => editingId && handleDelete(editingId)}
        submitText="Delete"
        submitVariant="danger"
        loading={deleting}
      >
        <p className="text-zinc-300 text-sm">
          Are you sure you want to delete this skill? This action cannot be undone.
        </p>
      </AdminModal>
    </div>
  );
}
