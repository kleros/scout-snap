import { GatsbyConfig } from 'gatsby';

const config: GatsbyConfig = {
  // This is required to make use of the React 17+ JSX transform.
  jsxRuntime: 'automatic',

  // Add the pathPrefix setting
  pathPrefix: '',

  plugins: [
    'gatsby-plugin-svgr',
    'gatsby-plugin-styled-components',
    {
      resolve: 'gatsby-plugin-manifest',
      options: {
        name: 'Template Snap',
        icon: 'src/assets/logo.svg',
        theme_color: '#6F4CFF', // eslint-disable-line @typescript-eslint/naming-convention
        background_color: '#FFFFFF', // eslint-disable-line @typescript-eslint/naming-convention
        display: 'standalone',
      },
    },
  ],
};

export default config;
