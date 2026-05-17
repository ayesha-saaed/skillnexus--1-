import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import { fileURLToPath } from "url";
import { createClient } from "@supabase/supabase-js";
import natural from "natural";
import dotenv from "dotenv";
import axios from "axios";
import { z } from "zod";
import { GoogleGenAI } from "@google/genai";
import { MASTER_SKILLS, SYNONYMS, JOB_ROLES, INDUSTRY_DEMAND, LEARNING_RESOURCES } from "./src/lib/knowledge_base";
import { INDUSTRY_DEMAND_HISTORICAL, CURATED_RESOURCES } from "./src/lib/data_seeder";
import { normalizeSkill } from "./src/lib/skillNormalization";
import { skillMatchKey } from "./src/lib/skillMatching";
import {
  isValidDomainLabel,
  isValidSkillToken,
  isValidJobRoleTitle,
  isValidResourceTitle,
  isValidResourceDescription,
  isValidHttpUrl,
  isPlaceholderResourceUrl,
  isValidResourceType,
  isValidResourceDifficulty,
  MSG_DOMAIN,
  MSG_SKILL,
  MSG_JOB_ROLE,
  MSG_RESOURCE_TITLE,
  MSG_DESCRIPTION
} from "./src/lib/inputValidation";

dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SECRET_KEY;
const supabaseAdmin = (supabaseUrl && supabaseServiceKey)
  ? createClient(supabaseUrl, supabaseServiceKey)
  : null;

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

if (!supabaseAdmin) {
  throw new Error("Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY / SUPABASE_SECRET_KEY");
}

const app = express();
const PORT = parseInt(process.env.PORT || "3001", 10);

app.use(express.json());

type AuthedRequest = express.Request & {
  authUser?: { id: string; email?: string | null };
  isAdmin?: boolean;
};
type ApiErrorCode = "VALIDATION_ERROR" | "AUTH_ERROR" | "FORBIDDEN" | "NOT_FOUND" | "SERVER_ERROR";

const apiError = (res: express.Response, status: number, code: ApiErrorCode, message: string, details?: unknown) =>
  res.status(status).json({ error: { code, message, details } });

const auditLog = (event: string, meta: Record<string, unknown>) => {
  const payload = { ts: new Date().toISOString(), event, ...meta };
  console.log(JSON.stringify(payload));
  if (supabaseAdmin) {
    void supabaseAdmin.from("api_audit_logs").insert({
      event,
      payload: meta,
      created_at: new Date().toISOString()
    });
  }
};

const recommendationsQuerySchema = z.object({
  limit: z.coerce.number().int().min(1).max(50).optional()
});

const aiRequestSchema = z.object({
  prompt: z.string().min(1).max(1600),
  context: z.string().max(1200).optional(),
  userSkills: z.array(z.string()).optional().default([])
});

// Content safety check for AI prompts
const containsHarmfulContent = (text: string): boolean => {
  const harmfulPatterns = [
    /\b(hack|exploit|attack|malware|virus|trojan|phish|scam|fraud)\b/i,
    /\b(illegal|criminal|terrorist|violent|harm|kill|suicide)\b/i,
    /\b(drug|weapon|nuclear|bomb|explosive)\b/i,
    /\b(personal|private|confidential|secret).*(data|information|details)/i
  ];
  return harmfulPatterns.some(pattern => pattern.test(text));
};

const getBearerToken = (req: express.Request) => {
  const header = req.headers.authorization || "";
  if (!header.toLowerCase().startsWith("bearer ")) return null;
  return header.slice(7).trim();
};

const requireAuth: express.RequestHandler = async (req, res, next) => {
  if (!supabaseAdmin) return apiError(res, 500, "SERVER_ERROR", "Supabase admin client not configured");
  const token = getBearerToken(req);
  if (!token) return apiError(res, 401, "AUTH_ERROR", "Missing bearer token");

  const { data, error } = await supabaseAdmin.auth.getUser(token);
  if (error || !data.user) return apiError(res, 401, "AUTH_ERROR", "Invalid or expired token");

  (req as AuthedRequest).authUser = { id: data.user.id, email: data.user.email };
  next();
};

const requireAdmin: express.RequestHandler = async (req, res, next) => {
  const authReq = req as AuthedRequest;
  if (!authReq.authUser?.id) return apiError(res, 401, "AUTH_ERROR", "Unauthorized");
  if (!supabaseAdmin) return apiError(res, 500, "SERVER_ERROR", "Supabase admin client not configured");

  const { data, error } = await supabaseAdmin
    .from("profiles")
    .select("role")
    .eq("id", authReq.authUser.id)
    .maybeSingle();

  if (error) return apiError(res, 500, "SERVER_ERROR", "Failed to check admin role", error.message);
  const role = String(data?.role ?? "")
    .trim()
    .toLowerCase();
  if (role !== "admin") return apiError(res, 403, "FORBIDDEN", "Admin access required");

  authReq.isAdmin = true;
  next();
};

const aiApiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY || null;
const aiModel = process.env.GEMINI_MODEL || 'gemini-2.0-flash';
const aiClient = aiApiKey ? new GoogleGenAI({ apiKey: aiApiKey }) : null;

const rateLimiter = (limit: number, windowMs: number): express.RequestHandler => {
  const store = new Map<string, { count: number; resetAt: number }>();
  return (req, res, next) => {
    const key = (req.headers['x-forwarded-for'] as string || req.ip || 'anonymous').split(',')[0].trim();
    const now = Date.now();
    const entry = store.get(key);
    if (!entry || entry.resetAt <= now) {
      store.set(key, { count: 1, resetAt: now + windowMs });
      return next();
    }
    if (entry.count >= limit) {
      return apiError(res, 429, 'FORBIDDEN', 'Rate limit exceeded', { retryAfterMs: entry.resetAt - now });
    }
    entry.count += 1;
    return next();
  };
};

