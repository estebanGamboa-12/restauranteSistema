// Config sencillo para Prisma CLI: usamos DATABASE_URL del .env
import "dotenv/config";

export default {
  schema: "prisma/schema.prisma",
  // Prisma 7 lee DATABASE_URL directamente del entorno
};
