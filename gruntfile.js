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
            dist: {
                entry: './.tmp/babel/index.js',
                output: {
                    path: './dist/',
                    filename: 'bundle.js'
                }
            }
        },
        copy: {
            dist: {
                files: [{expand: true, cwd: 'src', src: '**/*.html', dest: 'dist/'}]
            }
        },
        connect: {
            dist: {
                options: {
                    port: 9001,
                    base: 'dist',
                    keepalive: true
                }
            }
        }
    });

    grunt.registerTask('default', ['clean', 'babel', 'webpack', 'copy', 'connect']);
};