const resumeInput = document.getElementById("resumeInput");
const fileNameEl = document.getElementById("fileName");
const scoreValueEl = document.getElementById("scoreValue");
const scoreLabelEl = document.getElementById("scoreLabel");
const ringProgressEl = document.getElementById("ringProgress");
const matchedCountEl = document.getElementById("matchedCount");
const missingCountEl = document.getElementById("missingCount");
const textLengthEl = document.getElementById("textLength");
const matchedKeywordsEl = document.getElementById("matchedKeywords");
const missingKeywordsEl = document.getElementById("missingKeywords");
const suggestionsEl = document.getElementById("suggestions");
const sectionChecksEl = document.getElementById("sectionChecks");
const resumePreviewEl = document.getElementById("resumePreview");

const RING_CIRCUMFERENCE = 2 * Math.PI * 48;

if (window.pdfjsLib) {
    pdfjsLib.GlobalWorkerOptions.workerSrc =
        "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js";
}

resumeInput.addEventListener("change", handleFileUpload);

async function handleFileUpload(event) {
    const file = event.target.files[0];
    if (!file) return;

    fileNameEl.textContent = file.name;
    resetUIForNewUpload();

    try {
        const rawText = await extractTextFromFile(file);
        const cleanedText = normalizeText(rawText);

        if (!cleanedText || cleanedText.length < 30) {
            throw new Error("Readable text could not be extracted from this file.");
        }

        const config = await fetch("keywords.json", { cache: "no-store" }).then((res) => {
            if (!res.ok) {
                throw new Error("Failed to load keywords.json");
            }
            return res.json();
        });

        const analysis = analyzeResume(cleanedText, config);
        updateUI(analysis, cleanedText);
    } catch (error) {
        console.error("Resume analysis error:", error);
        resetUIWithError(error.message || "Could not analyze the resume.");
    }
}

async function extractTextFromFile(file) {
    const extension = file.name.split(".").pop().toLowerCase();

    if (extension === "txt") {
        return extractTextFromTXT(file);
    }

    if (extension === "pdf") {
        return extractTextFromPDF(file);
    }

    if (extension === "docx") {
        return extractTextFromDOCX(file);
    }

    throw new Error("Unsupported file type. Please upload PDF, DOCX, or TXT.");
}

async function extractTextFromTXT(file) {
    return await file.text();
}

async function extractTextFromPDF(file) {
    if (!window.pdfjsLib) {
        throw new Error("PDF library failed to load.");
    }

    const arrayBuffer = await file.arrayBuffer();
    const typedArray = new Uint8Array(arrayBuffer);

    const pdf = await pdfjsLib.getDocument({
        data: typedArray
    }).promise;

    let fullText = "";

    for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
        const page = await pdf.getPage(pageNum);
        const textContent = await page.getTextContent();

        const pageText = textContent.items
            .map((item) => item.str)
            .join(" ");

        fullText += pageText + "\n";
    }

    return fullText;
}

async function extractTextFromDOCX(file) {
    if (!window.mammoth) {
        throw new Error("DOCX library failed to load.");
    }

    const arrayBuffer = await file.arrayBuffer();
    const result = await mammoth.extractRawText({ arrayBuffer });
    return result.value || "";
}

function normalizeText(text) {
    return text
        .replace(/\r/g, "\n")
        .replace(/\t/g, " ")
        .replace(/[ ]{2,}/g, " ")
        .replace(/\n{3,}/g, "\n\n")
        .trim();
}

function analyzeResume(text, config) {
    const lowerText = text.toLowerCase();
    const words = lowerText.split(/\s+/).filter(Boolean);
    const wordCount = words.length;

    const sections = checkSections(lowerText);
    const contactChecks = checkContactInfo(text);
    const formattingChecks = checkReadability(text, wordCount);
    const keywordResult = checkKeywords(lowerText, config);

    let score = 0;
    score += sections.score;         // 30 max
    score += contactChecks.score;    // 20 max
    score += formattingChecks.score; // 15 max
    score += keywordResult.score;    // 35 max

    score = Math.max(0, Math.min(100, Math.round(score)));

    const suggestions = buildSuggestions(
        sections,
        contactChecks,
        formattingChecks,
        keywordResult,
        wordCount
    );

    return {
        score,
        wordCount,
        sections,
        contactChecks,
        formattingChecks,
        keywordResult,
        suggestions
    };
}

