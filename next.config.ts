/** @type {import('next').NextConfig} */

const nextConfig = {
  /* config options here */
  reactCompiler: true,
  experimental: {
    // ✅ evita que el bundler excluya @prisma/client/prisma
    serverComponentsExternalPackages: ["@prisma/client", "prisma"],

    // ✅ fuerza a trazar/copiar los artefactos nativos al output
    outputFileTracingIncludes: {
      // puedes ajustar al path real de tu app si no usas src/
      "/**/*": ["node_modules/.prisma/client", "node_modules/@prisma/client"],
    },
  },
};

module.exports = nextConfig;
