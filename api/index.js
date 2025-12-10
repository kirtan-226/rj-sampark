<<<<<<< HEAD
// Vercel serverless entrypoint
// Export a handler that proxies to the Express app so CORS middleware runs.
=======
// Vercel serverless entrypoint: forward to Express app so middleware (incl. CORS) runs
>>>>>>> 259f671 (get back to withour cors)
const app = require('../src/app');
module.exports = (req, res) => app(req, res);
