# Resume ATS Analyzer

## Overview
Resume ATS Analyzer is a frontend-based web application that analyzes resumes and generates an ATS-style score based on:
- Resume structure
- Keyword matching
- Section checks
- Readability
- Contact information

The project also demonstrates CI/CD deployment using GitHub, Jenkins, and Vercel.

---

# Features
- Login Page
- Main Menu Navigation
- Resume Upload
- ATS Score Generation
- Role-Based Keyword Analysis
- PDF, DOCX, TXT Support
- Resume Preview
- Matched & Missing Keywords
- Suggestions for Improvement
- CI/CD Deployment Pipeline

---

# Technologies Used

## Frontend
- HTML5
- CSS3
- JavaScript

## Libraries
- PDF.js
- Mammoth.js

## DevOps / Deployment
- GitHub
- Jenkins
- Vercel

---

# Project Structure

```plaintext
resume-analyzer/
│
├── index.html
├── style.css
├── script.js
├── keywords.json
├── package.json
├── tests-test.js
└── README.md
```

---

# Working Flow

1. User logs into the website
2. Main Menu page is displayed
3. User navigates to Resume Analyzer
4. Resume file is uploaded
5. Resume text is extracted
6. Keywords are analyzed
7. ATS score is generated
8. Results are displayed to the user

---

# Supported File Formats
- PDF
- DOCX
- TXT

---

# Architecture

User → Login Page → Main Menu → Resume Analyzer → Resume Upload → Text Extraction → Keyword Analysis → ATS Score → Results Display

---

# CI/CD Pipeline

GitHub → Jenkins → Vercel

- GitHub stores source code
- Jenkins performs automatic build and integration
- Vercel deploys the website live

---

# Deployment Steps

1. Push source code to GitHub
2. Configure Jenkins Pipeline
3. Connect GitHub repository to Jenkins
4. Enable Poll SCM trigger
5. Deploy project using Vercel
6. Automatic deployment occurs after each push

---

# Screenshots to Include

Add screenshots for:
- Login Page
- Main Menu
- Resume Analyzer Page
- ATS Score Result
- Jenkins Pipeline
- Vercel Deployment

---

# Conclusion

The Resume ATS Analyzer successfully analyzes resumes using ATS-style scoring techniques and demonstrates CI/CD deployment using GitHub, Jenkins, and Vercel.
