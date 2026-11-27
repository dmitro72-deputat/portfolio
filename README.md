# Developer Portfolio

A bilingual, static portfolio for document automation, local AI, software performance and remote collaboration. The interactive tools run entirely in the browser. Project links lead to public evidence. The DocuMind demonstration uses one synthetic receipt and includes its observed OCR failure.

## Local review

Open `docs/index.html` from a browser that supports local file links, or serve `docs/` over localhost.

```sh
python3 -m http.server 8000 --directory docs
```

Visit <http://localhost:8000/> for English and <http://localhost:8000/uk.html> for Ukrainian.

## Validation

```sh
node --test tests/tools.test.js
npm install --no-save --package-lock=false @playwright/test@1.51.1
npx playwright install chromium
npx playwright test tests/browser.spec.cjs --workers=1
```

Browser tests serve the static files through a Playwright fixture and check both languages, all three tools, keyboard navigation, the synthetic receipt, and layout widths from 320 to 1440 px.

## GitHub Pages

[English](https://dmitro72-deputat.github.io/portfolio/) · [Українська](https://dmitro72-deputat.github.io/portfolio/uk.html)

The GitHub Pages source is `main` and `/docs`. The English and Ukrainian pages have separate canonical URLs and reciprocal language alternatives.

The project sitemap is at `/portfolio/sitemap.xml`. Search engines read `robots.txt` at the host root. Submit the portfolio sitemap directly in Google Search Console and Bing Webmaster Tools. [GitHub Pages](https://docs.github.com/en/pages/getting-started-with-github-pages/configuring-a-publishing-source-for-your-github-pages-site) · [Google sitemap guidance](https://developers.google.com/search/docs/crawling-indexing/sitemaps/build-sitemap) · [Bing Webmaster Tools](https://www.bing.com/webmasters/about)
