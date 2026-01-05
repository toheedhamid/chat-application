# Use official n8n image
FROM n8nio/n8n:latest

# Set working directory
WORKDIR /data

# Copy workflow files
COPY n8n_workflows/ /data/n8n_workflows/

# Copy scripts to temporary location first
COPY scripts/import-workflows.js /tmp/import-workflows.js
COPY scripts/docker-entrypoint.sh /tmp/docker-entrypoint.sh

# Make entrypoint script executable and move to final location
RUN chmod +x /tmp/docker-entrypoint.sh && \
    mv /tmp/docker-entrypoint.sh /data/docker-entrypoint.sh && \
    mkdir -p /data/scripts && \
    mv /tmp/import-workflows.js /data/scripts/import-workflows.js

# Expose the default n8n port
EXPOSE 5678

# Use custom entrypoint that imports workflows
ENTRYPOINT ["/data/docker-entrypoint.sh"]
