const { GoogleGenerativeAI } = require("@google/generative-ai");
const ApiResponse = require("@entities/ApiResponse");
const ApiError = require("@entities/ApiError");
const prisma = require("@utils/prisma");

const generateMarkdownFromJSON = (q) => {
    let md = `## Description\n\n${q.description.trim()}\n\n`;

    md += `## Input Format\n\n${q.inputFormat.trim()}\n\n`;
    md += `## Output Format\n\n${q.outputFormat.trim()}\n\n`;

    const publicCases = q.testCases.filter(tc => !tc.hidden);
    if (publicCases.length) {
        md += `## Examples\n\n`
        publicCases.forEach((tc, i) => {
            md += `### Example ${i + 1}\n\n`;
            md += `**Input:**\n\`\`\`\n${tc.input.trim()}\n\`\`\`\n\n`;
            md += `**Output:**\n\`\`\`\n${tc.output.trim()}\n\`\`\`\n\n`;
            if (tc.explanation) {
                md += `**Explanation:** ${tc.explanation.trim()}\n\n`;
            }
        });
    }

    if (q.constraints.length) {
        md += `## Constraints\n\n`;
        q.constraints.forEach(c => {
            md += `- \`${c}\`\n`;
        });
        md += `\n`;
    }

    return md.trim();
};

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

async function generateDSAQuestion(topics, difficulty) {
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash-preview-04-17" });

    const systemPrompt = `
You are a DSA question generator bot. Generate a single coding question based on the given topic and difficulty.

You are strictly instructed to follow below instructions:
- Generate exactly 13 test cases:
    - First 3 test cases MUST have "hidden": false and contain a proper "explanation".
    - Remaining 10 test cases MUST have "hidden": true and remove "explanation" field.
    - Do NOT include more or fewer test cases than 13.
- IMPORTANT: Carefully verify that outputs are correct for each input. Every output must logically match the expected result based on input and problem description.
- The \`inputFormat\` and \`outputFormat\` must describe the format clearly, e.g., "First line contains \`N\`, second line contains \`N\` space-separated integers".
- In the \`constraints\`, use the format "1 <= N <= 10^5".
- The \`input\` of each test case must match the described format. Use raw values line-by-line, like stdin.
- Do NOT use JSON-like arrays (e.g., [1, 2, 3]).
- Output must be strict, clean JSON.
- JSON must be parseable with JSON.parse. No trailing commas.
- Provide a clear, detailed English problem statement.
- Response should be under limit so that it can be sent over http

Strictly follow this format:

{
  "title": string,
  "difficulty": "EASY" | "MEDIUM" | "HARD",
  "description": string,
  "constraints": string[],
  "inputFormat": string,
  "outputFormat": string,
  "testCases": [
    {
      "input": string,
      "output": string,
      "difficulty": "EASY" | "MEDIUM" | "HARD",
      "hidden": boolean,
      "explanation": string
    }
  ]
}
    `.trim();

    const userPrompt = `Topics: ${topics.join(', ')}, Difficulty: ${difficulty}`;

    const result = await model.generateContent({
        contents: [
            {
                parts: [{ text: `${systemPrompt}\n\n${userPrompt}` }],
            },
        ]
    });

    let content = result.response.text().trim();
    console.log("Gemini response:", content);
    

    if (content.startsWith('```json')) content = content.slice(7);
    if (content.endsWith('```')) content = content.slice(0, -3);

    try {
        const parsed = JSON.parse(content);
        const md = generateMarkdownFromJSON(parsed);
        parsed.md = md;
        return parsed;
    } catch (err) {
        console.error("❌ Invalid JSON response:", content);
        throw new Error("Failed to parse JSON from Gemini response");
    }
}

const generateQuestion = async (req, res, next) => {
    try {
        const { topics, difficulty } = req.body;
        const question = await generateDSAQuestion(topics, difficulty);

        res.json(new ApiResponse(question, "Question generated successfully"));
    } catch (err) {
        next(new ApiError(500, err.message, err, '/problems/generateQuestion'));
    }
};

module.exports = generateQuestion;
