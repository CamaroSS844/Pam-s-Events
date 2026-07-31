<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://ai.google.dev/static/site-assets/images/share-ais-513315318.png" />
</div>

# Pam's Events

Create elegant wedding and event invitations, manage guests, and deliver polished RSVP experiences.

This repository contains everything you need to run the Pam's Events platform locally.

## Run Locally

**Prerequisites:**  Node.js


## Asset Management & Naming Guidelines

All static media assets in this project are stored inside organized subdirectories in `/public/assets/`:
- `/public/assets/invitation/` - Ornamental arches, frames, watermarks, ribbons, and decorative graphics.
- `/public/assets/branding/` - Logotypes, badges, and brand icons.

### Naming Conventions
To guarantee 100% asset loading reliability across production CDNs and client-side canvas snapshot export tools (e.g. `html-to-image`):
1. **URL-Safe Filenames**: Use strictly lowercase letters, numbers, and hyphens (`a-z`, `0-9`, `-`).
2. **No Spaces or Special Characters**: Never use spaces, parentheses, commas, underscores, or uppercase letters in asset filenames.
3. **Descriptive Purpose**: Name files based on what they represent (e.g., `invitation-floral-watermark.jpeg`, `wedding-rings.png`, `gold-vine-ornament.png`).

