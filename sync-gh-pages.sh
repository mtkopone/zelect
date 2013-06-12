#!/bin/sh
set -e
git checkout gh-pages
git checkout master -- zelect.js
git commit -m "Update zelect.js from master"
git push
git checkout master