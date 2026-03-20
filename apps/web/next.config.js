const path = require('path');

/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ['@agent-crm/shared'],
  outputFileTracingRoot: path.join(__dirname, '../../'),
};

module.exports = nextConfig;
