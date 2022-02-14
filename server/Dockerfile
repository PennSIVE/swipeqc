FROM python:3.10
WORKDIR /opt
COPY requirements.txt .
RUN pip install -r requirements.txt
# install ssh server for backend
COPY . .
EXPOSE 5000 22
CMD /opt/init.sh
# docker build -t pennsive/swipeqc-api .