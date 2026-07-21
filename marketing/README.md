# Marketing Graphics

## event-graphics.html

The AAC Event Graphics Maker. Double-click the file to open it in your browser (no server or internet needed).

Type your event details into the form and it draws four matching graphics live, in the site's starfield desktop and retro window style:

- Poster, 8.5 x 11 in (1700 x 2200 px)
- Instagram Post, 4:5 (1080 x 1350 px)
- Instagram Square, 1:1 (1080 x 1080 px)
- Instagram Story, 9:16 (1080 x 1920 px)

Each has a Download PNG button. Three color themes: Starfield Blue, Midnight Navy, Forest Teal. It also writes suggested alt text for Instagram, and you can save events to reuse for a speaking series (saved in the browser).

Everything is self-contained: the TAY Big Bird display font (`public/fonts/TAYBigBirdRegular.woff2`) and the logo (`public/images/logo-across-blue-bg.svg`) are embedded in the file as base64. To change layouts or copy, edit the HTML/JS in `event-graphics.html` directly; the base64 blocks are just those two assets inlined.

This folder is not part of the Next.js app and never ships to the website.
