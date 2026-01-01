// hybridSearch.js
const { TfIdf } = require("natural");

/**
 * Hybrid Search
 * - Filters by category, location, guest count
 * - Ranks by TF-IDF if a query text is provided
 * 
 * @param {Array} services - List of service objects from DB
 * @param {Object} options - Search options
 *    options.queryText: string (optional)
 *    options.category: string (optional)
 *    options.location: string (optional)
 *    options.guestCount: number (optional)
 *    options.alpha: number (weight for TF-IDF, default 0.4)
 */
function hybridSearch(services, options = {}) {
    const {
        queryText = "",
        category = "",
        location = "",
        guestCount = 0,
        alpha = 0.4
    } = options;

    if (!Array.isArray(services) || services.length === 0) {
        return [];
    }

    const normalizedCategory = category.trim().toLowerCase();
    const normalizedLocation = location.trim().toLowerCase();
    const normalizedQuery = queryText.trim().toLowerCase();
    const hasQuery = normalizedQuery.length > 0;

    console.log("Search params:", { normalizedCategory, normalizedLocation, guestCount });

    // STEP 1: Filter services by hard constraints
    const filtered = services.filter(service => {
        // Category filtering (exact match)
        if (normalizedCategory) {
            const serviceCategory = (service.category || "").trim().toLowerCase();
            console.log(`Comparing: "${serviceCategory}" === "${normalizedCategory}"`);
            if (serviceCategory !== normalizedCategory) {
                return false;
            }
        }

        // Location filtering (contains match)
        if (normalizedLocation) {
            const serviceLocation = (service.location || "").trim().toLowerCase();
            if (!serviceLocation.includes(normalizedLocation)) {
                return false;
            }
        }

        // Guest count filtering
        if (guestCount > 0) {
            const capacity = service.categoryDetails?.capacity || 0;
            const maxGuests = service.categoryDetails?.maxGuests || 0;
            const availableGuests = Math.max(capacity, maxGuests);
            if (availableGuests < guestCount) {
                return false;
            }
        }

        return true;
    });

    console.log(`Filtered results: ${filtered.length} out of ${services.length}`);

    // If no results after filtering, return empty
    if (filtered.length === 0) {
        return [];
    }

    // STEP 2: Build TF-IDF corpus only if query exists
    const tfidf = new TfIdf();
    if (hasQuery) {
        filtered.forEach(service => {
            const text = `
                ${service.name || ""}
                ${service.description || ""}
                ${service.category || ""}
                ${service.location || ""}
            `.toLowerCase();
            tfidf.addDocument(text);
        });
    }

    // STEP 3: Score and rank the filtered services
    const scored = filtered.map((service, index) => {
        let score = 0;

        const serviceCategory = (service.category || "").trim().toLowerCase();
        const serviceLocation = (service.location || "").trim().toLowerCase();

        // Boost for exact category match
        if (normalizedCategory && serviceCategory === normalizedCategory) {
            score += 3;
        }

        // Boost for exact location match
        if (normalizedLocation && serviceLocation === normalizedLocation) {
            score += 3;
        }
        // Partial location match
        else if (normalizedLocation && serviceLocation.includes(normalizedLocation)) {
            score += 1.5;
        }

        // TF-IDF semantic similarity if query exists
        if (hasQuery) {
            let tfidfScore = 0;
            tfidf.tfidfs(normalizedQuery, (i, measure) => {
                if (i === index) tfidfScore = measure;
            });
            score += alpha * tfidfScore;
        }

        return { service, score };
    });

    // Sort by highest score first
    scored.sort((a, b) => b.score - a.score);

    return scored.map(item => item.service);
}

module.exports = hybridSearch;