function checkSections(lowerText) {
    const sectionRules = [
        {
            label: "Contact Information",
            patterns: ["email", "phone", "linkedin", "github"],
            points: 4
        },
        {
            label: "Professional Summary / Objective",
            patterns: ["summary", "objective", "profile"],
            points: 5
        },
        {
            label: "Skills Section",
            patterns: ["skills", "technical skills", "core competencies"],
            points: 5
        },
        {
            label: "Experience Section",
            patterns: ["experience", "work experience", "internship", "employment"],
            points: 6
        },
        {
            label: "Education Section",
            patterns: ["education", "academic", "university", "college"],
            points: 5
        },
        {
            label: "Projects Section",
            patterns: ["projects", "academic projects", "personal projects"],
            points: 3
        },
        {
            label: "Certifications Section",
            patterns: ["certifications", "certificates", "certified"],
            points: 2
        }
    ];

    let score = 0;
    const results = [];

    for (const rule of sectionRules) {
        const found = rule.patterns.some((pattern) => lowerText.includes(pattern));

        if (found) {
            score += rule.points;
        }

        results.push({
            label: rule.label,
            found
        });
    }

    return { score, results };
}

function checkContactInfo(text) {
    let score = 0;
    const results = [];

    const emailFound = /[a-zA-Z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}/i.test(text);
    const phoneFound = /(\+?\d{1,3}[\s-]?)?(\d{10}|\d{3}[\s-]?\d{3}[\s-]?\d{4})/.test(text);
    const linkedinFound = /linkedin\.com\/in\//i.test(text);
    const githubFound = /github\.com\//i.test(text);

    if (emailFound) score += 6;
    if (phoneFound) score += 5;
    if (linkedinFound) score += 5;
    if (githubFound) score += 4;

    results.push({ label: "Valid email detected", found: emailFound });
    results.push({ label: "Phone number detected", found: phoneFound });
    results.push({ label: "LinkedIn profile detected", found: linkedinFound });
    results.push({ label: "GitHub profile detected", found: githubFound });

    return { score, results };
}

function checkReadability(text, wordCount) {
    let score = 0;
    const results = [];

    const bulletCount = (text.match(/[•●▪■◦►\-]\s/g) || []).length;
    const hasEnoughBullets = bulletCount >= 3;
    const hasGoodLength = wordCount >= 250 && wordCount <= 900;
    const hasDates = /\b(20\d{2}|19\d{2})\b/.test(text);
    const hasActionVerbs =
        /(developed|built|designed|implemented|created|analyzed|led|improved|optimized|managed|collaborated|engineered|hosted|processed|presented)/i.test(text);

    if (hasEnoughBullets) score += 4;
    if (hasGoodLength) score += 4;
    if (hasDates) score += 3;
    if (hasActionVerbs) score += 4;

    results.push({ label: "Uses bullet points", found: hasEnoughBullets });
    results.push({ label: "Resume length is reasonable", found: hasGoodLength });
    results.push({ label: "Contains timeline/date references", found: hasDates });
    results.push({ label: "Uses action verbs", found: hasActionVerbs });

    return { score, results };
}

function checkKeywords(lowerText, config) {
    const matched = [];
    const missing = [];
    let earned = 0;
    let possible = 0;

    if (!config || !Array.isArray(config.keywordGroups)) {
        return {
            score: 0,
            matched: [],
            missing: []
        };
    }

    for (const group of config.keywordGroups) {
        if (!Array.isArray(group.keywords)) continue;

        for (const item of group.keywords) {
            possible += item.weight || 0;

            const found = Array.isArray(item.aliases) &&
                item.aliases.some((alias) => lowerText.includes(alias.toLowerCase()));

            if (found) {
                earned += item.weight || 0;
                matched.push(item.label);
            } else {
                missing.push(item.label);
            }
        }
    }

    const rawKeywordScore = possible === 0 ? 0 : (earned / possible) * 35;

    return {
        score: Math.round(rawKeywordScore),
        matched,
        missing
    };
}

