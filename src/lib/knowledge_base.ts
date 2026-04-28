/**
 * SkillNexus Master Knowledge Base
 * Structured datasets for NLP-based skill gap analysis and demand tracking.
 */

export const MASTER_SKILLS = [
  // --- FRONTEND ---
  { name: "JavaScript", category: "Frontend", subCategory: "Language", industryWeight: 0.95, trendScore: 0.9, description: "High-level, interpreted scripting language.", tags: ["web", "core", "dynamic"] },
  { name: "React", category: "Frontend", subCategory: "Library", industryWeight: 0.98, trendScore: 0.95, description: "UI library for components.", tags: ["facebook", "components", "vdom"] },
  { name: "TypeScript", category: "Frontend", subCategory: "Language", industryWeight: 0.92, trendScore: 0.98, description: "Typed superset of JavaScript.", tags: ["typed", "microsoft", "scalable"] },
  { name: "Next.js", category: "Frontend", subCategory: "Framework", industryWeight: 0.88, trendScore: 0.96, description: "React framework for production.", tags: ["ssr", "ssg", "vercel"] },
  { name: "Tailwind CSS", category: "Frontend", subCategory: "Styling", industryWeight: 0.85, trendScore: 0.94, description: "Utility-first CSS framework.", tags: ["css", "utility", "design"] },
  { name: "Vue.js", category: "Frontend", subCategory: "Framework", industryWeight: 0.75, trendScore: 0.7, description: "Progressive JS framework.", tags: ["reactive", "templates"] },
  { name: "Angular", category: "Frontend", subCategory: "Framework", industryWeight: 0.8, trendScore: 0.65, description: "Enterprise-grade platform.", tags: ["google", "typescript", "mvc"] },
  { name: "Svelte", category: "Frontend", subCategory: "Framework", industryWeight: 0.4, trendScore: 0.85, description: "Compiler for UI components.", tags: ["reactive", "compiler"] },
  { name: "Redux", category: "Frontend", subCategory: "State Management", industryWeight: 0.82, trendScore: 0.6, description: "Predictable state container.", tags: ["state", "flux"] },
  { name: "WebAssembly", category: "Frontend", subCategory: "Core", industryWeight: 0.45, trendScore: 0.88, description: "Binary instruction format for web.", tags: ["wasm", "performance"] },
  { name: "Three.js", category: "Frontend", subCategory: "Graphics", industryWeight: 0.35, trendScore: 0.82, description: "3D library for browsers.", tags: ["webgl", "3d"] },
  { name: "Vite", category: "Frontend", subCategory: "Build Tools", industryWeight: 0.78, trendScore: 0.95, description: "Next generation frontend tooling.", tags: ["fast", "esm"] },
  { name: "GraphQL", category: "Frontend", subCategory: "API", industryWeight: 0.72, trendScore: 0.75, description: "Query language for APIs.", tags: ["query", "apollo"] },
  { name: "Storybook", category: "Frontend", subCategory: "Testing", industryWeight: 0.65, trendScore: 0.8, description: "Tool for building UI components in isolation.", tags: ["ui", "documentation"] },
  { name: "Playwright", category: "Frontend", subCategory: "Testing", industryWeight: 0.6, trendScore: 0.9, description: "Reliable end-to-end testing.", tags: ["e2e", "microsoft"] },

  // --- BACKEND ---
  { name: "Node.js", category: "Backend", subCategory: "Runtime", industryWeight: 0.92, trendScore: 0.88, description: "JavaScript runtime built on V8.", tags: ["server", "v8", "asynchronous"] },
  { name: "Express.js", category: "Backend", subCategory: "Framework", industryWeight: 0.88, trendScore: 0.75, description: "Minimalist web framework for Node.", tags: ["middleware", "api"] },
  { name: "NestJS", category: "Backend", subCategory: "Framework", industryWeight: 0.7, trendScore: 0.92, description: "Scalable Node.js framework.", tags: ["typescript", "modular"] },
  { name: "Python", category: "Backend", subCategory: "Language", industryWeight: 0.96, trendScore: 0.98, description: "General-purpose programming language.", tags: ["versatile", "science", "ai"] },
  { name: "Django", category: "Backend", subCategory: "Framework", industryWeight: 0.82, trendScore: 0.7, description: "High-level Python web framework.", tags: ["orm", "django"] },
  { name: "FastAPI", category: "Backend", subCategory: "Framework", industryWeight: 0.65, trendScore: 0.95, description: "Modern, fast web framework for Python.", tags: ["async", "pydantic"] },
  { name: "Go", category: "Backend", subCategory: "Language", industryWeight: 0.85, trendScore: 0.9, description: "Statically typed language by Google.", tags: ["google", "concurrency"] },
  { name: "PostgreSQL", category: "Backend", subCategory: "Database", industryWeight: 0.9, trendScore: 0.95, description: "Powerful open-source relational database.", tags: ["sql", "relational", "acid"] },
  { name: "Prisma", category: "Backend", subCategory: "ORM", industryWeight: 0.68, trendScore: 0.92, description: "Next-generation Node.js and TypeScript ORM.", tags: ["database", "typesafe"] },
  { name: "Redis", category: "Backend", subCategory: "Caching", industryWeight: 0.85, trendScore: 0.88, description: "In-memory data structure store.", tags: ["cache", "pubsub"] },
  { name: "Apache Kafka", category: "Backend", subCategory: "Messaging", industryWeight: 0.78, trendScore: 0.85, description: "Distributed event streaming platform.", tags: ["streaming", "bigdata"] },
  { name: "gRPC", category: "Backend", subCategory: "Communication", industryWeight: 0.62, trendScore: 0.82, description: "High performance RPC framework.", tags: ["protocol", "buffers"] },
  { name: "Socket.io", category: "Backend", subCategory: "Real-time", industryWeight: 0.7, trendScore: 0.6, description: "Bidirectional event-based communication.", tags: ["websockets"] },
  { name: "Rust", category: "Backend", subCategory: "Language", industryWeight: 0.55, trendScore: 0.98, description: "Safe and fast systems language.", tags: ["performance", "safety"] },
  { name: "Elasticsearch", category: "Backend", subCategory: "Search", industryWeight: 0.75, trendScore: 0.7, description: "Distributed search and analytics engine.", tags: ["search", "elk"] },

  // --- DATA SCIENCE / AI ---
  { name: "PyTorch", category: "Data Science", subCategory: "Machine Learning", industryWeight: 0.88, trendScore: 0.98, description: "Deep learning framework by Meta.", tags: ["ml", "ai", "tensors"] },
  { name: "TensorFlow", category: "AI", subCategory: "Machine Learning", industryWeight: 0.9, trendScore: 0.85, description: "End-to-end open source machine learning platform.", tags: ["google", "keras"] },
  { name: "Scikit-Learn", category: "Data Science", subCategory: "Machine Learning", industryWeight: 0.92, trendScore: 0.8, description: "Simple tools for predictive data analysis.", tags: ["python", "regression"] },
  { name: "Pandas", category: "Data Science", subCategory: "Data Analysis", industryWeight: 0.95, trendScore: 0.85, description: "Fast, powerful, and easy to use data analysis tool.", tags: ["dataframes", "cleaning"] },
  { name: "NumPy", category: "Data Science", subCategory: "Core", industryWeight: 0.98, trendScore: 0.85, description: "Fundamental package for scientific computing with Python.", tags: ["math", "python"] },
  { name: "LangChain", category: "AI", subCategory: "LLM", industryWeight: 0.45, trendScore: 0.99, description: "Framework for building LLM applications.", tags: ["agents", "chains"] },
  { name: "Hugging Face", category: "AI", subCategory: "LLM", industryWeight: 0.5, trendScore: 0.98, description: "Open source community for ML models.", tags: ["transformers", "models"] },
  { name: "MLflow", category: "Data Science", subCategory: "MLOps", industryWeight: 0.55, trendScore: 0.9, description: "Platform for the machine learning lifecycle.", tags: ["tracking", "registry"] },
  { name: "Apache Spark", category: "Data Science", subCategory: "Big Data", industryWeight: 0.8, trendScore: 0.75, description: "Unified analytics engine for large-scale data processing.", tags: ["batch", "realtime"] },
  { name: "Fine Tuning", category: "AI", subCategory: "Training", industryWeight: 0.4, trendScore: 0.95, description: "Technique for adapting pre-trained models to specific tasks.", tags: ["customization", "transfer"] },
];

