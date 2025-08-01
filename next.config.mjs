/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    outputFileTracing: true,
  },
  outputFileTracingIncludes: {
    "/api/**/*": ["./node_modules/db-hafas-stations/**/*"],
    "/journey/**/*": ["./node_modules/db-hafas-stations/**/*"],
  },
};

export default nextConfig;
