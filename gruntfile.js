module.exports = function(grunt) {
    require('load-grunt-tasks')(grunt);
    grunt.initConfig({
        clean: {
            tmp: ['.tmp'],
            dist: ['dist']
        },
        babel: {
            browser: {
                options: {presets: ['es2015']},
                files: [{expand: true, cwd: 'src/browser', src: '**/*.js', dest: '.tmp/babel/browser'}]
            },
            commonjs: {
                options: {presets: ['es2015']},
                files: [{expand: true, cwd: 'src/worker', src: '**/*.js', dest: '.tmp/babel/worker'}]
            },
            es6: {
                options: {presets: ['es2015']},
                files: [{expand: true, cwd: 'src/es6', src: '**/*.js', dest: '.tmp/babel/es6'}]
            }
        },
        browserify: {
          node: {
              options: {
                  browserifyOptions: {
                      paths: ['./public/common/node_modules']
                  }
              },
              files: {
                  'dist/bundle-worker.js': ['.tmp/babel/node/entry.js']
              }
          }
        },
        webpack: {
          dist_index: {
              entry: './.tmp/babel/browser/index.js',
              output: {
                  path: './dist/',
                  filename: 'bundle-index.js'
              }
          }
        },
        copy: {
            dist: {
                files: [
                    {expand: true, cwd: 'src/browser/', src: '**/*.html', dest: 'dist/'}
                ]
            }
        },
        connect: {
            dist: {
                options: {
                    port: 9001,
                    base: ["dist"],
                    keepalive: true
                }
            }
        }
    });

    grunt.registerTask('default', ['clean', 'babel', 'webpack', 'browserify', 'copy', 'connect']);
};