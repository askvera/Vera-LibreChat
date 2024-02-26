#!/bin/bash
## get_next_pr_tag.sh
##  Handles using the AWS CLI to scan previous build artifcacts in S3, and find new version.
##  For example tag sequence, see Vera wiki

# Specify the S3 bucket and major.minor.patch
S3_URI=$1
VERSION=$2

# Get the list of image tags matching the given major.minor.patch
TAGS=$(aws s3 ls  --query "Contents[?contains(Key, '${VERSION}')].Key" ${S3_URI} --output text | awk '{print $2}' |  sed 's/\/$//')


# Initialize the highest r number found
MAX_R_NUM=0

while IFS= read -r i; do
    # Skip if no tag was found
    [ "$i" == "None" ] && continue

    # If the tag matches the rX format, extract the X and compare it to the current max
    if [[ $i =~ ^$VERSION'r'([0-9]+)$ ]]; then
        R_NUM=${BASH_REMATCH[1]}
        if (( R_NUM > MAX_R_NUM )); then
            MAX_R_NUM=$R_NUM
        fi
    fi
done <<< "$TAGS"

# Calculate the next r number
NEXT_R_NUM=$((MAX_R_NUM + 1))
NEXT_TAG="$VERSION"r"$NEXT_R_NUM"

# Print the next tag
echo $NEXT_TAG