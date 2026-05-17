import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Edit2, Trash2, Search, Shield, User, Eye, X } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { supabase } from '../../lib/supabase';
import { AdminTable } from './AdminTable';
import { AdminModal } from './AdminModal';
import { AdminSelect } from './AdminSelect';
import { AdminInput } from './AdminInput';
import type { ShowToastFn } from './useToast';
import {
  isValidDisplayName,
  isValidDomainLabel,
  isValidSkillToken,
  validateCommaSeparatedBadges
} from '../../lib/inputValidation';
import type { AdminTabNavigateOptions } from './adminTab';

interface UserProfile {
  id: string;
  name: string | null;
  email: string | null;
  role: string;
  level: number;
  points: number;
  badges: string[] | null;
  created_at: string;
  updated_at?: string | null;
  active_job_role_id?: string | null;
  active_job_role_name?: string | null;
  active_path_domain?: string | null;
}

interface LearnerSkillRow {
  id: string;
  skill_name: string;
  proficiency: string;
  updated_at: string;
}

interface JobRoleOption {
  id: string;
  role_name: string;
}

const PROFICIENCY_OPTIONS = [
  { value: 'Beginner', label: 'Beginner' },
  { value: 'Intermediate', label: 'Intermediate' },
  { value: 'Advanced', label: 'Advanced' }
];

interface UserManagementProps {
  showToast: ShowToastFn;
  usersNav?: AdminTabNavigateOptions | null;
  onUsersNavConsumed?: () => void;
}

