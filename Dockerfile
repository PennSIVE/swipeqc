FROM python:3.10
WORKDIR /opt/server
COPY server/requirements.txt .
RUN pip install -r requirements.txt
COPY server .
WORKDIR /opt/client
COPY client/build .
EXPOSE 5000 22
CMD /opt/server/init.sh
# docker build -t pennsive/swipeqc .