/**
 * Development configuration for RMMZ plugins
 *
 * Customize the paths and behavior for watch/deploy system
 */

const path = require('path');

module.exports = {
  // Path to your RMMZ project's plugins directory
  // Relative to this file's location
  rmmzPluginsPath: path.join(__dirname, '../../rmmz/Project1/js/plugins'),

  // Alternative: Absolute path
  // rmmzPluginsPath: '/absolute/path/to/your/rmmz/Project/js/plugins',

  // Plugin-specific deploy settings
  plugins: {
    physick: {
      // Output filename in RMMZ (defaults to dist filename)
      outputName: 'Physick.js',

      // Whether to deploy automatically on build
      autoDeploy: true,
    },

    // Add more plugins here as you create them:
    // 'my-other-plugin': {
    //   outputName: 'MyPlugin.js',
    //   autoDeploy: true,
    // },
  },

  // Watch settings
  watch: {
    // Debounce delay (ms) before rebuilding after file change
    debounceDelay: 100,

    // File extensions to watch
    extensions: ['.js', '.json'],

    // Directories to ignore
    ignore: ['node_modules', 'dist', '.git'],
  },

  // Build settings
  build: {
    // Show detailed build information
    verbose: false,

    // Clear console on rebuild
    clearConsole: false,
  },
};
