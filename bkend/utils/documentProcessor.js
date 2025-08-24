const fs = require("fs").promises;
const path = require("path");
const { generateEmbedding } = require("../services/geminiService");

// Simple text splitter (can be improved for more complex documents)
const splitTextIntoChunks = (text, chunkSize = 500, overlap = 50) => {
  const chunks = [];
  let i = 0;
  while (i < text.length) {
    const end = Math.min(i + chunkSize, text.length);
    const chunk = text.substring(i, end);
    chunks.push(chunk);
    if (end === text.length) break;
    i += chunkSize - overlap;
  }
  return chunks;
};

const processDocument = async (filePath) => {
  const fileName = path.basename(filePath);
  try {
    const content = await fs.readFile(filePath, "utf8");
    const chunks = splitTextIntoChunks(content);

    // Process embeddings in parallel
    const vectors = await Promise.all(
      chunks.map(async (chunk, i) => {
        const embedding = await generateEmbedding(chunk);
        return {
          id: `${fileName}-${i}`,
          values: embedding,
          metadata: {
            filename: fileName,
            chunk_index: i,
            text: chunk,
          },
        };
      })
    );

    console.log(
      `Processed document: ${fileName} into ${vectors.length} chunks.`
    );
    return vectors;
  } catch (error) {
    console.error(`Error processing document ${filePath}:`, error);
    throw error;
  }
};


module.exports = {
  processDocument,
};
