import { Express } from "express";
import swaggerUi from "swagger-ui-express";
import fs from "fs";
import YAML from "yaml";
import path from "path";

const openApiSpecPaths = [
    path.resolve(__dirname, "../docs/openapi-skeleton.yaml"), // dev
    path.resolve(__dirname, "../../src/docs/openapi-skeleton.yaml"), // dist fallback
];

export const setupSwagger = (app: Express): void => {
    try {
        const filePath = openApiSpecPaths.find(fs.existsSync);

        if (!filePath) {
            throw new Error(
                `OpenAPI spec not found. Checked: ${openApiSpecPaths.join(", ")}`
            );
        }
        
        const file = fs.readFileSync(filePath, "utf8");
        const swaggerDocument = YAML.parse(file);

        app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerDocument));

        console.log("Swagger UI available at /api-docs");
    } catch (error) {
        console.error("Failed to load OpenAPI specification:", error);
    }
};