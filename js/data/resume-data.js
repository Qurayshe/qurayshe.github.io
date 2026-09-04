/**
 * Resume Data Store
 * Persona: qurayshe (Developer // Designer, Computer Engineer)
 * Sanitized of personal identification (no name, email, or phone).
 */

export const RESUME_DATA = {
  profile: {
    handle: 'qurayshe',
    title: 'DEVELOPER // DESIGNER',
    subtitle: 'Computer Engineer \u2022 Systems \u2022 Machine Learning \u2022 3D Creative Tech',
    badge: 'VIRGINIA TECH ALUM \u2022 BS COMPUTER ENGINEERING',
    location: 'Blacksburg, VA / International',
    github: 'https://github.com/qurayshe',
    objective:
      'To secure a suitable position as a Computer Engineer where I can further my education, gain experience and serve the host organization in the process, while also evolving & diversifying my own skillset.'
  },

  summary: {
    overview:
      'Computer Engineer, software developer, and creative technologist with a versatile cross-disciplinary foundation spanning low-level C++ systems, machine learning pipelines in Python and R, full-stack web infrastructure, embedded electronics, and 3D computer graphics.',
    highlights: [
      {
        icon: 'silicon',
        title: 'Hardware & Embedded',
        desc: 'DIY enthusiast with BIOS & vBIOS modding experience; circuit design with Cadence Virtuoso, LTSpice, and KiCad; electric skateboards (esk8), Apple hardware repair, and robotics.'
      },
      {
        icon: 'cpu',
        title: 'Software & Systems',
        desc: 'C++ workflows for desktop and CLI programs, Java Android app development, Red Hat and Ubuntu servers, POP/IMAP email infrastructure, and cPanel/WHM database management.'
      },
      {
        icon: 'brain',
        title: 'Machine Learning & AI',
        desc: 'Predictive health monitoring (PHM) diagnostics for power electronic converters, computer vision with OpenCV, and market sentiment NLP research in Python and R (Anaconda).'
      },
      {
        icon: 'shield',
        title: 'Security & Pentesting',
        desc: 'Reverse engineering and security environments utilizing Kali Linux, IDA Pro, Cheat Engine disassembly tables, and W32DASM.'
      },
      {
        icon: 'cube',
        title: '3D Graphics & Game Dev',
        desc: 'Real-time 3D simulation and VR development in Unreal Engine 4/5, Unity, and Godot, accompanied by full modeling and rigging in Blender, ZBrush, and Maya.'
      },
      {
        icon: 'music',
        title: 'Sound & Visual Media',
        desc: 'Digital music composition (FL Studio 20, Omnisphere, Steinberg VG, BBC Symphony Orchestra) with ABRSM Grade 8 piano accreditation; video editing in Premiere & After Effects.'
      }
    ],
    languages: [
      { name: 'English', level: 'Fluent / Native Proficiency' },
      { name: 'Persian', level: 'Fluent / Native Proficiency' }
    ]
  },

  education: [
    {
      id: 'edu-vt',
      institution: 'Virginia Tech',
      degree: 'B.S. in Computer Engineering',
      year: '2023',
      location: 'Blacksburg, Virginia',
      logo: 'assets/images/logovt.png',
      logoFallback: 'assets/img/logovt.png',
      badge: 'BS CpE',
      highlights: [
        'Curriculum focus on computer systems architecture, embedded circuits, and software engineering.',
        'Major Design Experience (MDE) Capstone: Developed PHM ML diagnostic software (Best in Track Award 2022).',
        'Active contributor to academic research laboratories in VR exhibits and machine learning.'
      ]
    },
    {
      id: 'edu-daa',
      institution: 'Dubai American Academy',
      degree: 'Accredited International Baccalaureate (IB) Diploma',
      year: '2017',
      location: 'Dubai, UAE',
      logo: 'assets/images/logodaa.png',
      logoFallback: 'assets/img/logodaa.png',
      badge: 'IB Diploma',
      highlights: [
        'Rigorous accredited International Baccalaureate diploma program.',
        'Triple recipient of the prestigious Best in Music award (2014, 2015, 2016).'
      ]
    },
    {
      id: 'edu-jmc',
      institution: 'Jumeirah Music Centre',
      degree: 'Classical Piano ABRSM Grade 8 & Composition',
      year: '2013',
      location: 'Dubai, UAE',
      logo: 'assets/images/logojmc.png',
      logoFallback: 'assets/img/logojmc.png',
      badge: 'ABRSM 8',
      highlights: [
        'Associated Board of the Royal Schools of Music (ABRSM) Grade 8 certification in Piano & Music Theory.',
        'Two-time Best Solo Performance award winner (2008, 2011).'
      ]
    }
  ],

  experience: [
    {
      id: 'exp-collins',
      company: 'Collins Aerospace',
      role: 'Machine Learning Diagnostics Engineer (PHM)',
      period: '2021 \u2013 2022',
      logo: 'assets/images/logocollins.png',
      logoFallback: 'assets/img/logocollins.png',
      category: 'ml',
      summary:
        'Developed Prognostics and Health Management (PHM) machine learning software for diagnostic systems of power electronic converters.',
      bullets: [
        'Engineered predictive models in Python/Anaconda to estimate Remaining Useful Life (RUL) of mission-critical power converter components.',
        'Extracted degradation signatures and sensor time-series features to detect impending hardware anomalies prior to failure.',
        'Collaborated on engineering documentation and cross-disciplinary review for high-reliability aerospace electrical systems.',
        'Recognized with Best in Track at the Virginia Tech ECE Major Design Experience Expo 2022.'
      ],
      tags: ['Python', 'Machine Learning', 'PHM Diagnostics', 'Predictive Modeling', 'Power Electronics', 'Anaconda']
    },
    {
      id: 'exp-vtsffc',
      company: 'VT Science Fiction & Fantasy Club (VTSFFC)',
      role: 'Club President',
      period: '2021 \u2013 2023',
      logo: 'assets/images/logovtsffc.png',
      logoFallback: 'assets/img/logovtsffc.png',
      category: 'leadership',
      summary:
        'Served as Club President overseeing executive operations, university compliance, promotional media, and large-scale multi-club events.',
      bullets: [
        'Arranged general body and officer meetings, handled official university RSO paperwork, and led multi-club conventions.',
        'Created, received institutional approval for, and distributed physical and digital club promotional materials across campus.'
      ],
      tags: ['Club President', 'RSO Administration', 'Convention Leadership', 'Promotional Design', 'Executive Operations']
    },
    {
      id: 'exp-vt-aries',
      company: 'ARIES @ Virginia Tech',
      role: 'VR Developer & Simulation Researcher',
      period: '2020 \u2013 2022',
      logo: 'assets/images/logovt.png',
      logoFallback: 'assets/img/logovt.png',
      category: 'vr',
      summary:
        'Engineered immersive virtual reality environments and managed multi-display 360 projection systems.',
      bullets: [
        'Worked on Vauquois project\u2014an Unreal Engine 4-based VR exhibit containing a recreation of the town pre-WWI.',
        'Managed and calibrated immersive 360-degree VR projection systems.'
      ],
      tags: ['Unreal Engine 4', 'VR Development', '360 Systems', 'Simulation', 'Virtual Exhibits']
    },
    {
      id: 'exp-clicknpledge',
      company: 'Click & Pledge',
      role: 'Machine Learning & Software Intern',
      period: '2018 \u2013 2019',
      logo: 'assets/images/logoclicknpledge.png',
      logoFallback: 'assets/img/logoclicknpledge.png',
      category: 'ml',
      summary:
        'Developed custom machine learning software for processing and analyzing neuroheadset biosignal outputs.',
      bullets: [
        'Wrote ML programs for analyzing basic outputs of an EMOTIV EPOC+, as alternative to proprietary EEG app.',
        'Decoded and processed raw EEG telemetry streams for neurological pattern classification.'
      ],
      tags: ['Python', 'Machine Learning', 'EMOTIV EPOC+ (EEG)', 'Biosignal Analysis', 'Signal Processing']
    },
    {
      id: 'exp-vt-acis',
      company: 'ACIS @ Pamplin College of Business + Smith CEIP',
      role: 'Machine Learning & Data Science Research Assistant',
      period: '2019 \u2013 2020',
      logo: 'assets/images/logovt.png',
      logoFallback: 'assets/img/logovt.png',
      category: 'research',
      summary:
        'Conducted computational data science and machine learning research into online narrative diffusion and financial market impacts.',
      bullets: [
        'Provided R, Python, and Anaconda coding knowledge to ACIS research projects, including ML+AI research into fake news\u2019 impacts on markets and the detection of fake news stories.'
      ],
      tags: ['Python', 'R', 'Anaconda', 'Machine Learning', 'AI Research', 'Market Analytics']
    },
    {
      id: 'exp-motivate',
      company: 'Motivate Media Group',
      role: 'Digital Web & Advertising Production',
      period: '2015',
      logo: 'assets/images/logomotivate.png',
      logoFallback: 'assets/img/logomotivate.png',
      category: 'web',
      summary:
        'Engineered digital advertising assets and executed technical search engine optimization for major digital publications.',
      bullets: [
        'Produced interactive digital web banner ad campaigns for prominent automotive clients (Jeep).',
        'Implemented technical SEO enhancements, schema markup, and metadata optimizations across the WhatsOn web portal.',
        'Customized PHP codebase and styling within Motivate WordPress enterprise publishing templates.'
      ],
      tags: ['WordPress', 'PHP', 'Technical SEO', 'HTML/CSS/JS', 'Banner Advertising', 'Metadata Optimization']
    }
  ],

  skills: {
    tech: [
      {
        category: 'Game & VR Development',
        level: 'Advanced',
        tools: [
          'Unreal Engine 4 / 5',
          'Unity 3D',
          'Godot Engine',
          'OpenXR / SteamVR',
          'HLSL / GLSL Shaders',
          'Niagara FX',
          'Three.js / WebGL'
        ],
        desc: 'Interactive real-time 3D environments, VR exhibition systems (360), custom GLSL/HLSL shaders, physics simulations, particle systems (Niagara), and WebGL rendering.'
      },
      {
        category: 'Full-Stack C++ Development',
        level: 'Intermediate / Advanced',
        tools: [
          'C++ (C++17/20)',
          'CMake',
          'Visual Studio',
          'Clang / GCC',
          'GDB / LLDB',
          'Git / GitHub',
          'POSIX / Linux APIs',
          'Multithreading (std::thread)'
        ],
        desc: 'High-performance desktop applications, systems-level utilities, low-latency multithreaded architecture, memory profiling (ASan/Valgrind), and automated CMake build pipelines.'
      },
      {
        category: 'Machine Learning & AI Engineering',
        level: 'Intermediate / Advanced',
        tools: [
          'Python',
          'PyTorch',
          'Unsloth',
          'Hugging Face (Transformers/PEFT)',
          'vLLM / Ollama',
          'OpenCV',
          'NumPy / SciPy',
          'Pandas',
          'Scikit-Learn',
          'R / Anaconda'
        ],
        desc: 'LLM fine-tuning & quantization (Unsloth, LoRA/QLoRA), deep neural networks (PyTorch), predictive health monitoring (PHM), sensor time-series forecasting, EEG biosignal telemetry, and OpenCV vision pipelines.'
      },
      {
        category: 'Web & Full-Stack Infrastructure',
        level: 'Intermediate / Advanced',
        tools: [
          'TypeScript',
          'JavaScript (ES6+)',
          'HTML5 / CSS3',
          'Node.js / Express',
          'PHP / WordPress',
          'REST APIs',
          'PostgreSQL / MySQL',
          'cPanel / WHM'
        ],
        desc: 'Responsive web architectures, modern TypeScript/JavaScript web applications, custom CMS theme engineering, RESTful microservices, relational databases, and hosting infrastructure.'
      },
      {
        category: 'Embedded Systems & Hardware Design',
        level: 'Hands-on DIY / Power User',
        tools: [
          'Cadence Virtuoso',
          'LTSpice',
          'KiCad',
          'VHDL / Verilog (FPGA)',
          'ARM Cortex / STM32',
          'I2C / SPI / UART',
          'Oscilloscopes & Logic Analyzers',
          'Micro-soldering & SMT Rework',
          'BIOS / vBIOS Modding',
          'VESC Firmware'
        ],
        desc: 'Analog & digital circuit simulation, multi-layer PCB schematic & layout routing, FPGA logic design, embedded firmware protocols (I2C/SPI/UART), micro-soldering component rework, and high-power ESC/VESC motor tuning.'
      },
      {
        category: 'Operating Systems & Security Pentesting',
        level: 'Practical / Power User',
        tools: [
          'Ubuntu Server',
          'Red Hat Enterprise Linux',
          'Kali Linux',
          'IDA Pro',
          'Ghidra',
          'Wireshark',
          'Docker',
          'Bash / Shell Scripting',
          'Nmap / Burp Suite',
          'x64dbg / GDB',
          'Reverse Engineering'
        ],
        desc: 'Linux server orchestration & hardening, containerization (Docker), static/dynamic binary disassembly (Ghidra, IDA Pro), memory introspection, packet inspection (Wireshark), and network penetration testing.'
      },
      {
        category: 'Mobile Application Development',
        level: 'Intermediate',
        tools: [
          'Java',
          'Kotlin',
          'Android SDK',
          'Android Studio',
          'Android NDK (JNI / C++)',
          'Jetpack Compose',
          'Gradle',
          'Sensors & Bluetooth LE'
        ],
        desc: 'Native Android software engineering, modern Kotlin & Jetpack Compose, native C++ NDK integration for high-performance computation, BLE peripherals, and hardware sensor telemetry.'
      }
    ],

    creativity: [
      {
        category: '3DCG Modeling & Animation',
        level: 'Advanced',
        tools: ['Blender', 'ZBrush', 'Maya', 'Source Filmmaker (SFM)'],
        desc: 'Polygonal hard-surface and organic sculpting, UV mapping, skeletal bone rigging, weight painting, and 3D character animation.'
      },
      {
        category: 'Video Editing & Motion Design',
        level: 'Advanced',
        tools: ['Adobe Premiere Pro', 'Adobe After Effects', 'Adobe Illustrator'],
        desc: 'Cinematic video editing, motion graphics, audio sync, sound effects (SFX), keyframe compositing, and visual FX.'
      },
      {
        category: 'Digital Music Composition',
        level: 'Mastery / Classical Foundation',
        tools: ['FL Studio 20', 'Omnisphere', 'Steinberg Virtual Guitarist', 'BBC Symphony Orchestra (BBCSO)', 'Kontakt'],
        desc: 'Orchestral and synthetic music composition, MIDI orchestration, multi-track mixing/mastering, supported by ABRSM Grade 8 classical piano training.'
      },
      {
        category: 'Digital Art & Graphic Design',
        level: 'Advanced',
        tools: ['Adobe Photoshop', 'Clip Studio Paint (CSP)', 'Adobe Illustrator', 'Adobe InDesign'],
        desc: 'Digital concept art, vector typography, brand identity, convention posters, web banners, and editorial layout design.'
      }
    ]
  },

  awards: [
    {
      id: 'award-vt',
      year: '2022',
      title: 'Best in Track Award',
      organization: 'Virginia Tech ECE Major Design Experience (MDE) Expo',
      logo: 'assets/images/logovt.png',
      logoFallback: 'assets/img/logovt.png',
      desc: 'First place honors for engineering a predictive machine learning software solution for power electronics converter health diagnostics.'
    },
    {
      id: 'award-daa',
      year: '2014, 2015, 2016',
      title: 'Best in Music Award (3x Consecutive Recipient)',
      organization: 'Dubai American Academy',
      logo: 'assets/images/logodaa.png',
      logoFallback: 'assets/img/logodaa.png',
      desc: 'Awarded top musical achievement three years consecutively for solo piano performance, orchestral composition, and musical arrangement.'
    },
    {
      id: 'award-jmc',
      year: '2008, 2011',
      title: 'Best Solo Performance Award',
      organization: 'Jumeirah Music Centre',
      logo: 'assets/images/logojmc.png',
      logoFallback: 'assets/img/logojmc.png',
      desc: 'Recognized for outstanding classical piano recital performance and interpretative mastery under ABRSM concert guidelines.'
    }
  ]
};

