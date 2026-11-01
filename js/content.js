/**
 * content.js — EVERYTHING written on the site lives here.
 *
 * Edit text, projects, experience, skills and links below; the layout code in
 * render.js turns these objects into HTML. You should never need to touch the
 * other files to update content.
 *
 * Logos: `icon` fields are Simple Icons slugs (https://simpleicons.org — the
 * slug is the lowercase name in the icon's URL). Some brands (IBM, AWS, OpenAI)
 * aren't on Simple Icons; leave those empty to show a neutral award icon. Education `logo` can point to an image in assets/.
 */

const GITHUB = 'https://github.com/DHEERAJA007';
const LINKEDIN = 'https://in.linkedin.com/in/dheeraj-alahari-5b158b268';
const EMAIL = 'amsdheeraj.007@gmail.com';

export const content = {
  person: {
    name: 'Dheeraj Alahari',
  },

  /* ---------- Top bar ---------- */
  topbar: {
    // Shown top-left; the first line is red
    roles: ['Dheeraj', 'Alahari'],
    status: 'Open to work',
  },
  nav: [
    { label: 'Work', href: '#work' },
    { label: 'Experience', href: '#experience' },
    { label: 'Skills', href: '#skills' },
    { label: 'Contact', href: '#contact' },
  ],

  /* ---------- Hero ---------- */
  hero: {
    hello: "Hi, I'm",
    // The giant word across the top of the hero
    bigName: 'Dheeraj Alahari',
    role: ['Computer Science', 'Enthusiast'],
    // One paragraph per entry
    about: [
      'I’m a Computer Science graduate from VIT who loves turning raw data into things people can use — credit-risk models, intrusion detection, live telemetry dashboards and clean backend APIs.',
      'Along the way I’ve led a 400+ member maths society and run the tech side of a 700+ student cultural club.',
      'I’m also a football and F1 addict — and I love working on that data too: lap times, race telemetry, match stats and everything in between.',
    ],
    location: 'Based in India · Open to work',
    photo: {
      // Background removed, so the page shows through around you
      src: 'assets/portrait-cutout.webp',
      alt: 'Portrait of Dheeraj Alahari',
      width: 800,
      height: 1000,
    },
    // Numbers count up when scrolled into view
    stats: [
      { value: 10, suffix: '+', label: ['Projects', 'Built'] },
      { value: 15, suffix: '+', label: ['Technologies', 'Used'] },
      { value: 400, suffix: '+', label: ['Members', 'Led'] },
    ],
  },

  /* ---------- Selected projects (3 per row on laptops) ---------- */
  projects: {
    title: 'Selected Projects',
    viewAll: { label: 'View all on GitHub', href: GITHUB },
    items: [
      {
        title: 'Credit Risk Assessment',
        kicker: 'Machine Learning · FastAPI',
        description:
          'Predicts creditworthiness in real time: a hybrid ML model and WoE scorecard estimate the probability of default and turn it into a 300–900 credit score, served through FastAPI.',
        tech: ['Python', 'FastAPI', 'Scikit-learn', 'Pandas'],
        image: 'assets/project-credit.svg',
        alt: 'Mock screen of the credit risk app showing a credit score gauge and probability of default',
        links: { code: `${GITHUB}/Credit-web-interface`, live: '' },
      },
      {
        title: 'Intrusion Detection with ML',
        kicker: 'Cybersecurity · Machine Learning',
        description:
          'Detects malicious network activity from traffic data (UNSW-NB15). Feature engineering plus Random Forest and Logistic Regression reach ~90%+ detection accuracy, evaluated with confusion matrices and ROC curves.',
        tech: ['Python', 'Scikit-learn', 'Pandas', 'Jupyter'],
        image: 'assets/project-ids.svg',
        alt: 'Mock screen of the intrusion detection results with a ROC curve and a confusion matrix',
        links: { code: `${GITHUB}/Intrusion-detection-Using-Machine-Learning`, live: '' },
      },
      {
        title: 'Connected Car Analytics',
        kicker: 'Real-time Data · Flask',
        description:
          'A live connected-car dashboard: a simulator streams vehicle telemetry every second into SQLite, a REST API serves it, and a HUD-style UI renders gauges, alerts, trip analytics and PDF reports.',
        tech: ['Python', 'Flask', 'SQLite', 'Chart.js'],
        image: 'assets/project-car.svg',
        alt: 'Mock screen of the car analytics dashboard with speed and RPM gauges and a live chart',
        links: { code: `${GITHUB}/Car-Analytics-Dashboard`, live: '' },
      },
      {
        title: 'UPI Statement Insights',
        kicker: 'Data Analytics · Streamlit',
        description:
          'An interactive finance dashboard that turns raw UPI bank statements into spending insights — category-wise expenses, trends over time and exportable PDF reports.',
        tech: ['Python', 'Pandas', 'Streamlit', 'Plotly'],
        image: 'assets/project-upi.svg',
        alt: 'Mock screen of the UPI dashboard with a spending-by-category donut chart and monthly bars',
        links: { code: `${GITHUB}/UPI-Dashboard`, live: '' },
      },
      {
        title: 'Real-Time Face Recognition',
        kicker: 'Computer Vision · OpenCV',
        description:
          'Recognises faces live from a webcam: Haar Cascades detect faces, an LBPH model trained on captured samples identifies them, and results are labelled on screen — fully offline.',
        tech: ['Python', 'OpenCV', 'NumPy'],
        image: 'assets/project-face.svg',
        alt: 'Mock screen of the face recognition app with a labelled bounding box around a face',
        links: { code: `${GITHUB}/Face-recognisation`, live: '' },
      },
      {
        title: 'To-Do App with CI/CD',
        kicker: 'DevOps · Flask',
        description:
          'A Flask + SQLite task manager shipped like production software: Pytest unit tests, a Docker image and a GitHub Actions pipeline that tests and builds on every push.',
        tech: ['Flask', 'Docker', 'GitHub Actions', 'Pytest'],
        image: 'assets/project-todo.svg',
        alt: 'Mock screen of the to-do app next to a passing CI pipeline',
        links: { code: `${GITHUB}/TO-DO-APP`, live: '' },
      },
    ],
  },

  /* ---------- Experience (rendered as a data pipeline) ---------- */
  experience: {
    title: 'Experience',
    intro: 'Leadership and creative roles at VIT — each stage feeds the next.',
    // `stage` is the small red label on each card. Add or remove entries freely.
    items: [
      {
        stage: 'Leadership',
        role: 'Vice-Chairperson',
        org: 'VITMAS — VIT Mathematical Association',
        period: 'Feb 2024 – Jan 2025',
        points: [
          'Led a 400+ member society running workshops, Olympiads and technical talks with professors and external speakers.',
          'Planned flagship events and represented the club in inter-chapter and student-welfare meetings.',
        ],
        tech: ['Leadership', 'Event Ops', 'Outreach'],
      },
      {
        stage: 'Design & Tech',
        role: 'Technical Head',
        org: 'Sahiti TLA — VIT’s Telugu cultural club',
        period: 'Feb 2025 – Mar 2026',
        points: [
          'Led photography, video editing, web design and Figma creatives for the club’s events and online presence.',
          'Ran technical support for stage and online events attended by 700+ students.',
        ],
        tech: ['Figma', 'Web Design', 'Video', 'Photography'],
      },
    ],
    // Final node of the pipeline
    end: { label: 'Next stage', text: 'Your team?', cta: { label: 'Get in touch', href: '#contact' } },
  },

  /* ---------- Education ---------- */
  education: {
    title: 'Education',
    // badge: short monogram shown when there is no logo image
    items: [
      { degree: 'B.Tech in Computer Science', school: 'Vellore Institute of Technology, Vellore', period: '2022 – 2026', badge: 'VIT', logo: '' },
      { degree: 'Intermediate (MPC)', school: 'Vowel College, Nellore', period: '2020 – 2022', badge: 'VC', logo: '' },
    ],
    certifications: [
      { name: 'Blockchain Developer', issuer: 'IBM', icon: 'hyperledger', href: 'https://courses.vit.skillsnetwork.site/certificates/d47c956fc23e4f259d723192f48f4fd7' },
      { name: 'AWS Solutions Architect Associate (course)', issuer: 'GeeksforGeeks', icon: '', href: 'https://www.geeksforgeeks.org/certificate/6ae557faae6d07ad4e93e25634eb93a4' },
      { name: 'Mastering Generative AI & ChatGPT', issuer: 'GeeksforGeeks', icon: '', href: 'https://www.geeksforgeeks.org/certificate/e0e2bf777ae60ebeb6b13eee3c77803d' },
      { name: 'Golang Programming', issuer: 'GeeksforGeeks', icon: 'go', href: 'https://www.geeksforgeeks.org/certificate/19f43247326ac0895847a0c6bc9079e9' },
      { name: 'Intro to Machine Learning', issuer: 'Kaggle', icon: 'kaggle', href: '' }, // add your certificate URL here
    ],
  },

  /* ---------- Skills ---------- */
  skills: {
    title: 'Skills',
    // Each group is a "chip" on the circuit board; hover a group to light up its traces.
    groups: [
      { name: 'Languages', items: [
        { name: 'Python', icon: 'python' }, { name: 'Java', icon: 'openjdk' }, { name: 'C / C++', icon: 'cplusplus' },
        { name: 'SQL', icon: 'mysql' }, { name: 'JavaScript', icon: 'javascript' }, { name: 'Go', icon: 'go' },
      ] },
      { name: 'ML & Data', items: [
        { name: 'Scikit-learn', icon: 'scikitlearn' }, { name: 'Pandas', icon: 'pandas' }, { name: 'NumPy', icon: 'numpy' },
        { name: 'OpenCV', icon: 'opencv' }, { name: 'Streamlit', icon: 'streamlit' }, { name: 'Plotly', icon: 'plotly' },
      ] },
      { name: 'Backend & Web', items: [
        { name: 'FastAPI', icon: 'fastapi' }, { name: 'Flask', icon: 'flask' }, { name: 'REST APIs', icon: 'openapiinitiative' },
        { name: 'MongoDB', icon: 'mongodb' }, { name: 'MySQL', icon: 'mysql' }, { name: 'HTML / CSS', icon: 'html5' },
      ] },
      { name: 'Tools & DevOps', items: [
        { name: 'Git', icon: 'git' }, { name: 'Docker', icon: 'docker' }, { name: 'GitHub Actions', icon: 'githubactions' },
        { name: 'Pytest', icon: 'pytest' }, { name: 'Linux', icon: 'linux' }, { name: 'Postman', icon: 'postman' },
      ] },
    ],
  },

  /* ---------- Quote card ---------- */
  quote: {
    text: 'Good software isn’t just how it looks — it’s how reliably it works.',
    signature: 'Dheeraj',
    cta: { label: 'Let’s build something reliable together', href: '#contact' },
  },

  /* ---------- Contact ---------- */
  contact: {
    title: ['Let’s work', 'together'],
    text: 'I’m open to full-time roles, internships and collaborations in software, data and ML. If you have a problem worth solving, let’s talk.',
    cta: { label: 'Open to work', href: `mailto:${EMAIL}` },
    // Glass cards — icon: mail | github | linkedin | globe | phone | pin
    socials: [
      { icon: 'mail', title: 'Email', note: 'Drop me a line', href: `mailto:${EMAIL}` },
      { icon: 'github', title: 'GitHub', note: 'See my code', href: GITHUB },
      { icon: 'linkedin', title: 'LinkedIn', note: 'Let’s connect', href: LINKEDIN },
    ],
    // Rotating "Contact me" badge on the right
    badge: { heading: 'Contact me', ring: 'Contact me • Let’s talk • ', href: `mailto:${EMAIL}` },
  },

  /* ---------- Footer ---------- */
  footer: {
    note: 'Designed & built by Dheeraj Alahari',
    links: [
      { label: 'GitHub', href: GITHUB },
      { label: 'LinkedIn', href: LINKEDIN },
      { label: 'Email', href: `mailto:${EMAIL}` },
    ],
  },
};
