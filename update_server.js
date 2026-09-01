const fs = require('fs');
let serverJs = fs.readFileSync('server.js', 'utf8');
if (!serverJs.includes('featureRoutes')) {
    serverJs = serverJs.replace(
        "const adminRoutes = require('./backend/routes/adminRoutes');",
        "const adminRoutes = require('./backend/routes/adminRoutes');\nconst featureRoutes = require('./backend/routes/featureRoutes');"
    );
    serverJs = serverJs.replace(
        "app.use('/api', adminRoutes);",
        "app.use('/api', adminRoutes);\napp.use('/api', featureRoutes);"
    );
    fs.writeFileSync('server.js', serverJs);
    console.log('Routes added to server.js');
} else {
    console.log('Routes already exist in server.js');
}
