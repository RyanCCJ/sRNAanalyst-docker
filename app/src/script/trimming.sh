#!/bin/bash
#-------------------------------------------

# Arguments

BASE_DIR=$(dirname $0)/..
CONFIG=$1
CORE=$2

active=$(yq '.trimming.active' ${CONFIG})
tool=$(yq '.trimming.tool' ${CONFIG})
score3=$(yq '.trimming.score3' ${CONFIG})
score5=$(yq '.trimming.score5' ${CONFIG})
adapter3=$(yq '.trimming.adapter3' ${CONFIG})
adapter5=$(yq '.trimming.adapter5' ${CONFIG})
UMI3=$(yq '.trimming.UMI3' ${CONFIG})
UMI5=$(yq '.trimming.UMI5' ${CONFIG})
max_length=$(yq '.trimming.max_length' ${CONFIG})
min_length=$(yq '.trimming.min_length' ${CONFIG})
max_n=$(yq '.trimming.max_n' ${CONFIG})
extra_args=$(yq '.trimming.extra_args' ${CONFIG})

data=$(yq '.data' ${CONFIG})
input=$(yq '.input_file' ${CONFIG})
output=$(yq '.output_dir' ${CONFIG})
INPUT_NAME=${input%.*}
INPUT_EX=${input##*.}

log=${output}/log
fastqc_before=${output}/fastqc/before_trimming
fastqc_after=${output}/fastqc/after_trimming
task=${BASE_DIR}/toolkit/sRNAanalyst/preprocess.py

adapter_args=""
if [ ! -z $adapter5 ]; then
    adapter_args="${adapter_args} --front ${adapter5}"
fi
if [ ! -z $adapter3 ]; then
    adapter_args="${adapter_args} --adapter ${adapter3}"
fi

#-------------------------------------------

# Scripts

mkdir -p ${log} ${fastqc_before} ${fastqc_after}

if [ $INPUT_EX = "zip" ]; then
    unzip $input -d $INPUT_NAME
    input=$INPUT_NAME
fi
if [ $active = true ] ; then
    fastqc --threads $CORE --extract --outdir $fastqc_before $input 2> ${log}/fastqc_before.log
    cutadapt --cores $CORE --quality-cutoff $score5,$score3 $adapter_args $input 2> ${log}/cutadapt_trim-adapter.log | \
    cutadapt --cores $CORE --cut $UMI5 --cut -$UMI3 --maximum-length $max_length --minimum-length $min_length --max-n $max_n $extra_args > ${output}/${data}_trimmed.fq - 2> ${log}/cutadapt_trim-UMI.log
    fastqc --threads $CORE --extract --outdir $fastqc_after ${output}/${data}_trimmed.fq 2> ${log}/fastqc_after.log
else   
    if [ $INPUT_EX = "gz" ]; then
        gzip -dk ${input}
        input=$INPUT_NAME
    fi
    cp ${input} ${output}/${data}_trimmed.fq
fi

# collapse duplicated reads
python $task --collapse -i ${output}/${data}_trimmed.fq --format fasta -o ${output}/${data}_collapsed.fa
rm ${output}/${data}_trimmed.fq

#-------------------------------------------