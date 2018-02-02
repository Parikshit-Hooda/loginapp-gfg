#!/usr/bin/env node
var lineReader = require('line-reader');
var exec = require('child_process').exec;
var Promise = require('bluebird');
var Handlebars = require('handlebars');
var dir = require('node-dir');
var execSync = require("sync-exec");
var fs = require('fs');
var path = require('path');
var moduleArr = [];
var fileName = process.argv[2];
var fileNames = [];

function storingModuleNames(fn){
  return new Promise(function(resolve, reject){
    var eachLine = Promise.promisify(lineReader.eachLine);
    if(process.argv[2]==null){
      fileName = fn;
    }
    eachLine(fileName, function(line) {
      var regex = /require\(([^.\/)]+)\)/g;
      var mat = regex.exec(line);
      if(mat != null){
        mat[1] = mat[1].replace(/'/g, '');
        if (moduleArr.indexOf(mat[1]) == -1) {
          moduleArr.push(mat[1]);
        }
      }
    }).then(function(){
      resolve();
    })
    .catch(function(err) {
      console.error(err);
      reject();
    });
  }); 
};

function runningCommand(modules){
    console.log('\nINSTALLING THE FOLLOWING MODULES:');
    for (var module in modules){
      var localCommand = 'npm install '+modules[module]+' --save';
      if (modules[modules.length - 1] === modules[module])
        console.log('└── ',modules[module]);
      else
        console.log('├── ',modules[module]);
      execSync(localCommand);
    }
    console.log('\nMODULES INSTALLED AND SAVED INTO package.json...');
  };

function checkPackageJSON(){
    fs.stat('package.json', function(err, stat) {
      if(err == null) {
        //console.log('File exists');
      } else if(err.code == 'ENOENT') {
          function puts(error, stdout, stderr) {
            var globalModulesPath = stdout;
            var packageTemplatePath = path.join(globalModulesPath.trim(),'npm-install-all','template','template-package-json.hbs');
            var template = fs.readFileSync(packageTemplatePath).toString();
            var compiledTemplate = Handlebars.compile(template);
            var packagejson = JSON.parse(compiledTemplate());
            fs.writeFile('package.json', JSON.stringify(packagejson, null, "\t"));
          }

          var globalPathPrefixCommand = 'npm root -g';
          exec(globalPathPrefixCommand, puts);
          return;
      } else {
          console.log('Some other error: ', err.code);
      }
  });
}

var compute = function() {
  if(fileName!=null){
    checkPackageJSON();
    setTimeout(function(){
      storingModuleNames().then(function(){
      runningCommand(moduleArr);
    });
    }, 3000);
  }
  else{
    dir.readFiles('./', {
      match: /.js$/,
      excludeDir: ['node_modules']
    }, function(err, content, next) {
        if (err) throw err;
        next();
      },
      function(err, files){
        if (err) throw err;
        fileNames = files;
        checkPackageJSON();

      for (var file in fileNames){
        storingModuleNames(fileNames[file]);
      }

      setTimeout(function(){
        runningCommand(moduleArr);
      }, 3000);
    });
  }
};

compute();