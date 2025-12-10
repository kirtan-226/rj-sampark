const app = require('../src/app');

// Vercel serverless entrypoint: forward requests to Express so middleware (incl. CORS) runs
module.exports = (req, res) => app(req, res); 
