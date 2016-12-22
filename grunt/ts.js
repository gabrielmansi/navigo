module.exports =  {
    options: {                    // use to override the default options, see : http://gruntjs.com/configuring-tasks#options
        target: 'es5',            // es3 (default) / or es5
        //module: 'commonjs',       // amd (default), commonjs
        sourceMap: true,          // true  (default) | false
        declaration: false,       // true | false  (default)
        noLib: false,             // true | false (default)
        comments: false           // true | false (default)
    },
    dev: {                          // a particular target
        src: ['<%= yeoman.app %>/src/**/*.ts'],       // The source typescript files, See : http://gruntjs.com/configuring-tasks#files
        //html: ['<%= yeoman.app %>/src/home/*.html'],
        //watch: 'src',               // If specified, configures this target to watch the specified director for ts changes and reruns itself.
        reference: 'app/src/ts-reference.ts',   // If specified, generate a reference.ts file at this place
        out: 'app/src/ts-gen.js'    // If specified, generate an out.js file which is the merged js file
    }
}