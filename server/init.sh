#!/bin/bash

set -e
cd $(dirname $0)
export FLASK_ENV=development
export FLASK_APP=$PWD
export IMAGE_PATH=../test
flask run --port=5001 --host=0.0.0.0 "$@"
