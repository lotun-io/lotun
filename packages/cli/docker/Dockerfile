FROM node:12-alpine as BASE

USER root
ENV NPM_CONFIG_PREFIX=/home/node/.npm-global
ENV PATH=$PATH:/home/node/.npm-global/bin

USER node 
RUN npm i -g @lotun/cli

CMD ["lotun"]