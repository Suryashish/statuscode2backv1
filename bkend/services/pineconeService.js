const { Pinecone } = require("@pinecone-database/pinecone");

const pc = new Pinecone({
  apiKey: process.env.PINECONE_API_KEY,
});

const getPineconeIndex = async () => {
  const indexName = process.env.PINECONE_INDEX_NAME;
  try {
    await pc.describeIndex(indexName); // Check if index exists
    return pc.Index(indexName);
  } catch (error) {
    if (error.status === 404) {
      // Index not found, create it
      console.log(`Pinecone index '${indexName}' not found. Creating...`);
      await pc.createIndex({
        name: indexName,
        dimension: 768, // Gemini text-embedding-004 dimension
        metric: "cosine",
        spec: {
          serverless: {
            cloud: "aws",
            region: "us-east-1", // Choose your desired region
          },
        },
      });
      console.log(`Pinecone index '${indexName}' created.`);
      return pc.Index(indexName);
    }
    console.error("Error accessing Pinecone index:", error);
    throw error;
  }
};

const upsertVectors = async (vectors) => {
  const index = await getPineconeIndex();
  try {
    await index.upsert(vectors);
    console.log(`Upserted ${vectors.length} vectors to Pinecone.`);
  } catch (error) {
    console.error("Error upserting vectors to Pinecone:", error);
    throw error;
  }
};

const queryPinecone = async (embedding, topK = 5) => {
  const index = await getPineconeIndex();
  try {
    const queryResult = await index.query({
      vector: embedding,
      topK: topK,
      includeMetadata: true,
    });
    return queryResult.matches.map((match) => ({
      id: match.id,
      score: match.score,
      text: match.metadata.text,
    }));
  } catch (error) {
    console.error("Error querying Pinecone:", error);
    throw error;
  }
};

module.exports = {
  upsertVectors,
  queryPinecone,
};
