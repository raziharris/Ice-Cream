# Aiscrème

A colourful, responsive website for Aiscrème ice cream catering. The original supplied logo is preserved. The visual system uses strawberry pink, mango yellow, pistachio green and deep berry text.

## Run locally

Run `npm.cmd run dev` and open http://127.0.0.1:3333.

## Live site

http://43.156.11.241/Icecream/

Static content in `dist/` is served by the shared Tencent Lighthouse Nginx host from `/var/www/sites/Icecream`. Asset paths are relative to support this route.

## Features

- Wedding, birthday and corporate event sections
- Original photographs from https://www.instagram.com/_aiscreme/
- Gallery filters and accessible native dialog photo viewer
- Event enquiry composer: copies a message for the visitor to send on Instagram, with a manual copy fallback on HTTP
- Responsive navigation and reduced-motion support

No booking is submitted by the site. Availability and packages are confirmed directly with Aiscrème.

## Photo sources

See `docs/photo-sources.json` for the original Instagram post links. Selected photos are stored locally so the site does not depend on expiring Instagram CDN URLs. Historical sample shop assets remain in the repository but are not used by this page.
