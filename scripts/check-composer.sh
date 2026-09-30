#!/usr/bin/env bash

# In CI, we want to check all changed files between the base branch and the current branch
if [ -n "$GITHUB_ACTIONS" ]; then
    # Get the base SHA from the PR event
    BASE_SHA=$(git merge-base HEAD origin/$GITHUB_BASE_REF)
    COMPOSER_JSON_FILES=$(git diff --name-only $BASE_SHA HEAD | grep 'composer\.json$' | grep -v '/vendor/')
else
    COMPOSER_JSON_FILES=$(git diff --cached --name-only | grep 'composer\.json$' | grep -v '/vendor/')
fi

if [ -n "$COMPOSER_JSON_FILES" ]; then
    echo "Checking composer.lock files for modified composer.json..."

    exit_code=0

    while IFS= read -r file; do
        dir=$(dirname "$file")
        if [ -f "$dir/composer.lock" ]; then
            if [ -n "$GITHUB_ACTIONS" ]; then
                # In CI, check if the lock file has changed between base and head
                if ! git diff --name-only $BASE_SHA HEAD | grep -q "^$dir/composer.lock$"; then
                    echo "Error: $file was modified but $dir/composer.lock was not updated."
                    if [[ "$dir" == framework/src/* ]]; then
                        component=$(basename "$dir")
                        echo "Please run 'make composer-update-framework-$component' and commit the changes."
                    else
                        echo "Please run 'make composer-update-${dir##*/}' and commit the changes."
                    fi
                    exit_code=1
                fi
            else
                if ! git diff --cached --name-only | grep -q "^$dir/composer.lock$"; then
                    echo "Error: $file was modified but $dir/composer.lock was not updated."
                    if [[ "$dir" == framework/src/* ]]; then
                        component=$(basename "$dir")
                        echo "Please run 'make composer-update-framework-$component' and commit the changes."
                    else
                        echo "Please run 'make composer-update-${dir##*/}' and commit the changes."
                    fi
                    exit_code=1
                fi
            fi
        fi
    done <<< "$COMPOSER_JSON_FILES"

    exit $exit_code
fi