app.post('/api/ai/skill-agent', requireAuth, rateLimiter(12, 60_000), async (req, res) => {
  if (!aiClient) return apiError(res, 500, 'SERVER_ERROR', 'AI service not configured');
  const parsed = aiRequestSchema.safeParse(req.body);
  if (!parsed.success) {
    return apiError(res, 400, 'VALIDATION_ERROR', 'Invalid AI request payload', parsed.error.flatten());
  }

  // Content safety check
  const fullPrompt = [
    parsed.data.context || '',
    `Current user skills: ${parsed.data.userSkills.join(', ') || 'none'}`,
    parsed.data.prompt.trim()
  ].filter(Boolean).join('\n\n');

  if (containsHarmfulContent(fullPrompt)) {
    auditLog('ai.skill-agent.blocked', { userId: (req as AuthedRequest).authUser?.id, reason: 'harmful_content' });
    return apiError(res, 400, 'VALIDATION_ERROR', 'Request contains inappropriate content');
  }

  const prompt = [
    'You are a trusted career intelligence assistant for SkillNexus. Provide concise, actionable guidance, highlight high-demand skills, and keep recommendations grounded in evidence and safe best practices.',
    fullPrompt
  ].join('\n\n');

  try {
    const response = await aiClient.models.generateContent({
      model: aiModel,
      contents: [
        {
          role: 'user',
          parts: [{ text: prompt }]
        }
      ],
      config: {
        temperature: 0.35,
        maxOutputTokens: 512,
        topP: 0.9
      }
    });

    const answer = (response as any).text || (response as any)?.output?.[0]?.content?.[0]?.text || 'I could not generate an answer at this time.';
    auditLog('ai.skill-agent', { userId: (req as AuthedRequest).authUser?.id, prompt: parsed.data.prompt.slice(0, 200) });
    return res.json({ answer });
  } catch (error: any) {
    auditLog('ai.skill-agent.error', { message: error?.message || 'Unknown AI error' });
    return apiError(res, 500, 'SERVER_ERROR', 'AI request failed', error?.message);
  }
});

// --- NLP & Semantic Logic ---

function calculateCosineSimilarity(vec1: number[], vec2: number[]) {
  const dotProduct = vec1.reduce((sum, val, i) => sum + val * (vec2[i] || 0), 0);
  const mag1 = Math.sqrt(vec1.reduce((sum, val) => sum + val * val, 0));
  const mag2 = Math.sqrt(vec2.reduce((sum, val) => sum + val * val, 0));
  if (mag1 === 0 || mag2 === 0) return 0;
  return dotProduct / (mag1 * mag2);
}

