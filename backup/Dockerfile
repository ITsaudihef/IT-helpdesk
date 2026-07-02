FROM postgres:18-alpine

RUN apk add --no-cache bash

WORKDIR /app
COPY backup.sh /app/backup.sh
RUN chmod +x /app/backup.sh

CMD ["/app/backup.sh"]
