# On The Rocks Mobile Bar — website

The new site for [mobilebarontherocks.com](https://mobilebarontherocks.com/): one page,
plain HTML, CSS and JavaScript, with no build step. Upload the folder to any static host
(Netlify, GitHub Pages, Cloudflare Pages, or GoDaddy's file manager) and it works.

## What's on the page

1. **Opening scene.** You start outside the bar. As you scroll, the camera moves toward the
   trailer and in through the service window, the way the jet video flies in. Layers sit at
   different depths (sky, string lights, the title, the trailer, lights in front), so they
   shift against each other as the camera moves, and slightly with the mouse.
2. **Step inside:** about the business (insured, RAMP-certified, dry hire).
3. **How it works:** the four booking steps and the cancellation terms.
4. **The bar menu:** Bronze, Silver and Gold, plus bartender and travel fees.
5. **The real thing:** your two photos of the bar.
6. **Service area:** Milanville, PA, and the 50-mile radius.
7. **Check your date:** the booking form, and links to Facebook, Instagram and The Knot.

All prices, policies and wording come from the old site. New lines written for this site:
the hero title split, "We bring the bar. You bring the bottles.", "Four steps to a booked
bar", "The bar menu", "This is the bar that shows up", and the button labels.

Visitors who have "reduce motion" turned on get the same opening picture, held still, with
no camera move. Without JavaScript, the page still reads top to bottom.

## Still to fill in

| What | Where | Why |
|---|---|---|
| **Form destination** | `index.html`, the `<form action="…REPLACE_WITH_FORM_ID">` | Until it's set, sending the form shows a note asking visitors to message you on Facebook or Instagram. With [Formspree](https://formspree.io), create a form and paste its ID in place of `REPLACE_WITH_FORM_ID`. |
| **Email and phone** | `index.html`, the `CONTACT DETAILS` comment in the booking section | The old site published neither, so none are shown. |

## Adding a Higgsfield clip (optional)

The scene works without one. To add a moving sky behind the trailer:

1. Generate a clip, for example: *"slow drifting clouds at golden hour, soft teal and amber
   sky, no objects, no text, seamless loop, 16:9, 6–8 seconds"*.
2. Export it as MP4 (H.264, no audio, ideally under 4 MB) and save it as `assets/media/sky.mp4`.
3. In `index.html`, set `data-sky-video="assets/media/sky.mp4"` on the `<section class="scene">`.

The trailer itself stays your real photo.

## Files

```
index.html              the page
css/styles.css          all styles; shared values (colours, type, spacing) are in :root at the top
js/main.js              the camera move, the menu, the form
assets/img/             logo (two colourways), favicons, the trailer cut-out, background, gallery, share image
assets/fonts/           Outfit (self-hosted, SIL Open Font License — see OFL-Outfit.txt)
assets/media/           optional Higgsfield clip goes here
```

### Images

- `logo-dark.png` / `logo-light.png`: the glass-and-wheel logo from the old site, cropped,
  with dark lines for the light hero and white lines for the dark sections.
- The trailer in the opening scene is your eucalyptus photo, warm-graded and split into
  depths so it reads as 3D. Every file is the same size, so they line up exactly from the
  starting camera:
  - `scene-bar-back.webp`: the back wall of the bar, seen through the window (the
    bartender and lanterns painted out, slightly enlarged so the window never shows an edge);
  - `scene-bar-bartender.webp`: the bartender alone;
  - `scene-bar.webp`: the trailer body, with the service window cut open and the part the
    sign hid filled in;
  - `scene-bar-sign.webp`: the chalkboard sign, which stands in front;
  - `scene-bar-gloss.webp`: a mask of the glossy black panels, where the moving sheen shows.
- `scene-plate.jpg`: the same photo with the trailer removed and blurred, used as the
  background so the layers can move separately.
- `gallery-*.jpg`: your two photos, cropped from the phone screenshots, with the same warm grade.

If you swap the hero photo, the service window's position inside it is set on
`.scene__bar` in `index.html` (`--wx`, `--wy`, `--ww`, `--wh`, as fractions of the image),
which is where the camera aims.

## Run it locally

```bash
python3 -m http.server 8000
```

Then open http://localhost:8000.
