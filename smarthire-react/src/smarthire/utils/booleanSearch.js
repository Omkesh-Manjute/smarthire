function tokenize(query) {
  const tokens = [];
  let current = "";
  let inQuotes = false;
  for (let i = 0; i < query.length; i++) {
    const char = query[i];
    if (char === '"') {
      if (inQuotes && current) { tokens.push(`"${current}"`); current = ""; }
      inQuotes = !inQuotes;
    } else if (char === " " && !inQuotes) {
      if (current) { tokens.push(current.toUpperCase()); current = ""; }
    } else {
      current += char;
    }
  }
  if (current) tokens.push(inQuotes ? `"${current}"` : current.toUpperCase());
  return tokens;
}

function parseTokens(tokens) {
  const output = [];
  const operators = [];
  const precedence = { NOT: 3, AND: 2, OR: 1 };
  for (let i = 0; i < tokens.length; i++) {
    const token = tokens[i];
    if (token === "AND" || token === "OR" || token === "NOT") {
      while (operators.length > 0 && operators[operators.length - 1] !== "(" && precedence[operators[operators.length - 1]] >= precedence[token]) {
        output.push(operators.pop());
      }
      operators.push(token);
    } else if (token === "(") {
      operators.push(token);
    } else if (token === ")") {
      while (operators.length > 0 && operators[operators.length - 1] !== "(") output.push(operators.pop());
      operators.pop();
    } else {
      output.push(token);
    }
  }
  while (operators.length > 0) output.push(operators.pop());
  return buildAST(output);
}

function buildAST(rpn) {
  const stack = [];
  for (const token of rpn) {
    if (token === "AND" || token === "OR") {
      const right = stack.pop();
      const left = stack.pop();
      stack.push({ type: "operator", op: token, left, right });
    } else if (token === "NOT") {
      const operand = stack.pop();
      stack.push({ type: "operator", op: "NOT", operand });
    } else {
      stack.push({ type: "term", value: token.replace(/"/g, "").toLowerCase() });
    }
  }
  return stack[0];
}

function searchInCandidate(candidate, term) {
  const searchFields = [candidate.name, candidate.email, candidate.location, candidate.title, candidate.skills, candidate.experience, candidate.content].filter(Boolean).join(" ").toLowerCase();
  return searchFields.includes(term.toLowerCase());
}

function evaluateAST(node, candidate) {
  if (!node) return true;
  if (node.type === "term") return searchInCandidate(candidate, node.value);
  if (node.op === "AND") return evaluateAST(node.left, candidate) && evaluateAST(node.right, candidate);
  if (node.op === "OR") return evaluateAST(node.left, candidate) || evaluateAST(node.right, candidate);
  if (node.op === "NOT") return !evaluateAST(node.operand, candidate);
  return true;
}

export function booleanSearch(candidates, query) {
  if (!query.trim()) return candidates;
  const tokens = tokenize(query);
  const ast = parseTokens(tokens);
  return candidates.filter((candidate) => evaluateAST(ast, candidate));
}

export function calculateMatchScore(candidate, filters) {
  let skillScore = 0, experienceScore = 0, educationScore = 0, locationScore = 0, keywordScore = 0;
  if (filters.skills.length > 0) {
    const candidateSkills = candidate.skills.toLowerCase().split(",").map((s) => s.trim());
    const matchedSkills = filters.skills.filter((skill) => candidateSkills.some((s) => s.includes(skill.toLowerCase())));
    skillScore = (matchedSkills.length / filters.skills.length) * 40;
  } else {
    skillScore = 40;
  }
  if (candidate.experience) {
    const years = parseInt(candidate.experience);
    if (!isNaN(years)) {
      if (years >= 5) experienceScore = 25;
      else if (years >= 3) experienceScore = 20;
      else if (years >= 1) experienceScore = 15;
      else experienceScore = 10;
    }
  }
  if (filters.location && candidate.location) {
    locationScore = candidate.location.toLowerCase().includes(filters.location.toLowerCase()) ? 10 : 0;
  } else {
    locationScore = 10;
  }
  if (filters.education && candidate.content) {
    educationScore = candidate.content.toLowerCase().includes(filters.education.toLowerCase()) ? 15 : 5;
  } else {
    educationScore = 15;
  }
  if (filters.booleanQuery) {
    const tokens = tokenize(filters.booleanQuery);
    const terms = tokens.filter((t) => !["AND", "OR", "NOT", "(", ")"].includes(t));
    const matchedTerms = terms.filter((term) => searchInCandidate(candidate, term.replace(/"/g, "").toLowerCase()));
    keywordScore = terms.length > 0 ? (matchedTerms.length / terms.length) * 10 : 10;
  } else {
    keywordScore = 10;
  }
  const overall = Math.round(skillScore + experienceScore + educationScore + locationScore + keywordScore);
  const candidateSkillsList = candidate.skills.split(",").map((s) => s.trim());
  return {
    overall,
    breakdown: {
      skills: Math.round(skillScore),
      experience: Math.round(experienceScore),
      education: Math.round(educationScore),
      location: Math.round(locationScore),
      keywords: Math.round(keywordScore),
    },
    matchedSkills: filters.skills.filter((skill) => candidateSkillsList.some((s) => s.toLowerCase().includes(skill.toLowerCase()))),
    missingSkills: filters.skills.filter((skill) => !candidateSkillsList.some((s) => s.toLowerCase().includes(skill.toLowerCase()))),
  };
}
