# Use official n8n image
FROM n8nio/n8n:latest

# Set working directory
WORKDIR /data

# Copy workflow files
COPY n8n_workflows/ /data/n8n_workflows/

# Copy import script
COPY scripts/import-workflows.js /data/scripts/import-workflows.js

# Copy entrypoint script
COPY scripts/docker-entrypoint.sh /data/docker-entrypoint.sh

# Make scripts executable
RUN chmod +x /data/scripts/import-workflows.js /data/docker-entrypoint.sh

# Expose the default n8n port
EXPOSE 5678

# Use custom entrypoint that imports workflows
ENTRYPOINT ["/data/docker-entrypoint.sh"]
