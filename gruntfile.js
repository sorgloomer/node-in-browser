module.exports = function(grunt) {
    require('load-grunt-tasks')(grunt);
    grunt.initConfig({
        clean: {
            tmp: ['.tmp'],
            dist: ['dist']
        },
        babel: {
            modules: {
                options: {presets: ['es2015']},
                files: [{expand: true, cwd: 'src', src: '**/*.js', dest: '.tmp/babel/'}]
            }
        },
        webpack: {
            dist_index: {
                entry: './.tmp/babel/index.js',
                output: {
                    path: './dist/',
                    filename: 'bundle-index.js'
                }
            },
            dist_worker: {
                entry: './.tmp/babel/node-worker.js',
                output: {
                    path: './dist/',
                    filename: 'bundle-worker.js'
                }
            }
        },
        copy: {
            dist: {
                files: [
                    {expand: true, cwd: 'src', src: '**/*.html', dest: 'dist/'},
                    {expand: true, cwd: 'src/common', src: '**/*', dest: 'dist/common'}
                ]
            }
        },
        connect: {
            dist: {
                options: {
                    port: 9001,
                    base: ["public", "dist"],
                    keepalive: true
                }
            }
        }
    });

    grunt.registerTask('default', ['clean', 'babel', 'webpack', 'copy', 'connect']);
};