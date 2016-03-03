module.exports = function(grunt) {

    grunt.loadNpmTasks('grunt-babel');
    grunt.loadNpmTasks('grunt-contrib-clean');

    grunt.initConfig({
        clean: {
            tmp: ['.tmp'],
            dist: ['dist']
        },
        babel: {
            modules: {
                options: { presets: ['es2015'] },
                files: [{ expand: true, cwd: 'src', src: '**/*.js', dest: '.tmp/babel/' }]
            }
        }
    });

    grunt.registerTask('webpack', function() {
        const webpack = require('webpack');
        webpack({
            entry:'./.tmp/babel/index.js',
            output:{
                path: '/dist/',
                filename: 'bundle.js'
            }
        });
    });

    grunt.registerTask('default', ['clean', 'babel', 'webpack']);
};