export const SYNONYMS = [
  { skill: "JavaScript", synonyms: ["JS", "EcmaScript", "Vanilla JS"], category: "Frontend" },
  { skill: "React", synonyms: ["React.js", "ReactJS", "React Components"], category: "Frontend" },
  { skill: "Node.js", synonyms: ["Node", "NodeJS", "Server JS"], category: "Backend" },
  { skill: "PostgreSQL", synonyms: ["Postgres", "PGSQL", "Postgresql database"], category: "Backend" },
  { skill: "TypeScript", synonyms: ["TS", "Strict JS"], category: "Frontend" },
  { skill: "Machine Learning", synonyms: ["ML", "Statistical Learning"], category: "AI" },
  { skill: "Deep Learning", synonyms: ["Neural Networks", "DNN"], category: "AI" },
  { skill: "Amazon Web Services", synonyms: ["AWS", "Amazon Cloud"], category: "Cloud" },
  { skill: "Google Cloud Platform", synonyms: ["GCP", "Google Cloud"], category: "Cloud" },
  { skill: "Microsoft Azure", synonyms: ["Azure"], category: "Cloud" },
  { skill: "Docker", synonyms: ["Containerization", "Container Engine"], category: "DevOps" },
  { skill: "Kubernetes", synonyms: ["K8s", "Container Orchestration"], category: "DevOps" },
  { skill: "Authentication", synonyms: ["Auth", "IAM", "Identity Management", "Login Systems"], category: "Core" },
  { skill: "CI/CD", synonyms: ["Continuous Integration", "Pipelines", "GitHub Actions"], category: "DevOps" },
  { skill: "SQL", synonyms: ["Structured Query Language", "Relational Database Querying"], category: "Core" },
];