function analyzeGaps(userSkillsRaw: any[], requiredSkills: any[], domain?: string, demandMap?: Record<string, number>) {
  const TfIdf = (natural as any).TfIdf;
  const tfidf = new TfIdf();

  const userSkillsCanonical = userSkillsRaw.map((s) => {
    const rawName = typeof s === "string" ? s : s.skillName || s.name;
    const proficiency =
      typeof s?.proficiency === "number"
        ? s.proficiency
        : typeof s?.proficiencyLevel === "number"
          ? s.proficiencyLevel
          : proficiencyToLevel(s?.proficiency ?? s?.proficiencyLevel);
    return {
      name: normalizeSkill(rawName),
      matchKey: skillMatchKey(rawName),
      proficiency
    };
  });

  const requiredSkillsCanonical = requiredSkills.map((s: any) => {
    const rawName = typeof s === "string" ? s : s.name;
    return {
      name: normalizeSkill(rawName),
      matchKey: skillMatchKey(rawName),
      importance: typeof s?.importance === "number" ? s.importance : 0.7,
      requiredProficiency: typeof s?.requiredProficiency === "number" ? s.requiredProficiency : 0.8
    };
  });

  const userDoc = userSkillsCanonical.map(s => s.name).join(" ");
  const jobDoc = requiredSkillsCanonical.map(s => s.name).join(" ");

  tfidf.addDocument(userDoc);
  tfidf.addDocument(jobDoc);

  const terms = Array.from(new Set([
    ...userSkillsCanonical.map(s => s.name),
    ...requiredSkillsCanonical.map(s => s.name)
  ]));

  const vectors: number[][] = [[], []];
  terms.forEach((term, index) => {
    tfidf.listTerms(0).forEach((t: any) => {
      if (t.term === term.toLowerCase()) vectors[0][index] = t.tfidf;
    });
    tfidf.listTerms(1).forEach((t: any) => {
      if (t.term === term.toLowerCase()) vectors[1][index] = t.tfidf;
    });
    
    if (!vectors[0][index]) vectors[0][index] = 0;
    if (!vectors[1][index]) vectors[1][index] = 0;
  });

  const similarity = calculateCosineSimilarity(vectors[0], vectors[1]);
  
  const matched = requiredSkillsCanonical.filter((req) =>
    userSkillsCanonical.some((u) => u.matchKey === req.matchKey)
  );

  const missing = requiredSkillsCanonical.filter(
    (req) => !userSkillsCanonical.some((u) => u.matchKey === req.matchKey)
  );

  const weakSkillsCanonical = matched.filter((req) => {
    const userSkill = userSkillsCanonical.find((u) => u.matchKey === req.matchKey);
    return userSkill && userSkill.proficiency < req.requiredProficiency;
  });

  const getDemandScore = (skillName: string) => {
    if (demandMap && demandMap[skillName] !== undefined) return demandMap[skillName];
    return INDUSTRY_DEMAND.find(d => normalizeSkill(d.skill) === skillName)?.demandScore || 50;
  };

  const gapScore = requiredSkillsCanonical.length > 0 ? (missing.length + weakSkillsCanonical.length) / requiredSkillsCanonical.length : 0;

  const rankedMissing = missing.map(m => {
    const demandScore = getDemandScore(m.name);
    const trend = MASTER_SKILLS.find(ms => normalizeSkill(ms.name) === m.name)?.trendScore || 0.5;
    const delta = Math.max(0, m.requiredProficiency - 0);
    return {
      name: m.name,
      demandScore,
      gapScore: delta,
      finalScore: delta + (demandScore / 100),
      rankScore: delta + (demandScore / 100) + trend + (m.importance * 0.3)
    };
  }).sort((a, b) => b.rankScore - a.rankScore);

  const weakSkills = weakSkillsCanonical
    .map(req => {
      const userSkill = userSkillsCanonical.find((u) => u.matchKey === req.matchKey)!;
      const delta = Math.max(0, req.requiredProficiency - userSkill.proficiency);
      const demandScore = getDemandScore(req.name);
      const finalScore = delta + (demandScore / 100);
      const priority: "High" | "Medium" | "Low" = finalScore >= 1.1 ? "High" : finalScore >= 0.7 ? "Medium" : "Low";
      return {
        skill: req.name,
        userLevel: Number(userSkill.proficiency.toFixed(2)),
        requiredLevel: Number(req.requiredProficiency.toFixed(2)),
        gapScore: Number(delta.toFixed(2)),
        demandScore,
        finalScore: Number(finalScore.toFixed(2)),
        priority
      };
    })
    .sort((a, b) => b.finalScore - a.finalScore);

  // --- Enhanced Rich Recommendations Logic ---
  const richRecommendations: any[] = [];
  
  // 1. Solve critical missing gaps
  for (const skill of rankedMissing.slice(0, 3)) {
    const resource = CURATED_RESOURCES.find(r => 
      r.skillsCovered.some(s => normalizeSkill(s) === skill.name) && 
      (domain ? r.domain === domain : true)
    );
    
    if (resource) {
      richRecommendations.push({
        skillName: skill.name,
        resourceLink: resource.url,
        description: `Critical Gap: Master ${skill.name} to advance as a ${domain || 'professional'}. This resource covers the fundamentals needed.`,
        type: resource.type,
        platform: resource.platform,
        difficulty: resource.difficulty
      });
    }
  }

  // 2. Address weak skills
  for (const skill of weakSkillsCanonical.slice(0, 2)) {
    const resource = CURATED_RESOURCES.find(r => 
      r.skillsCovered.some(s => normalizeSkill(s) === skill.name) && 
      r.difficulty !== 'Beginner'
    );
    
    if (resource) {
      richRecommendations.push({
        skillName: skill.name,
        resourceLink: resource.url,
        description: `Skill Optimization: You have the basics of ${skill.name}, but this resource will help you reach the ${domain || 'industry'} standard proficiency.`,
        type: resource.type,
        platform: resource.platform,
        difficulty: resource.difficulty
      });
    }
  }

  const missingSkills = rankedMissing.map(m => m.name);
  const recommendedSkillsToLearn = [
    ...rankedMissing.map(m => m.name),
    ...weakSkills.map(w => `${w.skill} (advanced)`)
  ];

  const skillMatchScore = Math.round((1 - gapScore) * 100);

  return {
    jobRole: domain || "Selected Role",
    similarity,
    gapScore,
    skillMatchScore: Math.max(0, Math.min(100, skillMatchScore)),
    missingSkills,
    weakSkills,
    recommendedSkillsToLearn,
    matched: matched.map(m => m.name),
    missing: missingSkills,
    recommendations: [
      ...rankedMissing.slice(0, 2).map(m => `Priority Gap: Master ${m.name} (Critical Market Demand).`),
      ...weakSkills.slice(0, 1).map(w => `Skill Decay Guard: Improve your ${w.skill} level to meet role standards.`)
    ],
    richRecommendations
  };
}

function proficiencyToLevel(value: unknown): number {
  if (typeof value === "number" && Number.isFinite(value)) return Math.min(1, Math.max(0, value));
  if (typeof value === "string") {
    if (value === "Advanced") return 1;
    if (value === "Intermediate") return 0.7;
    if (value === "Beginner") return 0.3;
  }
  return 0.5;
}

function getDefaultRoleRows() {
  return JOB_ROLES.map((role: any) => ({
    role_name: role.jobRole,
    required_skills: (role.requiredSkills || []).map((s: any) => (typeof s === "string" ? s : s.name)).filter(Boolean),
    domain: role.domain || "Full Stack",
    difficulty: "Intermediate"
  }));
}

function inferSkillsFromCareerSummary(summary: string) {
  const text = summary.toLowerCase();
  const candidates = new Map<string, number>();

  const getHeuristicProficiency = (skill: string) => {
    const local = text.slice(Math.max(0, text.indexOf(skill.toLowerCase()) - 80), text.indexOf(skill.toLowerCase()) + 80);
    if (/expert|advanced|architect|lead|senior/.test(local)) return 0.9;
    if (/intermediate|mid|worked on|experience/.test(local)) return 0.7;
    if (/beginner|learning|started|new to/.test(local)) return 0.4;
    return 0.6;
  };

  for (const skill of MASTER_SKILLS) {
    const canonical = normalizeSkill(skill.name);
    const terms = [skill.name, ...(SYNONYMS.find(s => normalizeSkill(s.skill) === canonical)?.synonyms || [])];
    for (const term of terms) {
      const pattern = new RegExp(`\\b${term.replace(/[.*+?^${}()|[\]\\]/g, "\\$&").toLowerCase()}\\b`, "i");
      if (pattern.test(text)) {
        const inferred = getHeuristicProficiency(term);
        const prev = candidates.get(canonical) || 0;
        candidates.set(canonical, Math.max(prev, inferred));
      }
    }
  }

  return Array.from(candidates.entries()).map(([name, proficiencyLevel]) => ({ skillName: name, proficiencyLevel }));
}

