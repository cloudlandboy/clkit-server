#!/bin/bash
rootPath="$(dirname "$0")";
node $rootPath/install.js
node $rootPath/app.js start