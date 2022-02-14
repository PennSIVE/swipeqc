FROM python:3.10
RUN apt-get update && apt-get install imagemagick && pip install med2image
COPY mimosa.sh /opt/mimosa.sh
ENTRYPOINT [ "/opt/mimosa.sh" ]
# docker build -t pennsive/nifti2gif .
# docker run --rm -v $PWD:$PWD -w $PWD pennsive/nifti2gif $PWD/test/sub-01/mimosa_ses-20140321_run-01
