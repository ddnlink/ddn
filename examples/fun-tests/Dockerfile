FROM ubuntu:18.04

RUN mkdir -p /ddn

WORKDIR /ddn

RUN apt update && \
    apt install curl sqlite3 ntp wget git libssl-dev openssl \
    make gcc g++ autoconf automake python build-essential \
    libtool libtool-bin -y
RUN curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.35.3/install.sh | bash && \
    export NVM_DIR="$HOME/.nvm" && [ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh" && [ -s "$NVM_DIR/bash_completion" ] && \. "$NVM_DIR/bash_completion"  

RUN nvm install 10.21.0

COPY . /ddn

RUN git clone https://github.com/ddnlink/ddn-starter.git .

RUN npm install --production 

RUN chmod u+x init/*.sh && chmod 755 ddnd && ./ddnd configure

EXPOSE 8001

CMD ./ddnd start