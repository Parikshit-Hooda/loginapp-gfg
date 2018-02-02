# npm-install-all

![NPM](https://img.shields.io/badge/platform-windows%20%7C%20linux%20%7C%20ios-orange.svg) ![NPM](https://img.shields.io/badge/license-MIT-blue.svg) ![NPM](https://img.shields.io/badge/status-stable-green.svg)

[![NPM](https://nodei.co/npm/npm-install-all.png?downloads=true&downloadRank=true&stars=true)](https://nodei.co/npm/npm-install-all/)

[![NPM](https://nodei.co/npm-dl/npm-install-all.png?height=3)](https://nodei.co/npm/npm-install-all/)

This module simply recognizes all the require commands and help you to install all the npm modules and also save it in your package.json.
This is a pretty cool module which reduces the work of repetitive installation of npm modules which are not present in your package.json to run an application. If there exists a package.json, it saves it as dependencies inside it, else creates it.

You just need to run this module from the project directory. This module recursively checks all the folders (excluding node_modules folder) and files of the project or folder where you are running this command and install the npm packages that you are using in your project, and finally saves it into package.json.

## Installation

```
$ npm install npm-install-all -g
```

## Usage 1 (For a specific file)

```
$ npm-install-all <filename>
```

## Example
```
$ npm-install-all test.js
```

## Usage 2 (For a complete project or folder)

```
$ npm-install-all
```

## For example if you want to install all the dependent npm modules for the "demo-project" (currently residing in example folder)

Just go inside the demo-project folder and simply run this command below

```
$ npm-install-all
```

You will see all the node modules installed locally and a 'package.json' being created with all the node modules saved in 'dependencies' property.

## Screenshots

**Output in the console (For a specific js file)**

![](/screenshots/output1.PNG?raw=true)


**Output in the console (For a complete project or folder)**

![](/screenshots/output2.PNG?raw=true)


**node_modules folder**

![](/screenshots/node-modules.PNG?raw=true)


**package.json**

![](/screenshots/package-json.PNG?raw=true)

---
