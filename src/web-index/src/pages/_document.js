import { GoogleFonts } from 'nextjs-google-fonts/GoogleFonts'
import NextDocument, { Html, Head, Main, NextScript } from 'next/document'
import { extractCss } from 'goober'
import Config from "../Config.js";

export default class Document extends NextDocument {
  static async getInitialProps({ renderPage }) {
    const page = await renderPage()
    const css = extractCss()
    return { ...page, css }
  }

  render() {
    return (
      <Html lang="en">
        <Head>
          <meta charSet="UTF-8" />
          <meta property="og:title" content={Config.siteName} />
          <meta property="og:type" content="website" />
          <meta property="og:url" content={Config.siteUrl} />
          <meta
            property="og:image"
            content={Config.previewImage}
          />
          <meta property="og:description" content={Config.siteDescription} />
          <meta name="twitter:card" content="summary_large_image" />
          <meta name="twitter:site" content="@tay2win" />
          <meta name="twitter:creator" content="@tay2win" />
          <meta name="twitter:title" content={Config.siteName} />
          <meta name="twitter:description" content={Config.siteDescription} />
          <meta
            name="twitter:image"
            content={Config.previewImage}
          />

          {GoogleFonts()}

          <style
            id={'_goober'}
            // And defined it in here
            dangerouslySetInnerHTML={{ __html: ' ' + this.props.css }}
          />
        </Head>
        <body>
          <Main />
          <NextScript />
        </body>
      </Html>
    )
  }
}
