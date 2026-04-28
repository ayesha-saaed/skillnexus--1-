import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import { fileURLToPath } from "url";
import admin from "firebase-admin";
import natural from "natural";
import dotenv from "dotenv";
import fs from "fs";
import axios from "axios";
import { MASTER_SKILLS, SYNONYMS, JOB_ROLES, INDUSTRY_DEMAND, LEARNING_RESOURCES } from "./src/lib/knowledge_base";
import { SKILLS_DATA, INDUSTRY_DEMAND_HISTORICAL, CURATED_RESOURCES } from "./src/lib/data_seeder";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Initialize Firebase Admin SDK
const firebaseConfigPath = path.join(__dirname, "firebase-applet-config.json");
const firebaseConfig = JSON.parse(fs.readFileSync(firebaseConfigPath, "utf-8"));

if (!admin.apps?.length) {
  admin.initializeApp({
    projectId: firebaseConfig.projectId,
    databaseURL: `https://${firebaseConfig.projectId}.firebaseio.com`
  });
}

const db = admin.firestore();
if (firebaseConfig.firestoreDatabaseId && firebaseConfig.firestoreDatabaseId !== '(default)') {
  // Note: Admin SDK usually uses the default database unless specified differently in the client config
  // In many setups, the databaseId from client config is what and Admin needs
}

const app = express();
const PORT = 3000;

app.use(express.json());

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
  const { code, error, error_description } = req.query;

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

    // Ensure user doc exists in Firestore
    const userDocRef = db.collection("users").doc(uid);
    const userDoc = await userDocRef.get();
    if (!userDoc.exists) {
      await userDocRef.set({
        name: linkedinUser.name,
        email: email,
        role: "student",
        points: 0,
        level: 1,
        badges: [],
        createdAt: new Date().toISOString(),
        provider: "linkedin"
      });
    }

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

app.post("/api/analyze", async (req, res) => {
  try {
    const { userId, jobRoleId, userSkills: providedSkills } = req.body;
    
    let userSkillsFull = [];
    
    try {
      const skillsSnap = await db.collection("users").doc(userId).collection("skills").get();
      userSkillsFull = skillsSnap.docs.map(doc => doc.data());
    } catch (err) {
      userSkillsFull = (providedSkills || []).map((s: any) => 
        typeof s === 'string' ? { skillName: s, proficiencyLevel: 0.5 } : s
      );
    }
    
    const jobRoleDoc = await db.collection("jobRoles").doc(jobRoleId).get();
    if (!jobRoleDoc.exists) {
      return res.status(404).json({ error: "Job role not found" });
    }
    const roleData = jobRoleDoc.data();
    const requiredSkills = roleData?.requiredSkills || [];
    const domain = roleData?.domain;
    
    const analysis = analyzeGaps(userSkillsFull, requiredSkills, domain);
    res.json(analysis);
  } catch (error: any) {
    console.error("Analysis error:", error);
    res.status(500).json({ error: "Analysis failed", details: error.message });
  }
});

app.get("/api/industry-trends", async (req, res) => {
  try {
    const trendsSnapshot = await db.collection("trends").get();
    const trends = trendsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    res.json(trends);
  } catch (error: any) {
    res.status(500).json({ error: "Failed to fetch trends", details: error.message });
  }
});

app.post("/api/admin/seed", async (req, res) => {
  try {
    console.log("Seeding high-fidelity datasets...");
    
    // 1. Master Skills (200+)
    const skillsRef = db.collection("skills");
    const skillsSnap = await skillsRef.limit(1).get();
    if (skillsSnap.empty) {
      console.log("Seeding 200+ Master Skills...");
      for (const skill of SKILLS_DATA) {
        await skillsRef.add({
          ...skill,
          createdAt: new Date().toISOString()
        });
      }
    }

    // 2. Industry Demand (Historical)
    const demandRef = db.collection("industryDemand");
    const demandSnap = await demandRef.limit(1).get();
    if (demandSnap.empty) {
      console.log("Seeding Historical Industry Demand...");
      for (const demand of INDUSTRY_DEMAND_HISTORICAL) {
        await demandRef.add(demand);
      }
    }

    // 3. Learning Resources (Enhanced) - Update: Upsert curated ones to ensure user provided ones are present
    const resourcesRef = db.collection("resources");
    console.log("Upserting Curated Resources...");
    
    // Get existing to find documents to update
    const existingRes = await resourcesRef.get();
    const existingMap = new Map<string, string>(); // url -> docId
    existingRes.docs.forEach(d => existingMap.set(d.data().url, d.id));

    for (const resItem of CURATED_RESOURCES) {
      const docId = existingMap.get(resItem.url);
      if (docId) {
        // Update existing to ensure latest domain/skills are reflected
        await resourcesRef.doc(docId).update({
          ...resItem,
          updatedAt: new Date().toISOString()
        });
      } else {
        // Add new
        await resourcesRef.add({
          ...resItem,
          createdAt: new Date().toISOString()
        });
      }
    }

    // Optional: Also check original knowledge base
    for (const resItem of LEARNING_RESOURCES as any[]) {
      if (!existingMap.has(resItem.url)) {
        await resourcesRef.add({
          ...resItem,
          createdAt: new Date().toISOString()
        });
      }
    }

    // 4. Job Roles
    const jobRolesRef = db.collection("jobRoles");
    const rolesSnap = await jobRolesRef.limit(1).get();
    if (rolesSnap.empty) {
      for (const role of JOB_ROLES) {
        await jobRolesRef.add({
          title: role.jobRole,
          requiredSkills: role.requiredSkills,
          domain: role.domain,
          description: `Strategic industry roadmap for ${role.jobRole}.`
        });
      }
    }

    res.json({ message: "SkillNexus Intelligence Core Seeding Complete" });
  } catch (error: any) {
    console.error("Deep Seeding Failed:", error);
    res.status(500).json({ error: "Seeding failed", details: error.message });
  }
});

app.post("/api/admin/roles", async (req, res) => {
  try {
    const { title, requiredSkills } = req.body;
    const docRef = await db.collection("jobRoles").add({ 
      title, 
      requiredSkills, 
      description: "Custom specialization." 
    });
    res.json({ id: docRef.id });
  } catch (error: any) {
    res.status(500).json({ error: "Failed to add role", details: error.message });
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
