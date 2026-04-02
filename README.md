# Robin Web(RWRS Another Page V2)

[![Maintainability Rating](https://sonarcloud.io/api/project_badges/measure?project=Kreedzt_rwrs-another-page-v2&metric=sqale_rating)](https://sonarcloud.io/summary/new_code?id=Kreedzt_rwrs-another-page-v2)
[![codecov](https://codecov.io/gh/Kreedzt/rwrs-another-page-v2/branch/master/graph/badge.svg?token=MWGXZH7GO9)](https://codecov.io/gh/Kreedzt/rwrs-another-page-v2)
![build status](https://github.com/Kreedzt/rwrs-another-page-v2/actions/workflows/ci.yml/badge.svg?branch=master)

A clean and modern data browser for Running with Rifles (RWR) game, inspired by [rwrstats](https://rwrstats.com/).

## Overview

Robin web provides a pure and efficient way to browse Running with Rifles game servers and player statistics. Built with modern web technologies, it offers:

- Real-time server list and player leaderboard browsing
- Multi-database statistics (Invasion, Pacific, Prereset Invasion)
- Advanced filtering and full-text search
- Multiple view modes with multilingual support
- Mobile-friendly responsive design

## Technical Stack

- **Framework**: SvelteKit 2.16.0 with Svelte 5
- **Styling**: Tailwind CSS 4.0 with DaisyUI components
- **Language**: TypeScript 5.0
- **Testing**: Vitest (unit) + Playwright (E2E)
- **i18n**: @inlang/paraglide-js
- **Package Manager**: pnpm

## Features

**Server & Player Data**

- Real-time server list with auto-refresh capability
- Player leaderboard with 15+ statistics (kills, deaths, K/D, score, time played, rank progression, etc.)
- Multi-database support (Invasion, Pacific, Prereset Invasion)

**Search & Filtering**

- Full-text search across servers and players with keyboard shortcut (/) support
- Preset quick filters (Official, WW2, Dominance, Castling, HellDivers mods)
- Multi-level column sorting (ascending/descending/clear)

**User Interface**

- Dual view modes: data table (desktop) and responsive cards (mobile)
- Column visibility toggles with persistent settings
- Map preview images with modal display
- Dynamic language switching (English and Chinese)
- Mobile-friendly with infinite scroll

**Developer Features**

- Accessible keyboard navigation and ARIA-compliant markup
- URL state management for bookmarkable views
- Multi-platform analytics tracking (Google Analytics, Baidu Analytics, Umami)

**Share & Export**

- Player statistics sharing with PC/Mobile optimized cards
- Server information sharing with essential connection details (IP, Port)
- High-quality PNG image generation with snapdom
- Download or copy to clipboard functionality
- Real-time query timestamp and rankings display
- Player list badges with consistent styling across views

## Analytics

The application includes a comprehensive analytics system that tracks user interactions while respecting privacy:

### Supported Platforms

- **Google Analytics (gtag)** - Track events via externally injected gtag script
- **Baidu Analytics (\_hmt)** - Track events via Baidu's analytics platform
- **Umami Analytics** - Track events via Umami's privacy-focused analytics

### Privacy-First Design

- **No sensitive data tracking**: Search queries are never sent (only search trigger events)
- **No consent required**: Analytics is auto-enabled when scripts are detected
- **Safe integration**: Gracefully handles missing analytics platforms without errors

### Tracked Events

| Event                      | Description                                 |
| -------------------------- | ------------------------------------------- |
| `view_switch`              | Switching between server/player views       |
| `theme_change`             | Changing UI theme                           |
| `language_change`          | Changing interface language                 |
| `search_triggered`         | Search interactions (without query content) |
| `quick_filter_applied`     | Applying preset filters                     |
| `column_sort`              | Sorting data columns                        |
| `pagination_change`        | Page navigation                             |
| `load_more_click`          | Loading more data (mobile)                  |
| `auto_refresh_toggle`      | Toggling auto-refresh                       |
| `player_database_change`   | Switching player databases                  |
| `column_visibility_toggle` | Showing/hiding columns                      |
| `server_join_click`        | Clicking server join button                 |
| `map_preview_open`         | Opening map preview                         |
| `share_modal_open`         | Opening player share modal                  |
| `share_download`           | Downloading player share image              |
| `share_copy`               | Copying player share image to clipboard     |
| `server_share_modal_open`  | Opening server share modal                  |
| `server_share_download`    | Downloading server share image              |
| `server_share_copy`        | Copying server share image to clipboard     |
| `github_link_click`        | Clicking GitHub link in header              |
| `discord_link_click`       | Clicking Discord link in header             |
| `steam_rwr1_link_click`    | Clicking RWR1 Steam link in header          |
| `steam_rwr2_link_click`    | Clicking RWR2 Steam link in header          |

### Debug Mode

Enable debug logging for analytics:

```bash
# Build with debug enabled
VITE_ANALYTICS_DEBUG=true pnpm build

# Or set environment variable
VITE_ANALYTICS_DEBUG=true pnpm dev
```

Debug mode logs all analytics events to the console for development and testing.

## Dependencies

This project requires the following backend:

- [rwrs-server](https://github.com/Kreedzt/rwrs-server) - Provides the API for server data

## Development

### Prerequisites

- Node.js (v22 or later recommended)
- pnpm package manager

### Setup

1. Clone the repository:

   ```bash
   git clone https://github.com/yourusername/rwrs-another-page-v2.git
   cd rwrs-another-page-v2
   ```

2. Install dependencies:

   ```bash
   pnpm install
   ```

3. Start the development server:
   ```bash
   pnpm dev
   ```

The application will be available at http://localhost:5173 and will proxy API requests to the backend server.

### Building

To build for production:

```bash
pnpm build
```

To build with CDN support (assets served from a CDN):

```bash
# Scenario 1: All assets (JS/CSS/Images) on the same CDN path
CDN_URL=https://assets.kreedzt.cn pnpm build:cdn

# Scenario 2: Separate CDN for images (e.g. OSS bucket for images)
# JS/CSS -> https://assets.kreedzt.cn/rwrs-v2-web-assets/...
# Images -> https://img.kreedzt.cn/images/...
CDN_URL=https://assets.kreedzt.cn/rwrs-v2-web-assets CDN_IMAGE_URL=https://img.kreedzt.cn/ pnpm build:cdn
```

## Deployment

### Docker

#### Community Image

The `robin-web-community` image automatically detects the current domain at runtime - no configuration needed:

```bash
docker pull zhaozisong0/robin-web-community:latest
docker run -d --name robin-web -p 80:80 zhaozisong0/robin-web-community:latest
```

**Features:**

- Automatically uses `window.location.origin` for meta tags and SEO
- No environment variables required for basic usage
- Optionally override `VITE_SITE_URL` and `VITE_CDN_IMAGE_URL` at runtime

Optional runtime configuration:

```bash
docker run -d --name robin-web -p 80:80 \
  -e "VITE_SITE_URL=https://your-domain.com" \
  zhaozisong0/robin-web-community:latest
```

#### Deployment with Backend

##### Option 1: Separate Containers with Network

1. Create a Docker network:

   ```bash
   docker network create robin-network
   ```

2. Start the rwrs-server container:

   ```bash
   docker pull zhaozisong0/rwrs-server:latest
   docker run -d --name rwrs-server --network robin-network \
     -e "HOST=0.0.0.0" -e "PORT=80" \
     zhaozisong0/rwrs-server:latest
   ```

3. Start the robin-web container:

   ```bash
   docker pull zhaozisong0/robin-web-community:latest
   docker run -d --name robin-web --network robin-network -p 80:80 \
     zhaozisong0/robin-web-community:latest
   ```

4. Configure a reverse proxy (like Nginx) to route:
   - `/api/*` requests to the rwrs-server container
   - `/*` requests to the robin-web container

##### Option 2: Single Container

You can also deploy by copying the frontend build to the rwrs-server's static directory:

1. Build the frontend:

   ```bash
   pnpm build
   ```

2. Copy the contents of the `build` directory to the `/static` directory of the rwrs-server container:

   ```bash
   docker cp ./build/. rwrs-server:/static/
   ```

   Or mount the directory when starting the container:

   ```bash
   docker run -d -p 80:80 -e "HOST=0.0.0.0" -e "PORT=80" \
     -v $(pwd)/build:/static \
     zhaozisong0/rwrs-server:latest
   ```

#### Custom Header Scripts

You can inject custom header scripts (e.g., analytics) using the `HEADER_SCRIPTS` environment variable:

```bash
docker run -p 80:80 \
  -e "HEADER_SCRIPTS=<script src=\"https://analytics.example.com/script.js\"></script>" \
  zhaozisong0/robin-web-community:latest
```

### Manual Deployment

1. Build the project:

   ```bash
   pnpm build
   ```

2. Either:
   - Deploy the contents of the `build` directory to your web server and configure it to proxy API requests to the rwrs-server backend.
   - Copy the contents of the `build` directory to the `/static` directory of your rwrs-server installation.

## Disclaimer

This project is an independent work and is **not affiliated, associated, authorized, endorsed by, or in any way officially connected with RWRS (Running with Rifles Stats) or its authors**.

The only relation is that this project was **inspired by RWRS**, but it is written entirely from scratch and does not contain any code, documentation, or resources from the original repository.

This project is a **frontend application** that displays data obtained from the official RWR API. All data displayed is sourced from and belongs to the official RWR service.

All trademarks, service marks, and project names mentioned belong to their respective owners. Their use here is purely for identification and reference purposes only, and does not imply any form of partnership or endorsement.

## License

- [MIT](LICENSE)
