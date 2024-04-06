#!/bin/bash
#-------------------------------------------

# Arguments

BASE_DIR=$(dirname $0)/..
CONFIG=$1
CORE=$2

active=$(yq '.normalization.active' ${CONFIG})
strategy=$(yq '.normalization.strategy' ${CONFIG})
factor=$(yq '.normalization.factor' ${CONFIG})
reference=$(yq '.normalization.reference' ${CONFIG})
tool=$(yq '.normalization.tool' ${CONFIG})
strand=$(yq '.normalization.strand' ${CONFIG})
search=$(yq '.normalization.search' ${CONFIG})
number=$(yq '.normalization.number' ${CONFIG})
efficiency=$(yq '.normalization.efficiency' ${CONFIG})
boundary=$(yq '.normalization.boundary' ${CONFIG})
extra_args=$(yq '.normalization.extra_args' ${CONFIG})

data=$(yq '.data' ${CONFIG})
input=$(yq '.input_file' ${CONFIG})
output=$(yq '.output_dir' ${CONFIG})

log=${output}/log
task=${BASE_DIR}/toolkit/sRNAanalyst/preprocess.py
bowtie_args="--no-unal" # suppress reads that failed to align

if [ $strand = 'forward' ]; then
    strand_args=""
    bowtie_args="${bowtie_args} --norc"
elif [ $strand = 'reverse' ]; then
    strand_args="--rc"
    bowtie_args="${bowtie_args} --nofw"
else
    strand_args="--add_rc"
fi
if [ $search = 'all' ]; then
    bowtie_args="${bowtie_args} -a"
elif [ $search = 'limited' ]; then
    bowtie_args="${bowtie_args} -k ${number}"
fi
if [ $boundary = 'local' ]; then
    bowtie_args="${bowtie_args} --${boundary} --${efficiency}-local"
else
    bowtie_args="${bowtie_args} --${boundary} --${efficiency}"
fi

#-------------------------------------------

# Scripts

mkdir -p ${log} ${output}/bowtie2/

if [ $active = true ] ; then
    
    if [ $strategy = 'Factor' ]; then
        norm_factor=$factor

    elif [ $strategy = 'RPM' ]; then
        python $task --norm_factor -i ${output}/${data}_collapsed.fa -o ${output}/${data}_norm.csv
        norm_factor=$(awk '$0 ~ /# norm_factor/{split($0,a,"="); print a[2]}' ${output}/${data}_norm.csv)
        rm ${output}/${data}_norm.csv

    elif [ $strategy = 'Abundance' ]; then
        if [ $tool = 'perfect' ]; then
            python $task $strand_args --merge "ref:read_seq" -i ${output}/${data}_collapsed.fa -r $reference | \
            python $task --distribute --norm_factor -o ${output}/${data}_norm.csv

        elif [ $tool = 'bowtie2' ]; then
            index=${output}/bowtie2/ref
            bowtie2-build $reference $index --threads $CORE > ${log}/bowtie2-build_normalize.log 2>&1
            bowtie2 -x $index --threads $CORE $bowtie_args $extra_args -f ${output}/${data}_collapsed.fa -S ${output}/${data}_mapped.sam > ${log}/bowtie2_normalize.log 2>&1
            python $task --distribute --norm_factor -i ${output}/${data}_mapped.sam -o ${output}/${data}_norm.csv
            rm -r ${output}/bowtie2
        fi
        norm_factor=$(awk '$0 ~ /# norm_factor/{split($0,a,"="); print a[2]}' ${output}/${data}_norm.csv)
        rm ${output}/${data}_norm.csv
    fi
else
    norm_factor=1
fi

echo $norm_factor > ${log}/norm_factor.log

#-------------------------------------------