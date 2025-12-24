
// Log initialization - this will appear in Vercel logs
console.log('Serverless Function Loading...');

let app: any = null;

module.exports = async (req: any, res: any) => {
    console.log(`[${req.method}] ${req.url}`);

    try {
        if (!app) {
            console.log('Initializing Express App...');
            // Lazy load the application to catch startup errors
            // Use try-catch specifically around the require
            try {
                const updatedApp = await import('../src/app');
                app = updatedApp.default;
                console.log('Express App Initialized Successfully');
            } catch (importError: any) {
                console.error('CRITICAL: Failed to import src/app:', importError);
                // Return a JSON response with the error details
                res.status(500).json({
                    status: 'error',
                    message: 'Backend Startup Failed',
                    error: importError.toString(),
                    stack: importError.stack,
                    code: 'STARTUP_ERROR'
                });
                return;
            }
        }

        // Forward request to Express
        return app(req, res);

    } catch (runtimeError: any) {
        console.error('CRITICAL: Runtime Error in Handler:', runtimeError);
        res.status(500).json({
            status: 'error',
            message: 'Runtime Execution Failed',
            error: runtimeError.toString(),
            stack: runtimeError.stack
        });
    }
};
