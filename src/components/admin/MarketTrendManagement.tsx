import React, { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import { Trash2, Plus } from 'lucide-react';

export function MarketTrendManagement({ showToast }: { showToast: (msg: string, type?: string) => void }) {
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [supabaseAvailable, setSupabaseAvailable] = useState(true);
  const [skillName, setSkillName] = useState('');
  const [demandScore, setDemandScore] = useState<number>(80);
  const [growth, setGrowth] = useState('+5%');

  useEffect(() => {
    loadItems();
  }, []);

  async function loadItems() {
    setLoading(true);
    try {
      const { data, error } = await supabase.from('trends').select('*').order('id', { ascending: true });
      if (error) {
        console.warn('trends table missing or error:', error.message);
        setSupabaseAvailable(false);
        // fallback to localStorage
        const raw = localStorage.getItem('trends_local');
        const local = raw ? JSON.parse(raw) : [];
        setItems(local);
      } else {
        setSupabaseAvailable(true);
        setItems(data || []);
      }
    } catch (e) {
      console.error(e);
      setSupabaseAvailable(false);
      const raw = localStorage.getItem('trends_local');
      const local = raw ? JSON.parse(raw) : [];
      setItems(local);
    } finally {
      setLoading(false);
    }
  }

  async function handleAdd() {
    if (!skillName.trim()) return showToast('Enter a skill name', 'error');
    // Validate demand score and growth format
    if (typeof demandScore !== 'number' || Number.isNaN(demandScore) || demandScore < 0 || demandScore > 100) {
      return showToast('Demand score must be an integer between 0 and 100', 'error');
    }
    const growthRegex = /^[+-]?\d+%$/;
    if (!growthRegex.test(String(growth || '').trim())) {
      return showToast("Growth must be a percentage like '+5%' or '-2%'", 'error');
    }

    const growthValue = parseFloat(String(growth).replace('%', '').trim());
    const payload = { skill_name: skillName.trim(), demand_score: Math.round(demandScore), growth: Number.isNaN(growthValue) ? 0 : growthValue };

    async function addLocal() {
      const local = JSON.parse(localStorage.getItem('trends_local') || '[]');
      const id = Date.now();
      const row = { id, skill_name: payload.skill_name, demand_score: payload.demand_score, growth: payload.growth };
      local.push(row);
      localStorage.setItem('trends_local', JSON.stringify(local));
      setItems(local);
      showToast('Added market trend skill (local)', 'success');
      setSkillName('');
      setDemandScore(80);
      setGrowth('+5%');
    }

    try {
      if (supabaseAvailable) {
        const { error } = await supabase.from('trends').insert(payload);
        if (error) {
          const message = String(error.message || '');
          if (message.includes('trends') || message.includes('schema')) {
            setSupabaseAvailable(false);
            await addLocal();
            return;
          }
          throw error;
        }
        showToast('Added market trend skill', 'success');
        setSkillName('');
        setDemandScore(80);
        setGrowth('+5%');
        loadItems();
      } else {
        await addLocal();
      }
    } catch (e: any) {
      console.error(e);
      showToast(e.message || 'Failed to add', 'error');
    }
  }

  async function handleDelete(id: number) {
    if (!confirm('Delete this market trend skill?')) return;
    let usedLocalFallback = !supabaseAvailable;

    try {
      if (supabaseAvailable) {
        const { error } = await supabase.from('trends').delete().eq('id', id);
        if (error) {
          const message = String(error.message || '');
          if (message.includes('trends') || message.includes('schema')) {
            setSupabaseAvailable(false);
            usedLocalFallback = true;
          } else {
            throw error;
          }
        }
      }

      const local = JSON.parse(localStorage.getItem('trends_local') || '[]');
      const filtered = local.filter((it: any) => it.id !== id);
      localStorage.setItem('trends_local', JSON.stringify(filtered));
      setItems(filtered);
      showToast(usedLocalFallback ? 'Deleted (local)' : 'Deleted', 'success');
    } catch (e: any) {
      console.error(e);
      showToast(e.message || 'Delete failed', 'error');
    }
  }

  return (
    <div>
      <h2 className="text-2xl font-black text-white mb-4">Market Trends — Manage Skills</h2>
      <p className="text-sm text-zinc-400 mb-2">Add or remove skills shown on the Market Intelligence page.</p>
      {!supabaseAvailable && (
        <div className="rounded-lg border border-yellow-400/20 bg-yellow-500/10 px-4 py-3 text-sm text-yellow-200 mb-4">
          Supabase market trend storage is unavailable. Changes will be stored locally in this browser.
        </div>
      )}

      <div className="mb-6 flex gap-2">
        <input value={skillName} onChange={e => setSkillName(e.target.value)} placeholder="Skill name" className="flex-1 px-4 py-2 rounded-lg bg-white/3 text-white" />
        <input type="number" value={demandScore} onChange={e => setDemandScore(Number(e.target.value))} className="w-24 px-3 py-2 rounded-lg bg-white/3 text-white" />
        <input value={growth} onChange={e => setGrowth(e.target.value)} className="w-24 px-3 py-2 rounded-lg bg-white/3 text-white" />
        <button onClick={handleAdd} className="px-4 py-2 bg-blue-600 rounded-lg flex items-center gap-2">
          <Plus className="w-4 h-4" /> Add
        </button>
      </div>

      <div className="theme-card p-4">
        {loading ? (
          <p className="text-zinc-400">Loading…</p>
        ) : items.length === 0 ? (
          <p className="text-zinc-400">No market trend skills configured. Add some above.</p>
        ) : (
          <div className="space-y-2">
            {items.map((it) => {
              const displayGrowth = typeof it.growth === 'number' ? `${it.growth > 0 ? '+' : ''}${it.growth}%` : String(it.growth);
              return (
                <div key={it.id} className="flex items-center justify-between p-3 bg-white/2 rounded-lg">
                  <div>
                    <div className="font-bold text-white">{it.skill_name}</div>
                    <div className="text-sm text-zinc-400">Demand: {it.demand_score} • Growth: {displayGrowth}</div>
                  </div>
                  <div>
                    <button onClick={() => handleDelete(it.id)} className="text-red-400 hover:text-red-500 flex items-center gap-2">
                      <Trash2 className="w-4 h-4" /> Delete
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

export default MarketTrendManagement;
