module.exports = function(grunt) {
    const path = require("path");

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
            worker: {
                options: {presets: ['es2015']},
                files: [{expand: true, cwd: 'src/worker', src: '**/*.js', dest: '.tmp/babel/worker'}]
            }
        },
        browserify: {
          node: {
              options: {
                  browserifyOptions: {
                      paths: ['./thirdparty/node_modules']
                  }
              },
              files: {
                  'dist/bundle-worker.js': ['.tmp/babel/worker/node/entry.js']
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
                    {expand: true, cwd: 'src/browser/', src: '**/*.html', dest: 'dist/'},
                    {expand: true, cwd: '.tmp/babel/worker/modules', src: '**/*.js', dest: 'public/modules/'},
                    {
                        'public/modules/node-vfs.js': '.tmp/babel/worker/vfs/node-vfs.js',
                        'public/modules/node_modules/vfs_path.js': '.tmp/babel/worker/vfs/path.js'
                    }
                ]
            }
        },
        connect: {
            dist: {
                options: {
                    port: 9001,
                    base: ["./public", "./dist"],
                    keepalive: true
                }
            }
        }
    });

    grunt.registerTask('annotate', function() {
        const META_FILE = "dir-listing";

        traverse("./public");
        function traverse(parentPath) {
            const entries = grunt.file.expand(parentPath + "/*");
            entries.filter(f => filename(f) !== META_FILE);
            const files = entries.filter(f => grunt.file.isFile(f));
            const dirs = entries.filter(f => grunt.file.isDir(f));
            const meta = {
                files: files.map(filename),
                directories: dirs.map(filename)
            };
            grunt.file.write(
                path.join(parentPath, META_FILE),
                JSON.stringify(meta, null, 2),
                { encoding: "utf-8" }
            );
            dirs.forEach(traverse);
        }
        function filename(x) {
            return path.basename(x);
        }
    });

    grunt.registerTask('default', ['clean', 'babel', 'webpack', 'browserify', 'copy', 'connect']);
};