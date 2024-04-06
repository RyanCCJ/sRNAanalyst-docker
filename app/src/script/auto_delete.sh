#!/bin/bash
# delete directories older than 3 days

DIR=/app/media/*

find $DIR -maxdepth 0 -type d -mtime +3 -exec rm -rf {} \;
