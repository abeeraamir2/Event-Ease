const use = require('@tensorflow-models/universal-sentence-encoder');
const tf = require('@tensorflow/tfjs'); // Pure JS version
const cosineSimilarity = require('cosine-similarity');

// Compute semantic search on a list of services
async function semanticSearchServices(query, services, topN = 10) {
    const model = await use.load();

    // Encode query
    const queryEmbeddingTensor = await model.embed([query]);
    const queryEmbedding = queryEmbeddingTensor.arraySync()[0];

    // Encode service texts (name + description)
    const serviceTexts = services.map(s => s.name + " " + (s.description || ""));
    const serviceEmbeddingsTensor = await model.embed(serviceTexts);
    const serviceEmbeddings = serviceEmbeddingsTensor.arraySync();

    // Compute cosine similarity
    const results = services.map((service, idx) => {
        const score = cosineSimilarity(queryEmbedding, serviceEmbeddings[idx]);
        return { ...service, similarity_score: score };
    });

    // Sort by score
    return results.sort((a, b) => b.similarity_score - a.similarity_score).slice(0, topN);
}

module.exports = semanticSearchServices;