export const JOB_ROLES = [
  {
    jobRole: "Senior Frontend Engineer",
    domain: "Frontend",
    requiredSkills: [
      { name: "React", importance: 0.95, requiredProficiency: 0.9 },
      { name: "TypeScript", importance: 0.9, requiredProficiency: 0.8 },
      { name: "Next.js", importance: 0.85, requiredProficiency: 0.75 },
      { name: "JavaScript", importance: 1.0, requiredProficiency: 0.95 },
      { name: "Tailwind CSS", importance: 0.8, requiredProficiency: 0.8 },
      { name: "Storybook", importance: 0.6, requiredProficiency: 0.6 },
    ]
  },
  {
    jobRole: "Full Stack Developer",
    domain: "Full Stack",
    requiredSkills: [
      { name: "React", importance: 0.9, requiredProficiency: 0.8 },
      { name: "Node.js", importance: 0.9, requiredProficiency: 0.8 },
      { name: "PostgreSQL", importance: 0.85, requiredProficiency: 0.7 },
      { name: "TypeScript", importance: 0.8, requiredProficiency: 0.75 },
      { name: "Docker", importance: 0.7, requiredProficiency: 0.6 },
      { name: "JavaScript", importance: 1.0, requiredProficiency: 0.9 },
    ]
  },
  {
    jobRole: "AI Research Scientist",
    domain: "AI",
    requiredSkills: [
      { name: "Python", importance: 1.0, requiredProficiency: 0.95 },
      { name: "PyTorch", importance: 0.95, requiredProficiency: 0.9 },
      { name: "NumPy", importance: 0.9, requiredProficiency: 0.85 },
      { name: "TensorFlow", importance: 0.8, requiredProficiency: 0.8 },
      { name: "Fine Tuning", importance: 0.85, requiredProficiency: 0.8 },
      { name: "LangChain", importance: 0.75, requiredProficiency: 0.7 },
    ]
  }
];

export const INDUSTRY_DEMAND = [
  { skill: "AI Agents", demandScore: 98, growthRate: 150.2, year: 2026 },
  { skill: "LangChain", demandScore: 92, growthRate: 85.5, year: 2026 },
  { skill: "React", demandScore: 95, growthRate: 12.4, year: 2026 },
  { skill: "TypeScript", demandScore: 94, growthRate: 22.1, year: 2026 },
  { skill: "Python", demandScore: 97, growthRate: 18.2, year: 2026 },
  { skill: "Rust", demandScore: 65, growthRate: 45.8, year: 2026 },
  { skill: "Kubernetes", demandScore: 89, growthRate: 15.3, year: 2026 },
  { skill: "Next.js", demandScore: 91, growthRate: 35.6, year: 2026 },
];

export const LEARNING_RESOURCES = [
  { title: "The Joy of React", type: "Course", platform: "Josh W Comeau", skillsCovered: ["React", "JavaScript"], difficulty: "Intermediate", duration: "40h", rating: 4.9, domain: "Frontend" },
  { title: "TypeScript for Pro Developers", type: "Article", platform: "TypeScript Org", skillsCovered: ["TypeScript"], difficulty: "Intermediate", duration: "2h", rating: 4.8, domain: "Frontend" },
  { title: "Deep Learning Specialization", type: "Course", platform: "Coursera", skillsCovered: ["PyTorch", "Python", "Neural Networks"], difficulty: "Advanced", duration: "120h", rating: 4.9, domain: "AI / Machine Learning" },
  { title: "Node.js Design Patterns", type: "Book", platform: "Packt", skillsCovered: ["Node.js", "JavaScript"], difficulty: "Advanced", duration: "25h", rating: 4.7, domain: "Backend" },
  { title: "LangChain Crash Course", type: "Video", platform: "YouTube", skillsCovered: ["LangChain", "AI"], difficulty: "Beginner", duration: "3h", rating: 4.5, domain: "AI / Machine Learning" },
];