// --- API Endpoints ---

const analyzeSchema = z.object({
  userId: z.string().uuid().optional(),
  jobRoleId: z.string().uuid(),
  userSkills: z.array(z.union([
    z.string(),
    z.object({
      skillName: z.string().optional(),
      name: z.string().optional(),
      proficiencyLevel: z.number().optional(),
      proficiency: z.union([z.number(), z.string()]).optional()
    })
  ])).optional(),
  careerSummary: z
    .string()
    .max(5000)
    .optional()
    .transform((s) => {
      const t = (s || "").trim();
      return t.length >= 10 ? t : undefined;
    })
});

const roleResourcesSchema = z.object({
  jobRoleId: z.string().uuid(),
  missingSkills: z.array(z.string()).optional(),
  weakSkills: z.array(z.string()).optional(),
  domain: z.string().optional()
});


app.post("/api/analyze", requireAuth, async (req, res) => {
  try {
    const parsed = analyzeSchema.safeParse(req.body);
    if (!parsed.success) {
      return apiError(res, 400, "VALIDATION_ERROR", "Invalid analyze payload", parsed.error.flatten());
    }
    const { userId, jobRoleId, userSkills: providedSkills, careerSummary } = parsed.data;
    const authReq = req as AuthedRequest;
    if (authReq.authUser?.id && userId && authReq.authUser.id !== userId && !authReq.isAdmin) {
      return apiError(res, 403, "FORBIDDEN", "Forbidden for this userId");
    }
    const effectiveUserId = authReq.authUser?.id || userId;
    
    let userSkillsFull = [];
    
    const [{ data: skillsRows }, { data: roleData, error: roleErr }, { data: trendsRows }] = await Promise.all([
      supabaseAdmin!.from("user_skills").select("*").eq("user_id", effectiveUserId),
      supabaseAdmin!.from("job_roles").select("*").eq("id", jobRoleId).maybeSingle(),
      supabaseAdmin!.from("trends").select("skill_name,demand_score")
    ]);
    if (roleErr || !roleData) {
      return apiError(res, 404, "NOT_FOUND", "Job role not found");
    }
    const fromDb = (skillsRows || []).map((row: any) => ({
      skillName: row.skill_name,
      proficiencyLevel: row.proficiency === "Advanced" ? 1 : row.proficiency === "Intermediate" ? 0.7 : 0.3
    }));
    const providedMapped = (providedSkills || []).map((s: any) => ({
      skillName: s.skillName || s.name || "",
      proficiencyLevel: proficiencyToLevel(s.proficiencyLevel ?? s.proficiency)
    }));
    const inferredFromSummary = careerSummary ? inferSkillsFromCareerSummary(careerSummary) : [];
    const merged = new Map<string, number>();
    fromDb.forEach((s) => {
      if (!s.skillName) return;
      const key = skillMatchKey(s.skillName);
      merged.set(key, Math.max(merged.get(key) || 0, s.proficiencyLevel));
    });
    providedMapped.forEach((s) => {
      if (!s.skillName) return;
      const key = skillMatchKey(s.skillName);
      merged.set(key, Math.max(merged.get(key) || 0, s.proficiencyLevel));
    });
    inferredFromSummary.forEach((s) => {
      if (!s.skillName) return;
      const key = skillMatchKey(s.skillName);
      merged.set(key, Math.max(merged.get(key) || 0, s.proficiencyLevel || 0.5));
    });
    userSkillsFull = Array.from(merged.entries()).map(([skillName, proficiencyLevel]) => ({ skillName, proficiencyLevel }));
    const requiredSkills = roleData.required_skills || [];
    const domain = roleData.domain;
    const demandMap = Object.fromEntries((trendsRows || []).map((row: any) => [normalizeSkill(row.skill_name), row.demand_score]));
    const analysisBase = analyzeGaps(userSkillsFull, requiredSkills, domain, demandMap);
    const analysis = {
      ...analysisBase,
      jobRole: roleData.role_name || analysisBase.jobRole,
      careerSummary: careerSummary || null,
      inferredSkills: inferredFromSummary
    };
    auditLog("analyze.success", { userId: effectiveUserId, jobRoleId, similarity: analysis.similarity, gapScore: analysis.gapScore });
    res.json(analysis);
  } catch (error: any) {
    auditLog("analyze.error", { message: error.message });
    apiError(res, 500, "SERVER_ERROR", "Analysis failed", error.message);
  }
});

app.get("/api/industry-trends", async (req, res) => {
  try {
    const { data, error } = await supabaseAdmin!
      .from("trends")
      .select("*")
      .order("demand_score", { ascending: false });
    if (error) throw error;
    const { data: historyRows, error: historyErr } = await supabaseAdmin!
      .from("trend_history")
      .select("*")
      .order("year", { ascending: true });
    if (historyErr) throw historyErr;
    const growthBySkill = new Map<string, string>();
    const grouped: Record<string, any[]> = {};
    (historyRows || []).forEach((row: any) => {
      grouped[row.skill_name] = grouped[row.skill_name] || [];
      grouped[row.skill_name].push(row);
    });
    Object.entries(grouped).forEach(([skill, rows]) => {
      const sorted = rows.sort((a, b) => a.year - b.year);
      const latest = sorted[sorted.length - 1];
      const prev = sorted[sorted.length - 2];
      const growth = prev ? (((latest.demand_score - prev.demand_score) / Math.max(prev.demand_score, 1)) * 100) : (latest?.growth_rate || 0);
      growthBySkill.set(skill, `${growth >= 0 ? "+" : ""}${Math.round(growth)}%`);
    });
    const trends = (data || []).map((row: any) => ({
      id: row.id,
      skillName: row.skill_name,
      demandScore: row.demand_score,
      growth: growthBySkill.get(row.skill_name) || row.growth || "+0%"
    }));
    auditLog("trends.fetch", { count: trends.length });
    res.json(trends);
  } catch (error: any) {
    apiError(res, 500, "SERVER_ERROR", "Failed to fetch trends", error.message);
  }
});

