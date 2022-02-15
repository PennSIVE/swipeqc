FROM python:3.10
RUN apt-get update && apt-get install -y imagemagick ffmpeg && pip install med2image
COPY mimosa.sh /opt/mimosa.sh
ENTRYPOINT [ "/opt/mimosa.sh" ]
# docker build -t pennsive/nifti2video .
