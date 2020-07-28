
set -e
shopt -s extglob

TEMP_PATH="docs/.temp"

# build docs
yarn doc:build

# prepare deploy
mkdir $TEMP_PATH
cd $TEMP_PATH
git init
git pull git@github.com:ddnlink/ddn.git gh-pages
# rm -rf *
cp -r ../../dist/* .

# git config
git config user.email "limsbase@163.com"
git config user.name "limsbase"

# commit and push changes
git add -A
git commit --am -m "build: deploy documentation"
git push -f git@github.com:ddnlink/ddn.git master:gh-pages

# clean
cd -
rm -rf $TEMP_PATH
