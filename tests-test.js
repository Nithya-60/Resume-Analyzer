const fs = require("fs");

function assert(condition, message) {
    if (!condition) {
        throw new Error(message);
    }
}

const raw = fs.readFileSync("keywords.json", "utf8");
const data = JSON.parse(raw);

assert(data.keywordGroups, "keywordGroups is missing");
assert(Array.isArray(data.keywordGroups), "keywordGroups must be an array");
assert(data.keywordGroups.length > 0, "keywordGroups should not be empty");

for (const group of data.keywordGroups) {
    assert(group.group, "Each group must have a group name");
    assert(Array.isArray(group.keywords), `Group "${group.group}" must have a keywords array`);
    assert(group.keywords.length > 0, `Group "${group.group}" must not be empty`);

    for (const keyword of group.keywords) {
        assert(keyword.label, "Each keyword needs a label");
        assert(typeof keyword.weight === "number", `Keyword "${keyword.label}" must have numeric weight`);
        assert(Array.isArray(keyword.aliases), `Keyword "${keyword.label}" must have aliases array`);
        assert(keyword.aliases.length > 0, `Keyword "${keyword.label}" must have at least one alias`);
    }
}

console.log("All tests passed.");