app.get("/api/job-roles", requireAuth, async (req, res) => {
  try {
    const defaultRoles = getDefaultRoleRows();

    // Best-effort: ensure default roles exist in the DB so admin edits/deletes
    // can target real rows. We deliberately swallow errors here so a partial
    // seeding failure never causes the response to drop the defaults.
    if (defaultRoles.length) {
      try {
        const { data: existingRoles, error: existingError } = await supabaseAdmin!
          .from("job_roles")
          .select("role_name");
        if (!existingError) {
          const existingNames = new Set(
            (existingRoles || []).map((row: any) => String(row.role_name || '').trim().toLowerCase())
          );
          const missingRoles = defaultRoles.filter(
            (role) => !existingNames.has(String(role.role_name || '').trim().toLowerCase())
          );
          if (missingRoles.length) {
            const { error: insertError } = await supabaseAdmin!.from("job_roles").insert(missingRoles);
            if (insertError) {
              auditLog("job-roles.seed.warn", { message: insertError.message });
            }
          }
        } else {
          auditLog("job-roles.seed.warn", { message: existingError.message });
        }
      } catch (seedErr: any) {
        auditLog("job-roles.seed.warn", { message: seedErr?.message || String(seedErr) });
      }
    }

    const { data: roles, error } = await supabaseAdmin!.from("job_roles").select("*").order("role_name");
    if (error) throw error;

    // Defensive merge: if for any reason (seeding failure, RLS, etc.) the DB
    // doesn't contain a default role, surface it from the in-memory knowledge
    // base so the gap-checker page never loses its baseline list. Admin-added
    // roles from the DB are always preserved and appended.
    const dbRoles = roles || [];
    const dbNameSet = new Set(
      dbRoles.map((row: any) => String(row.role_name || '').trim().toLowerCase())
    );
    const fallbackDefaults = defaultRoles
      .filter((row) => !dbNameSet.has(String(row.role_name || '').trim().toLowerCase()))
      .map((row, index) => ({
        id: `default-${index}`,
        role_name: row.role_name,
        required_skills: row.required_skills,
        domain: row.domain,
        difficulty: row.difficulty,
        created_at: null,
        is_default: true
      }));

    return res.json([...dbRoles, ...fallbackDefaults]);
  } catch (error: any) {
    return apiError(res, 500, "SERVER_ERROR", "Failed to fetch job roles", error.message);
  }
});

app.post("/api/admin/seed", requireAuth, requireAdmin, async (req, res) => {
  try {
    console.log("Seeding high-fidelity datasets...");
    // 1) Trend history + latest trends
    const historyRows = INDUSTRY_DEMAND_HISTORICAL.map((row: any) => ({
      skill_name: row.skill,
      year: row.year,
      demand_score: row.demandScore,
      growth_rate: row.growthRate
    }));
    if (historyRows.length) {
      const { error } = await supabaseAdmin!.from("trend_history").upsert(historyRows, { onConflict: "skill_name,year" });
      if (error) throw error;
    }
    const trendsRows = INDUSTRY_DEMAND_HISTORICAL
      .filter((row: any) => row.year === 2026)
      .map((row: any) => ({
        skill_name: row.skill,
        demand_score: row.demandScore,
        growth: `+${row.growthRate}%`
      }));
    if (trendsRows.length) {
      const { error } = await supabaseAdmin!.from("trends").upsert(trendsRows, { onConflict: "skill_name" });
      if (error) throw error;
    }

    // 2) Resources
    const resourceRows = CURATED_RESOURCES
      .filter((r: any) => r.url)
      .map((r: any) => ({
        title: r.title,
        description: r.description || "",
        url: r.url,
        type: r.type || "Course",
        skills_covered: r.skillsCovered || [],
        difficulty: r.difficulty || "Beginner",
        platform: r.platform || "Unknown",
        duration: r.duration || null,
        rating: r.rating || null,
        domain: r.domain || "Full Stack"
      }));
    if (resourceRows.length) {
      const { error } = await supabaseAdmin!.from("resources").upsert(resourceRows, { onConflict: "url" });
      if (error) throw error;
    }

    // 3) Job roles
    const roleRows = getDefaultRoleRows();
    if (roleRows.length) {
      const { error } = await supabaseAdmin!.from("job_roles").upsert(roleRows, { onConflict: "role_name" });
      if (error) throw error;
    }

    auditLog("seed.success", { actor: (req as AuthedRequest).authUser?.id, trends: trendsRows.length, resources: resourceRows.length, roles: roleRows.length });
    return res.json({ message: "Supabase seeding complete", counts: { trends: trendsRows.length, resources: resourceRows.length, roles: roleRows.length } });
  } catch (error: any) {
    auditLog("seed.error", { message: error.message });
    apiError(res, 500, "SERVER_ERROR", "Seeding failed", error.message);
  }
});

const adminRoleSchema = z
  .object({
    id: z.string().uuid().optional(),
    title: z.string().min(2),
    domain: z.string().min(1).default("Custom"),
    difficulty: z.string().min(1).default("Intermediate"),
    requiredSkills: z.array(z.string()).default([])
  })
  .superRefine((data, ctx) => {
    if (!isValidJobRoleTitle(data.title.trim())) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: MSG_JOB_ROLE, path: ["title"] });
    }
    if (!isValidDomainLabel(data.domain.trim())) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: MSG_DOMAIN, path: ["domain"] });
    }
    data.requiredSkills.forEach((skill, index) => {
      const s = skill.trim();
      if (s && !isValidSkillToken(s)) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, message: MSG_SKILL, path: ["requiredSkills", index] });
      }
    });
  });

