#!/bin/bash
##################################
# Copyright (C) 2023 Ryan Chung  #
#                                #
# History:                       #
# 2023/01/20 Ryan Chung          #
#            Original code.      #
##################################

SCRIPT=unset

#################################
# Command Line Help Discription #
#################################
display_help() {
	echo "
	An sRNA-seq preprocess and analysis pipeline tool.

	Usage: main.sh [-i] [-h]

	Options:
	-i	Input pipeline script.
	-h	Show this message.
	"
}

###########################
# Obtain Script Arguments #
###########################
get_options() {
	if [ -z $1 ]; then
		# no arguments
		echo "Error: Empty options."
		echo "Please enter '-h' for more details."
		exit 0
	else
		while getopts ":i:h" option
		do
			case $option in
				i) # get script path
					SCRIPT=$OPTARG
					;;
				h) # display Help
					display_help
					exit 0
					;;	
				?) # incorrect option
					echo "Error: Invalid options."
					echo "Please enter '-h' for more details."
					exit 0
					;;
			esac
		done
	fi
}

################
# Main Program #
################
get_options $@
sh ${SCRIPT}
