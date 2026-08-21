# syntax=docker/dockerfile:1.7

FROM python:3.14-slim AS build
ENV PIP_DISABLE_PIP_VERSION_CHECK=1 \
    PIP_NO_CACHE_DIR=1 \
    VIRTUAL_ENV=/opt/venv
RUN python -m venv "$VIRTUAL_ENV"
ENV PATH="$VIRTUAL_ENV/bin:$PATH"
COPY server/requirements.txt /tmp/requirements.txt
RUN pip install --upgrade pip \
    && pip install --requirement /tmp/requirements.txt

FROM python:3.14-slim AS runtime
ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PATH="/opt/venv/bin:$PATH" \
    DJANGO_SETTINGS_MODULE=mers_tassel.settings

RUN addgroup --system --gid 10001 app \
    && adduser --system --uid 10001 --ingroup app --home /app app

WORKDIR /app
COPY --from=build /opt/venv /opt/venv
COPY server/ /app/
COPY deploy/python-entrypoint.sh /usr/local/bin/python-entrypoint
RUN chmod 0555 /usr/local/bin/python-entrypoint \
    && mkdir -p /app/media /app/staticfiles \
    && chown -R app:app /app

EXPOSE 8000
USER app

HEALTHCHECK --interval=20s --timeout=5s --start-period=45s --retries=5 \
    CMD python -c "import urllib.request; urllib.request.urlopen('http://127.0.0.1:8000/health/', timeout=3)" || exit 1

ENTRYPOINT ["/usr/local/bin/python-entrypoint"]
