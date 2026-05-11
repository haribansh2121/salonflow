import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  turbopack: {
    root: __dirname,
  },
};
module.exports = {
  allowedDevOrigins: ['192.168.8.196'],
}
export default nextConfig;
