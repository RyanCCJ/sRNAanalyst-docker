#!/bin/bash
#-------------------------------------------

# Go to project directory
cd $(dirname $0)/..
BASE_DIR=$(pwd)
CONFIG=$1

# PATH environment
. ./requirement.sh

# Arguments
field=$(yq '.field' ${CONFIG})
map=$(yq '.map' ${CONFIG})
filter=$(yq '.filter' ${CONFIG})
strand=$(yq '.strand' ${CONFIG})
rc=$(yq '.rc' ${CONFIG})
read=$(yq '.read' ${CONFIG})
reference=$(yq '.reference' ${CONFIG})
merge=$(yq '.merge' ${CONFIG})
normalize=$(yq '.normalize' ${CONFIG})
factor=$(yq '.factor' ${CONFIG})
format=$(yq '.format' ${CONFIG})

data=$(yq '.data' ${CONFIG})
input=$(yq '.input_file' ${CONFIG})
output=$(yq '.output_dir' ${CONFIG})
task=${BASE_DIR}/toolkit/sRNAanalyst/preprocess.py
INPUT_NAME=${input%.*}
INPUT_EX=${input##*.}

args=""
args2=""
if [ ! -z $field ]; then
    args="${args} --field ${field}"
fi
if [ ! -z $map ]; then
    args="${args} --map ${map}"
fi
if [ ! -z $filter ]; then
    args="${args} --filter ${filter}"
fi
if [ ! -z $strand ]; then
    if [ $strand = 'reverse' ]; then
        args="${args} --rc"
    elif [ $strand = 'both' ]; then
        args="${args} --add_rc"
    fi
fi
if [ ! -z $read ]; then
    if [ $read = 'collapse' ]; then
        args="${args} --collapse"
    elif [ $read = 'distribute' ]; then
        args="${args} --distribute"
    fi
fi
if [ ! -z $reference ]; then
    args="${args} --merge ${merge} -r ${reference}"
fi
if [ ! -z $normalize ]; then
    if [ $normalize = 'Factor' ]; then
        args="${args} --normalize ${factor}"
    elif [ $normalize = 'RPM' ]; then
        args="${args} --norm_factor"
    fi
fi
if [ $rc = false ]; then
    args2="${args2} --no_count"
fi
args2="${args2} --format ${format}"

#-------------------------------------------

# Scripts

if [ $INPUT_EX = "zip" ]; then
    unzip $input -d $INPUT_NAME
    input=$INPUT_NAME
elif [ $INPUT_EX = "gz" ]; then
    gzip -d ${input}
    input=$INPUT_NAME
fi
if [ ! -z $normalize ]; then
    if [ $normalize = 'RPM' ]; then
        python $task $args -i $input -o ${output}/${data}_norm.csv
        norm_factor=$(awk '$0 ~ /# norm_factor/{split($0,a,"="); print a[2]}' ${output}/${data}_norm.csv)
        python $task --normalize $norm_factor $args2 -i ${output}/${data}_norm.csv -o ${output}/${data}_preprocess.${format}
        rm ${output}/${data}_norm.csv
    else
        python $task $args $args2 -i $input -o ${output}/${data}_preprocess.${format}
    fi
else
    python $task $args $args2 -i $input -o ${output}/${data}_preprocess.${format}
fi
#-------------------------------------------