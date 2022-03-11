#!/bin/bash

set -e
cd $(dirname $0)
export FLASK_APP=$PWD
# export FLASK_ENV=development
# export IMAGE_PATH=../test/mimosa_outputs
flask run --host=0.0.0.0 "$@" #--port 5001
