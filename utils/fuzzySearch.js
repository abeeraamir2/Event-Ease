const Fuse = require('fuse.js');

function fuzzySearchServices(services, { name, description }, limit = 10) {
    const options = {
        keys: [
            { name: 'name', weight: 0.7 },
            { name: 'description', weight: 0.3 }
        ],
        threshold: 0.4, // Adjust sensitivity: 0.0 = exact, 1.0 = very fuzzy
    };

    const fuse = new Fuse(services, options);

    // Build search string by combining inputs
    let searchStr = '';
    if (name) searchStr += name + ' ';
    if (description) searchStr += description;

    if (!searchStr.trim()) return services.slice(0, limit); 

    const results = fuse.search(searchStr);

    return results.slice(0, limit).map(r => r.item);
}

module.exports = fuzzySearchServices;