function buildSuggestions(sections, contactChecks, formattingChecks, keywordResult, wordCount) {
    const suggestions = [];

    if (!sections.results.find((x) => x.label.includes("Summary") && x.found)) {
        suggestions.push("Add a short professional summary near the top of the resume.");
    }

    if (!sections.results.find((x) => x.label.includes("Projects") && x.found)) {
        suggestions.push("Include a dedicated projects section to highlight practical work.");
    }

    if (!contactChecks.results.find((x) => x.label.includes("LinkedIn") && x.found)) {
        suggestions.push("Add a LinkedIn profile link to improve professional visibility.");
    }

    if (!contactChecks.results.find((x) => x.label.includes("GitHub") && x.found)) {
        suggestions.push("Add a GitHub profile link if you have technical projects.");
    }

    if (!formattingChecks.results.find((x) => x.label.includes("bullet") && x.found)) {
        suggestions.push("Use more bullet points for readability and ATS-friendliness.");
    }

    if (!formattingChecks.results.find((x) => x.label.includes("action verbs") && x.found)) {
        suggestions.push("Start bullet points with strong action verbs like Developed, Built, or Implemented.");
    }

    if (wordCount < 250) {
        suggestions.push("Your resume may be too short. Add more evidence of skills, projects, and impact.");
    }

    if (wordCount > 900) {
        suggestions.push("Your resume may be too long. Keep it concise and focused on relevant achievements.");
    }

    if (keywordResult.missing.length > 0) {
        suggestions.push(
            `Consider adding relevant keywords such as: ${keywordResult.missing.slice(0, 8).join(", ")}.`
        );
    }

    if (suggestions.length === 0) {
        suggestions.push("Your resume looks strong overall. Fine-tune wording to better match the target job description.");
    }

    return suggestions;
}

function updateUI(analysis, cleanedText) {
    const {
        score,
        wordCount,
        sections,
        contactChecks,
        formattingChecks,
        keywordResult,
        suggestions
    } = analysis;

    scoreValueEl.textContent = score;
    scoreLabelEl.textContent = getScoreLabel(score);
    setScoreRing(score);

    matchedCountEl.textContent = keywordResult.matched.length;
    missingCountEl.textContent = keywordResult.missing.length;
    textLengthEl.textContent = wordCount;

    renderTags(matchedKeywordsEl, keywordResult.matched, "matched");
    renderTags(missingKeywordsEl, keywordResult.missing, "missing");

    renderCheckList(sectionChecksEl, [
        ...sections.results,
        ...contactChecks.results,
        ...formattingChecks.results
    ]);

    renderSuggestions(suggestionsEl, suggestions);
    resumePreviewEl.textContent = cleanedText;
}

function setScoreRing(score) {
    const offset = RING_CIRCUMFERENCE - (score / 100) * RING_CIRCUMFERENCE;
    ringProgressEl.style.strokeDasharray = `${RING_CIRCUMFERENCE}`;
    ringProgressEl.style.strokeDashoffset = `${offset}`;
}

function renderTags(container, items, type) {
    container.innerHTML = "";

    if (!items.length) {
        container.innerHTML = `<span class="tag ${type}">None</span>`;
        return;
    }

    items.forEach((item) => {
        const span = document.createElement("span");
        span.className = `tag ${type}`;
        span.textContent = item;
        container.appendChild(span);
    });
}

function renderCheckList(container, checks) {
    container.innerHTML = "";

    checks.forEach((check) => {
        const li = document.createElement("li");
        li.innerHTML = check.found
            ? `<span class="good">✓</span> ${check.label}`
            : `<span class="bad">✗</span> ${check.label}`;
        container.appendChild(li);
    });
}

function renderSuggestions(container, suggestions) {
    container.innerHTML = "";

    suggestions.forEach((suggestion) => {
        const li = document.createElement("li");
        li.textContent = suggestion;
        container.appendChild(li);
    });
}

function getScoreLabel(score) {
    if (score >= 85) return "Excellent ATS-style resume strength";
    if (score >= 70) return "Good resume, but can be improved";
    if (score >= 55) return "Moderate score — needs refinement";
    return "Low score — major improvements needed";
}

function resetUIForNewUpload() {
    scoreValueEl.textContent = "0";
    scoreLabelEl.textContent = "Analyzing resume...";
    setScoreRing(0);

    matchedCountEl.textContent = "0";
    missingCountEl.textContent = "0";
    textLengthEl.textContent = "0";

    matchedKeywordsEl.innerHTML = "";
    missingKeywordsEl.innerHTML = "";
    sectionChecksEl.innerHTML = "";
    suggestionsEl.innerHTML = "<li>Processing file...</li>";
    resumePreviewEl.textContent = "Extracting text...";
}

function resetUIWithError(message) {
    scoreValueEl.textContent = "0";
    scoreLabelEl.textContent = message;
    setScoreRing(0);

    matchedCountEl.textContent = "0";
    missingCountEl.textContent = "0";
    textLengthEl.textContent = "0";

    matchedKeywordsEl.innerHTML = "";
    missingKeywordsEl.innerHTML = "";
    sectionChecksEl.innerHTML = "";
    suggestionsEl.innerHTML = `<li>${message}</li>`;
    resumePreviewEl.textContent = "Could not extract readable text.";
}