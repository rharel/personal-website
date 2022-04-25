# Exit on error
set -e

# Preserve deployment independent files in temporary directory
mkdir -p build_artifacts
mv production/CNAME production/.nojekyll build_artifacts

# Clear and rebuild
rm -rf templates_compiled/* production/*
npx eleventy --input=templates --output=templates_compiled
npx parcel build --no-cache --dist-dir production
cp webroot/* production

# Restore deployment independent files from temporary directory
mv build_artifacts/CNAME build_artifacts/.nojekyll production
rmdir build_artifacts
