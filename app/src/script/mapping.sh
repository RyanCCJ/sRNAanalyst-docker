#!/bin/bash
#-------------------------------------------

# Arguments

BASE_DIR=$(dirname $0)/..
CONFIG=$1
CORE=$2

active=$(yq '.mapping.active' ${CONFIG})
filter=$(yq '.mapping.filter' ${CONFIG})
reference=$(yq '.mapping.reference' ${CONFIG})
tool=$(yq '.mapping.tool' ${CONFIG})
strand=$(yq '.mapping.strand' ${CONFIG})
search=$(yq '.mapping.search' ${CONFIG})
number=$(yq '.mapping.number' ${CONFIG})
efficiency=$(yq '.mapping.efficiency' ${CONFIG})
boundary=$(yq '.mapping.boundary' ${CONFIG})
extra_args=$(yq '.mapping.extra_args' ${CONFIG})

data=$(yq '.data' ${CONFIG})
input=$(yq '.input_file' ${CONFIG})
output=$(yq '.output_dir' ${CONFIG})

log=${output}/log
task=${BASE_DIR}/toolkit/sRNAanalyst/preprocess.py
norm_factor=$(cat ${log}/norm_factor.log)

# delete header & reads that failed to align
bowtie_args="--no-hd --no-unal"

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
    
    # add filter
    if [ ! -z $filter ]; then
        python $task --filter $filter --format fasta -i ${output}/${data}_collapsed.fa -o ${output}/${data}_filtered.fa
    else
        cp ${output}/${data}_collapsed.fa ${output}/${data}_filtered.fa
    fi

    # map to reference
    if [ $tool = 'perfect' ]; then
        python $task $strand_args --merge "ref:read_seq" -i ${output}/${data}_filtered.fa -r $reference | \
        python $task --distribute --normalize $norm_factor -o ${output}/${data}.csv

    elif [ $tool = 'bowtie2' ]; then
        index=${output}/bowtie2/ref
        bowtie2-build $reference $index --threads $CORE > ${log}/bowtie2-build.log 2>&1
        bowtie2 -x $index --threads $CORE $bowtie_args $extra_args -f ${output}/${data}_filtered.fa -S ${output}/${data}_mapped.sam > ${log}/bowtie2.log 2>&1
        python $task --distribute --normalize $norm_factor --MD_tool Bowtie2 -i ${output}/${data}_mapped.sam -o ${output}/${data}.csv
        rm -r ${output}/bowtie2
    fi
    rm ${output}/${data}_filtered.fa
fi

#-------------------------------------------