FROM nginx:alpine-slim

COPY nginx.conf /etc/nginx/nginx.conf
COPY site.conf /etc/nginx/sites-available/
RUN mkdir -p /etc/nginx/sites-enabled/ \
    && ln -s /etc/nginx/sites-available/site.conf /etc/nginx/sites-enabled/

CMD ["nginx", "-g", "daemon off;"]
