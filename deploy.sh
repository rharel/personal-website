# Exit on error
set -e

# Commit and push
cd production
git add --all
git commit -m "sync with master"
git push origin gh-pages
