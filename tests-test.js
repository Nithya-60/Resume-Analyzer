const fs = require("fs");

function assert(condition, message) {
    if (!condition) {
        throw new Error(message);
    }
}

const raw = fs.readFileSync("keywords.json", "utf8");
const data = JSON.parse(raw);

assert(data.domains, "domains is missing");
assert(typeof data.domains === "object", "domains must be an object");
assert(data.general, "general is missing");
assert(Array.isArray(data.general.keywords), "general.keywords must be an array");

for (const [domainKey, domainValue] of Object.entries(data.domains)) {
    assert(domainValue.label, `Domain ${domainKey} must have a label`);
    assert(Array.isArray(domainValue.keywords), `Domain ${domainKey} must have keywords array`);
    assert(domainValue.keywords.length > 0, `Domain ${domainKey} cannot be empty`);

    for (const keyword of domainValue.keywords) {
        assert(keyword.label, `Keyword in ${domainKey} is missing label`);
        assert(typeof keyword.weight === "number", `Keyword ${keyword.label} in ${domainKey} must have numeric weight`);
        assert(Array.isArray(keyword.aliases), `Keyword ${keyword.label} in ${domainKey} must have aliases array`);
        assert(keyword.aliases.length > 0, `Keyword ${keyword.label} in ${domainKey} must have at least one alias`);
    }
}

for (const keyword of data.general.keywords) {
    assert(keyword.label, "General keyword missing label");
    assert(typeof keyword.weight === "number", `General keyword ${keyword.label} must have numeric weight`);
    assert(Array.isArray(keyword.aliases), `General keyword ${keyword.label} must have aliases array`);
    assert(keyword.aliases.length > 0, `General keyword ${keyword.label} must have aliases`);
}

console.log("All tests passed.");