import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '../lib/supabase';
import { getCurrentUser } from '../lib/firebase';
import { Target, CheckCircle, AlertCircle, ArrowRight, BookOpen, Search, X, BarChart3 } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';

// ── Types ──────────────────────────────────────────────────────────────────────

interface Domain {
  id: string;
  name: string;
  languages: string[];
  frameworks: string[];
  libraries: string[];
  tools: string[];
}

interface GapResult {
  jobRole: string;
  matchedSkills: string[];
  missingSkills: string[];
  weakSkills: string[];
  nextSteps: string[];
}

interface SkillAnalysisProps {
  user?: any;
  onNavigate: (page: any) => void;
}

// ── Helpers ────────────────────────────────────────────────────────────────────

function parseDomainSkills(domain: any): string[] {
  const parse = (val: any): string[] => {
    if (!val) return [];
    try { return Array.isArray(val) ? val : JSON.parse(val); }
    catch { return []; }
  };
  return [
    ...parse(domain.languages),
    ...parse(domain.frameworks),
    ...parse(domain.libraries),
    ...parse(domain.tools),
  ];
}

// ── Component ─────────────────────────────────────────────────────────────────

export function SkillAnalysis({ user, onNavigate }: SkillAnalysisProps): JSX.Element {
  const [domains, setDomains] = useState<Domain[]>([]);
  const [userSkills, setUserSkills] = useState<string[]>([]);
  const [selectedDomainId, setSelectedDomainId] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [result, setResult] = useState<GapResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [fetchingData, setFetchingData] = useState(true);
  const [error, setError] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);
  const suggestionsRef = useRef<HTMLDivElement>(null);

  // ── All CS / IT domains ──────────────────────────────────────────────────────
  // These are upserted on first load so the DB is always up to date.
  const ALL_DOMAINS = [
    { id: '0a5c14cc-62c9-4770-bbbc-f550a101b6bc', name: 'Frontend Development', languages: ["HTML","CSS","JavaScript","TypeScript"], frameworks: ["React","Next.js","Angular","Vue.js"], libraries: ["Redux","Axios","Framer Motion","Chart.js"], tools: ["Webpack","Vite","Babel"] },

{ id: '55d13850-80f0-4cea-a610-98fbae22f857', name: 'Backend Development', languages: ["JavaScript","Python","Java","Go"], frameworks: ["Node.js","Express.js","Django","Spring Boot"], libraries: ["JWT","Mongoose","Sequelize"], tools: ["Postman","Swagger"] },
{ id: '44bed9a8-adac-42b9-be44-6a11bd0690d4', name: 'Full Stack Development', languages: ["JavaScript","TypeScript"], frameworks: ["Next.js","MERN","MEAN"], libraries: ["Redux","Axios"], tools: ["Docker","Git"] },
    { id: '1d0b2ff5-ffc7-4f05-b9a9-137d6564f773', name: 'Data Science', languages: ["Python","R","SQL"], frameworks: ["Pandas","NumPy"], libraries: ["Matplotlib","Seaborn","Plotly"], tools: ["Jupyter","Excel"] },

    { id: 'c7d55e13-c853-4d39-93b2-92a782a08e0d', name: 'AI / Machine Learning', languages: ["Python"], frameworks: ["TensorFlow","PyTorch"], libraries: ["Scikit-learn","NLTK","OpenCV"], tools: ["Colab","Jupyter"] },
    { id: '43eae6ec-4c3c-42f5-bdba-08c9e3def655', name: 'DevOps', languages: ["Bash","Python"], frameworks: [], libraries: [], tools: ["Docker","Kubernetes","Jenkins","GitHub Actions"] },

    { id: '9a6c7407-04c9-4c41-a1c9-c3e6e6ea6ffd', name: 'Cloud Computing', languages: ["Python","JavaScript"], frameworks: [], libraries: [], tools: ["AWS","Azure","GCP"] },
    { id: '861cd405-4190-4d79-bb58-700aad4da607', name: 'Cybersecurity', languages: ["Python","C","JavaScript"], frameworks: [], libraries: ["CryptoJS"], tools: ["Wireshark","Nmap","Metasploit"] },
    { id: 'db442a03-01b2-41e3-afc0-e5cecc72b857', name: 'Mobile Development', languages: ["Dart","Java","Kotlin","Swift"], frameworks: ["Flutter","React Native"], libraries: [], tools: ["Android Studio","Xcode"] },
    { id: '65222713-3291-45dd-8ead-8bb96068a1ac', name: 'UI/UX Design', languages: [], frameworks: [], libraries: [], tools: ["Figma","Adobe XD","Sketch"] },
    { id: '00000000-0000-0000-0000-000000000011', name: 'Game Development',
      languages: ['C++','C#','Python','Lua','GDScript','Rust'],
      frameworks: ['Unity','Unreal Engine','Godot','Pygame','MonoGame'],
      libraries: ['PhysX','Box2D','FMOD','OpenAL'],
      tools: ['Blender','Maya','Photoshop','Aseprite','Visual Studio','Steam SDK'] },
    { id: '00000000-0000-0000-0000-000000000012', name: 'Blockchain & Web3',
      languages: ['Solidity','Rust','Go','JavaScript','TypeScript'],
      frameworks: ['Hardhat','Foundry','Truffle','Anchor'],
      libraries: ['Ethers.js','Web3.js','OpenZeppelin','Wagmi','IPFS'],
      tools: ['MetaMask','Remix IDE','Infura','Alchemy','Chainlink','Tenderly'] },
    { id: '00000000-0000-0000-0000-000000000013', name: 'Database Engineering',
      languages: ['SQL','PL/pgSQL','Python','Java'],
      frameworks: ['PostgreSQL','MySQL','SQLite','Microsoft SQL Server','Oracle DB'],
      libraries: ['MongoDB','Redis','Cassandra','DynamoDB','Elasticsearch','Neo4j','InfluxDB'],
      tools: ['DBeaver','pgAdmin','DataGrip','MongoDB Compass','dbt','Airflow','Snowflake','BigQuery'] },
    { id: '00000000-0000-0000-0000-000000000014', name: 'Embedded Systems & IoT',
      languages: ['C','C++','Rust','Python','Assembly','MicroPython'],
      frameworks: ['FreeRTOS','Zephyr RTOS','Arduino','ESP-IDF','Mbed OS'],
      libraries: ['LVGL','TinyML','OpenCV (Lite)','MQTT'],
      tools: ['STM32CubeIDE','Arduino IDE','PlatformIO','KiCad','Proteus','AWS IoT','Azure IoT Hub'] },
    { id: '00000000-0000-0000-0000-000000000015', name: 'Computer Networks & IT Infrastructure',
      languages: ['Python','Bash','Go'],
      frameworks: ['Cisco IOS','OpenWRT','pfSense','GNS3'],
      libraries: ['Scapy','Netmiko','Nornir','Paramiko'],
      tools: ['Wireshark','Cisco Packet Tracer','GNS3','PRTG','Nagios','Zabbix','VMware','Active Directory'] },
    { id: '00000000-0000-0000-0000-000000000016', name: 'Software Testing & QA',
      languages: ['Python','Java','JavaScript','TypeScript','C#'],
      frameworks: ['Selenium','Playwright','Cypress','Appium','Robot Framework','pytest','Jest'],
      libraries: ['Faker','Locust','k6','Allure'],
      tools: ['Postman','JMeter','SonarQube','JIRA','TestRail','BrowserStack','Docker'] },
    { id: '00000000-0000-0000-0000-000000000017', name: 'Computer Vision',
      languages: ['Python','C++','MATLAB'],
      frameworks: ['OpenCV','TensorFlow','PyTorch','MediaPipe','YOLO','Detectron2'],
      libraries: ['NumPy','Pillow','scikit-image','Albumentations','torchvision','ONNX'],
      tools: ['Jupyter','CUDA','TensorRT','Roboflow','Label Studio','Weights & Biases','CVAT'] },
    { id: '00000000-0000-0000-0000-000000000018', name: 'Natural Language Processing',
      languages: ['Python','JavaScript','Java'],
      frameworks: ['Hugging Face Transformers','SpaCy','NLTK','LangChain','LlamaIndex','Rasa'],
      libraries: ['sentence-transformers','faiss-cpu','chromadb','pinecone','openai','tiktoken'],
      tools: ['Jupyter','Weights & Biases','Colab','CUDA','Streamlit','Gradio','Docker'] },
    { id: '00000000-0000-0000-0000-000000000019', name: 'Data Engineering',
      languages: ['Python','Scala','Java','SQL','Bash'],
      frameworks: ['Apache Spark','Apache Kafka','Apache Flink','dbt','Airflow','Prefect'],
      libraries: ['PySpark','Pandas','SQLAlchemy','Great Expectations','Delta Lake'],
      tools: ['Hadoop','Databricks','Snowflake','BigQuery','Redshift','Airbyte','Fivetran','Docker'] },
    { id: '00000000-0000-0000-0000-000000000020', name: 'Site Reliability Engineering',
      languages: ['Go','Python','Bash','Rust'],
      frameworks: ['Kubernetes','Terraform','Helm','Ansible','Istio'],
      libraries: ['Prometheus client','OpenTelemetry','Grafana SDK'],
      tools: ['Prometheus','Grafana','Datadog','PagerDuty','Jaeger','Loki','ArgoCD','AWS','GCP'] },
    { id: '00000000-0000-0000-0000-000000000021', name: 'AR / VR Development',
      languages: ['C#','C++','JavaScript','Swift','Kotlin'],
      frameworks: ['Unity','Unreal Engine','A-Frame','Three.js','ARCore','ARKit','Vuforia'],
      libraries: ['OpenXR','WebXR','MRTK'],
      tools: ['Meta Quest SDK','HoloLens SDK','Blender','Substance Painter','Figma','Rider'] },
    { id: '00000000-0000-0000-0000-000000000022', name: 'Robotics',
      languages: ['Python','C++','MATLAB','Rust'],
      frameworks: ['ROS','ROS 2','Gazebo','MoveIt','Nav2'],
      libraries: ['NumPy','SciPy','tf2_ros','rclpy','OMPL','Eigen'],
      tools: ['RViz','Arduino','Raspberry Pi','NVIDIA Jetson','Webots','CoppeliaSim'] },
    { id: '00000000-0000-0000-0000-000000000023', name: 'Quantum Computing',
      languages: ['Python','Q#','Julia','C++'],
      frameworks: ['Qiskit','Cirq','PennyLane','Braket SDK','QuTiP'],
      libraries: ['NumPy','SciPy','sympy','autograd'],
      tools: ['IBM Quantum','Google Quantum AI','Amazon Braket','Azure Quantum','Jupyter'] },
    { id: '00000000-0000-0000-0000-000000000024', name: 'IT Support & System Administration',
      languages: ['Bash','PowerShell','Python'],
      frameworks: ['Active Directory','Group Policy','LDAP','Exchange','Intune'],
      libraries: ['Ansible','Puppet','Chef'],
      tools: ['Windows Server','Linux','VMware','Hyper-V','ServiceNow','JIRA','Nagios','Zabbix','Splunk','Veeam'] },
    { id: '00000000-0000-0000-0000-000000000025', name: 'MLOps',
      languages: ['Python','Bash','Go'],
      frameworks: ['MLflow','Kubeflow','BentoML','Seldon Core','Ray','Feast'],
      libraries: ['scikit-learn','PyTorch','ONNX','Great Expectations','Evidently AI'],
      tools: ['Docker','Kubernetes','Airflow','DVC','Weights & Biases','SageMaker','Vertex AI','GitHub Actions'] },
    { id: '00000000-0000-0000-0000-000000000026', name: 'Systems Programming',
      languages: ['C','C++','Rust','Assembly','Go','Zig'],
      frameworks: ['POSIX','Win32 API','LLVM','GCC','Clang','pthreads'],
      libraries: ['Boost','Abseil','Intel TBB','libuv','libevent','jemalloc'],
      tools: ['GDB','LLDB','Valgrind','AddressSanitizer','Perf','CMake','Meson','Ninja'] },
    { id: '00000000-0000-0000-0000-000000000027', name: 'Business Intelligence & Analytics',
      languages: ['SQL','Python','R','DAX'],
      frameworks: ['dbt','Looker LookML','Apache Superset','Metabase'],
      libraries: ['Pandas','NumPy','Plotly','Seaborn','Altair'],
      tools: ['Tableau','Power BI','Looker','Google Data Studio','Snowflake','BigQuery','Excel','Fivetran'] },
    { id: '00000000-0000-0000-0000-000000000028', name: 'API Development & Integration',
      languages: ['JavaScript','TypeScript','Python','Go','Java'],
      frameworks: ['Express.js','FastAPI','Django REST Framework','Spring Boot','NestJS','Gin'],
      libraries: ['Axios','Pydantic','Zod','Yup','OpenAPI','Swagger UI'],
      tools: ['Postman','Insomnia','Swagger','API Gateway','RabbitMQ','Kafka','Redis','Docker'] },
    { id: '00000000-0000-0000-0000-000000000029', name: 'Compiler Design & Programming Languages',
      languages: ['C','C++','Rust','OCaml','Haskell','Python'],
      frameworks: ['LLVM','ANTLR','Bison','Flex','Cranelift','Tree-sitter'],
      libraries: ['lalrpop','nom','chumsky','logos'],
      tools: ['GCC','Clang','Valgrind','GDB','Perf','CMake','Nix','Racket'] },
    { id: '00000000-0000-0000-0000-000000000030', name: 'Digital Forensics & Incident Response',
      languages: ['Python','Bash','PowerShell','C','Go'],
      frameworks: ['Autopsy','Volatility','The Sleuth Kit','YARA'],
      libraries: ['pefile','scapy','impacket','yara-python'],
      tools: ['Autopsy','FTK Imager','Wireshark','Splunk','Elastic SIEM','TheHive','MISP','Kali Linux','REMnux'] },
  ];

  // Load domains and current user skills on mount
  useEffect(() => {
    async function loadData() {
      setFetchingData(true);
      try {
        // Upsert all domains so DB is always complete
        await supabase.from('domains').upsert(
          ALL_DOMAINS.map(d => ({
            id: d.id,
            name: d.name,
            languages: JSON.stringify(d.languages),
            frameworks: JSON.stringify(d.frameworks),
            libraries: JSON.stringify(d.libraries),
            tools: JSON.stringify(d.tools),
          })),
          { onConflict: 'id', ignoreDuplicates: false }
        );

        // Fetch all domains from DB (now guaranteed complete)
        const { data: domainData, error: domainErr } = await supabase
          .from('domains')
          .select('id, name, languages, frameworks, libraries, tools')
          .order('name');
        if (domainErr) throw domainErr;
        setDomains(domainData || []);

        // Fetch user's current skills
        const currentUser = await getCurrentUser();
        if (currentUser) {
          const { data: skillData } = await supabase
            .from('user_skills')
            .select('skill_name, proficiency_level')
            .eq('user_id', currentUser.id);
          setUserSkills((skillData || []).map((s: any) => s.skill_name));
        }
      } catch (e: any) {
        setError(e.message || 'Failed to load data');
      } finally {
        setFetchingData(false);
      }
    }
    loadData();
  }, []);

  function handleAnalyze() {
    if (!selectedDomainId) return;

    const domain = domains.find(d => d.id === selectedDomainId);
    if (!domain) return;

    setLoading(true);
    setResult(null);

    // Get all skills required for the selected role
    const requiredSkills = parseDomainSkills(domain);

    const userSkillsLower = userSkills.map(s => s.toLowerCase());

    const matchedSkills: string[] = [];
    const missingSkills: string[] = [];

    requiredSkills.forEach(skill => {
      if (userSkillsLower.includes(skill.toLowerCase())) {
        matchedSkills.push(skill);
      } else {
        missingSkills.push(skill);
      }
    });

    // For now we treat all matched skills as fine; extend with proficiency check if needed
    const weakSkills: string[] = [];

    // Chart data for graph
    const chartData = requiredSkills.slice(0, 10).map(skill => ({
      skill,
      yourScore: userSkillsLower.includes(skill.toLowerCase()) ? 1 : 0,
      required: 1,
      status: userSkillsLower.includes(skill.toLowerCase()) ? 'matched' : 'missing'
    }));

    // Build simple next steps
    const nextSteps: string[] = [];
    if (missingSkills.length === 0 && weakSkills.length === 0) {
      nextSteps.push('Great job! You have all the core skills for this role.');
      nextSteps.push('Consider building projects to strengthen your portfolio.');
      nextSteps.push('Look into advanced topics and specialisations in this domain.');
    } else {
      if (missingSkills.length > 0) {
        nextSteps.push(`Start learning the missing skills: focus on ${missingSkills.slice(0, 3).join(', ')} first.`);
      }
      if (weakSkills.length > 0) {
        nextSteps.push(`Improve your proficiency in: ${weakSkills.slice(0, 3).join(', ')}.`);
      }
      nextSteps.push('Head to the Resource Library to find courses and tutorials for these skills.');
      nextSteps.push('Build small projects to apply what you learn — hands-on practice is key.');
    }

    setResult({
      jobRole: domain.name,
      matchedSkills,
      missingSkills,
      weakSkills,
      nextSteps,
      chartData
    });

    setLoading(false);
  }

  // ── Render ─────────────────────────────────────────────────────────────────

  if (fetchingData) {
    return (
      <div className="flex items-center justify-center min-h-[40vh]">
        <p className="text-zinc-500 text-sm">Loading...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-lg mx-auto mt-10 p-6 bg-rose-500/10 border border-rose-500/20 rounded-2xl text-center">
        <p className="text-rose-400 text-sm">{error}</p>
      </div>
    );
  }

  const matchPercent = result
    ? Math.round((result.matchedSkills.length / (result.matchedSkills.length + result.missingSkills.length || 1)) * 100)
    : 0;

  return (
    <div className="max-w-3xl mx-auto pb-20 space-y-8">

      {/* ── Header ── */}
      <div className="border-b border-white/5 pb-8">
        <h1 className="text-3xl font-bold text-white tracking-tight">Skill Gap Checker</h1>
        <p className="text-zinc-500 text-sm mt-2">
          Select a job role to see which skills you already have and what you still need to learn.
        </p>
      </div>

      {/* ── Role Selector ── */}
      <div className="bg-zinc-900 border border-white/10 rounded-2xl p-6 space-y-4">
        <label className="block text-xs font-semibold text-zinc-400 uppercase tracking-widest">
          Select a Job Role
        </label>

        {/* Searchable input with suggestions */}
        <div className="relative" ref={suggestionsRef}>
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500 pointer-events-none" />
          <input
            ref={inputRef}
            type="text"
            placeholder="Type a role e.g. Frontend, DevOps..."
            value={searchInput}
            onChange={e => {
              setSearchInput(e.target.value);
              setShowSuggestions(true);
              // Clear selection if user edits
              if (selectedDomainId) { setSelectedDomainId(''); setResult(null); }
            }}
            onFocus={() => setShowSuggestions(true)}
            onBlur={() => setTimeout(() => setShowSuggestions(false), 150)}
            className="w-full bg-black/60 border border-white/10 text-white rounded-xl pl-11 pr-10 py-3 text-sm focus:outline-none focus:border-blue-500 transition-colors placeholder:text-zinc-600"
          />
          {searchInput && (
            <button
              onMouseDown={e => e.preventDefault()}
              onClick={() => { setSearchInput(''); setSelectedDomainId(''); setResult(null); inputRef.current?.focus(); }}
              className="absolute right-3 top-1/2 -translate-y-1/2"
            >
              <X className="w-4 h-4 text-zinc-500 hover:text-white transition-colors" />
            </button>
          )}

          {/* Suggestions dropdown */}
          {showSuggestions && (
            <div className="absolute z-20 top-full left-0 right-0 mt-1 bg-zinc-900 border border-white/10 rounded-xl overflow-hidden shadow-xl">
              {domains
                .filter(d => !searchInput || d.name.toLowerCase().includes(searchInput.toLowerCase()))
                .map(d => (
                  <button
                    key={d.id}
                    onMouseDown={e => e.preventDefault()}
                    onClick={() => {
                      setSelectedDomainId(d.id);
                      setSearchInput(d.name);
                      setShowSuggestions(false);
                      setResult(null);
                    }}
                    className={`w-full text-left px-4 py-3 text-sm transition-colors flex items-center justify-between
                      ${selectedDomainId === d.id
                        ? 'bg-blue-600/20 text-blue-300'
                        : 'text-zinc-300 hover:bg-white/5 hover:text-white'
                      }`}
                  >
                    {d.name}
                    {selectedDomainId === d.id && (
                      <CheckCircle className="w-4 h-4 text-blue-400 shrink-0" />
                    )}
                  </button>
                ))
              }
              {domains.filter(d => !searchInput || d.name.toLowerCase().includes(searchInput.toLowerCase())).length === 0 && (
                <p className="px-4 py-3 text-zinc-600 text-sm">No matching roles found</p>
              )}
            </div>
          )}
        </div>

        {/* Selected role pill */}
        {selectedDomainId && (
          <p className="text-xs text-blue-400">
            ✓ Selected: <span className="font-semibold">{searchInput}</span>
          </p>
        )}

        <button
          onClick={handleAnalyze}
          disabled={loading || !selectedDomainId}
          className="w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold py-3 rounded-xl text-sm transition-colors flex items-center justify-center gap-2"
        >
          {loading ? 'Analyzing...' : (
            <>
              <Target className="w-4 h-4" />
              Analyze My Skills
            </>
          )}
        </button>
      </div>

      {/* ── Results ── */}
      {result && (
        <div className="space-y-6">

          {/* Summary Bar */}
          <div className="bg-zinc-900 border border-white/10 rounded-2xl p-6">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-white font-bold text-base">{result.jobRole}</h2>
              <BarChart3 className="w-5 h-5 text-blue-400" />
              <span className="text-blue-400 font-bold text-lg">{matchPercent}% Match</span>
            </div>
            <div className="h-2 bg-zinc-800 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-emerald-500 to-blue-600 rounded-full transition-all duration-700"
                style={{ width: `${matchPercent}%` }}
              />
            </div>
            <p className="text-zinc-500 text-xs mt-2">
              You have {result.matchedSkills.length} of {result.matchedSkills.length + result.missingSkills.length} required skills
            </p>
          </div>

          {/* Analyzer Graph */}
          <div className="bg-zinc-900/50 border border-white/10 rounded-2xl p-6">
            <h3 className="text-white font-semibold text-base mb-4 flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-blue-400" />
              Skill Gap Analyzer (Top 10 Skills)
            </h3>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={result!.matchedSkills.slice(0, 10).concat(result!.missingSkills.slice(0, 10)).map(skill => ({
                  skill,
                  yourScore: result!.matchedSkills.some(s => s.toLowerCase().includes(skill.toLowerCase())) ? 1 : 0,
                  required: 1
                }))}>
</xai:function_call >

<xai:function_call name="edit_file">
<parameter name="path">src/pages/SkillAnalysis.tsx
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--muted)/0.2)" vertical={false} />
                  <XAxis dataKey="skill" angle={-45} height={80} tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 11 }} tickLine={false} axisLine={false} />
                  <YAxis type="number" domain={[0, 1]} tickLine={false} axisLine={false} tick={{ fill: 'hsl(var(--muted-foreground))' }} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: 'hsl(var(--background))', border: '1px solid hsl(var(--muted))', borderRadius: '8px' }}
                    labelStyle={{ color: 'hsl(var(--foreground))' }}
                    itemStyle={{ color: 'hsl(var(--foreground))' }}
                  />
                  <Bar dataKey="required" stackId="a" fill="hsl(var(--muted)/0.3)" name="Required" />
                  <Bar dataKey="yourScore" stackId="a" fill="#10b981" name="Your Level">
                    {result!.matchedSkills.slice(0, 10).concat(result!.missingSkills.slice(0, 10)).map((skill, index) => (
                      <Cell key={`cell-${index}`} fill={result!.matchedSkills.some(s => s === skill) ? "#10b981" : "#ef4444"} />
                    ))}

                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
            <p className="text-zinc-500 text-xs mt-3 text-center">
              Green = You have it | Red = Gap to fill
            </p>
          </div>

          {/* Skills to Improve */}
          {result.weakSkills.length > 0 && (
            <div className="bg-zinc-900 border border-amber-500/20 rounded-2xl p-6">
              <h3 className="flex items-center gap-2 text-amber-400 font-semibold text-sm mb-4">
                <AlertCircle className="w-4 h-4" />
                Skills to Improve ({result.weakSkills.length})
              </h3>
              <div className="flex flex-wrap gap-2">
                {result.weakSkills.map(skill => (
                  <span key={skill} className="px-3 py-1 bg-amber-500/10 border border-amber-500/20 text-amber-300 text-xs rounded-lg font-medium">
                    {skill}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Next Steps */}
          <div className="bg-zinc-900 border border-blue-500/20 rounded-2xl p-6">
            <h3 className="text-blue-400 font-semibold text-sm mb-4">What To Do Next</h3>
            <ol className="space-y-3">
              {result.nextSteps.map((step, i) => (
                <li key={i} className="flex items-start gap-3">
                  <span className="shrink-0 w-5 h-5 rounded-full bg-blue-600/20 border border-blue-500/30 text-blue-400 text-[10px] font-bold flex items-center justify-center mt-0.5">
                    {i + 1}
                  </span>
                  <p className="text-zinc-300 text-sm leading-relaxed">{step}</p>
                </li>
              ))}
            </ol>
          </div>

          {/* CTA to Library */}
          <button
            onClick={() => onNavigate('library')}
            className="w-full flex items-center justify-center gap-2 bg-white/5 hover:bg-white/10 border border-white/10 text-white font-semibold py-4 rounded-2xl text-sm transition-colors"
          >
            <BookOpen className="w-4 h-4" />
            Find Learning Resources for This Role
            <ArrowRight className="w-4 h-4" />
          </button>

        </div>
      )}
    </div>
  );
}