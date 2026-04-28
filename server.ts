import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import { fileURLToPath } from "url";
import admin from "firebase-admin";
import { createClient } from "@supabase/supabase-js";
import natural from "natural";
import dotenv from "dotenv";
import axios from "axios";
import { z } from "zod";
import { MASTER_SKILLS, SYNONYMS, JOB_ROLES, INDUSTRY_DEMAND, LEARNING_RESOURCES } from "./src/lib/knowledge_base";
import { INDUSTRY_DEMAND_HISTORICAL, CURATED_RESOURCES } from "./src/lib/data_seeder";

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
const PORT = 3000;

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

const linkedInCallbackSchema = z.object({
  code: z.string().optional(),
  error: z.string().optional(),
  error_description: z.string().optional()
});

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
  if (!data || data.role !== "admin") return apiError(res, 403, "FORBIDDEN", "Admin access required");

  authReq.isAdmin = true;
  next();
};

// --- NLP & Semantic Logic ---

const normalizeSkill = (skillName: string) => {
  const lower = skillName.toLowerCase().trim();
  for (const item of SYNONYMS) {
    if (
      item.skill.toLowerCase() === lower ||
      item.synonyms.some(s => s.toLowerCase() === lower)
    ) {
      return item.skill; // Return canonical name
    }
  }
  return skillName;
};

function calculateCosineSimilarity(vec1: number[], vec2: number[]) {
  const dotProduct = vec1.reduce((sum, val, i) => sum + val * (vec2[i] || 0), 0);
  const mag1 = Math.sqrt(vec1.reduce((sum, val) => sum + val * val, 0));
  const mag2 = Math.sqrt(vec2.reduce((sum, val) => sum + val * val, 0));
  if (mag1 === 0 || mag2 === 0) return 0;
  return dotProduct / (mag1 * mag2);
}

