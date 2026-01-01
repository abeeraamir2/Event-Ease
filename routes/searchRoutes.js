const express = require("express");
const router = express.Router();
const Service = require("../models/serviceModel");
const hybridSearch = require("../utils/hybridSearch");
const semanticSearch = require("../utils/semanticSearch");
const fuzzySearch = require('../utils/fuzzySearch');

// Hybrid search route
router.get("/", async (req, res) => {
    try {
        const allServices = await Service.find({}).lean();
        const { category, location, guestCount, queryText } = req.query;

        const results = hybridSearch(allServices, {
            category: category || "",
            location: location || "",
            guestCount: parseInt(guestCount) || 0,
            queryText: queryText || ""
        });

        res.json(results);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Semantic search route (using USE)
router.get('/semantic-search', async (req, res) => {
    try {
        const { query, topN = 3, category, location } = req.query;

        if (!query) return res.status(400).json({ message: "Query is required" });

        // Fetch services from DB with optional filters
        const filter = {};
        if (category) filter.category = category.toLowerCase();
        if (location) filter.location = location.toLowerCase();

        const services = await Service.find(filter).lean();

        if (!services.length) return res.json({ results: [] });

        // Semantic search logic
        const results = await semanticSearch(query, services, parseInt(topN));

        res.json({ results });

    } catch (err) {
        console.error("Semantic search error:", err);
        res.status(500).json({ message: "Server error" });
    }
});


router.get('/fuzzy-search', async (req, res) => {
    try {
        const { name, description, category, location } = req.query;

        // Fetch services from DB with optional filters
        const filter = {};
        if (category) filter.category = category.toLowerCase();
        if (location) filter.location = location.toLowerCase();

        const services = await Service.find(filter).lean();

        // Apply fuzzy search
        const results = fuzzySearch(services, { name, description }, 3);

        res.json({ results });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error' });
    }
});

module.exports = router;
