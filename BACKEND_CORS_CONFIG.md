# Backend CORS Configuration Guide

## Problem
The frontend can call the login API on `euniiq.com` but fails when calling APIs on school subdomains like `st-xaviers-school.euniiq.com` due to CORS restrictions.

## Solution: Configure CORS for All School Subdomains

### For Django Backend (using django-cors-headers)

#### 1. Install django-cors-headers (if not already installed)
```bash
pip install django-cors-headers
```

#### 2. Add to `settings.py`:

```python
INSTALLED_APPS = [
    # ... other apps
    'corsheaders',
    # ...
]

MIDDLEWARE = [
    'corsheaders.middleware.CorsMiddleware',  # Must be before CommonMiddleware
    'django.middleware.common.CommonMiddleware',
    # ... other middleware
]

# CORS Configuration
CORS_ALLOWED_ORIGINS = [
    "http://localhost:5173",  # Vite dev server
    "http://localhost:3000",  # Alternative dev port
    "https://your-production-domain.com",  # Production frontend
    # Add other frontend domains as needed
]

# OR use regex pattern to allow all subdomains of euniiq.com
CORS_ALLOWED_ORIGIN_REGEXES = [
    r"^https://.*\.euniiq\.com$",  # Allow all subdomains
    r"^http://localhost:\d+$",  # Allow localhost with any port
]

# Allow credentials (cookies, authorization headers)
CORS_ALLOW_CREDENTIALS = True

# Allow custom headers that frontend sends
CORS_ALLOW_HEADERS = [
    'accept',
    'accept-encoding',
    'authorization',  # Required for Bearer token
    'content-type',
    'dnt',
    'origin',
    'user-agent',
    'x-csrftoken',
    'x-requested-with',
    'x-tenant-id',  # Your custom header
    'x-school-domain',  # Your custom header
]

# Allow all HTTP methods
CORS_ALLOW_METHODS = [
    'DELETE',
    'GET',
    'OPTIONS',
    'PATCH',
    'POST',
    'PUT',
]

# Preflight cache duration (in seconds)
CORS_PREFLIGHT_MAX_AGE = 86400  # 24 hours
```

#### 3. For Multi-Tenant Setup (if using django-tenants or similar)

If your backend uses subdomains for multi-tenancy, you may need to configure CORS at the middleware level to handle dynamic subdomains:

```python
# In settings.py or a custom middleware
class CustomCorsMiddleware:
    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        origin = request.META.get('HTTP_ORIGIN')
        
        # Allow requests from localhost
        if origin and 'localhost' in origin:
            response = self.get_response(request)
            response['Access-Control-Allow-Origin'] = origin
            response['Access-Control-Allow-Credentials'] = 'true'
            response['Access-Control-Allow-Headers'] = 'authorization, content-type, x-tenant-id, x-school-domain'
            response['Access-Control-Allow-Methods'] = 'GET, POST, PUT, PATCH, DELETE, OPTIONS'
            return response
        
        # Allow requests from euniiq.com subdomains
        if origin and '.euniiq.com' in origin:
            response = self.get_response(request)
            response['Access-Control-Allow-Origin'] = origin
            response['Access-Control-Allow-Credentials'] = 'true'
            response['Access-Control-Allow-Headers'] = 'authorization, content-type, x-tenant-id, x-school-domain'
            response['Access-Control-Allow-Methods'] = 'GET, POST, PUT, PATCH, DELETE, OPTIONS'
            return response
        
        return self.get_response(request)
```

### Alternative: Nginx Configuration (if using Nginx as reverse proxy)

If you're using Nginx, you can configure CORS at the server level:

```nginx
server {
    listen 443 ssl;
    server_name *.euniiq.com;  # Match all subdomains
    
    # CORS headers
    add_header 'Access-Control-Allow-Origin' '$http_origin' always;
    add_header 'Access-Control-Allow-Credentials' 'true' always;
    add_header 'Access-Control-Allow-Methods' 'GET, POST, PUT, PATCH, DELETE, OPTIONS' always;
    add_header 'Access-Control-Allow-Headers' 'Authorization, Content-Type, X-Tenant-ID, X-School-Domain' always;
    
    # Handle preflight requests
    if ($request_method = 'OPTIONS') {
        add_header 'Access-Control-Allow-Origin' '$http_origin' always;
        add_header 'Access-Control-Allow-Credentials' 'true' always;
        add_header 'Access-Control-Allow-Methods' 'GET, POST, PUT, PATCH, DELETE, OPTIONS' always;
        add_header 'Access-Control-Allow-Headers' 'Authorization, Content-Type, X-Tenant-ID, X-School-Domain' always;
        add_header 'Access-Control-Max-Age' 86400;
        add_header 'Content-Type' 'text/plain; charset=utf-8';
        add_header 'Content-Length' 0;
        return 204;
    }
    
    location /api/ {
        proxy_pass http://backend;
        # ... other proxy settings
    }
}
```

## Testing

After configuring CORS, test by:

1. **Check Network Tab**: The preflight OPTIONS request should return `200 OK` with proper CORS headers
2. **Check Response Headers**: The actual request should include:
   - `Access-Control-Allow-Origin: http://localhost:5173`
   - `Access-Control-Allow-Credentials: true`
   - `Access-Control-Allow-Headers: authorization, content-type, x-tenant-id, x-school-domain`

## Common Issues

1. **"Provisional headers are shown"**: CORS preflight failed - check backend CORS configuration
2. **"No 'Access-Control-Allow-Origin' header"**: Backend not sending CORS headers
3. **"Credentials flag is true but Access-Control-Allow-Credentials is not 'true'"**: Set `CORS_ALLOW_CREDENTIALS = True`
4. **Custom headers blocked**: Add them to `CORS_ALLOW_HEADERS`

## Frontend Verification

The frontend is correctly configured. The issue is purely backend CORS configuration.