const adminDomainSchema = z
  .object({
    id: z.string().uuid().optional(),
    name: z.string().min(2),
    description: z.string().optional().default(""),
    icon: z.string().optional(),
    color: z.string().optional().default("#3b82f6"),
    image_url: z.string().optional()
  })
  .superRefine((data, ctx) => {
    if (!isValidDomainLabel(data.name.trim())) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: MSG_DOMAIN, path: ["name"] });
    }
    if (!isValidResourceDescription((data.description ?? "").trim())) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: MSG_DESCRIPTION, path: ["description"] });
    }
  });

const adminSkillSchema = z
  .object({
    id: z.string().uuid().optional(),
    name: z.string().min(2),
    description: z.string().min(1),
    domain_id: z
      .string()
      .optional()
      .transform((val) => (val?.trim() ? val : null))
  })
  .superRefine((data, ctx) => {
    if (!isValidSkillToken(data.name.trim())) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: MSG_SKILL, path: ["name"] });
    }
    if (!isValidResourceDescription(data.description.trim())) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: MSG_DESCRIPTION, path: ["description"] });
    }
  });

const adminResourceSchema = z
  .object({
    id: z.string().uuid().optional(),
    title: z.string().min(1),
    description: z.string().optional().default(""),
    url: z.string().min(1),
    type: z.string().min(1).default("Course"),
    difficulty: z.string().min(1).default("Beginner"),
    duration: z.string().optional().default(""),
    domain: z.string().optional().default("Full Stack"),
    skills_covered: z.array(z.string()).optional().default([])
  })
  .superRefine((data, ctx) => {
    if (!isValidResourceTitle(data.title.trim())) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: MSG_RESOURCE_TITLE, path: ["title"] });
    }
    if (!isValidResourceDescription((data.description ?? "").trim())) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: MSG_DESCRIPTION, path: ["description"] });
    }
    const url = data.url.trim();
    if (!isValidHttpUrl(url)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Enter a valid http:// or https:// URL.",
        path: ["url"]
      });
    } else if (isPlaceholderResourceUrl(url)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Use a real course link; skillnexus.dev/learn/… placeholders are not valid.",
        path: ["url"]
      });
    }
    if (!isValidResourceType(data.type)) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Invalid resource type.", path: ["type"] });
    }
    if (!isValidResourceDifficulty(data.difficulty)) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Invalid difficulty.", path: ["difficulty"] });
    }
    if (!isValidDomainLabel((data.domain ?? "").trim())) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: MSG_DOMAIN, path: ["domain"] });
    }
    (data.skills_covered ?? []).forEach((skill, index) => {
      const s = skill.trim();
      if (s && !isValidSkillToken(s)) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, message: MSG_SKILL, path: ["skills_covered", index] });
      }
    });
  });

const adminProfilePatchSchema = z
  .object({
    role: z.enum(["student", "admin", "moderator"]).optional(),
    name: z.string().min(2).max(80).optional(),
    level: z.number().int().min(1).optional(),
    points: z.number().int().min(0).optional(),
    badges: z.array(z.string()).optional(),
    active_job_role_id: z.string().uuid().nullable().optional(),
    active_job_role_name: z.string().nullable().optional(),
    active_path_domain: z.string().nullable().optional()
  })
  .refine((body) => Object.keys(body).length > 0, { message: "At least one field is required" })
  .superRefine((body, ctx) => {
    if (body.active_path_domain != null && body.active_path_domain.trim()) {
      if (!isValidDomainLabel(body.active_path_domain.trim())) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, message: MSG_DOMAIN, path: ["active_path_domain"] });
      }
    }
  });

app.post("/api/admin/roles", requireAuth, requireAdmin, async (req, res) => {
  try {
    const parsed = adminRoleSchema.safeParse(req.body);
    if (!parsed.success) {
      return apiError(res, 400, "VALIDATION_ERROR", "Invalid role payload", parsed.error.flatten());
    }

    const payload = {
      role_name: parsed.data.title.trim(),
      required_skills: parsed.data.requiredSkills.map((skill) => skill.trim()).filter(Boolean),
      domain: parsed.data.domain.trim() || 'Custom',
      difficulty: parsed.data.difficulty
    };

    if (parsed.data.id) {
      const { error } = await supabaseAdmin!.from("job_roles").update(payload).eq("id", parsed.data.id);
      if (error) throw error;
      auditLog("admin.role.updated", { actor: (req as AuthedRequest).authUser?.id, roleId: parsed.data.id, title: parsed.data.title });
      return res.json({ id: parsed.data.id });
    }

    const { data, error } = await supabaseAdmin!.from("job_roles").insert(payload).select("id").single();
    if (error) throw error;
    auditLog("admin.role.created", { actor: (req as AuthedRequest).authUser?.id, roleId: data.id, title: parsed.data.title });
    res.json({ id: data.id });
  } catch (error: any) {
    apiError(res, 500, "SERVER_ERROR", "Failed to save role", error.message);
  }
});

app.delete('/api/admin/roles/:id', requireAuth, requireAdmin, async (req, res) => {
  try {
    const id = req.params.id;
    if (!id) return apiError(res, 400, 'VALIDATION_ERROR', 'Invalid role id');

    const { error } = await supabaseAdmin!.from('job_roles').delete().eq('id', id);
    if (error) throw error;

    auditLog('admin.role.deleted', { actor: (req as AuthedRequest).authUser?.id, roleId: id });
    res.json({ success: true });
  } catch (error: any) {
    apiError(res, 500, 'SERVER_ERROR', 'Failed to delete role', error.message);
  }
});

