const swaggerJsdoc = require("swagger-jsdoc");
const swaggerUi = require("swagger-ui-express");

// Swagger configuration
const options = {
    definition: {
        openapi: "3.0.0",
        info: {
            title: "Emergency Dispatch API",
            version: "1.0.0",
            description: "API documentation for the Emergency Dispatch System",
        },
        servers: [
            {
                url: "http://localhost:5000/api/",
                description: "Local server",
            },
        ],
    },
    apis: ["./routes/*.js"], // Path to your API route files
};

const specs = swaggerJsdoc(options);

module.exports = { swaggerUi, specs };