function analyzeGaps(userSkillsRaw: any[], requiredSkills: any[], domain?: string) {
  const TfIdf = (natural as any).TfIdf;
  const tfidf = new TfIdf();

  // Normalize user skills
  const userSkillsCanonical = userSkillsRaw.map(s => {
    const name = typeof s === 'string' ? s : (s.skillName || s.name);
    return { name: normalizeSkill(name), proficiency: s.proficiencyLevel || 0.5 };
  });

  // Normalize required skills
  const requiredSkillsCanonical = requiredSkills.map(s => ({
    name: normalizeSkill(typeof s === 'string' ? s : s.name),
    importance: s.importance || 0.5,
    requiredProficiency: s.requiredProficiency || 0.5
  }));

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
  
  const matched = requiredSkillsCanonical.filter(req => 
    userSkillsCanonical.some(u => u.name === req.name)
  );
  
  const missing = requiredSkillsCanonical.filter(req => 
    !userSkillsCanonical.some(u => u.name === req.name)
  );

  const weakSkills = matched.filter(req => {
    const userSkill = userSkillsCanonical.find(u => u.name === req.name);
    return userSkill && userSkill.proficiency < req.requiredProficiency;
  });

  const gapScore = requiredSkillsCanonical.length > 0 ? (missing.length + weakSkills.length) / requiredSkillsCanonical.length : 0;

  const rankedMissing = missing.map(m => {
    const demand = INDUSTRY_DEMAND.find(d => d.skill === m.name);
    const trend = MASTER_SKILLS.find(ms => ms.name === m.name)?.trendScore || 0.5;
    return {
      name: m.name,
      rankScore: (demand?.demandScore || 50) / 100 + trend + (m.importance * 1.5)
    };
  }).sort((a, b) => b.rankScore - a.rankScore);

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
  for (const skill of weakSkills.slice(0, 2)) {
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

  return {
    similarity,
    gapScore,
    matched: matched.map(m => m.name),
    missing: rankedMissing.map(m => m.name),
    weakSkills: weakSkills.map(w => w.name),
    recommendations: [
      ...rankedMissing.slice(0, 2).map(m => `Priority Gap: Master ${m.name} (Critical Market Demand).`),
      ...weakSkills.slice(0, 1).map(w => `Skill Decay Guard: Improve your ${w} level to meet role standards.`)
    ],
    richRecommendations
  };
}

// --- LinkedIn OAuth ---

const getLinkedInRedirectUri = () => {
  // Use the development URL provided by the environment or a fallback
  const appUrl = process.env.VITE_APP_URL || `https://${process.env.PROJECT_ID}.asia-southeast1.run.app`;
  return `${appUrl}/api/auth/linkedin/callback`;
};

app.get("/api/auth/linkedin/url", (req, res) => {
  const clientId = process.env.LINKEDIN_CLIENT_ID;
  if (!clientId) {
    return res.status(500).json({ error: "LinkedIn Client ID not configured" });
  }

  const redirectUri = getLinkedInRedirectUri();
  const state = Math.random().toString(36).substring(7);
  
  const authUrl = `https://www.linkedin.com/oauth/v2/authorization?response_type=code&client_id=${clientId}&redirect_uri=${encodeURIComponent(redirectUri)}&state=${state}&scope=openid%20profile%20email`;
  
  res.json({ url: authUrl });
});

app.get("/api/auth/linkedin/callback", async (req, res) => {
  const parsed = linkedInCallbackSchema.safeParse(req.query);
  if (!parsed.success) {
    return apiError(res, 400, "VALIDATION_ERROR", "Invalid LinkedIn callback query", parsed.error.flatten());
  }
  const { code, error, error_description } = parsed.data;

  if (error) {
    return res.send(`
      <html>
        <body>
          <script>
            window.opener.postMessage({ type: 'LINKEDIN_AUTH_ERROR', error: '${error_description || error}' }, '*');
            window.close();
          </script>
        </body>
      </html>
    `);
  }

  try {
    const clientId = process.env.LINKEDIN_CLIENT_ID;
    const clientSecret = process.env.LINKEDIN_CLIENT_SECRET;
    const redirectUri = getLinkedInRedirectUri();

    // 1. Exchange code for access token
    const tokenResponse = await axios.post("https://www.linkedin.com/oauth/v2/accessToken", null, {
      params: {
        grant_type: "authorization_code",
        code,
        client_id: clientId,
        client_secret: clientSecret,
        redirect_uri: redirectUri,
      },
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
    });

    const accessToken = tokenResponse.data.access_token;

    // 2. Get user info
    const userResponse = await axios.get("https://api.linkedin.com/v2/userinfo", {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    const linkedinUser = userResponse.data; // { sub, name, given_name, family_name, picture, email, email_verified }
    const email = linkedinUser.email;
    const uid = `linkedin:${linkedinUser.sub}`;

    // 3. Create or update user in Firebase
    let firebaseUser;
    try {
      firebaseUser = await admin.auth().getUser(uid);
    } catch (e) {
      firebaseUser = await admin.auth().createUser({
        uid,
        email,
        displayName: linkedinUser.name,
        photoURL: linkedinUser.picture,
      });
    }

    // Note: LinkedIn path currently issues Firebase custom tokens only.
    // Supabase social auth should be preferred for production login flows.

    // 4. Generate custom token
    const customToken = await admin.auth().createCustomToken(uid);

    res.send(`
      <html>
        <body>
          <script>
            window.opener.postMessage({ type: 'LINKEDIN_AUTH_SUCCESS', token: '${customToken}' }, '*');
            window.close();
          </script>
          <p>Authentication successful. Closing window...</p>
        </body>
      </html>
    `);
  } catch (err: any) {
    console.error("LinkedIn OAuth error:", err.response?.data || err.message);
    res.send(`
      <html>
        <body>
          <script>
            window.opener.postMessage({ type: 'LINKEDIN_AUTH_ERROR', error: 'Failed to exchange token' }, '*');
            window.close();
          </script>
        </body>
      </html>
    `);
  }
});

// --- API Endpoints ---

const analyzeSchema = z.object({
  userId: z.string().uuid().optional(),
  jobRoleId: z.string().uuid(),
  userSkills: z.array(z.union([z.string(), z.object({ skillName: z.string(), proficiencyLevel: z.number().optional() })])).optional()
});

app.post("/api/analyze", requireAuth, async (req, res) => {
  try {
    const parsed = analyzeSchema.safeParse(req.body);
    if (!parsed.success) {
      return apiError(res, 400, "VALIDATION_ERROR", "Invalid analyze payload", parsed.error.flatten());
    }
    const { userId, jobRoleId, userSkills: providedSkills } = parsed.data;
    const authReq = req as AuthedRequest;
    if (authReq.authUser?.id && userId && authReq.authUser.id !== userId && !authReq.isAdmin) {
      return apiError(res, 403, "FORBIDDEN", "Forbidden for this userId");
    }
    const effectiveUserId = authReq.authUser?.id || userId;
    
    let userSkillsFull = [];
    
    const [{ data: skillsRows }, { data: roleData, error: roleErr }] = await Promise.all([
      supabaseAdmin!.from("user_skills").select("*").eq("user_id", effectiveUserId),
      supabaseAdmin!.from("job_roles").select("*").eq("id", jobRoleId).maybeSingle()
    ]);
    if (roleErr || !roleData) {
      return apiError(res, 404, "NOT_FOUND", "Job role not found");
    }
    userSkillsFull = (skillsRows || []).map((row: any) => ({
      skillName: row.skill_name,
      proficiencyLevel: row.proficiency === "Advanced" ? 1 : row.proficiency === "Intermediate" ? 0.7 : 0.3
    }));
    const requiredSkills = roleData.required_skills || [];
    const domain = roleData.domain;
    
    const analysis = analyzeGaps(userSkillsFull, requiredSkills, domain);
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
    const roleRows = JOB_ROLES.map((role: any) => ({
      role_name: role.jobRole,
      required_skills: role.requiredSkills || [],
      domain: role.domain || "Full Stack",
      difficulty: "Intermediate"
    }));
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

const adminRoleSchema = z.object({
  title: z.string().min(2),
  requiredSkills: z.array(z.string()).default([])
});

app.post("/api/admin/roles", requireAuth, requireAdmin, async (req, res) => {
  try {
    const parsed = adminRoleSchema.safeParse(req.body);
    if (!parsed.success) {
      return apiError(res, 400, "VALIDATION_ERROR", "Invalid role payload", parsed.error.flatten());
    }
    const { title, requiredSkills } = parsed.data;
    const { data, error } = await supabaseAdmin!.from("job_roles").insert({
      role_name: title,
      required_skills: requiredSkills || [],
      domain: "Custom",
      difficulty: "Intermediate"
    }).select("id").single();
    if (error) throw error;
    auditLog("admin.role.created", { actor: (req as AuthedRequest).authUser?.id, roleId: data.id, title });
    res.json({ id: data.id });
  } catch (error: any) {
    apiError(res, 500, "SERVER_ERROR", "Failed to add role", error.message);
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