export function UserManagement({ showToast, usersNav, onUsersNavConsumed }: UserManagementProps) {
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterRole, setFilterRole] = useState<string>('all');

  const [detailsUser, setDetailsUser] = useState<UserProfile | null>(null);
  const [detailSkills, setDetailSkills] = useState<LearnerSkillRow[]>([]);
  const [detailSkillsLoading, setDetailSkillsLoading] = useState(false);
  const [jobRoles, setJobRoles] = useState<JobRoleOption[]>([]);
  const [savingProfile, setSavingProfile] = useState(false);
  const [newSkillName, setNewSkillName] = useState('');
  const [newSkillProficiency, setNewSkillProficiency] = useState('Beginner');
  const [profileForm, setProfileForm] = useState({
    name: '',
    role: 'student',
    level: '1',
    points: '0',
    badges: '',
    active_job_role_id: '',
    active_path_domain: ''
  });
  const [profileErrors, setProfileErrors] = useState<Record<string, string>>({});

  const [formData, setFormData] = useState({ role: '' });

  const detailsUserIdRef = useRef<string | null>(null);
  useEffect(() => {
    detailsUserIdRef.current = detailsUser?.id ?? null;
  }, [detailsUser?.id]);

  const roleOptions = [
    { value: 'student', label: 'Student' },
    { value: 'admin', label: 'Admin' },
    { value: 'moderator', label: 'Moderator' }
  ];

  const fetchUsers = useCallback(async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setUsers((data || []) as UserProfile[]);
    } catch (err: any) {
      showToast(err.message || 'Failed to fetch users', 'error');
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  const loadSkillsForUser = useCallback(
    async (userId: string) => {
      try {
        setDetailSkillsLoading(true);
        const { data, error } = await supabase
          .from('user_skills')
          .select('id, skill_name, proficiency, updated_at')
          .eq('user_id', userId)
          .order('updated_at', { ascending: false });
        if (error) throw error;
        setDetailSkills((data || []) as LearnerSkillRow[]);
      } catch (err: any) {
        showToast(err.message || 'Failed to load user skills', 'error');
        setDetailSkills([]);
      } finally {
        setDetailSkillsLoading(false);
      }
    },
    [showToast]
  );

  useEffect(() => {
    void fetchUsers();
  }, [fetchUsers]);

  useEffect(() => {
    (async () => {
      const { data, error } = await supabase.from('job_roles').select('id, role_name').order('role_name');
      if (!error && data) setJobRoles(data as JobRoleOption[]);
    })();
  }, []);

  useEffect(() => {
    const channel = supabase
      .channel('admin-user-management-rt')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'profiles' }, () => {
        void fetchUsers();
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'user_skills' }, (payload) => {
        void fetchUsers();
        const openId = detailsUserIdRef.current;
        if (!openId) return;
        const row = (payload.new as { user_id?: string } | null) ?? (payload.old as { user_id?: string } | null);
        const rowUserId = row?.user_id;
        if (rowUserId === openId) void loadSkillsForUser(openId);
      })
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [fetchUsers, loadSkillsForUser]);

  function openDetails(user: UserProfile) {
    setDetailsUser(user);
    setProfileErrors({});
    setProfileForm({
      name: user.name || '',
      role: user.role || 'student',
      level: String(user.level ?? 1),
      points: String(user.points ?? 0),
      badges: (user.badges || []).join(', '),
      active_job_role_id: user.active_job_role_id || '',
      active_path_domain: user.active_path_domain || ''
    });
    setNewSkillName('');
    setNewSkillProficiency('Beginner');
    void loadSkillsForUser(user.id);
  }

  function closeDetails() {
    setDetailsUser(null);
    setDetailSkills([]);
    setProfileErrors({});
  }

  useEffect(() => {
    if (!usersNav?.openUserDetails || loading || users.length === 0) return;
    const target = usersNav.userId ? users.find((u) => u.id === usersNav.userId) : users[0];
    if (target) openDetails(target);
    onUsersNavConsumed?.();
  }, [usersNav, loading, users, onUsersNavConsumed]);

  async function handleRoleUpdate() {
    if (!editingId || !formData.role) return;

    try {
      setLoading(true);
      const { error } = await supabase.from('profiles').update({ role: formData.role }).eq('id', editingId);

      if (error) throw error;
      showToast('User role updated successfully', 'success');
      setIsModalOpen(false);
      await fetchUsers();
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
      showToast('User profile removed from directory', 'success');
      setIsDeleteConfirmOpen(false);
      if (detailsUser?.id === id) closeDetails();
      await fetchUsers();
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

  async function saveProfileFromDetails() {
    if (!detailsUser) return;
    const errs: Record<string, string> = {};
    if (!isValidDisplayName(profileForm.name)) {
      errs.name =
        'Display name must be 2–80 characters and start with a letter, number, or . + # (allowed: letters, numbers, spaces, -+#.() and apostrophe).';
    }
    const pathTrim = profileForm.active_path_domain.trim();
    if (pathTrim && !isValidDomainLabel(pathTrim)) {
      errs.active_path_domain =
        'Active path domain: 2–80 characters; start with a letter, number, or . + #; then letters, numbers, spaces, and hyphen, ampersand, slash, comma, plus, period, parentheses.';
    }
    const badgesCheck = validateCommaSeparatedBadges(profileForm.badges);
    if (!badgesCheck.ok) errs.badges = badgesCheck.error;
    const levelNum = Math.max(1, parseInt(profileForm.level, 10) || 1);
    const pointsNum = Math.max(0, parseInt(profileForm.points, 10) || 0);
    setProfileErrors(errs);
    if (Object.keys(errs).length) {
      showToast('Fix validation errors before saving.', 'error');
      return;
    }

    const selectedRole = jobRoles.find((r) => r.id === profileForm.active_job_role_id);
    const active_job_role_id = profileForm.active_job_role_id || null;

    try {
      setSavingProfile(true);
      const badges = badgesCheck.ok ? badgesCheck.badges : [];
      const { error } = await supabase
        .from('profiles')
        .update({
          name: profileForm.name.trim(),
          role: profileForm.role,
          level: levelNum,
          points: pointsNum,
          badges,
          active_job_role_id,
          active_job_role_name: selectedRole ? selectedRole.role_name : null,
          active_path_domain: pathTrim || null,
          updated_at: new Date().toISOString()
        })
        .eq('id', detailsUser.id);

      if (error) throw error;
      showToast('Profile updated', 'success');
      await fetchUsers();
      const { data: fresh } = await supabase.from('profiles').select('*').eq('id', detailsUser.id).single();
      if (fresh) {
        const u = fresh as UserProfile;
        setDetailsUser(u);
        setProfileForm({
          name: u.name || '',
          role: u.role || 'student',
          level: String(u.level ?? 1),
          points: String(u.points ?? 0),
          badges: (u.badges || []).join(', '),
          active_job_role_id: u.active_job_role_id || '',
          active_path_domain: u.active_path_domain || ''
        });
      }
    } catch (err: any) {
      showToast(err.message || 'Failed to update profile', 'error');
    } finally {
      setSavingProfile(false);
    }
  }

  async function handleAddSkillForUser() {
    if (!detailsUser) return;
    const trimmed = newSkillName.trim();
    if (!isValidSkillToken(trimmed)) {
      showToast(
        "Skill name must be 2–80 characters; start with a letter, number, or . + #; then letters, numbers, spaces, and -+#.() and apostrophe (').",
        'error'
      );
      return;
    }
    try {
      const { error } = await supabase.from('user_skills').insert({
        user_id: detailsUser.id,
        skill_name: trimmed,
        proficiency: newSkillProficiency,
        updated_at: new Date().toISOString()
      });
      if (error) throw error;
      showToast('Skill added', 'success');
      setNewSkillName('');
      await loadSkillsForUser(detailsUser.id);
    } catch (err: any) {
      showToast(
        err.message ||
          'Could not add skill. If you are admin, run the latest sql/user_skills_admin_rls.sql in Supabase for insert permission.',
        'error'
      );
    }
  }

  async function handleSkillProficiencyChange(row: LearnerSkillRow, proficiency: string) {
    if (!detailsUser) return;
    try {
      const { error } = await supabase
        .from('user_skills')
        .update({ proficiency, updated_at: new Date().toISOString() })
        .eq('id', row.id);
      if (error) throw error;
      await loadSkillsForUser(detailsUser.id);
    } catch (err: any) {
      showToast(err.message || 'Failed to update proficiency', 'error');
    }
  }

  async function handleDeleteSkill(skillId: string) {
    if (!detailsUser) return;
    try {
      const { error } = await supabase.from('user_skills').delete().eq('id', skillId);
      if (error) throw error;
      showToast('Skill removed', 'success');
      await loadSkillsForUser(detailsUser.id);
    } catch (err: any) {
      showToast(err.message || 'Failed to delete skill', 'error');
    }
  }

  const filteredUsers = users.filter((u) => {
    const q = searchTerm.trim().toLowerCase();
    const matchesSearch =
      !q ||
      (u.name || '').toLowerCase().includes(q) ||
      (u.email || '').toLowerCase().includes(q) ||
      u.id.toLowerCase().includes(q);
    const matchesRole = filterRole === 'all' || u.role === filterRole;
    return matchesSearch && matchesRole;
  });

  const jobRoleSelectOptions = [{ value: '', label: '— None —' }, ...jobRoles.map((r) => ({ value: r.id, label: r.role_name }))];

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
              placeholder="Search by name, email, or user ID…"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-white/5 border border-white/10 rounded-lg text-sm text-white placeholder-zinc-600 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
            />
          </div>
        </div>

        <select
          aria-label="Filter users by role"
          value={filterRole}
          onChange={(e) => setFilterRole(e.target.value)}
          className="px-4 py-2 bg-zinc-800 border border-zinc-600 rounded-lg text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50"
        >
          <option value="all">All Roles</option>
          <option value="admin">Admin</option>
          <option value="moderator">Moderator</option>
          <option value="student">Student</option>
        </select>
      </div>

      <AdminTable<UserProfile>
        data={filteredUsers}
        onRowClick={(user) => openDetails(user)}
        columns={[
          {
            header: 'Name',
            key: 'name',
            sortable: true,
            render: (_value, user) => (
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-blue-600/20 flex items-center justify-center text-xs font-bold text-blue-300">
                  {(user.name || user.email || '?').charAt(0).toUpperCase()}
                </div>
                <div>
                  <p className="text-sm font-medium">{user.name || '—'}</p>
                  <p className="text-xs text-zinc-500">{user.email}</p>
                  <p className="text-[10px] text-zinc-600 font-mono mt-0.5 truncate max-w-[200px]" title={user.id}>
                    {user.id}
                  </p>
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
                {String(value).charAt(0).toUpperCase() + String(value).slice(1)}
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
          <div className="flex gap-2 justify-end" onClick={(e) => e.stopPropagation()} role="presentation">
            <button
              type="button"
              onClick={() => openDetails(user)}
              className="p-2 hover:bg-white/5 rounded transition-colors"
              title="User details"
            >
              <Eye className="w-4 h-4 text-emerald-400" />
            </button>
            <button
              type="button"
              onClick={() => openRoleModal(user)}
              className="p-2 hover:bg-white/5 rounded transition-colors"
              title="Change Role"
            >
              <Edit2 className="w-4 h-4 text-blue-400" />
            </button>
            <button
              type="button"
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
          Remove this user&apos;s profile from the database? Related learner skills are removed by cascade. The auth account may
          still exist until cleaned up in Supabase Auth.
        </p>
      </AdminModal>

      <AnimatePresence>
        {detailsUser && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/60 z-[60]"
              onClick={closeDetails}
            />
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 12 }}
              className="fixed inset-4 md:inset-8 md:left-1/2 md:-translate-x-1/2 md:w-full md:max-w-4xl z-[70] mx-auto flex flex-col max-h-[calc(100vh-2rem)]"
            >
              <div className="bg-linear-to-br from-zinc-900 to-black border border-white/10 rounded-2xl shadow-2xl flex flex-col min-h-0 overflow-hidden">
                <div className="flex items-start justify-between gap-4 p-5 border-b border-white/10 shrink-0">
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-[0.25em] text-blue-400">User details</p>
                    <h2 className="text-xl font-bold text-white mt-1">{detailsUser.name || detailsUser.email || 'User'}</h2>
                    <p className="text-xs text-zinc-500 font-mono break-all mt-1">{detailsUser.id}</p>
                    {(profileForm.active_job_role_id || detailsUser.active_job_role_name) && (
                      <p className="text-xs text-amber-400/90 mt-2">
                        Job role:{' '}
                        {jobRoles.find((r) => r.id === profileForm.active_job_role_id)?.role_name ||
                          detailsUser.active_job_role_name}
                      </p>
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={closeDetails}
                    className="p-2 rounded-lg hover:bg-white/10 text-zinc-400"
                    aria-label="Close"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <div className="overflow-y-auto flex-1 p-5 space-y-8">
                  <section className="space-y-4">
                    <h3 className="text-xs font-bold uppercase tracking-widest text-zinc-400">Account</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <AdminInput
                        label="Email (read-only)"
                        value={detailsUser.email || ''}
                        onChange={() => {}}
                        readOnly
                        required={false}
                      />
                      <AdminInput
                        label="Display name"
                        value={profileForm.name}
                        onChange={(value) => setProfileForm((f) => ({ ...f, name: value }))}
                        placeholder="e.g. Jane Doe"
                        error={profileErrors.name}
                        required
                      />
                      <AdminSelect
                        label="Role"
                        value={profileForm.role}
                        onChange={(value) => setProfileForm((f) => ({ ...f, role: value }))}
                        options={roleOptions}
                        required
                      />
                      <AdminInput
                        label="Level"
                        type="number"
                        value={profileForm.level}
                        onChange={(value) => setProfileForm((f) => ({ ...f, level: value }))}
                      />
                      <AdminInput
                        label="Points"
                        type="number"
                        value={profileForm.points}
                        onChange={(value) => setProfileForm((f) => ({ ...f, points: value }))}
                      />
                      <AdminInput
                        label="Badges (comma-separated)"
                        value={profileForm.badges}
                        onChange={(value) => setProfileForm((f) => ({ ...f, badges: value }))}
                        placeholder="e.g. polymath, early_adopter"
                        error={profileErrors.badges}
                      />
                      <AdminSelect
                        label="Target job role (Gap Checker)"
                        value={profileForm.active_job_role_id}
                        onChange={(value) => setProfileForm((f) => ({ ...f, active_job_role_id: value }))}
                        options={jobRoleSelectOptions}
                      />
                      <AdminInput
                        label="Active path domain"
                        value={profileForm.active_path_domain}
                        onChange={(value) => setProfileForm((f) => ({ ...f, active_path_domain: value }))}
                        placeholder="e.g. Full Stack"
                        error={profileErrors.active_path_domain}
                      />
                    </div>
                    <button
                      type="button"
                      onClick={() => void saveProfileFromDetails()}
                      disabled={savingProfile}
                      className="px-4 py-2 rounded-lg bg-blue-600/30 hover:bg-blue-600/40 border border-blue-500/30 text-sm font-medium text-blue-200 disabled:opacity-50"
                    >
                      {savingProfile ? 'Saving…' : 'Save profile changes'}
                    </button>
                  </section>

                  <section className="space-y-4">
                    <h3 className="text-xs font-bold uppercase tracking-widest text-zinc-400">Learner skills (My Skills)</h3>
                    <div className="flex flex-wrap gap-2 items-end">
                      <div className="flex-1 min-w-[200px]">
                        <label className="block text-sm font-medium text-zinc-300 mb-2">Add skill</label>
                        <input
                          type="text"
                          value={newSkillName}
                          onChange={(e) => setNewSkillName(e.target.value)}
                          placeholder="e.g. TypeScript"
                          className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-sm text-white placeholder-zinc-600 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                        />
                      </div>
                      <select
                        value={newSkillProficiency}
                        onChange={(e) => setNewSkillProficiency(e.target.value)}
                        className="px-3 py-2 bg-zinc-800 border border-zinc-600 rounded-lg text-sm text-white"
                        aria-label="Proficiency for new skill"
                      >
                        {PROFICIENCY_OPTIONS.map((o) => (
                          <option key={o.value} value={o.value}>
                            {o.label}
                          </option>
                        ))}
                      </select>
                      <button
                        type="button"
                        onClick={() => void handleAddSkillForUser()}
                        className="px-4 py-2 rounded-lg bg-emerald-600/25 hover:bg-emerald-600/35 border border-emerald-500/30 text-sm font-medium text-emerald-200"
                      >
                        Add
                      </button>
                    </div>

                    {detailSkillsLoading ? (
                      <p className="text-sm text-zinc-500">Loading skills…</p>
                    ) : detailSkills.length === 0 ? (
                      <p className="text-sm text-zinc-500">No skills on file.</p>
                    ) : (
                      <ul className="divide-y divide-white/10 border border-white/10 rounded-lg overflow-hidden">
                        {detailSkills.map((row) => (
                          <li key={row.id} className="flex flex-wrap items-center gap-3 px-4 py-3 bg-white/2">
                            <span className="font-medium text-sm text-white flex-1 min-w-[120px]">{row.skill_name}</span>
                            <select
                              value={row.proficiency}
                              onChange={(e) => void handleSkillProficiencyChange(row, e.target.value)}
                              className="px-2 py-1.5 bg-zinc-800 border border-zinc-600 rounded text-xs text-white"
                              aria-label={`Proficiency for ${row.skill_name}`}
                            >
                              {PROFICIENCY_OPTIONS.map((o) => (
                                <option key={o.value} value={o.value}>
                                  {o.label}
                                </option>
                              ))}
                            </select>
                            <span className="text-[10px] text-zinc-600">Updated {new Date(row.updated_at).toLocaleString()}</span>
                            <button
                              type="button"
                              onClick={() => void handleDeleteSkill(row.id)}
                              className="p-2 text-red-400 hover:bg-red-500/10 rounded"
                              title="Remove skill"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </li>
                        ))}
                      </ul>
                    )}
                  </section>
                </div>

                <div className="p-5 border-t border-white/10 flex flex-wrap gap-2 justify-between shrink-0">
                  <button
                    type="button"
                    onClick={() => {
                      setEditingId(detailsUser.id);
                      setIsDeleteConfirmOpen(true);
                    }}
                    className="px-4 py-2 rounded-lg border border-red-500/30 text-red-300 text-sm hover:bg-red-500/10"
                  >
                    Delete user
                  </button>
                  <button
                    type="button"
                    onClick={closeDetails}
                    className="px-4 py-2 rounded-lg border border-white/10 text-zinc-300 text-sm hover:bg-white/5"
                  >
                    Close
                  </button>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