app.post("/api/admin/domains", requireAuth, requireAdmin, async (req, res) => {
  try {
    const parsed = adminDomainSchema.safeParse(req.body);
    if (!parsed.success) {
      return apiError(res, 400, "VALIDATION_ERROR", "Invalid domain payload", parsed.error.flatten());
    }

    const payload = {
      name: parsed.data.name.trim(),
      description: parsed.data.description?.trim() || null,
      icon: parsed.data.icon?.trim() || null,
      color: parsed.data.color || '#3b82f6',
      image_url: parsed.data.image_url?.trim() || null,
      updated_at: new Date().toISOString()
    };

    if (parsed.data.id) {
      const { error } = await supabaseAdmin!.from("domains").update(payload).eq("id", parsed.data.id);
      if (error) throw error;
      auditLog("admin.domain.updated", { actor: (req as AuthedRequest).authUser?.id, domainId: parsed.data.id });
      return res.json({ id: parsed.data.id });
    }

    const { data, error } = await supabaseAdmin!.from("domains").insert({ ...payload, created_at: new Date().toISOString() }).select("id").single();
    if (error) throw error;
    auditLog("admin.domain.created", { actor: (req as AuthedRequest).authUser?.id, domainId: data.id });
    res.json({ id: data.id });
  } catch (error: any) {
    apiError(res, 500, "SERVER_ERROR", "Failed to save domain", error.message);
  }
});

app.delete("/api/admin/domains/:id", requireAuth, requireAdmin, async (req, res) => {
  try {
    const id = req.params.id;
    if (!id) return apiError(res, 400, "VALIDATION_ERROR", "Invalid domain id");
    const { error } = await supabaseAdmin!.from("domains").delete().eq("id", id);
    if (error) throw error;
    auditLog("admin.domain.deleted", { actor: (req as AuthedRequest).authUser?.id, domainId: id });
    res.json({ success: true });
  } catch (error: any) {
    apiError(res, 500, "SERVER_ERROR", "Failed to delete domain", error.message);
  }
});

app.post("/api/admin/skills", requireAuth, requireAdmin, async (req, res) => {
  try {
    const parsed = adminSkillSchema.safeParse(req.body);
    if (!parsed.success) {
      return apiError(res, 400, "VALIDATION_ERROR", "Invalid skill payload", parsed.error.flatten());
    }

    const payload = {
      name: parsed.data.name.trim(),
      description: parsed.data.description.trim(),
      domain_id: parsed.data.domain_id || null
    };

    if (parsed.data.id) {
      const { error } = await supabaseAdmin!.from("skills").update(payload).eq("id", parsed.data.id);
      if (error) throw error;
      auditLog("admin.skill.updated", { actor: (req as AuthedRequest).authUser?.id, skillId: parsed.data.id });
      return res.json({ id: parsed.data.id });
    }

    const { data, error } = await supabaseAdmin!.from("skills").insert(payload).select("id").single();
    if (error) throw error;
    auditLog("admin.skill.created", { actor: (req as AuthedRequest).authUser?.id, skillId: data.id });
    res.json({ id: data.id });
  } catch (error: any) {
    apiError(res, 500, "SERVER_ERROR", "Failed to save skill", error.message);
  }
});

app.delete("/api/admin/skills/:id", requireAuth, requireAdmin, async (req, res) => {
  try {
    const id = req.params.id;
    if (!id) return apiError(res, 400, "VALIDATION_ERROR", "Invalid skill id");
    const { error } = await supabaseAdmin!.from("skills").delete().eq("id", id);
    if (error) throw error;
    auditLog("admin.skill.deleted", { actor: (req as AuthedRequest).authUser?.id, skillId: id });
    res.json({ success: true });
  } catch (error: any) {
    apiError(res, 500, "SERVER_ERROR", "Failed to delete skill", error.message);
  }
});

app.get("/api/admin/users", requireAuth, requireAdmin, async (_req, res) => {
  try {
    const { data, error } = await supabaseAdmin!
      .from("profiles")
      .select("*")
      .order("created_at", { ascending: false });
    if (error) throw error;
    return res.json({ users: data || [] });
  } catch (error: any) {
    return apiError(res, 500, "SERVER_ERROR", "Failed to list users", error.message);
  }
});

app.patch("/api/admin/users/:id", requireAuth, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const parsed = adminProfilePatchSchema.safeParse(req.body);
    if (!parsed.success) {
      return apiError(res, 400, "VALIDATION_ERROR", "Invalid profile payload", parsed.error.flatten());
    }

    const { data, error } = await supabaseAdmin!
      .from("profiles")
      .update({ ...parsed.data, updated_at: new Date().toISOString() })
      .eq("id", id)
      .select("*")
      .maybeSingle();

    if (error) throw error;
    if (!data) return apiError(res, 404, "NOT_FOUND", "User profile not found");

    auditLog("admin.user.updated", { actor: (req as AuthedRequest).authUser?.id, userId: id });
    return res.json({ user: data });
  } catch (error: any) {
    return apiError(res, 500, "SERVER_ERROR", "Failed to update user profile", error.message);
  }
});

app.get("/api/admin/resources", requireAuth, requireAdmin, async (_req, res) => {
  try {
    const { data, error } = await supabaseAdmin!
      .from("resources")
      .select("*")
      .order("created_at", { ascending: false });
    if (error) throw error;
    return res.json({ resources: data || [] });
  } catch (error: any) {
    return apiError(res, 500, "SERVER_ERROR", "Failed to list resources", error.message);
  }
});

