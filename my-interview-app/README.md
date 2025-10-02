# 🎯 AI Interview App

An AI-powered interview preparation web app where candidates can upload their resume, answer AI-generated interview questions, and receive real-time evaluation with feedback and scoring.  

This project uses **React + Redux + TypeScript**, integrates **PDF parsing**, and provides a clean **dark/light themed UI** for an engaging interview experience.  

---

## 🚀 Features

- 📄 **Resume Upload & Parsing** – Upload PDF resumes, automatically extract candidate details.  
- 🤖 **AI-Driven Questions** – Generate and ask interview questions interactively.  
- 💬 **Chat-style Interface** – Candidate and bot messages displayed in a conversational UI.  
- ⏱ **Timer Support** – Track time for each question to simulate real interview conditions.  
- 📝 **Answer Recording** – Candidate responses stored for evaluation.  
- 📊 **Evaluation System** – Assign difficulty, generate feedback, and calculate final score.  
- 💾 **State Persistence** – Resume unfinished interviews from where you left off.  
- 🎨 **Modern UI/UX** – Styled with responsive CSS and supports **dark/light themes**.  

---

## 🛠️ Tech Stack

- **Frontend:** React (with Hooks), TypeScript  
- **State Management:** Redux Toolkit  
- **Styling:** Custom CSS with theme variables  
- **PDF Parsing:** `pdfjs-dist`  
- **Utilities:** UUID for profile IDs  
- **Version Control:** Git + GitHub  

---

## 📂 Project Structure
```
my-interview-app/
│── public/                  # Static assets (favicon, index.html, etc.)
│
│── src/
│   ├── assets/              # Images, icons, fonts
│   ├── components/          # Reusable UI components
│   │   ├── IntervieweeView/ # Feature-specific component folder
│   │   │   ├── index.tsx    # Main component
│   │   │   └── styles.css   # Local styles (if needed)
│   │   └── Common/          # Generic UI (buttons, inputs, loaders, etc.)
│   │
│   ├── features/            # Feature-based folders for Redux + logic
│   │   └── candidates/
│   │       ├── candidatesSlice.ts # Redux slice
│   │       ├── types.ts          # Type definitions
│   │       └── selectors.ts      # Selectors (optional)
│   │
│   ├── hooks/               # Custom React hooks (useSession, useTimer, etc.)
│   ├── styles/              # Global styles (index.css, theme.css)
│   ├── utils/               # Helper functions (AI prompts, API wrappers, etc.)
│   ├── store/               # Redux store configuration
│   │   └── index.ts
│   ├── App.tsx              # Root component
│   └── main.tsx             # React entry point
│
├── .gitignore
├── package.json
├── tsconfig.json
└── README.md
```


## 🎥 Demo Video
[![Watch Demo](https://img.shields.io/badge/Watch-Demo-red?style=for-the-badge&logo=youtube)](https://drive.google.com/file/d/1l8DVhR-JnpC7DdeEDbHQ0yjV0ezkx_DT/view?usp=drive_link)
[![Live Demo](https://img.shields.io/badge/Live-Demo-brightgreen?style=for-the-badge&logo=vercel)](https://ai-interview-six-kappa.vercel.app/)



## ⚡ Getting Started

### 1. Clone the repository
```bash
git clone https://github.com/Prashant-24-17/AI_Interview/tree/main/my-interview-app
cd my-interview-app
```
### 2. Install dependencies
```bash
npm install
```
### 3. Run the development server
```bash
npm run dev
```
App will be available at http://localhost:5173/

NOTE: I Limit Question to 2 Because Of API Quota