import app from './app';
// import dotenv if needed, usually imported early or via -r dotenv/config

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
