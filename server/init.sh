#!/bin/bash

set -e
cd $(dirname $0)
export FLASK_ENV=development
export FLASK_APP=$PWD
export IMAGE_PATH=../test/mimosa_web
flask run --host=0.0.0.0 "$@"
