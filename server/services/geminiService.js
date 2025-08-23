const { GoogleGenerativeAI } = require("@google/generative-ai");

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

const getGeminiModel = () => {
  return genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
};

const generateEmbedding = async (text) => {
  try {
    const model = genAI.getGenerativeModel({ model: "text-embedding-004" });
    const result = await model.embedContent({ content: { parts: [{ text }] } });
    return result.embedding.values;
  } catch (error) {
    console.error("Error generating embedding with Gemini:", error);
    throw error;
  }
};

const generateText = async (prompt) => {
  try {
    const model = getGeminiModel();
    const result = await model.generateContent(prompt);
    return result.response.text();
  } catch (error) {
    console.error("Error generating text with Gemini:", error);
    throw error;
  }
};

module.exports = {
  generateEmbedding,
  generateText,
};
