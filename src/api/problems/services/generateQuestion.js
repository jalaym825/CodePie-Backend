const { GoogleGenerativeAI } = require("@google/generative-ai");
const ApiResponse = require("@entities/ApiResponse");
const ApiError = require("@entities/ApiError");

const generateMarkdownFromJSON = (q) => {
    let md = `## Description\n\n${q.description.trim()}\n\n`;
    md += `## Input Format\n\n${q.inputFormat.trim()}\n\n`;
    md += `## Output Format\n\n${q.outputFormat.trim()}\n\n`;

    const publicCases = q.testCases.filter(tc => !tc.hidden);
    if (publicCases.length) {
        md += `## Examples\n\n`;
        publicCases.forEach((tc, i) => {
            md += `### Example ${i + 1}\n\n`;
            md += `**Input:**\n\`\`\`\n${tc.input.trim()}\n\`\`\`\n\n`;
            md += `**Output:**\n\`\`\`\n${tc.output.trim()}\n\`\`\`\n\n`;
            if (tc.explanation) {
                md += `**Explanation:** ${tc.explanation.trim()}\n\n`;
            }
        });
    }

    if (q.constraints?.length) {
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
    const model = genAI.getGenerativeModel({
        model: "gemini-2.5-flash-preview-04-17"
    });

    const systemPrompt = `
    You are an expert DSA question generator. Given topics and a difficulty level, generate **one** problem in JSON format with these fields:
    
    - "title", "difficulty" (EASY | MEDIUM | HARD), "description", "constraints" (array), "inputFormat", "outputFormat", "testCases" (array of 13 objects).
    
    Test case rules:
    - First 3 test cases: hidden=false, must have explanation.
    - Remaining 10: hidden=true, no explanation.
    
    Important:
    - Simulate every test case using a correct implementation and use actual computed outputs.
    - Include the full solution code used to generate the outputs before the testCases array.
    - JSON must be strictly valid and compact.
    - Avoid large inputs or long outputs. Fit all content under 3000 tokens total.
    
    Example format:
    {
      "title": "...",
      "difficulty": "...",
      "description": "...",
      "constraints": ["..."],
      "inputFormat": "...",
      "outputFormat": "...",
      "solutionCode": "C++ or Python code here...",
      "testCases": [
        {
          "input": "...",
          "output": "...",
          "hidden": false,
          "explanation": "..."
        },
        ...
      ]
    }
    `.trim();
        

    const userPrompt = `Topics: ${topics.join(', ')}\nDifficulty: ${difficulty}`;

    const result = await model.generateContent({
        contents: [{ parts: [{ text: `${systemPrompt}\n\n${userPrompt}` }] }],
        generationConfig: {
            maxOutputTokens: 10000,  // prevent overflow
            temperature: 0.8,
            topP: 1,
            topK: 40,
        }
    });
    
    console.log("Full response structure:", JSON.stringify(result.response, null, 2));
    let content = result.response.text().trim();
    console.log("Gemini response:", content);

    if (content.startsWith('```json')) content = content.slice(7);
    if (content.endsWith('```')) content = content.slice(0, -3);

    try {
        const parsed = JSON.parse(content);
        parsed.md = generateMarkdownFromJSON(parsed);
        return parsed;
    } catch (err) {
        console.error("❌ Failed to parse JSON:", content);
        throw new Error("Gemini returned an invalid JSON response");
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
