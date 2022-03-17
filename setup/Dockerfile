FROM python:3.10
RUN apt-get update && apt-get install -y imagemagick ffmpeg sqlite3 && pip install med2image
WORKDIR /opt
COPY . .
ENTRYPOINT [ "/opt/mimosa.sh" ]
# docker build -t pennsive/nifti2video .
