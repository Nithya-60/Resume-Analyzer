document.getElementById("resumeInput").addEventListener("change", async function(e) {
    const file = e.target.files[0];
    const text = await file.text();

    const keywords = await fetch("keywords.json").then(r => r.json());

    let score = 0;
    let matched = [];

    keywords.forEach(k => {
        if (text.toLowerCase().includes(k)) {
            score += 5;
            matched.push(k);
        }
    });

    if (score > 100) score = 100;

    document.getElementById("score").innerText = "ATS Score: " + score + "%";
    document.getElementById("matched").innerText = "Matched: " + matched.join(", ");
});