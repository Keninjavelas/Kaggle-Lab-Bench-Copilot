<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# Run and deploy your AI Studio app

This contains everything you need to run your app locally.

View your app in AI Studio: https://ai.studio/apps/drive/1LEfn5C0v19fppkoj2VDiRI3j1rE7lDgS

# 🧬 Lab Bench Co-Pilot  
> *"Debugging Science with Gemini 3 Pro"*

---

## 🚨 The Problem

Science has a reproducibility crisis.  

- **70%** of researchers fail to reproduce another scientist's experiments.  
- **50%+** fail to reproduce their *own* experiments.  

Lab notes are messy, "failed" gels are often discarded without analysis, and safety risks are overlooked in the heat of the moment.

---

## 💡 The Solution

**Lab Bench Co-Pilot** is a native multimodal AI agent designed to sit *(virtually)* on the lab bench beside a molecular biologist.  

Unlike generic chatbots, it is:
- Context-aware  
- Safety-conscious  
- Deeply integrated into the scientific workflow  

Powered by **Gemini 3 Pro**, it bridges the gap between *physical experiments* and *digital analysis*.

---

## ✨ Key Features

### 1. 👁️ Visual Troubleshooting ("The Detective")
Stop guessing why your PCR failed.

- **Multimodal Analysis**  
  Upload a photo of a failed result (e.g., smeared agarose gel, contaminated petri dish).

- **Deep Reasoning**  
  Gemini correlates visual artifacts (e.g., smearing) with your text protocol  
  (`"left on bench overnight"`) → identifies the root cause (e.g., DNA degradation).

- **Outcome**  
  Not just failure detection — actionable diagnosis and fix recommendations.

---

### 2. 📄 Paper-to-Pipeline ("The Translator")
Turn dense academic PDFs into actionable workflows.

- **PDF Parsing**  
  Drag & drop a 20-page research paper.

- **Smart Extraction**  
  Ignores abstract/discussion, extracts only **Materials & Methods**.

- **Auto-Timer**  
  Time-sensitive steps (e.g., `"Incubate 10 mins"`) are converted into clickable timer tasks in the sidebar.

---

### 3. 🛡️ Certified Reporting ("The Paperwork")
Turn failures into validated data.

- **Auto-Generated Reports**  
  One-click creation of a **Certificate of Analysis (PDF)**.

- **Reagent Audit**  
  Flags:
  - High-cost reagents  
  - Safety hazards (e.g., *Ethidium Bromide = mutagen*)

- **AI Verification Stamp**  
  Vector-based **"AI VERIFIED"** seal  
  Color-coded based on:
  - Safety level  
  - Confidence score  

---

### 4. 🦠 "Petri" & The Bio-Glass UI ("The Vibe")
Designed for real lab conditions.

- **Bio-Glass Interface**  
  Dark-mode, high-contrast UI optimized for microscopy rooms.

- **Mascot — "Petri"**  
  Adaptive AI persona:
  - Hyperactive for *E. coli*  
  - Chill for *Yeast*

- **Smart-Push Sidebar**  
  Non-intrusive layout — tools never obscure experiment data.

---

## 🛠️ Built With

### 🔍 Model
- **Google Gemini 3 Pro** (via AI Studio)

### ⚙ Capabilities
- Vision → Image Analysis  
- Document Understanding → PDF Parsing  
- Reasoning → Root Cause Analysis  

### 🎨 Frontend
- HTML5  
- CSS3 (Glassmorphism)  
- JavaScript  

### 📚 Libraries
- `jspdf` → client-side PDF report generation  

---

🚀 How to Run
Clone the repository.

Open index.html in your browser.

Enter your Google Gemini API Key in the settings menu.

Drag a protocol PDF or upload a gel image to start "Vibe Coding."

## Run Locally

**Prerequisites:**  Node.js


1. Install dependencies:
   `npm install`
2. Set the `GEMINI_API_KEY` in [.env.local](.env.local) to your Gemini API key
3. Run the app:
   `npm run dev`
