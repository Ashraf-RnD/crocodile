// @ts-check
import { defineConfig } from 'astro/config';

import react from '@astrojs/react';
import mdx from '@astrojs/mdx';
import linksApi from './integrations/links-api.mjs';

// https://astro.build/config
export default defineConfig({
  integrations: [react(), mdx(), linksApi()]
});