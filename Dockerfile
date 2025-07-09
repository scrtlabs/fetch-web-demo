# Use the latest nginx image as base
FROM nginx:latest

# Set working directory
WORKDIR /usr/share/nginx/html

# Remove default nginx static assets
RUN rm -rf /usr/share/nginx/html/*

# Copy application files to nginx html directory
COPY index.html .
COPY demo.html .
COPY report.html .
COPY demo-features.html .
COPY demo-workflow.html .
COPY demo-specs.html .
COPY demo-cta.html .
COPY demo-footer.html .

# Copy CSS files
COPY css/ ./css/

# Copy JavaScript files
COPY js/ ./js/

# Copy custom nginx configuration
COPY nginx.conf /etc/nginx/nginx.conf

# Create logs directory
RUN mkdir -p /var/log/nginx

# Expose port 80
EXPOSE 80

# Add health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD curl -f http://localhost/ || exit 1

# Start nginx
CMD ["nginx", "-g", "daemon off;"]