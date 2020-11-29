FROM node:12.16.1-alpine
WORKDIR /app
COPY . . 

RUN yarn install
RUN   apk update && \
      apk add --no-cache \
      openssh-keygen curl
ENTRYPOINT ["/bin/sh"]
CMD ["./script/run.sh"]
