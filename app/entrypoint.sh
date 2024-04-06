#!/bin/bash
echo 'Collect Static'
python manage.py collectstatic --noinput
exec "$@"