#!/bin/bash
# -------------------

# CPU limitation
CORE=$(nproc --all)   # personal computer
if [ $CORE -gt 8 ]; then
    CORE=$(($CORE/2)) # workstation computer
fi

# Go to project directory
cd $(dirname $0)/..

# PATH environment
. ./requirement.sh

# Step1. Trimming
sh script/trimming.sh $1 ${CORE}

# Step2. Normalization
sh script/normalization.sh $1 ${CORE}

# Step3. Mapping
sh script/mapping.sh $1 ${CORE}

# -------------------