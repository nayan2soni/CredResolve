
const app = require('../src/app').default;

// Log initialization
console.log('Serverless Function Initialized');

module.exports = (req: any, res: any) => {
    // Vercel handling
    console.log(`[${req.method}] ${req.url}`);
    return app(req, res);
};
