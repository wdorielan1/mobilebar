# On The Rocks Mobile Bar — website

The new site for [mobilebarontherocks.com](https://mobilebarontherocks.com/): one page,
plain HTML, CSS and JavaScript, with no build step. Upload the folder to any static host
(Netlify, GitHub Pages, Cloudflare Pages, or GoDaddy's file manager) and it works.

## What's on the page

1. **Opening scene.** Your trailer, large, at a wedding, with its service window shut and
   "On The Rocks" lettered in gold on the side. Scrolling fades the name, rolls the shutter
   up to show a bartender shaking a cocktail, then moves the camera in through the window
   into the rest of the site. The backdrop, trailer and window interior sit at different
   depths, so they shift against each other as you move and scroll.
2. **Step inside:** about the business (insured, RAMP-certified, you supply the alcohol).
3. **How it works:** the four booking steps and the cancellation terms.
4. **The bar menu:** Bronze, Silver and Gold, plus bartender and travel fees.
5. **The real thing:** your two real photos of the bar.
6. **Service area:** Milanville, PA, and the 50-mile radius.
7. **Check your date:** the booking form, and links to Facebook, Instagram and The Knot.

The look is black tie: ivory, near-black and champagne gold, Cormorant Garamond headings,
Great Vibes for the gold lettering, Outfit for everything else.

All prices, policies and wording come from the old site. New lines written for this site:
"An elegant mobile bar for weddings and celebrations.", "We bring the bar. You bring the
bottles.", "Four steps to a booked bar", "The bar menu", "This is the bar that shows up",
and the button labels.

Visitors who have "reduce motion" turned on, and browsers without JavaScript, get the same
opening picture held still, with the window already open.

## Still to fill in

| What | Where | Why |
|---|---|---|
| **Form destination** | `index.html`, the `<form action="…REPLACE_WITH_FORM_ID">` | Until it's set, sending the form shows a note asking visitors to message you on Facebook or Instagram. With [Formspree](https://formspree.io), create a form and paste its ID in place of `REPLACE_WITH_FORM_ID`. |
| **Email and phone** | `index.html`, the `CONTACT DETAILS` comment in the booking section | The old site published neither, so none are shown. |

## The opening scene's images (made with Higgsfield)

The trailer in the opening scene is an AI-generated image (Higgsfield, FLUX 3), made from
your two trailer photos so it keeps your trailer's shape: glossy black, wood-framed window,
brass lamps. The bartender in the open window is AI-generated too, not one of your staff.
The gallery further down uses your real photos.

- `hero-venue.jpg`: the wedding venue, with the trailer and its hitch painted out.
- `hero-trailer.webp`: the trailer cut out, with the service window's opening left clear.
- `hero-shutter.webp`: the closed shutter, which rolls up as you scroll.
- `hero-interior.webp`: the bar through the open window, with the bartender.

All four come from one 2736×1536 picture, so they line up exactly. To swap in a new one,
keep that size, or change `--scene-img-w`/`--scene-img-h` in `css/styles.css`, and update
the window's position in two places: `.scene__shutter`/`.scene__interior` in the CSS and
`WINDOW` in `js/main.js`.

## Files

```
index.html              the page
css/styles.css          all styles; shared values (colours, type, spacing) are in :root at the top
js/main.js              the camera move, the menu, the form
assets/img/             the opening scene's four layers, logo (two colourways), favicons, gallery, share image
assets/fonts/           Outfit, Cormorant Garamond, Great Vibes (self-hosted, SIL Open Font License)
```

### Other images

- `logo-dark.png` / `logo-light.png`: the glass-and-wheel logo from the old site, with its
  accent recoloured champagne gold. Dark lines for the ivory pages, light for the footer.
- `gallery-*.jpg`: your two real photos, cropped from the phone screenshots.

## Run it locally

```bash
python3 -m http.server 8000
```

Then open http://localhost:8000.
