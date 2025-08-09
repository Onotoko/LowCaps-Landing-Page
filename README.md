# Lowcaps.io - Blockchain Development Team Landing Page

Professional landing page for an elite blockchain development team featuring anime-style character designs, modern animations, and comprehensive SEO optimization.

## 📋 Table of Contents

- [Prerequisites](#prerequisites)
- [Installation](#installation)
- [Project Structure](#project-structure)
- [Development](#development)
- [Deployment](#deployment)
- [Configuration](#configuration)
- [SEO Setup](#seo-setup)
- [Performance Optimization](#performance-optimization)
- [Testing](#testing)
- [Troubleshooting](#troubleshooting)

## 🔧 Prerequisites

- Web server (Apache, Nginx, or any static hosting service)
- Text editor or IDE (VS Code, Sublime Text, etc.)
- Modern web browser for testing
- (Optional) Node.js for development tools
- (Optional) Git for version control

## 📦 Installation

```bash
# Clone the repository
git clone https://github.com/lowcapgems/LowCaps-Landing-Page.git

# Navigate to project directory
cd LowCaps-Landing-Page

# Open in your preferred editor
code .  # For VS Code
```

## 📁 Project Structure

```
lowcaps-website/
│
├── index.html              # Main landing page (contains all code)
├── README.md               # Project documentation
├── LICENSE                 # License file
├── .gitignore              # Git ignore file
│
├── assets/                 # Static assets (create these directories)
│   ├── images/
│   │   ├── og-image.png   # Open Graph image (1200x630px)
│   │   ├── twitter-card.png # Twitter card image (1200x600px)
│   │   └── logo.png       # Company logo
│   ├── team/              # Team member images
│   |   ├── brett.png      # Brett's avatar
│   |   ├── andy.png       # Andy's avatar
│   |   ├── jena.png       # Jena's avatar
│   |   ├── mohit.png      # Mohit's avatar
│   |   └── ryan.png       # Ryan's avatar
│   └── icons/
│       ├── favicon.ico
│       ├── favicon-32x32.png
│       ├── favicon-16x16.png
│       └── apple-touch-icon.png
│
├── robots.txt             # Search engine crawling rules
├── sitemap.xml           # XML sitemap for SEO
└── site.webmanifest      # Web app manifest
```

## 💻 Development

### Local Development Server

```bash
# Install http-server globally
npm install -g http-server

# Run server
http-server -p 8000

# Or using npx (no installation needed)
npx http-server -p 8000
```

## 🚀 Deployment

### Static Hosting Services

#### Netlify
```bash
# Install Netlify CLI
npm install -g netlify-cli

# Deploy to Netlify
netlify deploy

# Deploy to production
netlify deploy --prod
```

#### Vercel
```bash
# Install Vercel CLI
npm install -g vercel

# Deploy
vercel
```

### Docker Deployment

Create a `Dockerfile`:
```dockerfile
FROM nginx:alpine
COPY . /usr/share/nginx/html
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
```

Build and run:
```bash
# Build image
docker build -t lowcaps-website .

# Run container
docker run -d -p 80:80 lowcaps-website
```

### Nginx Configuration

```nginx
server {
    listen 80;
    listen [::]:80;
    server_name lowcaps.io www.lowcaps.io;
    
    root /var/www/lowcaps.io;
    index index.html;
    
    # Gzip compression
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_types text/plain text/css text/xml text/javascript application/javascript application/xml+rss application/json;
    
    # Cache static assets
    location ~* \.(jpg|jpeg|png|gif|ico|css|js|svg)$ {
        expires 30d;
        add_header Cache-Control "public, immutable";
    }
    
    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header X-Content-Type-Options "nosniff" always;
    
    location / {
        try_files $uri $uri/ =404;
    }
}
```

## ⚙️ Configuration

### Environment Variables

Create a `.env` file for configuration:
```env
SITE_URL=https://lowcaps.io
CONTACT_EMAIL=hello@lowcaps.io
GA_TRACKING_ID=UA-XXXXXXXXX-X
```

### Customization

1. **Update Contact Information:**
   - Search for `hello@lowcaps.io` and replace with your email
   - Update social media links in the structured data

2. **Modify Colors:**
   - Edit CSS variables in the `:root` selector
   - Located around line 320 in the `<style>` section

3. **Change Team Members:**
   - Find the team section (search for "team-members")
   - Update SVG illustrations and names

## 🔍 SEO Setup

### 1. Create Required Files

#### robots.txt
```txt
User-agent: *
Allow: /
Sitemap: https://lowcaps.io/sitemap.xml

User-agent: Googlebot
Crawl-delay: 0

User-agent: Bingbot
Crawl-delay: 1
```

#### sitemap.xml
```xml
<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
    <url>
        <loc>https://lowcaps.io/</loc>
        <lastmod>2024-01-01</lastmod>
        <changefreq>weekly</changefreq>
        <priority>1.0</priority>
    </url>
</urlset>
```

### 2. Generate Favicon Files

Use a favicon generator like [favicon.io](https://favicon.io) or [realfavicongenerator.net](https://realfavicongenerator.net)

### 3. Create Open Graph Images

- **og-image.png**: 1200x630px
- **twitter-card.png**: 1200x600px

### 4. Submit to Search Engines

```bash
# Google Search Console
https://search.google.com/search-console

# Bing Webmaster Tools
https://www.bing.com/webmasters

# Submit sitemap URL in both tools
```

## ⚡ Performance Optimization

### Minification

```bash
# Install minification tools
npm install -g html-minifier terser cssnano-cli

# Minify HTML
html-minifier --collapse-whitespace --remove-comments --minify-css true --minify-js true index.html -o index.min.html

# If CSS/JS were external:
# terser script.js -o script.min.js --compress --mangle
# cssnano styles.css styles.min.css
```

### Image Optimization

```bash
# Install image optimization tools
npm install -g imagemin-cli

# Optimize images
imagemin assets/images/* --out-dir=assets/images/optimized
```

### Enable Compression

For Apache, add to `.htaccess`:
```apache
<IfModule mod_deflate.c>
    AddOutputFilterByType DEFLATE text/html
    AddOutputFilterByType DEFLATE text/css
    AddOutputFilterByType DEFLATE text/javascript
    AddOutputFilterByType DEFLATE application/javascript
</IfModule>
```

## 🧪 Testing

### Browser Testing

```bash
# Test responsiveness
# Open Chrome DevTools (F12)
# Toggle device toolbar (Ctrl+Shift+M)
# Test various device sizes
```

### Lighthouse Audit

1. Open Chrome DevTools
2. Go to Lighthouse tab
3. Run audit for:
   - Performance
   - Accessibility
   - Best Practices
   - SEO

### W3C Validation

```bash
# HTML Validation
https://validator.w3.org/

# CSS Validation
https://jigsaw.w3.org/css-validator/
```

### Speed Testing

- [Google PageSpeed Insights](https://pagespeed.web.dev/)
- [GTmetrix](https://gtmetrix.com/)
- [WebPageTest](https://www.webpagetest.org/)

## 🐛 Troubleshooting

### Common Issues

**Issue: Animations not working**
```bash
# Check browser console for errors
# Ensure JavaScript is enabled
# Test in different browser
```

**Issue: Mobile menu not opening**
```bash
# Check if JavaScript is loading
# Verify click event listeners
# Test touch events on actual device
```

**Issue: Fonts not loading**
```bash
# Check network tab for 404 errors
# Verify font URLs are correct
# Ensure CORS headers if loading from CDN
```

**Issue: Poor performance score**
```bash
# Minify HTML/CSS/JS
# Optimize images
# Enable caching
# Use CDN for assets
```

## 📊 Monitoring

### Google Analytics Setup

Add before closing `</head>` tag:
```html
<!-- Google Analytics -->
<script async src="https://www.googletagmanager.com/gtag/js?id=GA_MEASUREMENT_ID"></script>
<script>
  window.dataLayer = window.dataLayer || [];
  function gtag(){dataLayer.push(arguments);}
  gtag('js', new Date());
  gtag('config', 'GA_MEASUREMENT_ID');
</script>
```

### Error Tracking (Sentry)

```html
<script src="https://browser.sentry-cdn.com/7.0.0/bundle.min.js"></script>
<script>
  Sentry.init({ dsn: 'YOUR_SENTRY_DSN' });
</script>
```

## 🔐 Security

### HTTPS Setup

1. Obtain SSL certificate (Let's Encrypt)
```bash
sudo certbot --nginx -d lowcaps.io -d www.lowcaps.io
```

2. Force HTTPS redirect
3. Update all URLs to use HTTPS

### Security Headers

Add to server configuration:
```
X-Frame-Options: SAMEORIGIN
X-Content-Type-Options: nosniff
X-XSS-Protection: 1; mode=block
Referrer-Policy: strict-origin-when-cross-origin
Content-Security-Policy: default-src 'self'
```

## 📝 License

MIT License - see LICENSE file for details

## 🤝 Support

For deployment issues:
- Check browser console for errors
- Verify all file paths are correct
- Ensure proper server configuration
- Contact: hello@lowcaps.io

---

Built with ❤️ by the Lowcaps.io Team