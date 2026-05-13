-- ================================================
-- Skill Nexus: Comprehensive Job Roles Seed
-- Run this in Supabase SQL Editor
-- ================================================

-- ================================================
-- 1. CREATE DOMAINS TABLE (if not exists)
-- ================================================
CREATE TABLE IF NOT EXISTS public.domains (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  description TEXT,
  icon TEXT DEFAULT 'code',
  color TEXT DEFAULT '#3b82f6',
  category TEXT DEFAULT 'General',
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ================================================
-- 2. CREATE SKILLS TABLE (if not exists)
-- ================================================
CREATE TABLE IF NOT EXISTS public.skills (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  description TEXT,
  domain_id UUID REFERENCES public.domains(id) ON DELETE SET NULL,
  difficulty TEXT DEFAULT 'Intermediate',
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ================================================
-- 3. CREATE JOB_ROLE_SKILLS JUNCTION TABLE
-- ================================================
CREATE TABLE IF NOT EXISTS public.job_role_skills (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  job_role_id UUID REFERENCES public.job_roles(id) ON DELETE CASCADE,
  skill_id UUID REFERENCES public.skills(id) ON DELETE CASCADE,
  is_core BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(job_role_id, skill_id)
);

-- ================================================
-- 4. SEED DOMAINS
-- ================================================
INSERT INTO public.domains (name, description, icon, color, category) VALUES
  ('Web Development', 'Frontend and backend web development technologies', 'code', '#3b82f6', 'Development'),
  ('AI/Data Science', 'Artificial Intelligence, Machine Learning, and Data Analysis', 'brain', '#8b5cf6', 'AI/ML'),
  ('Cybersecurity', 'Security analysis, ethical hacking, and information protection', 'shield', '#ef4444', 'Security'),
  ('Cloud/DevOps', 'Cloud platforms, CI/CD, containers, and infrastructure', 'cloud', '#10b981', 'Infrastructure'),
  ('Mobile Development', 'iOS, Android, and cross-platform mobile apps', 'smartphone', '#f59e0b', 'Development'),
  ('UI/UX Design', 'User interface, user experience, and product design', 'palette', '#ec4899', 'Design'),
  ('Database', 'SQL, NoSQL, data warehousing, and data engineering', 'database', '#6366f1', 'Development'),
  ('Quality Assurance', 'Testing, QA automation, and software quality', 'check-circle', '#14b8a6', 'Testing'),
  ('Game Development', 'Game design, Unity, Unreal Engine, and graphics', 'gamepad', '#22c55e', 'Development'),
  ('Blockchain/Web3', 'Cryptocurrency, smart contracts, and decentralized apps', 'link', '#f97316', 'Emerging'),
  ('AR/VR/XR', 'Augmented, Virtual, and Mixed Reality development', 'eye', '#a855f7', 'Emerging'),
  ('IoT/Robotics', 'Internet of Things and Robotics Engineering', 'cpu', '#06b6d4', 'Emerging'),
  ('Product Management', 'Product strategy, roadmaps, and agile methodologies', 'briefcase', '#64748b', 'Management'),
  ('Business Analysis', 'Business intelligence, ERP, and system analysis', 'bar-chart', '#78716c', 'Business'),
  ('Networking', 'Network administration, architecture, and telecom', 'wifi', '#0ea5e9', 'Infrastructure'),
  ('Research', 'Scientific research, quantum computing, and academia', 'flask', '#c084fc', 'Research'),
  ('Emerging Technologies', 'AI Ethics, Digital Transformation, and Future Tech', 'sparkles', '#f43f5e', 'Emerging')
ON CONFLICT (name) DO NOTHING;

-- ================================================
-- 5. SEED SKILLS BY DOMAIN
-- ================================================

-- Web Development Skills
INSERT INTO public.skills (name, description, domain_id, difficulty) 
SELECT name, description, id, difficulty FROM (
  VALUES
    ('HTML', 'HyperText Markup Language - Web page structure', 'Web Development', 'Beginner'),
    ('CSS', 'Cascading Style Sheets - Web styling', 'Web Development', 'Beginner'),
    ('JavaScript', 'Core JavaScript programming language', 'Web Development', 'Beginner'),
    ('TypeScript', 'Type-safe JavaScript superset', 'Web Development', 'Intermediate'),
    ('React', 'React.js frontend library', 'Web Development', 'Intermediate'),
    ('Vue.js', 'Progressive JavaScript framework', 'Web Development', 'Intermediate'),
    ('Angular', 'Full-featured TypeScript framework', 'Web Development', 'Intermediate'),
    ('Next.js', 'React meta-framework for production', 'Web Development', 'Intermediate'),
    ('Node.js', 'Server-side JavaScript runtime', 'Web Development', 'Intermediate'),
    ('Express.js', 'Minimal Node.js web framework', 'Web Development', 'Intermediate'),
    ('REST APIs', 'RESTful API design and development', 'Web Development', 'Intermediate'),
    ('GraphQL', 'Query language for APIs', 'Web Development', 'Intermediate'),
    ('Tailwind CSS', 'Utility-first CSS framework', 'Web Development', 'Beginner'),
    ('SASS/SCSS', 'CSS preprocessor', 'Web Development', 'Intermediate'),
    ('Webpack', 'Module bundler', 'Web Development', 'Advanced'),
    ('Vite', 'Next-generation build tool', 'Web Development', 'Intermediate'),
    ('Git', 'Version control system', 'Web Development', 'Beginner'),
    ('Responsive Design', 'Mobile-first responsive layouts', 'Web Development', 'Beginner'),
    ('Web Accessibility', 'WCAG accessibility standards', 'Web Development', 'Intermediate'),
    ('WordPress', 'CMS for website building', 'Web Development', 'Beginner'),
    ('Shopify', 'E-commerce platform development', 'Web Development', 'Intermediate'),
    ('Django', 'Python web framework', 'Web Development', 'Intermediate'),
    ('Flask', 'Lightweight Python web framework', 'Web Development', 'Intermediate'),
    ('Ruby on Rails', 'Ruby full-stack framework', 'Web Development', 'Intermediate'),
    ('Spring Boot', 'Java enterprise framework', 'Web Development', 'Intermediate'),
    ('PHP', 'Server-side scripting language', 'Web Development', 'Beginner'),
    ('Laravel', 'PHP framework', 'Web Development', 'Intermediate')
) AS t(name, description, domain_name, difficulty)
JOIN public.domains d ON d.name = domain_name
ON CONFLICT (name) DO NOTHING;

-- AI/ML Skills
INSERT INTO public.skills (name, description, domain_id, difficulty) 
SELECT name, description, id, difficulty FROM (
  VALUES
    ('Python', 'Python programming language', 'AI/Data Science', 'Beginner'),
    ('Machine Learning', 'ML algorithms and fundamentals', 'AI/Data Science', 'Intermediate'),
    ('Deep Learning', 'Neural networks and deep architectures', 'AI/Data Science', 'Advanced'),
    ('TensorFlow', 'Google ML framework', 'AI/Data Science', 'Advanced'),
    ('PyTorch', 'Facebook ML framework', 'AI/Data Science', 'Advanced'),
    ('NumPy', 'Python numerical computing', 'AI/Data Science', 'Intermediate'),
    ('Pandas', 'Python data analysis', 'AI/Data Science', 'Intermediate'),
    ('Scikit-learn', 'Python ML library', 'AI/Data Science', 'Intermediate'),
    ('NLP', 'Natural Language Processing', 'AI/Data Science', 'Advanced'),
    ('Computer Vision', 'Image and video analysis', 'AI/Data Science', 'Advanced'),
    ('Prompt Engineering', 'AI prompt design and optimization', 'AI/Data Science', 'Intermediate'),
    ('Generative AI', 'AI content generation systems', 'AI/Data Science', 'Advanced'),
    ('LLMs', 'Large Language Models', 'AI/Data Science', 'Advanced'),
    ('LangChain', 'LLM application framework', 'AI/Data Science', 'Advanced'),
    ('Hugging Face', 'NLP and ML tools platform', 'AI/Data Science', 'Advanced'),
    ('R', 'Statistical computing language', 'AI/Data Science', 'Intermediate'),
    ('Statistics', 'Statistical analysis methods', 'AI/Data Science', 'Intermediate'),
    ('Linear Algebra', 'Math for ML', 'AI/Data Science', 'Advanced'),
    ('Data Visualization', 'Data presentation with charts', 'AI/Data Science', 'Intermediate'),
    ('MLOps', 'ML operations and deployment', 'AI/Data Science', 'Advanced'),
    ('Keras', 'High-level neural networks API', 'AI/Data Science', 'Intermediate'),
    ('OpenCV', 'Computer vision library', 'AI/Data Science', 'Advanced'),
    ('spaCy', 'NLP library for Python', 'AI/Data Science', 'Intermediate'),
    ('Transformers', 'Attention mechanisms and transformers', 'AI/Data Science', 'Advanced'),
    ('AI Ethics', 'Responsible AI development', 'AI/Data Science', 'Intermediate')
) AS t(name, description, domain_name, difficulty)
JOIN public.domains d ON d.name = domain_name
ON CONFLICT (name) DO NOTHING;

-- Cybersecurity Skills
INSERT INTO public.skills (name, description, domain_id, difficulty) 
SELECT name, description, id, difficulty FROM (
  VALUES
    ('Network Security', 'Securing network infrastructure', 'Cybersecurity', 'Intermediate'),
    ('Penetration Testing', 'Ethical hacking and vulnerability assessment', 'Cybersecurity', 'Advanced'),
    ('Ethical Hacking', 'Authorized security testing', 'Cybersecurity', 'Advanced'),
    ('SIEM', 'Security Information and Event Management', 'Cybersecurity', 'Advanced'),
    ('Incident Response', 'Security incident handling', 'Cybersecurity', 'Advanced'),
    ('Digital Forensics', 'Digital evidence investigation', 'Cybersecurity', 'Advanced'),
    ('Malware Analysis', 'Analyzing malicious software', 'Cybersecurity', 'Advanced'),
    ('Cloud Security', 'Securing cloud environments', 'Cybersecurity', 'Advanced'),
    ('Firewalls', 'Network security appliances', 'Cybersecurity', 'Intermediate'),
    ('Cryptography', 'Encryption and security protocols', 'Cybersecurity', 'Advanced'),
    ('Vulnerability Assessment', 'Finding system weaknesses', 'Cybersecurity', 'Intermediate'),
    ('Security Auditing', 'Security compliance checking', 'Cybersecurity', 'Intermediate'),
    ('Identity Management', 'IAM and access control', 'Cybersecurity', 'Intermediate'),
    ('Zero Trust', 'Zero trust security model', 'Cybersecurity', 'Advanced'),
    ('SOC Operations', 'Security Operations Center work', 'Cybersecurity', 'Intermediate'),
    ('Threat Intelligence', 'Analyzing security threats', 'Cybersecurity', 'Advanced'),
    ('OWASP', 'Web application security', 'Cybersecurity', 'Intermediate')
) AS t(name, description, domain_name, difficulty)
JOIN public.domains d ON d.name = domain_name
ON CONFLICT (name) DO NOTHING;

-- Cloud/DevOps Skills
INSERT INTO public.skills (name, description, domain_id, difficulty) 
SELECT name, description, id, difficulty FROM (
  VALUES
    ('AWS', 'Amazon Web Services', 'Cloud/DevOps', 'Intermediate'),
    ('Azure', 'Microsoft Azure cloud platform', 'Cloud/DevOps', 'Intermediate'),
    ('Google Cloud', 'GCP cloud platform', 'Cloud/DevOps', 'Intermediate'),
    ('Docker', 'Containerization platform', 'Cloud/DevOps', 'Intermediate'),
    ('Kubernetes', 'Container orchestration', 'Cloud/DevOps', 'Advanced'),
    ('CI/CD', 'Continuous Integration/Deployment', 'Cloud/DevOps', 'Intermediate'),
    ('Jenkins', 'CI/CD automation server', 'Cloud/DevOps', 'Intermediate'),
    ('Terraform', 'Infrastructure as Code', 'Cloud/DevOps', 'Advanced'),
    ('Ansible', 'Configuration management', 'Cloud/DevOps', 'Intermediate'),
    ('Linux', 'Linux system administration', 'Cloud/DevOps', 'Intermediate'),
    ('Shell Scripting', 'Bash and shell programming', 'Cloud/DevOps', 'Intermediate'),
    ('GitHub Actions', 'CI/CD on GitHub', 'Cloud/DevOps', 'Intermediate'),
    ('GitLab CI', 'GitLab continuous integration', 'Cloud/DevOps', 'Intermediate'),
    ('Prometheus', 'Monitoring and alerting', 'Cloud/DevOps', 'Advanced'),
    ('Grafana', 'Metrics visualization', 'Cloud/DevOps', 'Intermediate'),
    ('Helm', 'Kubernetes package manager', 'Cloud/DevOps', 'Advanced'),
    ('Istio', 'Service mesh for Kubernetes', 'Cloud/DevOps', 'Advanced'),
    ('Platform Engineering', 'Internal developer platforms', 'Cloud/DevOps', 'Advanced'),
    ('Site Reliability Engineering', 'SRE practices and tools', 'Cloud/DevOps', 'Advanced'),
    ('Cloud Architecture', 'Designing cloud solutions', 'Cloud/DevOps', 'Advanced')
) AS t(name, description, domain_name, difficulty)
JOIN public.domains d ON d.name = domain_name
ON CONFLICT (name) DO NOTHING;

-- Mobile Development Skills
INSERT INTO public.skills (name, description, domain_id, difficulty) 
SELECT name, description, id, difficulty FROM (
  VALUES
    ('React Native', 'Cross-platform mobile framework', 'Mobile Development', 'Intermediate'),
    ('Flutter', 'Google cross-platform UI toolkit', 'Mobile Development', 'Intermediate'),
    ('Swift', 'iOS development language', 'Mobile Development', 'Intermediate'),
    ('Objective-C', 'Legacy iOS language', 'Mobile Development', 'Beginner'),
    ('Kotlin', 'Android development language', 'Mobile Development', 'Intermediate'),
    ('Java', 'Android development language', 'Mobile Development', 'Intermediate'),
    ('Xcode', 'Apple IDE', 'Mobile Development', 'Intermediate'),
    ('Android Studio', 'Android IDE', 'Mobile Development', 'Beginner'),
    ('iOS Development', 'Native iOS app development', 'Mobile Development', 'Intermediate'),
    ('Android Development', 'Native Android app development', 'Mobile Development', 'Intermediate'),
    ('Mobile UI Design', 'Mobile-specific design patterns', 'Mobile Development', 'Intermediate'),
    ('App Store Optimization', 'ASO techniques', 'Mobile Development', 'Beginner'),
    ('Firebase', 'Google mobile backend', 'Mobile Development', 'Intermediate'),
    ('Push Notifications', 'Mobile push messaging', 'Mobile Development', 'Intermediate')
) AS t(name, description, domain_name, difficulty)
JOIN public.domains d ON d.name = domain_name
ON CONFLICT (name) DO NOTHING;

-- UI/UX Design Skills
INSERT INTO public.skills (name, description, domain_id, difficulty) 
SELECT name, description, id, difficulty FROM (
  VALUES
    ('Figma', 'Collaborative design tool', 'UI/UX Design', 'Beginner'),
    ('Adobe XD', 'UX design software', 'UI/UX Design', 'Beginner'),
    ('Sketch', 'Mac design tool', 'UI/UX Design', 'Beginner'),
    ('UI Design', 'User interface aesthetics', 'UI/UX Design', 'Intermediate'),
    ('UX Design', 'User experience research', 'UI/UX Design', 'Intermediate'),
    ('Prototyping', 'Interactive mockups', 'UI/UX Design', 'Intermediate'),
    ('User Research', 'Understanding user needs', 'UI/UX Design', 'Intermediate'),
    ('Wireframing', 'Low-fidelity design layouts', 'UI/UX Design', 'Beginner'),
    ('Design Systems', 'Component libraries', 'UI/UX Design', 'Advanced'),
    ('Typography', 'Font and text design', 'UI/UX Design', 'Intermediate'),
    ('Color Theory', 'Color in design', 'UI/UX Design', 'Beginner'),
    ('Motion Design', 'Animation in interfaces', 'UI/UX Design', 'Intermediate'),
    ('Interaction Design', 'Designing interactions', 'UI/UX Design', 'Intermediate'),
    ('Adobe Illustrator', 'Vector graphics', 'UI/UX Design', 'Intermediate'),
    ('Photoshop', 'Image editing', 'UI/UX Design', 'Beginner'),
    ('Design Thinking', 'Problem-solving methodology', 'UI/UX Design', 'Intermediate')
) AS t(name, description, domain_name, difficulty)
JOIN public.domains d ON d.name = domain_name
ON CONFLICT (name) DO NOTHING;

-- Database Skills
INSERT INTO public.skills (name, description, domain_id, difficulty) 
SELECT name, description, id, difficulty FROM (
  VALUES
    ('SQL', 'Structured Query Language', 'Database', 'Beginner'),
    ('PostgreSQL', 'Advanced open-source RDBMS', 'Database', 'Intermediate'),
    ('MySQL', 'Popular open-source database', 'Database', 'Beginner'),
    ('MongoDB', 'NoSQL document database', 'Database', 'Intermediate'),
    ('Redis', 'In-memory data store', 'Database', 'Intermediate'),
    ('Elasticsearch', 'Search and analytics engine', 'Database', 'Advanced'),
    ('Data Warehousing', 'Enterprise data storage', 'Database', 'Advanced'),
    ('ETL', 'Extract Transform Load', 'Database', 'Advanced'),
    ('Database Design', 'Schema design and normalization', 'Database', 'Intermediate'),
    ('NoSQL', 'Non-relational databases', 'Database', 'Intermediate'),
    ('Apache Kafka', 'Event streaming platform', 'Database', 'Advanced'),
    ('SQLite', 'Embedded database', 'Database', 'Beginner'),
    ('Oracle', 'Enterprise database', 'Database', 'Advanced'),
    ('SQL Server', 'Microsoft database', 'Database', 'Intermediate'),
    ('Database Administration', 'DBA operations', 'Database', 'Advanced')
) AS t(name, description, domain_name, difficulty)
JOIN public.domains d ON d.name = domain_name
ON CONFLICT (name) DO NOTHING;

-- QA/Testing Skills
INSERT INTO public.skills (name, description, domain_id, difficulty) 
SELECT name, description, id, difficulty FROM (
  VALUES
    ('Selenium', 'Web automation testing', 'Quality Assurance', 'Intermediate'),
    ('Cypress', 'Modern web testing', 'Quality Assurance', 'Intermediate'),
    ('JUnit', 'Java testing framework', 'Quality Assurance', 'Intermediate'),
    ('Playwright', 'Microsoft testing library', 'Quality Assurance', 'Intermediate'),
    ('Manual Testing', 'Human-driven testing', 'Quality Assurance', 'Beginner'),
    ('API Testing', 'REST API validation', 'Quality Assurance', 'Intermediate'),
    ('Performance Testing', 'Load and stress testing', 'Quality Assurance', 'Advanced'),
    ('JMeter', 'Load testing tool', 'Quality Assurance', 'Advanced'),
    ('Test Automation', 'Automated test scripts', 'Quality Assurance', 'Intermediate'),
    ('Test Planning', 'Test strategy development', 'Quality Assurance', 'Intermediate'),
    ('Bug Tracking', 'Issue management', 'Quality Assurance', 'Beginner'),
    ('Jest', 'JavaScript testing', 'Quality Assurance', 'Intermediate'),
    ('Mocha', 'JavaScript test framework', 'Quality Assurance', 'Intermediate'),
    ('Postman', 'API testing tool', 'Quality Assurance', 'Beginner'),
    ('CI/CD Testing', 'Automated pipeline testing', 'Quality Assurance', 'Advanced')
) AS t(name, description, domain_name, difficulty)
JOIN public.domains d ON d.name = domain_name
ON CONFLICT (name) DO NOTHING;

-- Game Development Skills
INSERT INTO public.skills (name, description, domain_id, difficulty) 
SELECT name, description, id, difficulty FROM (
  VALUES
    ('Unity', 'Cross-platform game engine', 'Game Development', 'Intermediate'),
    ('Unreal Engine', 'AAA game engine', 'Game Development', 'Advanced'),
    ('C#', 'Unity programming language', 'Game Development', 'Intermediate'),
    ('C++', 'Unreal programming language', 'Game Development', 'Advanced'),
    ('Game Design', 'Game mechanics and systems', 'Game Development', 'Intermediate'),
    ('3D Modeling', '3D asset creation', 'Game Development', 'Intermediate'),
    ('Blender', '3D modeling software', 'Game Development', 'Intermediate'),
    ('Game Physics', 'Physics simulation in games', 'Game Development', 'Advanced'),
    ('Shader Programming', 'GPU shader development', 'Game Development', 'Advanced'),
    ('Virtual Reality', 'VR development', 'Game Development', 'Advanced'),
    ('Augmented Reality', 'AR development', 'Game Development', 'Advanced'),
    ('Godot', 'Open-source game engine', 'Game Development', 'Intermediate'),
    ('3D Graphics', '3D rendering techniques', 'Game Development', 'Advanced')
) AS t(name, description, domain_name, difficulty)
JOIN public.domains d ON d.name = domain_name
ON CONFLICT (name) DO NOTHING;

-- Blockchain Skills
INSERT INTO public.skills (name, description, domain_id, difficulty) 
SELECT name, description, id, difficulty FROM (
  VALUES
    ('Solidity', 'Ethereum smart contract language', 'Blockchain/Web3', 'Advanced'),
    ('Web3.js', 'Ethereum JavaScript library', 'Blockchain/Web3', 'Advanced'),
    ('Ethereum', 'Ethereum blockchain platform', 'Blockchain/Web3', 'Advanced'),
    ('Smart Contracts', 'Self-executing blockchain contracts', 'Blockchain/Web3', 'Advanced'),
    ('NFT', 'Non-Fungible Tokens', 'Blockchain/Web3', 'Intermediate'),
    ('DeFi', 'Decentralized Finance', 'Blockchain/Web3', 'Advanced'),
    ('Blockchain', 'Distributed ledger technology', 'Blockchain/Web3', 'Intermediate'),
    ('Web3', 'Decentralized web technologies', 'Blockchain/Web3', 'Advanced'),
    ('Rust', 'Systems programming for blockchain', 'Blockchain/Web3', 'Advanced'),
    ('Hyperledger', 'Enterprise blockchain framework', 'Blockchain/Web3', 'Advanced'),
    ('IPFS', 'InterPlanetary File System', 'Blockchain/Web3', 'Advanced'),
    ('TypeScript', 'Smart contract development', 'Blockchain/Web3', 'Advanced')
) AS t(name, description, domain_name, difficulty)
JOIN public.domains d ON d.name = domain_name
ON CONFLICT (name) DO NOTHING;

-- Product Management Skills
INSERT INTO public.skills (name, description, domain_id, difficulty) 
SELECT name, description, id, difficulty FROM (
  VALUES
    ('Product Management', 'Product lifecycle management', 'Product Management', 'Intermediate'),
    ('Agile', 'Agile methodology', 'Product Management', 'Intermediate'),
    ('Scrum', 'Scrum framework', 'Product Management', 'Intermediate'),
    ('Jira', 'Project tracking tool', 'Product Management', 'Beginner'),
    ('Roadmapping', 'Product strategy planning', 'Product Management', 'Advanced'),
    ('User Stories', 'Agile requirement specification', 'Product Management', 'Beginner'),
    ('Stakeholder Management', 'Managing project stakeholders', 'Product Management', 'Advanced'),
    ('Product Analytics', 'Data-driven product decisions', 'Product Management', 'Intermediate'),
    ('A/B Testing', 'Feature testing methodology', 'Product Management', 'Intermediate'),
    ('OKRs', 'Objectives and Key Results', 'Product Management', 'Intermediate'),
    ('Technical Writing', 'Documentation skills', 'Product Management', 'Intermediate'),
    ('Wireframing', 'Product prototyping', 'Product Management', 'Intermediate')
) AS t(name, description, domain_name, difficulty)
JOIN public.domains d ON d.name = domain_name
ON CONFLICT (name) DO NOTHING;

-- Networking Skills
INSERT INTO public.skills (name, description, domain_id, difficulty) 
SELECT name, description, id, difficulty FROM (
  VALUES
    ('TCP/IP', 'Network protocols', 'Networking', 'Intermediate'),
    ('DNS', 'Domain Name System', 'Networking', 'Intermediate'),
    ('VPN', 'Virtual Private Networks', 'Networking', 'Intermediate'),
    ('Cisco', 'Networking equipment', 'Networking', 'Intermediate'),
    ('Network Monitoring', 'Network status tracking', 'Networking', 'Intermediate'),
    ('Load Balancing', 'Traffic distribution', 'Networking', 'Advanced'),
    ('Wireless Networking', 'WiFi and cellular', 'Networking', 'Intermediate'),
    ('Bash', 'Shell scripting', 'Networking', 'Intermediate'),
    ('Routing', 'Network routing protocols', 'Networking', 'Advanced'),
    ('Switching', 'Network switching', 'Networking', 'Intermediate'),
    ('Firewall Configuration', 'Security rules setup', 'Networking', 'Advanced'),
    ('Network Architecture', 'Network design', 'Networking', 'Advanced')
) AS t(name, description, domain_name, difficulty)
JOIN public.domains d ON d.name = domain_name
ON CONFLICT (name) DO NOTHING;

-- ================================================
-- 6. SEED JOB ROLES WITH SKILLS
-- ================================================

-- SOFTWARE DEVELOPMENT ROLES
INSERT INTO public.job_roles (role_name, required_skills, difficulty, domain) VALUES
  ('Frontend Developer', ARRAY['HTML', 'CSS', 'JavaScript', 'React', 'Git', 'Responsive Design', 'TypeScript', 'Tailwind CSS'], 'Intermediate', 'Web Development'),
  ('Backend Developer', ARRAY['Node.js', 'Python', 'SQL', 'REST APIs', 'Git', 'Docker', 'Linux', 'PostgreSQL'], 'Intermediate', 'Web Development'),
  ('Full Stack Developer', ARRAY['HTML', 'CSS', 'JavaScript', 'React', 'Node.js', 'SQL', 'REST APIs', 'Git', 'Docker', 'TypeScript'], 'Intermediate', 'Web Development'),
  ('Web Developer', ARRAY['HTML', 'CSS', 'JavaScript', 'Responsive Design', 'Git', 'React', 'TypeScript'], 'Beginner', 'Web Development'),
  ('Software Engineer', ARRAY['Python', 'Java', 'SQL', 'Git', 'Data Structures', 'Algorithms', 'Linux'], 'Intermediate', 'Web Development'),
  ('Software Developer', ARRAY['Python', 'JavaScript', 'Git', 'SQL', 'REST APIs', 'Docker'], 'Intermediate', 'Web Development'),
  ('Application Developer', ARRAY['Java', 'Kotlin', 'Swift', 'React Native', 'SQL', 'APIs'], 'Intermediate', 'Mobile Development'),
  ('Mobile App Developer', ARRAY['React Native', 'JavaScript', 'TypeScript', 'REST APIs', 'Firebase', 'Mobile UI Design'], 'Intermediate', 'Mobile Development'),
  ('Android Developer', ARRAY['Kotlin', 'Java', 'Android Studio', 'SQLite', 'REST APIs', 'Jetpack Compose'], 'Intermediate', 'Mobile Development'),
  ('iOS Developer', ARRAY['Swift', 'Objective-C', 'Xcode', 'UIKit', 'SwiftUI', 'Core Data'], 'Intermediate', 'Mobile Development'),
  ('Game Developer', ARRAY['Unity', 'C#', 'Game Design', '3D Graphics', 'Game Physics', 'Blender'], 'Advanced', 'Game Development'),
  ('Embedded Systems Developer', ARRAY['C', 'C++', 'Linux', 'Microcontrollers', 'RTOS', 'Bash'], 'Advanced', 'IoT/Robotics'),
  ('Desktop Application Developer', ARRAY['Electron', 'Java', 'C#', 'Python', 'SQL', 'Git'], 'Intermediate', 'Web Development'),
  ('API Developer', ARRAY['REST APIs', 'GraphQL', 'Node.js', 'Python', 'PostgreSQL', 'Docker', 'Authentication'], 'Intermediate', 'Web Development'),
  ('WordPress Developer', ARRAY['WordPress', 'PHP', 'HTML', 'CSS', 'MySQL', 'JavaScript'], 'Beginner', 'Web Development'),
  ('Shopify Developer', ARRAY['Liquid', 'JavaScript', 'React', 'REST APIs', 'Shopify', 'HTML', 'CSS'], 'Intermediate', 'Web Development'),
  ('CMS Developer', ARRAY['Content Management', 'PHP', 'MySQL', 'HTML', 'CSS', 'JavaScript', 'WordPress'], 'Intermediate', 'Web Development')
ON CONFLICT (role_name) DO NOTHING;

-- AI / MACHINE LEARNING / DATA ROLES
INSERT INTO public.job_roles (role_name, required_skills, difficulty, domain) VALUES
  ('AI Engineer', ARRAY['Python', 'Machine Learning', 'Deep Learning', 'TensorFlow', 'PyTorch', 'SQL', 'Docker', 'MLOps'], 'Advanced', 'AI/Data Science'),
  ('Machine Learning Engineer', ARRAY['Python', 'Scikit-learn', 'TensorFlow', 'PyTorch', 'SQL', 'Docker', 'MLOps', 'Statistics'], 'Advanced', 'AI/Data Science'),
  ('Deep Learning Engineer', ARRAY['Python', 'Deep Learning', 'TensorFlow', 'PyTorch', 'Neural Networks', 'Linear Algebra', 'GPU Programming'], 'Advanced', 'AI/Data Science'),
  ('NLP Engineer', ARRAY['Python', 'NLP', 'spaCy', 'Transformers', 'Hugging Face', 'Deep Learning', 'NLTK'], 'Advanced', 'AI/Data Science'),
  ('Computer Vision Engineer', ARRAY['Python', 'Computer Vision', 'OpenCV', 'Deep Learning', 'TensorFlow', 'PyTorch', 'Image Processing'], 'Advanced', 'AI/Data Science'),
  ('Prompt Engineer', ARRAY['Prompt Engineering', 'LLMs', 'Python', 'Generative AI', 'LangChain', 'API Integration'], 'Intermediate', 'AI/Data Science'),
  ('Generative AI Engineer', ARRAY['Python', 'Generative AI', 'LLMs', 'LangChain', 'Vector Databases', 'PyTorch', 'Fine-tuning'], 'Advanced', 'AI/Data Science'),
  ('LLM Engineer', ARRAY['Python', 'LLMs', 'Transformers', 'Fine-tuning', 'LangChain', 'RAG', 'Prompt Engineering'], 'Advanced', 'AI/Data Science'),
  ('AI Research Engineer', ARRAY['Python', 'Deep Learning', 'PyTorch', 'Research', 'Linear Algebra', 'Statistics', 'Academic Writing'], 'Advanced', 'AI/Data Science'),
  ('Data Scientist', ARRAY['Python', 'Machine Learning', 'Statistics', 'SQL', 'Pandas', 'Data Visualization', 'R'], 'Intermediate', 'AI/Data Science'),
  ('Data Analyst', ARRAY['Python', 'SQL', 'Pandas', 'Data Visualization', 'Statistics', 'Excel', 'Tableau'], 'Beginner', 'AI/Data Science'),
  ('Business Intelligence Analyst', ARRAY['SQL', 'Tableau', 'Power BI', 'Data Visualization', 'Statistics', 'ETL', 'Data Warehousing'], 'Intermediate', 'Business Analysis'),
  ('Data Engineer', ARRAY['Python', 'SQL', 'Apache Kafka', 'ETL', 'Data Warehousing', 'Snowflake', 'Airflow', 'Docker'], 'Advanced', 'AI/Data Science'),
  ('Big Data Engineer', ARRAY['Python', 'Scala', 'Apache Spark', 'Hadoop', 'SQL', 'NoSQL', 'ETL', 'Cloud Platforms'], 'Advanced', 'AI/Data Science'),
  ('Analytics Engineer', ARRAY['SQL', 'dbt', 'Data Modeling', 'Python', 'Data Visualization', 'ETL', 'Data Warehousing'], 'Intermediate', 'AI/Data Science'),
  ('MLOps Engineer', ARRAY['Python', 'MLOps', 'Docker', 'Kubernetes', 'CI/CD', 'MLflow', 'AWS', 'Terraform'], 'Advanced', 'AI/Data Science'),
  ('AI Product Engineer', ARRAY['Python', 'Machine Learning', 'LLMs', 'Product Management', 'APIs', 'Docker', 'Agile'], 'Advanced', 'AI/Data Science')
ON CONFLICT (role_name) DO NOTHING;

-- CYBERSECURITY ROLES
INSERT INTO public.job_roles (role_name, required_skills, difficulty, domain) VALUES
  ('Cybersecurity Analyst', ARRAY['Network Security', 'SIEM', 'Firewalls', 'Incident Response', 'Vulnerability Assessment', 'Security Auditing'], 'Intermediate', 'Cybersecurity'),
  ('Security Engineer', ARRAY['Network Security', 'Penetration Testing', 'Python', 'Firewalls', 'SIEM', 'Cryptography'], 'Advanced', 'Cybersecurity'),
  ('Ethical Hacker', ARRAY['Penetration Testing', 'Ethical Hacking', 'Network Security', 'Python', 'Linux', 'Vulnerability Assessment'], 'Advanced', 'Cybersecurity'),
  ('Penetration Tester', ARRAY['Penetration Testing', 'Ethical Hacking', 'OWASP', 'Burp Suite', 'Python', 'Linux', 'Networking'], 'Advanced', 'Cybersecurity'),
  ('SOC Analyst', ARRAY['SIEM', 'SOC Operations', 'Incident Response', 'Log Analysis', 'Network Security', 'SIEM Tools'], 'Intermediate', 'Cybersecurity'),
  ('Digital Forensics Analyst', ARRAY['Digital Forensics', 'Malware Analysis', 'Incident Response', 'Linux', 'Python', 'Evidence Collection'], 'Advanced', 'Cybersecurity'),
  ('Cloud Security Engineer', ARRAY['Cloud Security', 'AWS', 'Azure', 'Kubernetes', 'Terraform', 'IAM', 'Zero Trust'], 'Advanced', 'Cybersecurity'),
  ('Network Security Engineer', ARRAY['Network Security', 'Firewalls', 'VPN', 'IDS/IPS', 'TCP/IP', 'Cisco', 'Linux'], 'Advanced', 'Cybersecurity'),
  ('Information Security Analyst', ARRAY['Security Auditing', 'Risk Assessment', 'Compliance', 'Network Security', 'Incident Response', 'SIEM'], 'Intermediate', 'Cybersecurity'),
  ('Security Architect', ARRAY['Network Security', 'Cloud Architecture', 'Cryptography', 'Zero Trust', 'Security Auditing', 'Firewalls'], 'Advanced', 'Cybersecurity'),
  ('Malware Analyst', ARRAY['Malware Analysis', 'Reverse Engineering', 'Assembly', 'Python', 'Linux', 'Digital Forensics'], 'Advanced', 'Cybersecurity'),
  ('Incident Response Engineer', ARRAY['Incident Response', 'Digital Forensics', 'Malware Analysis', 'SIEM', 'Python', 'Linux', 'Log Analysis'], 'Advanced', 'Cybersecurity')
ON CONFLICT (role_name) DO NOTHING;

-- CLOUD / DEVOPS / INFRASTRUCTURE ROLES
INSERT INTO public.job_roles (role_name, required_skills, difficulty, domain) VALUES
  ('DevOps Engineer', ARRAY['Docker', 'Kubernetes', 'CI/CD', 'AWS', 'Terraform', 'Linux', 'Git', 'Python'], 'Advanced', 'Cloud/DevOps'),
  ('Site Reliability Engineer', ARRAY['Linux', 'Python', 'Prometheus', 'Grafana', 'Kubernetes', 'SRE', 'CI/CD', 'AWS'], 'Advanced', 'Cloud/DevOps'),
  ('Cloud Engineer', ARRAY['AWS', 'Azure', 'Docker', 'Kubernetes', 'Terraform', 'Linux', 'CI/CD'], 'Intermediate', 'Cloud/DevOps'),
  ('Cloud Architect', ARRAY['AWS', 'Azure', 'Cloud Architecture', 'Terraform', 'Kubernetes', 'Networking', 'Security'], 'Advanced', 'Cloud/DevOps'),
  ('AWS Engineer', ARRAY['AWS', 'Lambda', 'EC2', 'S3', 'RDS', 'Terraform', 'CloudFormation', 'CI/CD'], 'Advanced', 'Cloud/DevOps'),
  ('Azure Engineer', ARRAY['Azure', 'Azure DevOps', 'ARM Templates', 'Kubernetes', 'Azure Functions', 'PowerShell'], 'Advanced', 'Cloud/DevOps'),
  ('Google Cloud Engineer', ARRAY['Google Cloud', 'GKE', 'Cloud Functions', 'BigQuery', 'Terraform', 'Python'], 'Advanced', 'Cloud/DevOps'),
  ('Infrastructure Engineer', ARRAY['Terraform', 'Ansible', 'Linux', 'Docker', 'Kubernetes', 'AWS', 'Networking'], 'Advanced', 'Cloud/DevOps'),
  ('Kubernetes Engineer', ARRAY['Kubernetes', 'Docker', 'Helm', 'Istio', 'Linux', 'Cloud Platforms', 'Prometheus'], 'Advanced', 'Cloud/DevOps'),
  ('Platform Engineer', ARRAY['Kubernetes', 'Platform Engineering', 'CI/CD', 'Linux', 'Python', 'Terraform', 'GitHub Actions'], 'Advanced', 'Cloud/DevOps'),
  ('Systems Administrator', ARRAY['Linux', 'Windows Server', 'Bash', 'Networking', 'Shell Scripting', 'Docker'], 'Intermediate', 'Cloud/DevOps'),
  ('Linux Administrator', ARRAY['Linux', 'Shell Scripting', 'Bash', 'Apache', 'Nginx', 'Docker', 'Networking'], 'Intermediate', 'Cloud/DevOps'),
  ('Network Engineer', ARRAY['TCP/IP', 'Routing', 'Switching', 'Cisco', 'VPN', 'Firewalls', 'Network Monitoring'], 'Intermediate', 'Networking')
ON CONFLICT (role_name) DO NOTHING;

-- UI/UX / DESIGN ROLES
INSERT INTO public.job_roles (role_name, required_skills, difficulty, domain) VALUES
  ('UI Designer', ARRAY['Figma', 'UI Design', 'Typography', 'Color Theory', 'Adobe Illustrator', 'Responsive Design'], 'Intermediate', 'UI/UX Design'),
  ('UX Designer', ARRAY['UX Design', 'User Research', 'Wireframing', 'Prototyping', 'Figma', 'Design Thinking'], 'Intermediate', 'UI/UX Design'),
  ('UI/UX Designer', ARRAY['Figma', 'UI Design', 'UX Design', 'User Research', 'Prototyping', 'Design Systems', 'Typography'], 'Intermediate', 'UI/UX Design'),
  ('Product Designer', ARRAY['Figma', 'UI Design', 'UX Design', 'Design Systems', 'Prototyping', 'Design Thinking', 'User Research'], 'Advanced', 'UI/UX Design'),
  ('Graphic Designer', ARRAY['Adobe Illustrator', 'Photoshop', 'Typography', 'Color Theory', 'Design Principles', 'Print Design'], 'Intermediate', 'UI/UX Design'),
  ('Motion Designer', ARRAY['After Effects', 'Motion Design', 'Animation', 'Prototyping', 'Figma', 'Cinema 4D'], 'Advanced', 'UI/UX Design'),
  ('Interaction Designer', ARRAY['Interaction Design', 'Prototyping', 'Figma', 'Animation', 'User Research', 'Design Systems'], 'Intermediate', 'UI/UX Design')
ON CONFLICT (role_name) DO NOTHING;

-- DATABASE ROLES
INSERT INTO public.job_roles (role_name, required_skills, difficulty, domain) VALUES
  ('Database Administrator', ARRAY['SQL', 'PostgreSQL', 'MySQL', 'Database Administration', 'Backup', 'Performance Tuning', 'Security'], 'Advanced', 'Database'),
  ('Database Engineer', ARRAY['SQL', 'PostgreSQL', 'MongoDB', 'Redis', 'Database Design', 'ETL', 'Python'], 'Advanced', 'Database'),
  ('SQL Developer', ARRAY['SQL', 'PostgreSQL', 'MySQL', 'Database Design', 'Stored Procedures', 'ETL', 'Reporting'], 'Intermediate', 'Database'),
  ('Data Warehouse Engineer', ARRAY['SQL', 'Data Warehousing', 'Snowflake', 'dbt', 'ETL', 'Python', 'BigQuery'], 'Advanced', 'Database')
ON CONFLICT (role_name) DO NOTHING;

-- TESTING / QA ROLES
INSERT INTO public.job_roles (role_name, required_skills, difficulty, domain) VALUES
  ('QA Engineer', ARRAY['Manual Testing', 'Test Planning', 'Bug Tracking', 'Selenium', 'API Testing', 'SQL'], 'Intermediate', 'Quality Assurance'),
  ('Software Tester', ARRAY['Manual Testing', 'Test Planning', 'Bug Tracking', 'SQL', 'API Testing', 'Documentation'], 'Beginner', 'Quality Assurance'),
  ('Automation Test Engineer', ARRAY['Selenium', 'Cypress', 'Playwright', 'Python', 'Test Automation', 'CI/CD', 'Java'], 'Advanced', 'Quality Assurance'),
  ('Performance Test Engineer', ARRAY['Performance Testing', 'JMeter', 'Load Testing', 'API Testing', 'Monitoring', 'Linux', 'Scripting'], 'Advanced', 'Quality Assurance'),
  ('Manual Tester', ARRAY['Manual Testing', 'Test Planning', 'Bug Tracking', 'SQL', 'Documentation', 'Test Cases'], 'Beginner', 'Quality Assurance')
ON CONFLICT (role_name) DO NOTHING;

-- BLOCKCHAIN / WEB3 ROLES
INSERT INTO public.job_roles (role_name, required_skills, difficulty, domain) VALUES
  ('Blockchain Developer', ARRAY['Blockchain', 'Solidity', 'Ethereum', 'Web3.js', 'Smart Contracts', 'IPFS'], 'Advanced', 'Blockchain/Web3'),
  ('Smart Contract Developer', ARRAY['Solidity', 'Smart Contracts', 'Ethereum', 'Web3.js', 'Blockchain', 'Security Auditing'], 'Advanced', 'Blockchain/Web3'),
  ('Web3 Developer', ARRAY['Web3', 'Solidity', 'Ethereum', 'React', 'IPFS', 'DeFi', 'NFT'], 'Advanced', 'Blockchain/Web3'),
  ('Solidity Developer', ARRAY['Solidity', 'Smart Contracts', 'Ethereum', 'Web3.js', 'Hardhat', 'Testing', 'Security'], 'Advanced', 'Blockchain/Web3')
ON CONFLICT (role_name) DO NOTHING;

-- AR/VR / EMERGING TECH ROLES
INSERT INTO public.job_roles (role_name, required_skills, difficulty, domain) VALUES
  ('AR Developer', ARRAY['Unity', 'C#', 'Augmented Reality', 'ARKit', 'ARCore', '3D Modeling'], 'Advanced', 'AR/VR/XR'),
  ('VR Developer', ARRAY['Unity', 'C#', 'Virtual Reality', 'Oculus SDK', 'SteamVR', '3D Graphics'], 'Advanced', 'AR/VR/XR'),
  ('XR Engineer', ARRAY['Unity', 'C#', 'Virtual Reality', 'Augmented Reality', 'Mixed Reality', '3D Graphics', 'Computer Vision'], 'Advanced', 'AR/VR/XR'),
  ('Robotics Engineer', ARRAY['C++', 'Python', 'ROS', 'Embedded Systems', 'Linux', 'Sensors', 'Control Systems'], 'Advanced', 'IoT/Robotics'),
  ('IoT Engineer', ARRAY['Embedded Systems', 'C', 'C++', 'Linux', 'IoT Protocols', 'Python', 'Sensors', 'Networking'], 'Advanced', 'IoT/Robotics')
ON CONFLICT (role_name) DO NOTHING;

-- PRODUCT / MANAGEMENT ROLES
INSERT INTO public.job_roles (role_name, required_skills, difficulty, domain) VALUES
  ('Product Manager', ARRAY['Product Management', 'Agile', 'User Stories', 'Roadmapping', 'Stakeholder Management', 'Analytics'], 'Intermediate', 'Product Management'),
  ('Technical Product Manager', ARRAY['Product Management', 'Agile', 'APIs', 'Technical Writing', 'Roadmapping', 'SQL', 'Software Development'], 'Advanced', 'Product Management'),
  ('Project Manager', ARRAY['Project Management', 'Agile', 'Scrum', 'Jira', 'Stakeholder Management', 'Risk Management'], 'Intermediate', 'Product Management'),
  ('Scrum Master', ARRAY['Scrum', 'Agile', 'Jira', 'Facilitation', 'Team Coaching', 'Kanban'], 'Intermediate', 'Product Management'),
  ('Agile Coach', ARRAY['Agile', 'Scrum', 'Kanban', 'Coaching', 'Facilitation', 'Leadership'], 'Advanced', 'Product Management'),
  ('Technical Program Manager', ARRAY['Program Management', 'Technical Writing', 'Stakeholder Management', 'Risk Management', 'Agile', 'Technical Skills'], 'Advanced', 'Product Management')
ON CONFLICT (role_name) DO NOTHING;

-- BUSINESS / SUPPORT TECH ROLES
INSERT INTO public.job_roles (role_name, required_skills, difficulty, domain) VALUES
  ('IT Support Specialist', ARRAY['Troubleshooting', 'Windows', 'Linux', 'Networking', 'Help Desk', 'Documentation'], 'Beginner', 'Business Analysis'),
  ('Technical Support Engineer', ARRAY['Technical Writing', 'APIs', 'Debugging', 'Troubleshooting', 'Linux', 'SQL'], 'Intermediate', 'Business Analysis'),
  ('System Analyst', ARRAY['SQL', 'System Analysis', 'Requirements', 'Documentation', 'UML', 'Agile'], 'Intermediate', 'Business Analysis'),
  ('Business Analyst', ARRAY['Business Analysis', 'SQL', 'Requirements', 'Stakeholder Management', 'Data Analysis', 'Documentation'], 'Intermediate', 'Business Analysis'),
  ('ERP Consultant', ARRAY['SAP', 'Oracle', 'ERP Systems', 'Business Processes', 'SQL', 'Implementation'], 'Advanced', 'Business Analysis'),
  ('CRM Developer', ARRAY['Salesforce', 'CRM', 'APIs', 'Apex', 'JavaScript', 'SQL'], 'Intermediate', 'Business Analysis'),
  ('Solutions Architect', ARRAY['Cloud Architecture', 'AWS', 'APIs', 'System Design', 'Enterprise Architecture', 'Security'], 'Advanced', 'Product Management')
ON CONFLICT (role_name) DO NOTHING;

-- RESEARCH & ADVANCED ROLES
INSERT INTO public.job_roles (role_name, required_skills, difficulty, domain) VALUES
  ('Research Scientist', ARRAY['Research', 'Python', 'Machine Learning', 'Statistics', 'Linear Algebra', 'Academic Writing', 'Deep Learning'], 'Advanced', 'Research'),
  ('AI Researcher', ARRAY['Deep Learning', 'Research', 'PyTorch', 'Transformers', 'Linear Algebra', 'Statistics', 'Python'], 'Advanced', 'Research'),
  ('Quantum Computing Researcher', ARRAY['Quantum Computing', 'Python', 'Qiskit', 'Linear Algebra', 'Physics', 'Research'], 'Advanced', 'Research'),
  ('Computational Scientist', ARRAY['Python', 'Scientific Computing', 'Linear Algebra', 'Statistics', 'MPI', 'HPC'], 'Advanced', 'Research')
ON CONFLICT (role_name) DO NOTHING;

-- NETWORKING ROLES
INSERT INTO public.job_roles (role_name, required_skills, difficulty, domain) VALUES
  ('Network Administrator', ARRAY['Networking', 'TCP/IP', 'DNS', 'VPN', 'Windows Server', 'Linux', 'Firewalls'], 'Intermediate', 'Networking'),
  ('Network Architect', ARRAY['Network Architecture', 'TCP/IP', 'Routing', 'Switching', 'Cloud Networking', 'Security', 'Cisco'], 'Advanced', 'Networking'),
  ('Telecom Engineer', ARRAY['Telecommunications', 'Networking', 'VoIP', 'SIP', 'Wireless Networking', 'Signal Processing'], 'Advanced', 'Networking')
ON CONFLICT (role_name) DO NOTHING;

-- FUTURE EMERGING ROLES
INSERT INTO public.job_roles (role_name, required_skills, difficulty, domain) VALUES
  ('AI Ethics Specialist', ARRAY['AI Ethics', 'Machine Learning', 'Philosophy', 'Policy', 'Research', 'Compliance'], 'Advanced', 'Emerging Technologies'),
  ('AI Auditor', ARRAY['AI Ethics', 'Machine Learning', 'Audit', 'Compliance', 'Risk Assessment', 'Documentation'], 'Advanced', 'Emerging Technologies'),
  ('AI Safety Engineer', ARRAY['Machine Learning', 'Python', 'Safety Engineering', 'Research', 'Testing', 'Validation'], 'Advanced', 'Emerging Technologies'),
  ('Forward Deployed Engineer', ARRAY['Python', 'SQL', 'Machine Learning', 'Problem Solving', 'Deployment', 'AWS', 'Communication'], 'Advanced', 'AI/Data Science'),
  ('AI Integration Engineer', ARRAY['Python', 'LLMs', 'APIs', 'Integration', 'Docker', 'Prompt Engineering', 'Testing'], 'Advanced', 'AI/Data Science'),
  ('Automation Engineer', ARRAY['Python', 'Selenium', 'CI/CD', 'Docker', 'Linux', 'RPA', 'Scripting'], 'Intermediate', 'Cloud/DevOps'),
  ('Digital Transformation Engineer', ARRAY['Cloud Architecture', 'CI/CD', 'Agile', 'Process Automation', 'APIs', 'Change Management'], 'Advanced', 'Emerging Technologies')
ON CONFLICT (role_name) DO NOTHING;

-- ================================================
-- 7. SEED LEARNING RESOURCES
-- ================================================

INSERT INTO public.resources (title, description, url, type, skills_covered, difficulty, domain) VALUES
  -- Web Development Resources
  ('The Web Developer Bootcamp', 'Complete web development course covering HTML, CSS, JS, Node, and more', 'https://www.udemy.com/course/the-web-developer-bootcamp/', 'Course', ARRAY['HTML', 'CSS', 'JavaScript', 'Node.js', 'MongoDB'], 'Beginner', 'Web Development'),
  ('freeCodeCamp', 'Free coding curriculum for web development', 'https://www.freecodecamp.org/', 'Course', ARRAY['HTML', 'CSS', 'JavaScript', 'React', 'Node.js', 'SQL'], 'Beginner', 'Web Development'),
  ('MDN Web Docs', 'Official Mozilla documentation for web technologies', 'https://developer.mozilla.org/', 'Documentation', ARRAY['HTML', 'CSS', 'JavaScript', 'Web APIs'], 'Beginner', 'Web Development'),
  ('React Official Tutorial', 'Learn React from the official documentation', 'https://react.dev/learn', 'Tutorial', ARRAY['React', 'JavaScript', 'TypeScript'], 'Intermediate', 'Web Development'),
  ('TypeScript Handbook', 'Comprehensive TypeScript documentation', 'https://www.typescriptlang.org/docs/', 'Documentation', ARRAY['TypeScript', 'JavaScript'], 'Intermediate', 'Web Development'),
  ('Node.js Documentation', 'Official Node.js documentation', 'https://nodejs.org/docs/', 'Documentation', ARRAY['Node.js', 'JavaScript', 'Express.js'], 'Intermediate', 'Web Development'),
  ('Next.js Documentation', 'The React framework for production', 'https://nextjs.org/docs', 'Documentation', ARRAY['Next.js', 'React', 'TypeScript'], 'Intermediate', 'Web Development'),
  
  -- AI/ML Resources
  ('Machine Learning by Andrew Ng', 'Stanford ML course by AI pioneer', 'https://www.coursera.org/learn/machine-learning', 'Course', ARRAY['Machine Learning', 'Python', 'Statistics', 'Linear Algebra'], 'Intermediate', 'AI/Data Science'),
  ('Deep Learning Specialization', 'Deep Learning courses by Andrew Ng', 'https://www.coursera.org/specializations/deep-learning', 'Course', ARRAY['Deep Learning', 'TensorFlow', 'Neural Networks', 'Python'], 'Advanced', 'AI/Data Science'),
  ('Fast.ai Practical Deep Learning', 'Free deep learning course', 'https://www.fast.ai/', 'Course', ARRAY['Deep Learning', 'PyTorch', 'Machine Learning'], 'Intermediate', 'AI/Data Science'),
  ('Hugging Face Course', 'Learn about transformers and Hugging Face', 'https://huggingface.co/course/chapter1/1', 'Course', ARRAY['NLP', 'Transformers', 'Hugging Face', 'Python'], 'Advanced', 'AI/Data Science'),
  ('Python for Data Science', 'IBM Data Science Professional Certificate', 'https://www.coursera.org/professional-certificates/ibm-data-science', 'Course', ARRAY['Python', 'Pandas', 'SQL', 'Data Visualization'], 'Beginner', 'AI/Data Science'),
  ('TensorFlow Developer Certificate', 'Google TensorFlow certification course', 'https://www.tensorflow.org/certificate', 'Course', ARRAY['TensorFlow', 'Python', 'Machine Learning'], 'Intermediate', 'AI/Data Science'),
  ('LangChain Documentation', 'Build LLM applications with LangChain', 'https://python.langchain.com/docs', 'Documentation', ARRAY['LangChain', 'LLMs', 'Python'], 'Advanced', 'AI/Data Science'),
  
  -- Cybersecurity Resources
  ('TryHackMe', 'Learn cybersecurity through hands-on labs', 'https://tryhackme.com/', 'Course', ARRAY['Penetration Testing', 'Ethical Hacking', 'Network Security'], 'Beginner', 'Cybersecurity'),
  ('PortSwigger Web Academy', 'Learn web security from Burp Suite creators', 'https://portswigger.net/web-security', 'Course', ARRAY['OWASP', 'Penetration Testing', 'Web Security'], 'Intermediate', 'Cybersecurity'),
  ('CompTIA Security+', 'Security certification course', 'https://www.comptia.org/certifications/security', 'Course', ARRAY['Network Security', 'Security Auditing', 'Incident Response'], 'Intermediate', 'Cybersecurity'),
  ('SANS Cybersecurity Courses', 'Professional cybersecurity training', 'https://www.sans.org/', 'Course', ARRAY['Penetration Testing', 'Incident Response', 'Digital Forensics'], 'Advanced', 'Cybersecurity'),
  ('Cybrary', 'Cybersecurity learning platform', 'https://www.cybrary.it/', 'Course', ARRAY['Network Security', 'Ethical Hacking', 'SIEM'], 'Intermediate', 'Cybersecurity'),
  
  -- Cloud/DevOps Resources
  ('AWS Certified Solutions Architect', 'AWS certification course', 'https://aws.amazon.com/certification/certified-solutions-architect-associate/', 'Course', ARRAY['AWS', 'Cloud Architecture', 'Cloud Security'], 'Intermediate', 'Cloud/DevOps'),
  ('Kubernetes Documentation', 'Official Kubernetes documentation', 'https://kubernetes.io/docs/', 'Documentation', ARRAY['Kubernetes', 'Docker', 'Container Orchestration'], 'Advanced', 'Cloud/DevOps'),
  ('Docker Official Tutorial', 'Learn Docker from basics to advanced', 'https://docs.docker.com/get-started/', 'Tutorial', ARRAY['Docker', 'Containerization'], 'Beginner', 'Cloud/DevOps'),
  ('Terraform Documentation', 'Infrastructure as Code with Terraform', 'https://www.terraform.io/docs', 'Documentation', ARRAY['Terraform', 'Cloud Architecture', 'AWS'], 'Intermediate', 'Cloud/DevOps'),
  ('Azure DevOps Learning Path', 'Microsoft Azure DevOps training', 'https://learn.microsoft.com/en-us/training/paths/azure-devops-fundamentals/', 'Course', ARRAY['Azure', 'CI/CD', 'DevOps'], 'Intermediate', 'Cloud/DevOps'),
  ('GCP Cloud Engineer', 'Google Cloud certification course', 'https://cloud.google.com/certification/cloud-engineer', 'Course', ARRAY['Google Cloud', 'Kubernetes', 'Docker'], 'Intermediate', 'Cloud/DevOps'),
  
  -- Mobile Development Resources
  ('React Native Documentation', 'Build mobile apps with React Native', 'https://reactnative.dev/docs/getting-started', 'Documentation', ARRAY['React Native', 'JavaScript', 'Mobile UI Design'], 'Intermediate', 'Mobile Development'),
  ('Flutter Documentation', 'Google Flutter UI toolkit', 'https://flutter.dev/docs', 'Documentation', ARRAY['Flutter', 'Dart', 'Mobile UI Design'], 'Intermediate', 'Mobile Development'),
  ('iOS Development with Swift', 'Apple Swift development course', 'https://developer.apple.com/swift-data/', 'Course', ARRAY['Swift', 'iOS Development', 'Xcode'], 'Intermediate', 'Mobile Development'),
  ('Android Developer Fundamentals', 'Google Android development course', 'https://developer.android.com/courses/fundamentals-training/overview-v2', 'Course', ARRAY['Kotlin', 'Android Development', 'Android Studio'], 'Intermediate', 'Mobile Development'),
  
  -- Design Resources
  ('Figma for Design Systems', 'Learn Figma for professional design', 'https://www.figma.com/best-practices/guide-to-design-systems/', 'Tutorial', ARRAY['Figma', 'Design Systems', 'UI Design'], 'Intermediate', 'UI/UX Design'),
  ('UX Design Institute', 'Professional UX design certification', 'https://www.uxdesigninstitute.com/', 'Course', ARRAY['UX Design', 'User Research', 'Design Thinking'], 'Intermediate', 'UI/UX Design'),
  ('Interaction Design Foundation', 'Free design courses', 'https://www.interaction-design.org/courses', 'Course', ARRAY['Interaction Design', 'UI Design', 'UX Design'], 'Beginner', 'UI/UX Design'),
  
  -- Database Resources
  ('SQL for Data Science', 'Learn SQL for data analysis', 'https://www.coursera.org/learn/sql-for-data-science', 'Course', ARRAY['SQL', 'PostgreSQL', 'Data Analysis'], 'Beginner', 'Database'),
  ('MongoDB University', 'Free MongoDB courses', 'https://learn.mongodb.com/', 'Course', ARRAY['MongoDB', 'NoSQL', 'Database Design'], 'Intermediate', 'Database'),
  ('PostgreSQL Tutorial', 'Comprehensive PostgreSQL guide', 'https://www.postgresql.org/docs/', 'Documentation', ARRAY['PostgreSQL', 'SQL', 'Database Administration'], 'Intermediate', 'Database'),
  
  -- QA/Testing Resources
  ('Selenium WebDriver', 'Browser automation with Selenium', 'https://www.selenium.dev/documentation/webdriver/', 'Documentation', ARRAY['Selenium', 'Test Automation', 'Java'], 'Intermediate', 'Quality Assurance'),
  ('Cypress.io', 'Modern end-to-end testing', 'https://docs.cypress.io/', 'Documentation', ARRAY['Cypress', 'Test Automation', 'JavaScript'], 'Intermediate', 'Quality Assurance'),
  ('Testing Library', 'Simple and complete testing library', 'https://testing-library.com/', 'Documentation', ARRAY['Jest', 'React', 'Test Automation'], 'Intermediate', 'Quality Assurance'),
  
  -- Blockchain Resources
  ('CryptoZombies', 'Learn Solidity by building games', 'https://cryptozombies.io/', 'Course', ARRAY['Solidity', 'Smart Contracts', 'Ethereum'], 'Intermediate', 'Blockchain/Web3'),
  ('Alchemy University', 'Free blockchain development courses', 'https://university.alchemy.com/', 'Course', ARRAY['Solidity', 'Web3.js', 'Ethereum', 'NFT'], 'Intermediate', 'Blockchain/Web3'),
  
  -- Game Development Resources
  ('Unity Learn', 'Official Unity tutorials', 'https://learn.unity.com/', 'Course', ARRAY['Unity', 'C#', 'Game Design'], 'Intermediate', 'Game Development'),
  ('Unreal Engine Documentation', 'Official Unreal Engine docs', 'https://docs.unrealengine.com/', 'Documentation', ARRAY['Unreal Engine', 'C++', 'Game Development'], 'Advanced', 'Game Development'),
  
  -- Product Management Resources
  ('Product Management by Atlassian', 'Free PM course', 'https://www.atlassian.com/pm-academy', 'Course', ARRAY['Product Management', 'Agile', 'Scrum'], 'Beginner', 'Product Management'),
  ('Google PM Certificate', 'Google Product Management certificate', 'https://grow.google/certificates/product-management/', 'Course', ARRAY['Product Management', 'Roadmapping', 'Analytics'], 'Intermediate', 'Product Management'),
  
  -- Networking Resources
  ('CompTIA Network+', 'Networking certification course', 'https://www.comptia.org/certifications/network', 'Course', ARRAY['Networking', 'TCP/IP', 'Routing', 'Switching'], 'Intermediate', 'Networking'),
  ('Cisco Networking Academy', 'Free networking courses', 'https://www.netacad.com/', 'Course', ARRAY['Cisco', 'Networking', 'Routing', 'Switching'], 'Beginner', 'Networking')
ON CONFLICT (url) DO NOTHING;

-- ================================================
-- 8. VERIFY DATA
-- ================================================

-- Show counts
SELECT 'Domains: ' || COUNT(*) as result FROM public.domains
UNION ALL SELECT 'Skills: ' || COUNT(*) FROM public.skills
UNION ALL SELECT 'Job Roles: ' || COUNT(*) FROM public.job_roles
UNION ALL SELECT 'Resources: ' || COUNT(*) FROM public.resources;

-- Show domains
SELECT name, description, color FROM public.domains ORDER BY name;

-- Show top skills per domain
SELECT d.name as domain, COUNT(s.id) as skill_count
FROM public.domains d
LEFT JOIN public.skills s ON s.domain_id = d.id
GROUP BY d.name
ORDER BY skill_count DESC;

-- Show all job roles grouped by domain
SELECT domain, COUNT(*) as count, 
       STRING_AGG(role_name, ', ' ORDER BY role_name) as roles
FROM public.job_roles
GROUP BY domain
ORDER BY count DESC;

-- ================================================
-- 9. OPTIONAL: CREATE JOB_ROLE_SKILLS RELATIONSHIPS
-- ================================================
DO $$
DECLARE
  role_record RECORD;
  skill_record RECORD;
  role_id UUID;
  skill_id UUID;
BEGIN
  FOR role_record IN SELECT id, role_name, required_skills FROM public.job_roles LOOP
    role_id := role_record.id;
    
    -- Handle array of skill names
    FOR skill_record IN SELECT unnest(role_record.required_skills) as skill_name LOOP
      SELECT id INTO skill_id FROM public.skills WHERE name = skill_record.skill_name;
      
      IF skill_id IS NOT NULL THEN
        INSERT INTO public.job_role_skills (job_role_id, skill_id, is_core)
        VALUES (role_id, skill_id, true)
        ON CONFLICT DO NOTHING;
      END IF;
      
      skill_id := NULL;
    END LOOP;
  END LOOP;
END $$;

-- Show skill relationships
SELECT j.role_name, d.name as domain, 
       STRING_AGG(s.name, ', ' ORDER BY s.name) as skills,
       COUNT(s.id) as skill_count
FROM public.job_roles j
LEFT JOIN public.domains d ON d.name = j.domain
LEFT JOIN public.job_role_skills jrs ON jrs.job_role_id = j.id
LEFT JOIN public.skills s ON s.id = jrs.skill_id
GROUP BY j.role_name, d.name
ORDER BY d.name, j.role_name
LIMIT 20;

SELECT 'Seed completed successfully!' as status;