app.post("/api/admin/resources", requireAuth, requireAdmin, async (req, res) => {
  try {
    const parsed = adminResourceSchema.safeParse(req.body);
    if (!parsed.success) {
      return apiError(res, 400, "VALIDATION_ERROR", "Invalid resource payload", parsed.error.flatten());
    }

    const payload = {
      title: parsed.data.title.trim(),
      description: parsed.data.description?.trim() || null,
      url: parsed.data.url.trim(),
      type: parsed.data.type,
      difficulty: parsed.data.difficulty,
      duration: parsed.data.duration?.trim() || null,
      domain: parsed.data.domain || 'Full Stack',
      skills_covered: parsed.data.skills_covered || [],
      updated_at: new Date().toISOString()
    };

    if (parsed.data.id) {
      const { error } = await supabaseAdmin!.from("resources").update(payload).eq("id", parsed.data.id);
      if (error) throw error;
      auditLog("admin.resource.updated", { actor: (req as AuthedRequest).authUser?.id, resourceId: parsed.data.id });
      return res.json({ id: parsed.data.id });
    }

    const { data, error } = await supabaseAdmin!.from("resources").insert({ ...payload, created_at: new Date().toISOString() }).select("id").single();
    if (error) throw error;
    auditLog("admin.resource.created", { actor: (req as AuthedRequest).authUser?.id, resourceId: data.id });
    res.json({ id: data.id });
  } catch (error: any) {
    apiError(res, 500, "SERVER_ERROR", "Failed to save resource", error.message);
  }
});

app.delete("/api/admin/resources/:id", requireAuth, requireAdmin, async (req, res) => {
  try {
    const id = req.params.id;
    if (!id) return apiError(res, 400, "VALIDATION_ERROR", "Invalid resource id");
    const { error } = await supabaseAdmin!.from("resources").delete().eq("id", id);
    if (error) throw error;
    auditLog("admin.resource.deleted", { actor: (req as AuthedRequest).authUser?.id, resourceId: id });
    res.json({ success: true });
  } catch (error: any) {
    apiError(res, 500, "SERVER_ERROR", "Failed to delete resource", error.message);
  }
});

app.get("/api/recommendations", requireAuth, async (req, res) => {
  try {
    const queryParsed = recommendationsQuerySchema.safeParse(req.query);
    if (!queryParsed.success) {
      return apiError(res, 400, "VALIDATION_ERROR", "Invalid recommendations query", queryParsed.error.flatten());
    }
    const maxRecommendations = queryParsed.data.limit ?? 10;

    if (!supabaseAdmin) return apiError(res, 500, "SERVER_ERROR", "Supabase admin client not configured");
    const authReq = req as AuthedRequest;
    const userId = authReq.authUser?.id;
    if (!userId) return apiError(res, 401, "AUTH_ERROR", "Unauthorized");

    const [{ data: skillsRows, error: skillsErr }, { data: resourcesRows, error: resourcesErr }] = await Promise.all([
      supabaseAdmin.from("user_skills").select("*").eq("user_id", userId),
      supabaseAdmin.from("resources").select("*")
    ]);
    if (skillsErr) throw skillsErr;
    if (resourcesErr) throw resourcesErr;

    const userSkills = (skillsRows || []).map((row: any) => normalizeSkill(row.skill_name));
    if (!userSkills.length) return res.json([]);

    const userDoc = userSkills.join(" ");
    const recommendations = (resourcesRows || []).map((resource: any) => {
      const covered = (resource.skills_covered || []).map((s: string) => normalizeSkill(s));
      const overlap = covered.filter((skill: string) => userSkills.includes(skill));
      const tfidf = new (natural as any).TfIdf();
      tfidf.addDocument(userDoc);
      tfidf.addDocument(covered.join(" "));
      const terms = Array.from(new Set([...userSkills, ...covered]));
      const vectors: number[][] = [[], []];
      terms.forEach((term, index) => {
        tfidf.listTerms(0).forEach((t: any) => { if (t.term === term.toLowerCase()) vectors[0][index] = t.tfidf; });
        tfidf.listTerms(1).forEach((t: any) => { if (t.term === term.toLowerCase()) vectors[1][index] = t.tfidf; });
        if (!vectors[0][index]) vectors[0][index] = 0;
        if (!vectors[1][index]) vectors[1][index] = 0;
      });
      const semantic = calculateCosineSimilarity(vectors[0], vectors[1]);
      const score = overlap.length * 0.6 + semantic * 0.4;
      return {
        resource_id: resource.id,
        score,
        reason: overlap.length ? `Matches ${overlap.slice(0, 3).join(", ")}` : "Semantic skill similarity"
      };
    }).sort((a, b) => b.score - a.score).slice(0, maxRecommendations);

    if (recommendations.length) {
      const rows = recommendations.map((item) => ({
        user_id: userId,
        resource_id: item.resource_id,
        score: Number(item.score.toFixed(4)),
        reason: item.reason,
        updated_at: new Date().toISOString()
      }));
      const { error: upsertErr } = await supabaseAdmin.from("recommendations").upsert(rows, { onConflict: "user_id,resource_id" });
      if (upsertErr) throw upsertErr;
    }

    const resourceIds = recommendations.map((r) => r.resource_id);
    const { data: selectedResources, error: selErr } = await supabaseAdmin.from("resources").select("*").in("id", resourceIds);
    if (selErr) throw selErr;
    const byId = new Map((selectedResources || []).map((r: any) => [r.id, r]));
    const payload = recommendations.map((rec) => ({ ...byId.get(rec.resource_id), recommendationScore: rec.score, recommendationReason: rec.reason })).filter(Boolean);
    auditLog("recommendations.generated", { userId, count: payload.length });
    return res.json(payload);
  } catch (error: any) {
    return apiError(res, 500, "SERVER_ERROR", "Failed to generate recommendations", error.message);
  }
});

// --- Vite Middleware ---

async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
