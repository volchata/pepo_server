#!/usr/bin/env bash

#npm run lint

function jsLint () {
	OUTPUT="$(npm run lint1 "$1")"
	RETVAL=$?
	if [ $RETVAL -ne 0 ]; then
	        npm run fix1 "$1"
	        git add "$1"
		OUTPUT="$(npm run lint1 "$1")"
	        RETVAL=$?
	
	        if [ $RETVAL -ne 0 ]; then

		     echo "$OUTPUT"
		     exit 1;
	        fi
       fi 
	

}

old_ifs=$IFS
IFS=$'\n'

files=$(git status --short | grep -E '^(A|M)' | awk '{ print $2 }' | grep -E '\.js$')
for file in $files; do
  jsLint $file
done
