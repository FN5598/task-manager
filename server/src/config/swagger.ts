import swaggerUi from "swagger-ui-express";
import SwaggerParser from "@apidevtools/swagger-parser";
import { Express } from "express";


export const setupSwagger = async (app: Express) => {
    try {
        const api = await SwaggerParser.dereference("./src/docs/swagger.yaml");
        
        app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(api));
    } catch (err) {
        console.error("Failed to setup Swagger:", err);
    }
}
